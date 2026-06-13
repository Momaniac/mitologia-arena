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

/** Adyacencia ortogonal (arriba/abajo/izquierda/derecha). */
const NEIGHBORS_4 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function touchesExisting(board: Board, row: number, col: number): boolean {
  for (const [dr, dc] of NEIGHBORS_4) {
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

function placementsAreConnected(
  placements: readonly { row: number; col: number }[],
): boolean {
  if (placements.length === 0) return false;
  const keys = new Set(placements.map((p) => `${p.row},${p.col}`));
  const visited = new Set<string>();
  const stack = [placements[0]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.row},${current.col}`;
    if (visited.has(key)) continue;
    visited.add(key);
    for (const [dr, dc] of NEIGHBORS_4) {
      const next = { row: current.row + dr, col: current.col + dc };
      if (keys.has(`${next.row},${next.col}`)) stack.push(next);
    }
  }

  return visited.size === placements.length;
}

function touchesPreviousBoard(
  board: Board,
  placements: readonly { row: number; col: number }[],
): boolean {
  return placements.some((p) => touchesExisting(board, p.row, p.col));
}

export type PlaceResult =
  | { ok: true; board: Board; placements: { row: number; col: number; figure: Figure }[] }
  | { ok: false; reason: string };

/**
 * Coloca 4 fichas en el board aplicando gravedad y reglas de contacto.
 * - Cada ficha cae a la fila libre más baja de su columna.
 * - Las 4 fichas finales deben formar un grupo ortogonal conectado.
 * - Si el board NO está vacío, al menos una ficha nueva debe tocar una ficha previa.
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
  if (!placementsAreConnected(placements)) {
    return {
      ok: false,
      reason: 'Las 4 fichas deben mantenerse conectadas como un gusanito.',
    };
  }
  if (!wasEmpty && !touchesPreviousBoard(board, placements)) {
    return {
      ok: false,
      reason: 'A partir de la segunda ronda, tu acomodo debe tocar al menos una ficha ya colocada.',
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
