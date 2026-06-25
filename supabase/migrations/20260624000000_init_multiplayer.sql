-- Mitología · multijugador (host-autoritativo + Realtime + RLS)
-- Modelo: el host (moderador) corre el motor y escribe el estado público.
-- Identidad por dispositivo vía Supabase Anonymous Sign-ins (auth.uid()).

-- =====================================================================
-- Tablas
-- =====================================================================

-- Estado público de la partida (lee cualquier participante; escribe el host).
create table public.games (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,                 -- código corto para unirse
  host_uid      uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'lobby',        -- lobby|setup|playing|finished
  mode          text not null default 'teams',        -- teams|individual
  phase         text not null default 'LOBBY',        -- fase del motor
  round         int  not null default 0,
  board         jsonb not null default '[]'::jsonb,
  current_draw  jsonb,                                 -- {A:[],B:[]} visible para todos
  bet_totals    jsonb,                                 -- {A,B} solo tras cerrar apuestas
  last_result   jsonb,                                 -- ganador/acomodo de la última ronda
  final_scores  jsonb,
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Secretos del motor (semilla, bolsas restantes). Solo host.
create table public.game_private (
  game_id    uuid primary key references public.games (id) on delete cascade,
  seed       bigint not null,
  tombola_a  jsonb not null default '[]'::jsonb,
  tombola_b  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Equipos: parte pública.
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references public.games (id) on delete cascade,
  name             text not null,
  score            int  not null default 0,
  revealed_card_id text,                               -- carta pública del equipo
  representative   uuid references auth.users (id),    -- quién ejecuta
  bet_submitted    bool not null default false,        -- progreso (sin montos)
  created_at       timestamptz not null default now()
);
create index on public.teams (game_id);

-- Equipos: secretos (mano, combinación, condición, monedas). Miembros + host.
create table public.team_secrets (
  team_id     uuid primary key references public.teams (id) on delete cascade,
  game_id     uuid not null references public.games (id) on delete cascade,
  hand        jsonb not null default '[]'::jsonb,      -- 3 cartas
  combination jsonb,                                   -- orden de 3 figuras
  condition   jsonb,                                   -- condición secreta única
  coins       int  not null default 30
);

-- Jugadores (identidad/lobby). Parte pública para participantes.
create table public.players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games (id) on delete cascade,
  team_id   uuid references public.teams (id) on delete set null,
  auth_uid  uuid not null references auth.users (id) on delete cascade,
  name      text not null,
  connected bool not null default true,
  joined_at timestamptz not null default now(),
  unique (game_id, auth_uid)
);
create index on public.players (game_id);

-- Apuestas por ronda y equipo (privadas hasta resolver).
create table public.bets (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  round      int not null,
  tombola    text not null check (tombola in ('A','B')),
  amount     int  not null,
  "order"    jsonb not null,                           -- permutación [0..3]
  columns    jsonb not null,                           -- 4 columnas
  created_at timestamptz not null default now(),
  unique (game_id, team_id, round)
);
create index on public.bets (game_id, round);

-- Historial público de rondas (se llena al resolver).
create table public.round_history (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  round      int not null,
  payload    jsonb not null,                           -- apuestas reveladas, ganador, acomodo
  created_at timestamptz not null default now()
);
create index on public.round_history (game_id);

-- =====================================================================
-- Helpers (SECURITY DEFINER para evitar recursión de RLS)
-- =====================================================================

create or replace function public.is_game_host(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from games where id = g and host_uid = auth.uid());
$$;

create or replace function public.is_game_participant(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from games  where id = g and host_uid = auth.uid())
      or exists (select 1 from players where game_id = g and auth_uid = auth.uid());
$$;

create or replace function public.my_team_id(g uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select team_id from players where game_id = g and auth_uid = auth.uid();
$$;

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.games         enable row level security;
alter table public.game_private  enable row level security;
alter table public.teams         enable row level security;
alter table public.team_secrets  enable row level security;
alter table public.players       enable row level security;
alter table public.bets          enable row level security;
alter table public.round_history enable row level security;

-- games: participantes leen; host escribe. (El host inserta su propia sala.)
create policy games_select on public.games for select
  using (is_game_participant(id));
create policy games_insert on public.games for insert
  with check (host_uid = auth.uid());
create policy games_update on public.games for update
  using (host_uid = auth.uid()) with check (host_uid = auth.uid());

-- game_private: solo host.
create policy gp_all on public.game_private for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- teams (público para participantes); escribe host.
create policy teams_select on public.teams for select
  using (is_game_participant(game_id));
create policy teams_write on public.teams for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- team_secrets: miembros del equipo + host.
create policy ts_select on public.team_secrets for select
  using (is_game_host(game_id) or team_id = my_team_id(game_id));
create policy ts_write on public.team_secrets for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- players: participantes leen; cada quien inserta/actualiza su fila; host gestiona.
create policy players_select on public.players for select
  using (is_game_participant(game_id));
create policy players_update_self on public.players for update
  using (auth_uid = auth.uid() or is_game_host(game_id))
  with check (auth_uid = auth.uid() or is_game_host(game_id));
create policy players_host on public.players for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- bets: el representante del equipo inserta la suya; equipo + host leen.
create policy bets_select on public.bets for select
  using (is_game_host(game_id) or team_id = my_team_id(game_id));
create policy bets_insert on public.bets for insert
  with check (team_id = my_team_id(game_id));
create policy bets_host on public.bets for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- round_history: participantes leen; host escribe.
create policy rh_select on public.round_history for select
  using (is_game_participant(game_id));
create policy rh_write on public.round_history for all
  using (is_game_host(game_id)) with check (is_game_host(game_id));

-- =====================================================================
-- RPC: unirse a una sala por código (atómico, evita abrir RLS de games)
-- =====================================================================

create or replace function public.join_game(p_code text, p_name text)
returns table (game_id uuid, player_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  g games%rowtype;
  pid uuid;
begin
  select * into g from games where code = upper(p_code) and status = 'lobby';
  if not found then
    raise exception 'Sala no encontrada o ya iniciada';
  end if;

  insert into players (game_id, auth_uid, name)
  values (g.id, auth.uid(), p_name)
  on conflict (game_id, auth_uid)
    do update set name = excluded.name, connected = true
  returning id into pid;

  return query select g.id, pid;
end;
$$;

-- =====================================================================
-- Realtime: solo tablas públicas
-- =====================================================================

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.round_history;
