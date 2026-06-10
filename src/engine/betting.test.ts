import { describe, expect, it } from 'vitest';
import { resolveRound } from './betting';
import type { Bet } from './types';

function bet(playerId: string, tombola: 'A' | 'B', amount: number): Bet {
  return { playerId, tombola, amount, columns: [0, 0, 0, 0] };
}

describe('resolveRound', () => {
  it('gana la tómbola con MENOR total (regla contraintuitiva)', () => {
    const bets: Bet[] = [
      bet('p1', 'A', 10),
      bet('p2', 'A', 5),
      bet('p3', 'B', 3),
    ];
    const r = resolveRound(bets);
    expect(r.kind).toBe('winner');
    if (r.kind === 'winner') {
      expect(r.winnerTombola).toBe('B');
      expect(r.winnerPlayerId).toBe('p3');
    }
  });

  it('dentro de la tómbola ganadora, gana la apuesta MAYOR', () => {
    const bets: Bet[] = [
      bet('p1', 'A', 10),
      bet('p2', 'B', 3),
      bet('p3', 'B', 5),
    ];
    const r = resolveRound(bets);
    expect(r.kind).toBe('winner');
    if (r.kind === 'winner') {
      expect(r.winnerTombola).toBe('B');
      expect(r.winnerPlayerId).toBe('p3');
    }
  });

  it('empate de totales entre tómbolas → ronda anulada', () => {
    const bets: Bet[] = [bet('p1', 'A', 5), bet('p2', 'B', 5)];
    const r = resolveRound(bets);
    expect(r.kind).toBe('voided');
    if (r.kind === 'voided') {
      expect(r.reason).toBe('tombola-tie');
    }
  });

  it('empate entre apuestas máximas dentro de la ganadora → anulada', () => {
    const bets: Bet[] = [
      bet('p1', 'A', 10),
      bet('p2', 'B', 4),
      bet('p3', 'B', 4),
    ];
    const r = resolveRound(bets);
    expect(r.kind).toBe('voided');
    if (r.kind === 'voided') {
      expect(r.reason).toBe('player-tie');
    }
  });

  it('si nadie apostó a la ganadora (apuestas concentradas en una), anula', () => {
    // Caso esquina: todos apuestan a A → B tiene total 0, B "gana" pero nadie colocó allí.
    const bets: Bet[] = [bet('p1', 'A', 5), bet('p2', 'A', 3)];
    const r = resolveRound(bets);
    expect(r.kind).toBe('voided');
  });
});
