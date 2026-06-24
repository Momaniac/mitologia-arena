-- Estado de juego: setup por equipo, RPCs para representantes, historial privado.

alter table public.teams
  add column if not exists setup_done boolean not null default false;

-- El historial completo (con apuestas individuales y equipo ganador) es SOLO del
-- moderador. Los jugadores ven el resumen público en games.last_result + el tablero.
drop policy if exists rh_select on public.round_history;
create policy rh_select on public.round_history for select
  using (is_game_host(game_id));

-- ¿auth.uid() es el representante de este equipo?
create or replace function public.is_team_rep(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from teams where id = p_team_id and representative = auth.uid());
$$;

-- Representante define la combinación (orden de 3 cartas) y la carta pública.
create or replace function public.define_setup(
  p_team_id uuid,
  p_combination jsonb,
  p_revealed_card_id text
) returns void
language plpgsql security definer set search_path = public as $$
declare g_status text;
begin
  if not is_team_rep(p_team_id) then
    raise exception 'Solo el representante puede definir el setup.';
  end if;
  select status into g_status from games
    where id = (select game_id from teams where id = p_team_id);
  if g_status <> 'setup' then
    raise exception 'El setup no está disponible en esta fase.';
  end if;

  update team_secrets set combination = p_combination where team_id = p_team_id;
  update teams set revealed_card_id = p_revealed_card_id, setup_done = true
    where id = p_team_id;
end;
$$;

-- Representante envía (o actualiza) la apuesta del equipo en la ronda actual.
create or replace function public.submit_bet(
  p_team_id uuid,
  p_round int,
  p_tombola text,
  p_amount int,
  p_order jsonb,
  p_columns jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare g games%rowtype;
begin
  if not is_team_rep(p_team_id) then
    raise exception 'Solo el representante puede apostar.';
  end if;
  select * into g from games where id = (select game_id from teams where id = p_team_id);
  if g.status <> 'playing' or g.phase <> 'BETTING' or g.round <> p_round then
    raise exception 'Las apuestas no están abiertas para esta ronda.';
  end if;
  if p_amount < 1 or p_amount > 10 then
    raise exception 'La apuesta debe estar entre 1 y 10.';
  end if;

  insert into bets (game_id, team_id, round, tombola, amount, "order", columns)
  values (g.id, p_team_id, p_round, p_tombola, p_amount, p_order, p_columns)
  on conflict (game_id, team_id, round) do update
    set tombola = excluded.tombola, amount = excluded.amount,
        "order" = excluded."order", columns = excluded.columns;

  update teams set bet_submitted = true where id = p_team_id;
end;
$$;
