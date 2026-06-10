import {
  FIGURES,
  type Board,
  type ComparisonOp,
  type Condition,
  type Figure,
} from './types';
import { type RNG, pickN, randInt } from './rng';

/**
 * Genera un catálogo de condiciones del tipo `X > Y` o `X >= Y` con
 * X != Y. Se evalúan contando fichas presentes en el tablero final.
 *
 * NOTA: el documento da 3 ejemplos. El catálogo completo está pendiente
 * de confirmación del cliente — se usa este placeholder mientras tanto.
 */
export function buildConditionCatalog(): Condition[] {
  const ops: ComparisonOp[] = ['>', '>='];
  const out: Condition[] = [];
  for (const left of FIGURES) {
    for (const right of FIGURES) {
      if (left === right) continue;
      for (const op of ops) {
        out.push({ id: `${left}-${op}-${right}`, left, op, right });
      }
    }
  }
  return out;
}

/** Cuenta fichas de cada figura presentes en el tablero. */
export function countFigures(board: Board): Record<Figure, number> {
  const c: Record<Figure, number> = {
    dragon: 0,
    hydra: 0,
    fenix: 0,
    kraken: 0,
    minotauro: 0,
  };
  for (const row of board) {
    for (const cell of row) {
      if (cell) c[cell]++;
    }
  }
  return c;
}

export function evaluateCondition(board: Board, condition: Condition): boolean {
  const counts = countFigures(board);
  const l = counts[condition.left];
  const r = counts[condition.right];
  return condition.op === '>' ? l > r : l >= r;
}

/**
 * Para la fase CHOOSE_CONDITION: el sistema ofrece N condiciones aleatorias
 * y el jugador escoge una. (Confirmación pendiente del cliente — sección 6 del doc.)
 */
export function offerConditions(rng: RNG, count = 3): Condition[] {
  const catalog = buildConditionCatalog();
  return pickN(catalog, count, rng);
}

/** Auxiliar para bots: elige una condición al azar entre las ofrecidas. */
export function botPickCondition(rng: RNG, offered: Condition[]): Condition {
  return offered[randInt(rng, offered.length)];
}
