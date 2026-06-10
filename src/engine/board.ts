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

/**
 * Adyacencia ortogonal por defecto (arriba/abajo/izquierda/derecha).
 * Pendiente confirmación del cliente — si fuera con diagonal, cambiar a 8-conexa.
 */
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

export type PlaceResult =
  | { ok: true; board: Board; placements: { row: number; col: number; figure: Figure }[] }
  | { ok: false; reason: string };

/**
 * Coloca 4 fichas en el board aplicando gravedad y reglas de contacto.
 * - Cada ficha cae a la fila libre más baja de su columna.
 * - Si el board NO está vacío, cada ficha colocada debe tocar al menos una ficha previa
 *   (que puede ser una recién colocada en esta misma jugada).
 * - Si una columna está llena cuando se intenta colocar, falla.
 */
export function placeTokens(
  board: Board,
  figures: readonly Figure[],
  columns: readonly number[],
): PlaceResult {
  if (figures.length !== columns.length) {
    return { ok: false, reason: 'mismatch fichas/columnas' };
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
    // Validación de contacto: necesario solo si el board no estaba vacío
    // al comienzo Y esta ficha no es la primera que se coloca esta jugada
    // sobre un board vacío. Si el board ya tenía fichas, TODA ficha nueva debe
    // tocar al menos una ficha (previa o recién colocada esta jugada).
    if (!wasEmpty && !touchesExisting(next, row, col)) {
      return {
        ok: false,
        reason: `ficha en (${row},${col}) no toca ninguna ficha existente`,
      };
    }
    next[row][col] = figures[i];
    placements.push({ row, col, figure: figures[i] });
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
