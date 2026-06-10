import { describe, expect, it } from 'vitest';
import { countFigures, evaluateCondition } from './conditions';
import { emptyBoard } from './board';
import type { Figure } from './types';

const D: Figure = 'dragon';
const H: Figure = 'hydra';

describe('evaluateCondition', () => {
  it('Dragones > Hydras: 3D 2H → true', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[4][2] = D;
    b[3][0] = H;
    b[3][1] = H;
    expect(
      evaluateCondition(b, { id: 't', left: 'dragon', op: '>', right: 'hydra' }),
    ).toBe(true);
  });

  it('Dragones > Hydras: 2D 2H → false', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[3][0] = H;
    b[3][1] = H;
    expect(
      evaluateCondition(b, { id: 't', left: 'dragon', op: '>', right: 'hydra' }),
    ).toBe(false);
  });

  it('Dragones >= Hydras: 2D 2H → true', () => {
    const b = emptyBoard();
    b[4][0] = D;
    b[4][1] = D;
    b[3][0] = H;
    b[3][1] = H;
    expect(
      evaluateCondition(b, { id: 't', left: 'dragon', op: '>=', right: 'hydra' }),
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
});
