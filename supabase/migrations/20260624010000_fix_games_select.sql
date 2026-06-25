-- Fix: al crear la sala con INSERT ... RETURNING, la política SELECT de games
-- se evalúa sobre la fila nueva, pero is_game_participant() es una función
-- STABLE/SECURITY DEFINER que no ve la fila recién insertada dentro del mismo
-- statement → RLS rechazaba el RETURNING. Añadimos el predicado directo
-- host_uid = auth.uid(), evaluado sobre la fila candidata.

drop policy if exists games_select on public.games;
create policy games_select on public.games for select
  using (host_uid = auth.uid() or is_game_participant(id));
