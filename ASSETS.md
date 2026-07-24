# Assets del juego — estado

Los assets entregados por el diseñador se **optimizaron** (venían en ~2048px /
7-8 MB c/u) y se integraron en `mitologia/src/assets/`. Los originales quedan en
`../assets/` (raíz del proyecto) como archivo de entrega.

## Integrado ✔

| Asset | Origen entregado | En la app | Dónde se usa |
|---|---|---|---|
| Fichas (5) | `assets/figuras/para fichas/` | `src/assets/tokens/*.png` (224px, ~100 KB) | `TokenIcon` → tablero, mano, moderador, tutorial |
| Naipes (5) | `assets/figuras/para naipes/` | `src/assets/cards/*.jpg` (512px, ~120 KB) | `Card` → mano, carta pública, "Mis cartas" |
| Logo Mitología | `assets/logo mitología/mitologia.png` | `src/assets/brand/logo-mitologia.jpg` (1000px, ~168 KB) | Título en splash/acceso (`Entry` → `Brand`) |
| Logo Arena | `assets/logo arena/imago_arena.png` | `src/assets/brand/logo-arena.png` | Sello en splash/acceso (`Entry` → `Brand`) |
| Logo empresa | `assets/logo empresa/equilibrio_creciente.png` | `src/assets/brand/logo-empresa.png` | Crédito en el splash |
| Favicon/app icon | `assets/favicon/favicon.png` | `public/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | `index.html` |

- El **mapa figura → imagen** está en `src/ui/figureArt.ts` (`TOKEN_ART`, `CARD_ART`).
- El logo de Arena es line-art **negro**, así que va sobre un **sello claro** para
  que se lea en el tema oscuro. El logo de la empresa se **invierte a blanco** para
  el crédito.
- **Naipes:** fondo negro (se funde con el círculo de la imagen) + **marco dorado
  ornamental con gemas** en las esquinas (`Card.tsx`).
- **Fichas de casino:** se mantienen las del código (`CoinChip`, color por valor);
  no se usan imágenes, según lo pedido.

## Pendiente

1. **Regla de color de ficha de casino** (intermedios): hoy = mayor denominación ≤
   monto. Confirmar o cambiar a "apilado".
2. **Costura del logo:** `logo-mitologia.jpg` trae fondo oscuro propio (sin alfa);
   sobre el fondo de la app se puede notar un rectángulo muy leve. Si molesta,
   pedir una versión con fondo transparente (PNG).

## Si el diseñador entrega más versiones

Para cambiar una figura basta reemplazar el archivo en `src/assets/tokens/` o
`src/assets/cards/` (mismo nombre) — no hay que tocar código. Mantener pesos
bajos (fichas ≤224px, naipes ≤512px) para que cargue rápido en móvil.
