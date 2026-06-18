import type { Board, Figure } from './types';

export const ROWS = 5;
export const COLS = 5;

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null as Figure | null),
  );
}

/** Última fila libre (más baja) de una columna o null si está llena. */
export function lowestFreeRow(board: Board, col: number): number | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return null;
}

/** True si el board está totalmente vacío (caso ronda 1). */
export function isBoardEmpty(board: Board): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null) return false;
    }
  }
  return true;
}

/** Adyacencia por cara: arriba/abajo/izquierda/derecha. Diagonal no cuenta. */
const NEIGHBORS_ORTHOGONAL = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function touchesExistingByFace(board: Board, row: number, col: number): boolean {
  for (const [dr, dc] of NEIGHBORS_ORTHOGONAL) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (board[r][c] !== null) return true;
  }
  return false;
}

function sameFigureMultiset(a: readonly Figure[], b: readonly Figure[]): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<Figure, number>();
  for (const figure of a) counts.set(figure, (counts.get(figure) ?? 0) + 1);
  for (const figure of b) {
    const next = (counts.get(figure) ?? 0) - 1;
    if (next < 0) return false;
    counts.set(figure, next);
  }
  return Array.from(counts.values()).every((count) => count === 0);
}

export function hasFloatingTokens(board: Board): boolean {
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null && board[r + 1][c] === null) return true;
    }
  }
  return false;
}

/**
 * Verifica que las fichas colocadas forman un "gusanito" válido:
 * cada ficha nueva debe tocar por una cara a la ficha inmediatamente anterior.
 * El contacto diagonal no cuenta para esta regla.
 */
function placementsFollowWorm(
  placements: readonly { row: number; col: number }[],
): boolean {
  if (placements.length !== 4) return false;
  for (let i = 1; i < placements.length; i++) {
    const previous = placements[i - 1];
    const current = placements[i];
    const distance =
      Math.abs(current.row - previous.row) + Math.abs(current.col - previous.col);
    if (distance !== 1) return false;
  }

  return true;
}

function touchesPreviousBoard(
  board: Board,
  placements: readonly { row: number; col: number }[],
): boolean {
  return placements.some((p) => touchesExistingByFace(board, p.row, p.col));
}

export type PlaceResult =
  | { ok: true; board: Board; placements: { row: number; col: number; figure: Figure }[] }
  | { ok: false; reason: string };

/**
 * Coloca 4 fichas en el board aplicando gravedad y reglas de contacto.
 * - Cada ficha cae a la fila libre más baja de su columna.
 * - Cada ficha nueva debe tocar por una cara a la ficha inmediatamente anterior.
 * - Si el board NO está vacío, al menos una ficha nueva debe tocar por una cara
 *   una ficha previa.
 * - Si una columna está llena cuando se intenta colocar, falla.
 */
export function placeTokens(
  board: Board,
  figures: readonly Figure[],
  columns: readonly number[],
  expectedFigures: readonly Figure[] = figures,
): PlaceResult {
  if (figures.length !== columns.length) {
    return { ok: false, reason: 'mismatch fichas/columnas' };
  }
  if (figures.length !== 4 || columns.length !== 4) {
    return { ok: false, reason: 'Debes usar exactamente las 4 fichas de la tómbola seleccionada.' };
  }
  if (!sameFigureMultiset(figures, expectedFigures)) {
    return { ok: false, reason: 'Debes usar exactamente las 4 fichas de la tómbola seleccionada.' };
  }
  const next: Board = board.map((row) => row.slice());
  const wasEmpty = isBoardEmpty(next);
  const placements: { row: number; col: number; figure: Figure }[] = [];

  for (let i = 0; i < figures.length; i++) {
    const col = columns[i];
    if (col < 0 || col >= COLS) {
      return { ok: false, reason: `columna ${col} fuera de rango` };
    }
    const row = lowestFreeRow(next, col);
    if (row === null) {
      return { ok: false, reason: `columna ${col} llena` };
    }
    next[row][col] = figures[i];
    placements.push({ row, col, figure: figures[i] });
  }

  if (hasFloatingTokens(next)) {
    return {
      ok: false,
      reason: 'Las fichas deben caer por gravedad. No pueden quedar espacios vacíos debajo.',
    };
  }
  if (!placementsFollowWorm(placements)) {
    return {
      ok: false,
      reason: 'Cada ficha nueva debe tocar por una cara a la ficha anterior. El contacto diagonal no cuenta como gusanito.',
    };
  }
  if (!wasEmpty && !touchesPreviousBoard(board, placements)) {
    return {
      ok: false,
      reason: 'A partir de la segunda ronda, tu acomodo debe tocar por una cara al menos una ficha ya colocada.',
    };
  }

  return { ok: true, board: next, placements };
}

/** Lista de columnas con al menos un espacio libre. */
export function availableColumns(board: Board): number[] {
  const out: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (lowestFreeRow(board, c) !== null) out.push(c);
  }
  return out;
}
