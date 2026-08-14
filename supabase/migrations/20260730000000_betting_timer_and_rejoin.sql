-- Iteración 2 (2026-07-30), tras la primera clase real:
--   1) Cronómetro de apuestas: el moderador abre la ronda de apuestas y corre un
--      reloj. Al agotarse, quien no apostó pierde 1 moneda y queda fuera de esa
--      ronda; la partida continúa sin esperarlo.
--   2) Reingreso: un jugador que se cae por red puede volver a una partida en
--      curso (por su uid o, si perdió la sesión, reclamando su lugar por nombre).
--   3) Presencia (heartbeat) fuera de Realtime: sirve para saber quién está en
--      línea y para decidir si un lugar puede reclamarse.

-- =====================================================================
-- 1) Cronómetro de apuestas
-- =====================================================================

alter table public.games
  add column if not exists bet_seconds     int not null default 60,
  add column if not exists betting_ends_at timestamptz,
  add column if not exists bet_penalized   jsonb not null default '[]'::jsonb;

comment on column public.games.bet_seconds     is 'Duración elegida por el moderador para la ronda de apuestas.';
comment on column public.games.betting_ends_at is 'Instante (reloj del servidor) en que se cierran las apuestas.';
comment on column public.games.bet_penalized   is 'player_id de quienes no apostaron a tiempo en la ronda en curso.';

-- Reloj del servidor: los teléfonos calculan su desfase contra este valor para
-- que la cuenta regresiva sea la misma en todos los dispositivos.
create or replace function public.server_now()
returns timestamptz language sql stable as $$
  select now();
$$;

-- Abre las apuestas y fija el instante de cierre.
create or replace function public.start_betting(p_game_id uuid, p_seconds int)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  g      games%rowtype;
  -- Nombre distinto a "secs" a propósito: en plpgsql, el argumento con nombre
  -- make_interval(secs => …) choca con una variable llamada igual.
  v_secs int := greatest(10, least(600, coalesce(p_seconds, 60)));
  ends   timestamptz;
begin
  if not is_game_host(p_game_id) then
    raise exception 'Solo el moderador puede iniciar las apuestas.';
  end if;
  select * into g from games where id = p_game_id for update;
  if not found then
    raise exception 'Sala no encontrada.';
  end if;
  if g.phase not in ('DRAW', 'BETTING') then
    raise exception 'Las apuestas no se pueden abrir en esta fase.';
  end if;

  ends := now() + make_interval(secs => v_secs);
  update games
     set phase = 'BETTING',
         status = 'playing',
         bet_seconds = v_secs,
         betting_ends_at = ends,
         bet_penalized = '[]'::jsonb
   where id = p_game_id;
  return ends;
end;
$$;

-- Cierra las apuestas: descuenta 1 moneda a cada jugador presente que no apostó
-- y devuelve sus player_id. Idempotente: si ya estaban cerradas, no cobra dos
-- veces (solo devuelve la lista guardada).
create or replace function public.close_betting(p_game_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g         games%rowtype;
  penalized jsonb;
begin
  if not is_game_host(p_game_id) then
    raise exception 'Solo el moderador puede cerrar las apuestas.';
  end if;
  select * into g from games where id = p_game_id for update;
  if not found then
    raise exception 'Sala no encontrada.';
  end if;
  if g.phase <> 'BETTING' then
    return coalesce(g.bet_penalized, '[]'::jsonb);
  end if;

  with faltantes as (
    select p.id
      from players p
     where p.game_id = p_game_id
       and p.connected
       and not exists (
         select 1 from bets b
          where b.game_id = p_game_id and b.round = g.round and b.player_id = p.id
       )
  ), multados as (
    update player_secrets s
       set coins = greatest(0, s.coins - 1)
     where s.player_id in (select id from faltantes)
     returning s.player_id
  )
  select coalesce(jsonb_agg(player_id), '[]'::jsonb) into penalized from multados;

  update games
     set phase = 'BETS_CLOSED',
         betting_ends_at = null,
         bet_penalized = penalized
   where id = p_game_id;
  return penalized;
end;
$$;

-- El jugador solo puede apostar con las apuestas abiertas y antes del cierre
-- (2 s de gracia por latencia de red).
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
  if g.betting_ends_at is not null and now() > g.betting_ends_at + interval '2 seconds' then
    raise exception 'Se acabó el tiempo para apostar en esta ronda.';
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

-- =====================================================================
-- 2) Presencia: heartbeat ligero, fuera de la publicación de Realtime
--    (30 jugadores latiendo cada 10 s no deben despertar a toda la sala).
-- =====================================================================

create table if not exists public.player_presence (
  player_id    uuid primary key references public.players (id) on delete cascade,
  game_id      uuid not null references public.games (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
create index if not exists player_presence_game_idx on public.player_presence (game_id);

alter table public.player_presence enable row level security;

drop policy if exists pp_select on public.player_presence;
create policy pp_select on public.player_presence for select
  using (is_game_participant(game_id));

drop policy if exists pp_self on public.player_presence;
create policy pp_self on public.player_presence for all
  using (is_player_self(player_id)) with check (is_player_self(player_id));

create or replace function public.heartbeat(p_player_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_player_self(p_player_id) then
    return;
  end if;
  insert into player_presence (player_id, game_id, last_seen_at)
  select id, game_id, now() from players where id = p_player_id
  on conflict (player_id) do update set last_seen_at = now();
end;
$$;

-- =====================================================================
-- 3) Reingreso a una partida en curso
-- =====================================================================

-- Un lugar puede reclamarse por nombre si su dueño no da señales de vida.
create or replace function public.presence_grace_seconds()
returns int language sql immutable as $$ select 25; $$;

drop function if exists public.join_game(text, text);

create function public.join_game(p_code text, p_name text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  g    games%rowtype;
  slot players%rowtype;
  pid  uuid;
  nm   text := btrim(coalesce(p_name, ''));
begin
  select * into g from games where code = upper(btrim(p_code));
  if not found then
    raise exception 'Sala no encontrada. Revisa el código con el moderador.';
  end if;
  if g.status = 'finished' then
    raise exception 'Esa partida ya terminó.';
  end if;

  -- (a) Este dispositivo ya estuvo en la sala: vuelve a su mismo lugar.
  select * into slot from players where game_id = g.id and auth_uid = auth.uid();
  if found then
    update players
       set connected = true,
           name = case when nm = '' then name else nm end
     where id = slot.id
    returning id into pid;

    insert into player_presence (player_id, game_id, last_seen_at)
    values (pid, g.id, now())
    on conflict (player_id) do update set last_seen_at = now();

    return json_build_object('game_id', g.id, 'player_id', pid, 'rejoined', true);
  end if;

  -- (b) Sala aún en lobby: alta normal.
  if g.status = 'lobby' then
    insert into players (game_id, auth_uid, name)
    values (g.id, auth.uid(), case when nm = '' then 'Jugador' else nm end)
    returning id into pid;

    insert into player_presence (player_id, game_id, last_seen_at)
    values (pid, g.id, now())
    on conflict (player_id) do update set last_seen_at = now();

    return json_build_object('game_id', g.id, 'player_id', pid, 'rejoined', false);
  end if;

  -- (c) Partida en curso y sesión nueva (perdió el navegador o cambió de
  --     teléfono): recupera su lugar por nombre, si nadie lo está usando.
  if nm = '' then
    raise exception 'Escribe tu nombre para volver a entrar.';
  end if;

  select p.* into slot
    from players p
    left join player_presence pr on pr.player_id = p.id
   where p.game_id = g.id
     and lower(btrim(p.name)) = lower(nm)
     and (
       p.connected = false
       or pr.last_seen_at is null
       or pr.last_seen_at < now() - make_interval(secs => presence_grace_seconds())
     )
   order by pr.last_seen_at nulls first
   limit 1;

  if not found then
    raise exception 'La partida ya empezó. Entra con el mismo nombre que usaste al inicio; si alguien más lo está usando, pide ayuda al moderador.';
  end if;

  update players set auth_uid = auth.uid(), connected = true
   where id = slot.id
  returning id into pid;

  insert into player_presence (player_id, game_id, last_seen_at)
  values (pid, g.id, now())
  on conflict (player_id) do update set last_seen_at = now();

  return json_build_object('game_id', g.id, 'player_id', pid, 'rejoined', true);
end;
$$;

-- El jugador que se reincorpora tarde (o al que el moderador reparte cartas ya
-- empezada la partida) también debe poder definir su combinación.
create or replace function public.define_setup(
  p_player_id uuid,
  p_combination jsonb,
  p_revealed_card_id text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  g_status text;
  done     boolean;
begin
  if not is_player_self(p_player_id) then
    raise exception 'Solo puedes definir tu propia combinación.';
  end if;
  select g.status, p.setup_done into g_status, done
    from players p join games g on g.id = p.game_id
   where p.id = p_player_id;

  if g_status = 'finished' or (g_status <> 'setup' and done) then
    raise exception 'El setup no está disponible en esta fase.';
  end if;

  update player_secrets set combination = p_combination where player_id = p_player_id;
  update players set revealed_card_id = p_revealed_card_id, setup_done = true
    where id = p_player_id;
end;
$$;
