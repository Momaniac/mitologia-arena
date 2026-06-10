# Mitología — v1 (Demo Local)

Webapp de demostración del juego **Mitología** para el programa ARENA. Esta primera versión es **single-player con bots** y corre 100% en el navegador (offline tras la carga).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (paleta de cliente aplicada como design tokens)
- Zustand para el estado global
- Vitest para tests del motor

## Cómo correr

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # corre los tests del motor
npm run build      # build de producción → dist/
npm run preview    # sirve la build de producción
```

## Estructura

```
src/
  engine/      # Lógica pura del juego (sin React)
    deck.ts, tombolas.ts, board.ts, betting.ts,
    scoring.ts, conditions.ts, rng.ts, types.ts
    *.test.ts  # Tests unitarios del motor
  bots/        # IA simple para oponentes
  state/       # Store global (Zustand) + máquina de fases
  ui/
    pages/     # Setup, Tutorial, Game, Moderator
    components/
  tutorial/    # Pasos del tutorial obligatorio
```

## Estado de implementación

- ✅ Motor de juego (gravedad Connect Four, contacto entre fichas,
  detección de combinaciones directas e inversas, multiplicador por condición,
  resolución de ronda con empates).
- ✅ Bots con estrategia simple (apuesta razonada + columnas válidas).
- ✅ UI: setup, definición de combinación, condición secreta,
  carta revelada, fase de apuesta + selección de posición, resolución, resultados.
- ✅ Vista de moderador con toda la información privada.
- ✅ Tutorial interactivo de 12 pasos, obligatorio en primer ingreso.
- ⏳ Pendiente: ilustraciones finales de figuras y logos (el cliente las proveerá);
  por ahora se usan emojis + nombres como placeholders.

## Decisiones pendientes con el cliente

Ver [`../PLAN.md`](../PLAN.md) — sección "Preguntas para el cliente".
