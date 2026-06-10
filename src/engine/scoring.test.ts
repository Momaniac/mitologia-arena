import { describe, expect, it } from 'vitest';
import { countCombinationOccurrences, getLines, rawScore } from './scoring';
import { emptyBoard } from './board';
import type { Combination, Figure } from './types';

const D: Figure = 'dragon';
const H: Figure = 'hydra';
const K: Figure = 'kraken';
const F: Figure = 'fenix';
const M: Figure = 'minotauro';

describe('countCombinationOccurrences', () => {
  it('ejemplo del documento: D-H-K-H-D con combinación D-H-K → 2 puntos', () => {
    const line: (Figure | null)[] = [D, H, K, H, D];
    const combo: Combination = [D, H, K];
    expect(countCombinationOccurrences(line, combo)).toBe(2);
  });

  it('no cuenta cuando hay huecos en el medio', () => {
    const line: (Figure | null)[] = [D, null, K];
    const combo: Combination = [D, H, K];
    expect(countCombinationOccurrences(line, combo)).toBe(0);
  });

  it('cuenta múltiples ocurrencias directas', () => {
    const line: (Figure | null)[] = [D, H, K, D, H, K];
    const combo: Combination = [D, H, K];
    expect(countCombinationOccurrences(line, combo)).toBe(2);
  });

  it('combinación palíndroma D-H-D cuenta directa e inversa por el mismo segmento', () => {
    const line: (Figure | null)[] = [D, H, D];
    const combo: Combination = [D, H, D];
    expect(countCombinationOccurrences(line, combo)).toBe(2);
  });

  it('línea sin coincidencias devuelve 0', () => {
    const line: (Figure | null)[] = [F, M, F, M, F];
    const combo: Combination = [D, H, K];
    expect(countCombinationOccurrences(line, combo)).toBe(0);
  });
});

describe('getLines', () => {
  it('5x5 produce filas + columnas + diagonales con longitud >= 3', () => {
    const lines = getLines(emptyBoard());
    // 5 filas + 5 columnas + diagonales ↘ con length>=3 + diagonales ↙ con length>=3
    // diagonales ↘: longitudes 1,2,3,4,5,4,3,2,1 → válidas (>=3): 3,4,5,4,3 = 5
    // diagonales ↙: igual número = 5
    expect(lines.length).toBe(5 + 5 + 5 + 5);
  });
});

describe('rawScore', () => {
  it('tablero vacío → 0', () => {
    expect(rawScore(emptyBoard(), [D, H, K])).toBe(0);
  });

  it('combinación en fila inferior cuenta 1 vez', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = H;
    b[4][2] = K;
    expect(rawScore(b, [D, H, K])).toBe(1);
  });

  it('combinación en diagonal ↘ cuenta', () => {
    const b = emptyBoard();
    b[2][0] = D;
    b[3][1] = H;
    b[4][2] = K;
    expect(rawScore(b, [D, H, K])).toBe(1);
  });

  it('combinación en diagonal ↙ cuenta', () => {
    const b = emptyBoard();
    b[2][2] = D;
    b[3][1] = H;
    b[4][0] = K;
    expect(rawScore(b, [D, H, K])).toBe(1);
  });

  it('orden inverso en fila también cuenta', () => {
    const b = emptyBoard();
    b[4][0] = K;
    b[4][1] = H;
    b[4][2] = D;
    expect(rawScore(b, [D, H, K])).toBe(1);
  });
});
