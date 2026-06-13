import { describe, expect, it } from 'vitest';
import {
  SECRET_CONDITIONS,
  assignUniqueConditions,
  countFigures,
  evaluateCondition,
} from './conditions';
import { emptyBoard } from './board';
import type { Figure } from './types';
import { makeRng } from './rng';

const D: Figure = 'dragon';
const H: Figure = 'hydra';

describe('evaluateCondition', () => {
  it('catálogo cerrado contiene 50 condiciones únicas', () => {
    expect(SECRET_CONDITIONS).toHaveLength(50);
    expect(new Set(SECRET_CONDITIONS.map((c) => c.id)).size).toBe(50);
  });

  it('Dragones > Hydras: 3D 2H → true', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[4][2] = D;
    b[3][0] = H;
    b[3][1] = H;
    expect(
      evaluateCondition(b, {
        id: 't',
        label: 'Dragón > Hydra',
        left: ['dragon'],
        right: ['hydra'],
      }),
    ).toBe(true);
  });

  it('Dragones > Hydras: 2D 2H → false', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[3][0] = H;
    b[3][1] = H;
    expect(
      evaluateCondition(b, {
        id: 't',
        label: 'Dragón > Hydra',
        left: ['dragon'],
        right: ['hydra'],
      }),
    ).toBe(false);
  });

  it('condición compuesta: (Dragón + Hydra) > (Fénix + Kraken)', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[3][0] = H;
    b[3][1] = 'fenix';
    expect(
      evaluateCondition(b, {
        id: 't',
        label: '(Dragón + Hydra) > (Fénix + Kraken)',
        left: ['dragon', 'hydra'],
        right: ['fenix', 'kraken'],
      }),
    ).toBe(true);
  });

  it('countFigures suma correctamente', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[3][0] = H;
    const c = countFigures(b);
    expect(c.dragon).toBe(2);
    expect(c.hydra).toBe(1);
    expect(c.fenix).toBe(0);
  });

  it('asigna condiciones únicas sin repetir dentro de una partida', () => {
    const assignments = assignUniqueConditions(
      ['p1', 'p2', 'p3', 'p4'],
      makeRng(123),
    );
    const ids = Object.values(assignments).map((condition) => condition.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('rechaza más participantes que condiciones disponibles', () => {
    const participants = Array.from({ length: 51 }, (_, i) => `p${i}`);
    expect(() => assignUniqueConditions(participants, makeRng(123))).toThrow(
      'No fue posible asignar una condición única.',
    );
  });
});
