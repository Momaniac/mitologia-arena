import { type RNG, randInt } from '../engine/rng';
import { MAX_BET, MIN_BET } from '../engine/betting';
import { availableColumns, placeTokens } from '../engine/board';
import type { Board, Figure, Player, Token, TombolaId, Bet } from '../engine/types';

/**
 * Estrategia del bot para apostar:
 * - Elige tómbola al azar (con ligero sesgo hacia la que tiene fichas que le sirven
 *   más al patrón de su combinación).
 * - Apuesta entre 1 y min(10, monedas/3 + 1) con ruido.
 *   Razón: en una partida típica con 30 monedas y 5 rondas, apostar ~6 por ronda
 *   es razonable. Los bots no son contendientes serios, solo deben jugar lo suficiente
 *   para que la demo se sienta viva.
 */
export function botDecideBet(
  bot: Player,
  drawnA: Token[],
  drawnB: Token[],
  board: Board,
  rng: RNG,
): Bet {
  const wantedFigures = new Set(bot.combination);
  const goodInA = drawnA.filter((t) => wantedFigures.has(t.figure)).length;
  const goodInB = drawnB.filter((t) => wantedFigures.has(t.figure)).length;
  // Pequeño sesgo: prefiere tómbola con más fichas útiles, pero con ruido.
  const biasedToB = goodInB > goodInA;
  const tombola: TombolaId =
    rng() < (biasedToB ? 0.65 : 0.35) ? 'B' : 'A';

  const maxAffordable = Math.min(MAX_BET, Math.max(MIN_BET, bot.coins));
  const base = Math.min(maxAffordable, Math.max(MIN_BET, Math.floor(bot.coins / 4)));
  const noise = randInt(rng, 3) - 1;
  const amount = Math.min(maxAffordable, Math.max(MIN_BET, base + noise));

  const drawn = tombola === 'A' ? drawnA : drawnB;
  const columns = pickBotColumns(
    board,
    drawn.map((token) => token.figure),
    rng,
  );
  // Los bots colocan en el orden de extracción (sin reordenar).
  return { playerId: bot.id, tombola, amount, columns, order: [0, 1, 2, 3] };
}

/**
 * Elige 4 columnas válidas para que el bot pueda colocar las 4 fichas si gana.
 * Intenta elegir columnas que pasen gravedad, gusanito y contacto.
 */
export function pickBotColumns(
  board: Board,
  figures: readonly Figure[],
  rng: RNG,
): [number, number, number, number] {
  const valid: [number, number, number, number][] = [];
  for (let a = 0; a < 5; a++) {
    for (let b = 0; b < 5; b++) {
      for (let c = 0; c < 5; c++) {
        for (let d = 0; d < 5; d++) {
          const columns: [number, number, number, number] = [a, b, c, d];
          if (placeTokens(board, figures, columns, figures).ok) valid.push(columns);
        }
      }
    }
  }
  if (valid.length > 0) return valid[randInt(rng, valid.length)];

  // Trabajamos sobre un mapa de "ocupación virtual": cada vez que elegimos una
  // columna, simulamos su llenado para no repetir una columna ya llena.
  const heights = new Array(5).fill(0).map((_, c) => {
    let h = 0;
    for (let r = 0; r < 5; r++) if (board[r][c] !== null) h++;
    return h;
  });
  const cols: number[] = [];
  for (let i = 0; i < 4; i++) {
    const candidates = heights
      .map((h, c) => ({ c, free: 5 - h }))
      .filter((x) => x.free > 0);
    if (candidates.length === 0) {
      // Tablero lleno: rellenar con 0 como fallback, motor rechazará.
      cols.push(0);
      continue;
    }
    const choice = candidates[randInt(rng, candidates.length)];
    cols.push(choice.c);
    heights[choice.c]++;
  }
  return [cols[0], cols[1], cols[2], cols[3]];
}

/**
 * Bot elige orden de sus 3 cartas (combinación inicial). Simplemente las
 * mantiene en el orden del reparto + barajada leve.
 */
export function botOrderHand<T>(hand: T[], rng: RNG): T[] {
  const arr = hand.slice();
  // Mezcla simple
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Bot elige cuál carta revelar al azar. */
export function botPickRevealedCard<T extends { id: string }>(hand: T[], rng: RNG): string {
  return hand[randInt(rng, hand.length)].id;
}

/** Útil para debug: una columna válida cualquiera o -1 si no hay. */
export function anyValidColumn(board: Board): number {
  const avail = availableColumns(board);
  return avail.length === 0 ? -1 : avail[0];
}
