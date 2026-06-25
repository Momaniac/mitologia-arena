-- Fix: el RETURNS TABLE(game_id, player_id) colisionaba con la columna
-- players.game_id en el ON CONFLICT ("column reference game_id is ambiguous").
-- Reescribimos devolviendo json (sin columnas de salida que colisionen).

drop function if exists public.join_game(text, text);

create function public.join_game(p_code text, p_name text)
returns json
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

  return json_build_object('game_id', g.id, 'player_id', pid);
end;
$$;
