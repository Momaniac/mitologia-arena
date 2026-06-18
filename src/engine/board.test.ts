import { describe, expect, it } from 'vitest';
import {
  availableColumns,
  emptyBoard,
  hasFloatingTokens,
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
  it('primera ronda: no exige contacto si forma gusanito', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 1, 2, 3]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][0]).toBe(D);
      expect(r.board[4][1]).toBe(H);
      expect(r.board[4][2]).toBe(K);
      expect(r.board[4][3]).toBe(D);
    }
  });

  it('aplica gravedad y permite que el gusanito conecte por cara vertical', () => {
    const b = emptyBoard();
    const r = placeTokens(b, [H, K, D, H], [0, 1, 1, 0]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][0]).toBe(H);
      expect(r.board[4][1]).toBe(K);
      expect(r.board[3][1]).toBe(D);
      expect(r.board[3][0]).toBe(H);
    }
  });

  it('rechaza colocación que no toca ficha previa cuando board no está vacío', () => {
    const b = emptyBoard();
    b[4][0] = D;
    const r = placeTokens(b, [H, K, D, H], [3, 4, 4, 3]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('debe tocar');
  });

  it('acepta si al menos una ficha nueva toca ficha previa', () => {
    const b = emptyBoard();
    b[4][0] = D;
    const r = placeTokens(b, [H, K, D, H], [1, 2, 3, 4]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][1]).toBe(H);
    }
  });

  it('rechaza gusanito roto en grupos separados', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 1, 3, 4]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('gusanito');
  });

  it('acepta 4 fichas en la misma columna si caen de abajo hacia arriba', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 0, 0, 0]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][0]).toBe(D);
      expect(r.board[3][0]).toBe(H);
      expect(r.board[2][0]).toBe(K);
      expect(r.board[1][0]).toBe(D);
    }
  });

  it('rechaza fichas apiladas en 2 columnas si el orden produce un salto diagonal', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 0, 1, 1]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('diagonal');
  });

  it('rechaza un mismo acomodo si el orden salta en diagonal', () => {
    const b = emptyBoard();
    for (let c = 0; c < 4; c++) b[4][c] = D;
    const r = placeTokens(b, [D, H, K, D], [2, 3, 4, 4]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('diagonal');
  });

  it('acepta un gusanito horizontal en orden de colocación', () => {
    const r = placeTokens(emptyBoard(), [D, H, K, D], [0, 1, 2, 3]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][0]).toBe(D);
      expect(r.board[4][1]).toBe(H);
      expect(r.board[4][2]).toBe(K);
      expect(r.board[4][3]).toBe(D);
    }
  });

  it('acepta el mismo acomodo si el orden va de abajo hacia arriba y luego por caras', () => {
    const b = emptyBoard();
    for (let c = 0; c < 4; c++) b[4][c] = D;
    const r = placeTokens(b, [D, H, K, D], [4, 4, 3, 2]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.board[4][4]).toBe(D);
      expect(r.board[3][4]).toBe(H);
      expect(r.board[3][3]).toBe(K);
      expect(r.board[3][2]).toBe(D);
    }
  });

  it('acepta contacto con ficha previa cuando es vertical por una cara', () => {
    const b = emptyBoard();
    for (let c = 0; c < 4; c++) b[4][c] = D;
    const r = placeTokens(b, [H, K, D, H], [0, 1, 1, 0]);
    expect(r.ok).toBe(true);
  });

  it('rechaza si no se usan exactamente las fichas de la tómbola', () => {
    const r = placeTokens(
      emptyBoard(),
      [D, H, K, D],
      [0, 1, 2, 3],
      [D, H, K, K],
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('exactamente las 4 fichas');
  });

  it('rechaza si una columna se llena durante la jugada', () => {
    const b = emptyBoard();
    for (let r = 0; r < 5; r++) b[r][0] = D;
    const r = placeTokens(b, [H, K, D, H], [0, 1, 2, 3]);
    expect(r.ok).toBe(false);
  });

  it('isBoardEmpty / availableColumns', () => {
    const b = emptyBoard();
    expect(isBoardEmpty(b)).toBe(true);
    expect(availableColumns(b)).toEqual([0, 1, 2, 3, 4]);
    b[4][0] = D;
    expect(isBoardEmpty(b)).toBe(false);
  });

  it('detecta fichas flotantes', () => {
    const b = emptyBoard();
    b[3][0] = D;
    expect(hasFloatingTokens(b)).toBe(true);
  });
});
