import { describe, expect, it } from 'vitest';
import {
  availableColumns,
  emptyBoard,
  isBoardEmpty,
  lowestFreeRow,
  placeTokens,
} from './board';
import type { Figure } from './types';

const D: Figure = 'dragon';
const H: Figure = 'hydra';
const K: Figure = 'kraken';

describe('lowestFreeRow', () => {
  it('en columna vacía devuelve la fila inferior (4)', () => {
    expect(lowestFreeRow(emptyBoard(), 0)).toBe(4);
  });

  it('si la fila inferior está ocupada, devuelve la siguiente arriba', () => {
    const b = emptyBoard();
    b[4][0] = D;
    expect(lowestFreeRow(b, 0)).toBe(3);
  });

  it('columna llena devuelve null', () => {
    const b = emptyBoard();
    for (let r = 0; r < 5; r++) b[r][0] = D;
    expect(lowestFreeRow(b, 0)).toBe(null);
  });
});

describe('placeTokens (gravedad + contacto)', () => {
  it('primera ronda: no exige contacto', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 1, 2, 3]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][0]).toBe(D);
      expect(r.board[4][1]).toBe(H);
      expect(r.board[4][2]).toBe(K);
      expect(r.board[4][3]).toBe(D);
    }
  });

  it('aplica gravedad: ficha cae al espacio libre más bajo', () => {
    const b = emptyBoard();
    b[4][0] = D;
    const r = placeTokens(b, [H], [0]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[3][0]).toBe(H);
      expect(r.board[4][0]).toBe(D);
    }
  });

  it('rechaza colocación que no toca ficha existente cuando board no está vacío', () => {
    const b = emptyBoard();
    b[4][0] = D;
    const r = placeTokens(b, [H], [4]);
    expect(r.ok).toBe(false);
  });

  it('acepta colocación que toca por arriba sobre ficha previa', () => {
    const b = emptyBoard();
    b[4][0] = D;
    const r = placeTokens(b, [H], [1]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][1]).toBe(H);
    }
  });

  it('rechaza si una columna se llena durante la jugada', () => {
    const b = emptyBoard();
    for (let r = 0; r < 5; r++) b[r][0] = D;
    const r = placeTokens(b, [H], [0]);
    expect(r.ok).toBe(false);
  });

  it('isBoardEmpty / availableColumns', () => {
    const b = emptyBoard();
    expect(isBoardEmpty(b)).toBe(true);
    expect(availableColumns(b)).toEqual([0, 1, 2, 3, 4]);
    b[4][0] = D;
    expect(isBoardEmpty(b)).toBe(false);
  });
});
