# Multijugador (Supabase) — Arquitectura

Estado: **individual** (sin equipos).

## Objetivo

Hasta ~30 personas se unen desde sus móviles a **una misma partida**. **Todos
juegan de forma individual**: cada jugador administra sus propias monedas,
combinación, condición y apuesta. No existen equipos ni representantes (decisión
de cliente 2026-07-23: la "modalidad por equipos" del documento original era solo
una solución operativa para sesiones presenciales, no una mecánica del juego).

Como cada jugador recibe 3 cartas propias, el reparto es **independiente** por
jugador (`dealHandsIndependent`), no de un mazo compartido de 30 — así escala
más allá de 10 jugadores.

## Modelo elegido: host-autoritativo + Supabase Realtime

- **Frontend** en **Vercel** (estático). Sin cambios de hosting.
- **Supabase** es la fuente de verdad compartida (Postgres + Realtime + RLS).
- El **moderador/host** (quien crea la sala) es la **autoridad**: corre el motor
  de juego existente (`src/engine/*`) y escribe el estado público. Evita Edge
  Functions y reutiliza toda la lógica ya probada.
- Los **jugadores** se unen con un **código de sala**, cada uno envía su propia
  apuesta, y todos reciben el estado en vivo por Realtime.
- **Identidad por dispositivo:** Supabase **Anonymous Sign-ins**. Cada móvil
  obtiene un `auth.uid()` persistente → reconexión simple y base para RLS.

### Privacidad (doc. secciones 26–27)

RLS separa lo **público** de lo **privado**:

| Tabla | Visibilidad |
|---|---|
| `games` | Estado público: tablero, ronda, fase, fichas extraídas, totales por tómbola (tras cerrar), acomodo ganador, puntajes finales. Lee cualquier participante; escribe solo el host. |
| `game_private` | Secretos del motor (semilla, bolsas restantes de tómbolas). **Solo host**. |
| `players` | Identidad/lobby + parte pública del jugador: nombre, conectado, carta revelada, puntaje, rondas ganadas, progreso (`setup_done`, `bet_submitted`). Lee cualquier participante. |
| `player_secrets` | **Privado**: mano, combinación, condición, monedas. Solo el dueño + host. |
| `bets` | **Privado** por ronda: solo el jugador dueño + host. Se revelan tras resolver vía `round_history`. |
| `round_history` | **Solo host**: apuestas reveladas, ganador y acomodo de cada ronda (la tabla en vivo del moderador). |

Realtime publica solo tablas públicas (`games`, `players`). El moderador lee
`bets` por consulta directa (RLS se lo permite) para ver las apuestas en vivo; el
progreso ("3/8 apostaron") se expone con el booleano público `players.bet_submitted`,
sin filtrar montos.

## Flujo

1. **Lobby** — el host crea la sala (código). Los jugadores entran con el código
   y su nombre. El host inicia cuando hay ≥2 jugadores conectados (sin armar
   equipos).
2. **Setup** — el sistema asigna a cada jugador una condición única y 3 cartas;
   cada jugador define su combinación (orden) y su carta pública.
3. **Rondas (×5)** — el host extrae 4+4 fichas (visibles para todos). Cada
   jugador elige tómbola, monto y acomodo (en secreto). Cuando todos enviaron, el
   **host resuelve** con el motor y escribe el resultado. Empate ⇒ se repite con
   las mismas fichas.
4. **Resultados** — puntaje por combinaciones × condición, ranking de jugadores,
   rondas ganadas y **tablero final**.

## Esquema

Migración base: `supabase/migrations/20260624000000_init_multiplayer.sql`
(+ fixes). Refactor a individual: `supabase/migrations/20260723000000_individual_no_teams.sql`
(elimina `teams`/`team_secrets`, crea `player_secrets`, mueve la apuesta y el
setup a RPCs por jugador: `submit_bet(p_player_id, …)`, `define_setup(p_player_id, …)`).
