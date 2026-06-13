# Backend de condiciones secretas

La asignación de condiciones secretas de Iteración 1 se resuelve en Vercel
Functions usando Upstash Redis como fuente de verdad.

## Variables de entorno

Configurar en Vercel:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Endpoints

- `POST /api/games`: crea o recupera una partida y asigna condiciones únicas.
- `GET /api/player-condition`: devuelve solo la condición del jugador con su
  `playerSecret`.
- `GET /api/moderator-conditions`: devuelve todas las condiciones con
  `moderatorSecret`.

La asignación es idempotente por `gameId`: si la partida ya existe, se devuelven
las condiciones guardadas y no se reasignan.

## Desarrollo local

Si no existen credenciales de Upstash y `NODE_ENV !== "production"`, la API usa
un fallback en memoria para facilitar pruebas locales. Además, cuando se corre
solo con Vite y `/api/games` no está disponible, el cliente usa un fallback
marcado con `import.meta.env.DEV`.

Estos fallbacks no cumplen unicidad real multiusuario ni persistencia robusta
entre procesos, por lo que no deben considerarse cumplimiento productivo de la
regla del cliente.
