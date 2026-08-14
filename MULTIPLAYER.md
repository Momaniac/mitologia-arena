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
| `player_presence` | Último latido de cada jugador. Lee cualquier participante; escribe cada quien el suyo. **Fuera de Realtime** a propósito. |

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
3. **Rondas (×5)** — el host extrae 4+4 fichas (visibles para todos, fase `DRAW`).
   El moderador pulsa **"Iniciar apuestas"** y arranca el cronómetro (fase
   `BETTING`). Cada jugador elige tómbola, monto y acomodo (en secreto). Al llegar
   a cero —o si el moderador cierra antes— quien no apostó pierde **1 moneda** y
   queda fuera de la ronda; el **host resuelve** con el motor y escribe el
   resultado. Empate ⇒ se repite con las mismas fichas (vuelve a `DRAW`).
4. **Resultados** — puntaje por combinaciones × condición, ranking de jugadores,
   rondas ganadas y **tablero final**.

### Fases (`games.phase`)

`LOBBY → SETUP → DRAW ⇄ BETTING → BETS_CLOSED → ROUND_END → … → RESULTS`

`DRAW` existe para separar "hay fichas en mesa" de "se puede apostar": los
jugadores ya pueden **armar** su jugada, pero el envío se habilita solo con el
cronómetro corriendo.

## Cronómetro de apuestas

- `start_betting(game_id, segundos)` fija `games.betting_ends_at` con el **reloj
  del servidor**. Cada dispositivo mide su desfase una vez (`server_now()`,
  `syncServerClock`) y lo aplica, así todos ven el mismo número.
- El moderador fija la duración con un **fader** (`TimeFader`), de **10 s a 5
  minutos** en pasos de 5 s (`src/ui/betDuration.ts`). Puede moverlo también con
  las apuestas en curso: «Poner en X» reinicia la cuenta, «+30 s» los suma al
  tiempo restante. Ambos llaman a `start_betting`, que acepta las fases `DRAW` y
  `BETTING`. El servidor reacota el valor por su cuenta.
- `close_betting(game_id)` descuenta 1 moneda a cada jugador conectado sin
  apuesta, guarda sus ids en `games.bet_penalized` y pasa a `BETS_CLOSED`. Es
  **idempotente**: si ya estaba cerrada, no vuelve a cobrar.
- El cierre lo dispara el **host** (autoritativo) al llegar a cero, o el botón
  "Cerrar apuestas y resolver". `submit_bet` además rechaza en el servidor
  cualquier apuesta posterior al cierre (2 s de gracia por latencia).
- `resolveRound` no hace nada si la fase ya no es `BETTING`/`BETS_CLOSED`: evita
  que el botón y el cronómetro resuelvan dos veces.

## Reingreso y presencia

Un problema de red no debe dejar a nadie fuera ni frenar a la clase:

- `join_game` acepta partidas **en curso**. Reconoce el dispositivo por su
  `auth.uid()`; si la sesión se perdió (otro navegador, datos borrados), deja
  **reclamar el lugar por nombre** cuando su dueño lleva más de 25 s sin latir
  (`presence_grace_seconds()`), para que nadie pueda quitarle el puesto a un
  jugador activo.
- Cada jugador late cada 10 s (`heartbeat`) sobre `player_presence`. Esa tabla
  **no** está en la publicación de Realtime: 30 teléfonos latiendo no deben
  despertar refrescos en toda la sala.
- El panel del moderador muestra quién está en línea y permite **repartir cartas**
  a quien entró con la partida ya empezada (`dealInPlayer`, condición secreta
  libre + 3 cartas nuevas; no toca al resto).
- `define_setup` también acepta a quien todavía no definió su combinación con la
  partida ya empezada, y el moderador puede iniciar las rondas con 2 jugadores
  listos aunque falten otros (juegan con su orden provisional).

## Esquema

Migración base: `supabase/migrations/20260624000000_init_multiplayer.sql`
(+ fixes). Refactor a individual: `supabase/migrations/20260723000000_individual_no_teams.sql`
(elimina `teams`/`team_secrets`, crea `player_secrets`, mueve la apuesta y el
setup a RPCs por jugador: `submit_bet(p_player_id, …)`, `define_setup(p_player_id, …)`).
Iteración 2: `supabase/migrations/20260730000000_betting_timer_and_rejoin.sql`
(cronómetro `bet_seconds`/`betting_ends_at`/`bet_penalized`, RPCs `start_betting`,
`close_betting`, `server_now`, `heartbeat`; tabla `player_presence`; `join_game`
con reingreso).
