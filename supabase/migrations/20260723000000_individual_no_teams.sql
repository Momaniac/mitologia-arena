-- Refactor: eliminar equipos. Todos los participantes juegan de forma INDIVIDUAL.
-- El jugador es la unidad: mano, combinación, condición, monedas y apuesta propias.
-- Los secretos viven en player_secrets (privados por RLS); players queda público.
-- Decisión de cliente 2026-07-23: el juego no tiene equipos ni representantes.

-- =====================================================================
-- 1) Baja de objetos basados en equipos
-- =====================================================================

-- RPCs y helpers de equipos (se recrean por jugador más abajo).
drop function if exists public.submit_bet(uuid, int, text, int, jsonb, jsonb);
drop function if exists public.define_setup(uuid, jsonb, text);
drop function if exists public.is_team_rep(uuid);

-- La tabla de apuestas se recrea con player_id (antes referenciaba teams).
drop table if exists public.bets cascade;

-- Secretos y parte pública de equipos.
drop table if exists public.team_secrets cascade;
drop table if exists public.teams cascade;

-- Ya sin tablas que la usen, se elimina el helper de equipo del jugador.
drop function if exists public.my_team_id(uuid);

-- La columna team_id de players deja de existir (su FK cayó con teams).
alter table public.players drop column if exists team_id;

-- =====================================================================
-- 2) players: parte pública por jugador (identidad + progreso + lo revelado)
-- =====================================================================

alter table public.players
  add column if not exists revealed_card_id text,
  add column if not exists score         int     not null default 0,
  add column if not exists rounds_won     int     not null default 0,
  add column if not exists setup_done    boolean not null default false,
  add column if not exists bet_submitted boolean not null default false;

-- Modo por defecto: individual (ya no hay 'teams').
alter table public.games alter column mode set default 'individual';

-- =====================================================================
-- 3) player_secrets: mano, combinación, condición y monedas (privado)
-- =====================================================================

create table public.player_secrets (
  player_id   uuid primary key references public.players (id) on delete cascade,
  game_id     uuid not null references public.games (id) on delete cascade,
  hand        jsonb not null default '[]'::jsonb,      -- 3 cartas
  combination jsonb,                                   -- orden de 3 figuras
  condition   jsonb,                                   -- condición secreta única
  coins       int  not null default 30
);
create index on public.player_secrets (game_id);

-- =====================================================================
-- 4) bets: apuesta por jugador y ronda (privada hasta resolver)
-- =====================================================================

create table public.bets (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  player_id  uuid not null references public.players (id) on delete cascade,
  round      int not null,
  tombola    text not null check (tombola in ('A','B')),
  amount     int  not null,
  "order"    jsonb not null,                           -- permutación [0..3]
  columns    jsonb not null,                           -- 4 columnas
  created_at timestamptz not null default now(),
  unique (game_id, player_id, round)
);
create index on public.bets (game_id, round);

-- =====================================================================
-- 5) Helpers (SECURITY DEFINER para evitar recursión de RLS)
-- =====================================================================

-- ¿auth.uid() es el dueño de esta fila de players?
create or replace function public.is_player_self(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = p_player_id and auth_uid = auth.uid());
$$;

-- player_id del jugador actual en una partida (null si es host o no está).
create or replace function public.my_player_id(g uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select id from players where game_id = g and auth_uid = auth.uid();
$$;

-- =====================================================================
-- 6) RLS
-- =====================================================================

alter table public.player_secrets enable row level security;
alter table public.bets           enable row level security;

-- player_secrets: solo el dueño + host leen; escribe el host (o RPC define_setup).
create policy ps_select on public.player_secrets for select
  using (is_game_host(game_id) or is_player_self(player_id));
create policy ps_write on public.player_secrets for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- bets: el jugador inserta la suya; el dueño + host leen.
create policy bets_select on public.bets for select
  using (is_game_host(game_id) or is_player_self(player_id));
create policy bets_insert on public.bets for insert
  with check (is_player_self(player_id));
create policy bets_host on public.bets for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- =====================================================================
-- 7) RPCs por jugador
-- =====================================================================

-- El jugador define su combinación (orden de 3 cartas) y su carta pública.
create or replace function public.define_setup(
  p_player_id uuid,
  p_combination jsonb,
  p_revealed_card_id text
) returns void
language plpgsql security definer set search_path = public as $$
declare g_status text;
begin
  if not is_player_self(p_player_id) then
    raise exception 'Solo puedes definir tu propia combinación.';
  end if;
  select status into g_status from games
    where id = (select game_id from players where id = p_player_id);
  if g_status <> 'setup' then
    raise exception 'El setup no está disponible en esta fase.';
  end if;

  update player_secrets set combination = p_combination where player_id = p_player_id;
  update players set revealed_card_id = p_revealed_card_id, setup_done = true
    where id = p_player_id;
end;
$$;

-- El jugador envía (o actualiza) su apuesta en la ronda actual.
create or replace function public.submit_bet(
  p_player_id uuid,
  p_round int,
  p_tombola text,
  p_amount int,
  p_order jsonb,
  p_columns jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare g games%rowtype;
begin
  if not is_player_self(p_player_id) then
    raise exception 'Solo puedes enviar tu propia apuesta.';
  end if;
  select * into g from games where id = (select game_id from players where id = p_player_id);
  if g.status <> 'playing' or g.phase <> 'BETTING' or g.round <> p_round then
    raise exception 'Las apuestas no están abiertas para esta ronda.';
  end if;
  if p_amount < 1 or p_amount > 10 then
    raise exception 'La apuesta debe estar entre 1 y 10.';
  end if;

  insert into bets (game_id, player_id, round, tombola, amount, "order", columns)
  values (g.id, p_player_id, p_round, p_tombola, p_amount, p_order, p_columns)
  on conflict (game_id, player_id, round) do update
    set tombola = excluded.tombola, amount = excluded.amount,
        "order" = excluded."order", columns = excluded.columns;

  update players set bet_submitted = true where id = p_player_id;
end;
$$;
