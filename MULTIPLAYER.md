# Multijugador (Supabase) — Arquitectura

Estado: **fase 1 — andamiaje** (rama `feat/multiplayer-supabase`).

## Objetivo

Hasta **30 personas** se unen desde sus móviles a **una misma partida**. Según
la documentación (sección 2), >12 jugadores ⇒ **modo equipos** obligatorio,
equipos de **4–6** personas. El equipo comparte **monedas, combinación,
condición y puntaje**, y **solo un representante** ejecuta apuesta, selección de
tómbola y acomodo.

## Modelo elegido: host-autoritativo + Supabase Realtime

- **Frontend** sigue en **Vercel** (estático). Sin cambios de hosting.
- **Supabase** es la fuente de verdad compartida (Postgres + Realtime + RLS).
- El **moderador/host** (quien crea la sala) es la **autoridad**: corre el motor
  de juego existente (`src/engine/*`) y escribe el estado público. Evita escribir
  Edge Functions y reutiliza toda la lógica ya probada.
- Los **jugadores** se unen con un **código de sala**, su representante envía la
  apuesta del equipo, y todos reciben el estado en vivo por Realtime.
- **Identidad por dispositivo:** Supabase **Anonymous Sign-ins**. Cada móvil
  obtiene un `auth.uid()` persistente (en localStorage) → reconexión simple y
  base para las políticas RLS. (Debe habilitarse en el proyecto cloud.)

### Privacidad (doc. secciones 26–27)

RLS separa lo **público** de lo **privado**:

| Tabla | Visibilidad |
|---|---|
| `games` | Estado público: tablero, ronda, fase, fichas extraídas, totales por tómbola (tras cerrar), acomodo ganador, puntajes finales. Lee cualquier participante; escribe solo el host. |
| `game_private` | Secretos del motor (semilla, bolsas restantes de tómbolas). **Solo host**. |
| `teams` | Público del equipo: nombre, puntaje, carta revelada, representante. Lee cualquier participante. |
| `team_secrets` | **Privado**: mano, combinación, condición, monedas. Solo miembros del equipo + host. |
| `players` | Identidad/lobby: nombre, equipo, representante, conectado. Lee cualquier participante. |
| `bets` | **Privado** por ronda: solo el equipo dueño + host. Se revelan tras resolver vía `round_history`. |
| `round_history` | Público tras resolver: apuestas reveladas, ganador, acomodo. |

Realtime publica solo tablas públicas (`games`, `teams`, `players`,
`round_history`). El host lee `bets` por consulta directa (RLS se lo permite);
el progreso ("3/6 equipos apostaron") se expone con un booleano público
`teams.bet_submitted`, sin filtrar montos.

## Flujo

1. **Lobby** — el host crea la sala (código). Los jugadores entran con el código
   y su nombre. El host forma equipos (4–6) y marca un representante por equipo.
2. **Setup** — por cada equipo: el sistema asigna condición única, el
   representante define la combinación (orden de 3 cartas) y la carta pública.
3. **Rondas (×5)** — el host extrae 4+4 fichas (visibles para todos). Cada
   representante elige tómbola, monto y acomodo (en secreto). Cuando todos
   enviaron, el **host resuelve** con el motor y escribe el resultado. Empate ⇒
   se repite con las mismas fichas (ya implementado).
4. **Resultados** — puntaje por combinaciones × condición, ranking de equipos.

## Pendiente de esta fase

- [ ] `supabase login` del usuario → crear/enlazar proyecto cloud y aplicar
      migración.
- [ ] Habilitar Anonymous Sign-ins en el proyecto.
- [ ] Cliente Supabase + capa realtime en el frontend.
- [ ] Lobby, refactor a equipos, quitar bots, conectar vistas.
