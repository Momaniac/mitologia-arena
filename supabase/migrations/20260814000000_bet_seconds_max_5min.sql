-- Tope del cronómetro de apuestas: 5 minutos.
--
-- El moderador ahora fija el tiempo con un fader (10 s a 5 min). La UI ya no
-- puede pedir más de 300 s, pero el servidor era más permisivo (600 s): se
-- iguala aquí para que el límite valga aunque la llamada no venga de la UI.
--
-- Única diferencia con 20260730000000: least(600, …) → least(300, …).

create or replace function public.start_betting(p_game_id uuid, p_seconds int)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  g      games%rowtype;
  -- Nombre distinto a "secs" a propósito: en plpgsql, el argumento con nombre
  -- make_interval(secs => …) choca con una variable llamada igual.
  v_secs int := greatest(10, least(300, coalesce(p_seconds, 60)));
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
