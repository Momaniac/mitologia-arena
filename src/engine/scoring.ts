import type { Board, Combination, Figure } from './types';
import { COLS, ROWS } from './board';

/**
 * Devuelve todas las líneas del tablero (filas, columnas, ambas diagonales)
 * como arreglos de celdas (`Figure | null`), siempre con `null` para huecos.
 */
export function getLines(board: Board): (Figure | null)[][] {
  const lines: (Figure | null)[][] = [];

  // Filas
  for (let r = 0; r < ROWS; r++) lines.push(board[r].slice());
  // Columnas
  for (let c = 0; c < COLS; c++) {
    lines.push(Array.from({ length: ROWS }, (_, r) => board[r][c]));
  }
  // Diagonales ↘ (down-right). Solo aquellas con longitud >= 3.
  for (let start = -(ROWS - 1); start < COLS; start++) {
    const line: (Figure | null)[] = [];
    for (let r = 0; r < ROWS; r++) {
      const c = start + r;
      if (c >= 0 && c < COLS) line.push(board[r][c]);
    }
    if (line.length >= 3) lines.push(line);
  }
  // Diagonales ↙ (down-left).
  for (let start = 0; start < ROWS + COLS - 1; start++) {
    const line: (Figure | null)[] = [];
    for (let r = 0; r < ROWS; r++) {
      const c = start - r;
      if (c >= 0 && c < COLS) line.push(board[r][c]);
    }
    if (line.length >= 3) lines.push(line);
  }
  return lines;
}

/**
 * Cuenta cuántas veces aparece el patrón `combination` (en orden directo
 * o inverso) como subsecuencia CONTIGUA y SIN HUECOS en `line`.
 *
 * Una misma línea puede contener múltiples combinaciones — el ejemplo del doc:
 *   Línea: [D, H, K, H, D], combinación [D, H, K] → 2 puntos
 *   (D-H-K directa en [0..2], K-H-D inversa en [2..4])
 *
 * Cuenta directa e inversa por separado. Si la combinación es un palíndromo
 * (ej. D-H-D), un mismo segmento contaría como ambas — eso es lo correcto
 * según el doc ("una coincidencia directa y una inversa").
 */
export function countCombinationOccurrences(
  line: (Figure | null)[],
  combination: Combination,
): number {
  const direct = combination;
  const reverse: Combination = [combination[2], combination[1], combination[0]];
  let count = 0;
  for (let i = 0; i + 2 < line.length; i++) {
    const a = line[i];
    const b = line[i + 1];
    const c = line[i + 2];
    if (a === null || b === null || c === null) continue;
    if (a === direct[0] && b === direct[1] && c === direct[2]) count++;
    if (a === reverse[0] && b === reverse[1] && c === reverse[2]) count++;
  }
  return count;
}

/** Puntaje crudo (sin multiplicador) para un jugador dado el tablero. */
export function rawScore(board: Board, combination: Combination): number {
  const lines = getLines(board);
  let total = 0;
  for (const line of lines) {
    total += countCombinationOccurrences(line, combination);
  }
  return total;
}
