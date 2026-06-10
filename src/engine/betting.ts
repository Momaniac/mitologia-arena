import type { Bet, TombolaId } from './types';

export type RoundResolution =
  | {
      kind: 'winner';
      winnerTombola: TombolaId;
      winnerPlayerId: string;
      totals: { A: number; B: number };
    }
  | {
      kind: 'voided';
      reason: 'tombola-tie' | 'player-tie';
      totals: { A: number; B: number };
    };

/**
 * Resuelve una ronda según las reglas del documento:
 * - Gana la tómbola con MENOR cantidad total apostada.
 * - Empate de totales → ronda anulada (devolución).
 * - Dentro de la tómbola ganadora, gana el jugador con MAYOR apuesta individual.
 * - Empate entre las apuestas máximas → ronda anulada (devolución).
 *
 * Si una tómbola no recibió ninguna apuesta, su total = 0 y "gana" (es la menor).
 * Si ambas son 0 (nadie apostó), se considera empate-tombola → anulada.
 */
export function resolveRound(bets: readonly Bet[]): RoundResolution {
  const totals = { A: 0, B: 0 };
  for (const b of bets) totals[b.tombola] += b.amount;

  if (totals.A === totals.B) {
    return { kind: 'voided', reason: 'tombola-tie', totals };
  }
  const winnerTombola: TombolaId = totals.A < totals.B ? 'A' : 'B';
  const inWinning = bets.filter((b) => b.tombola === winnerTombola);
  if (inWinning.length === 0) {
    // Nadie apostó a la tómbola ganadora — no hay jugador que coloque fichas.
    return { kind: 'voided', reason: 'player-tie', totals };
  }
  const maxBet = Math.max(...inWinning.map((b) => b.amount));
  const top = inWinning.filter((b) => b.amount === maxBet);
  if (top.length > 1) {
    return { kind: 'voided', reason: 'player-tie', totals };
  }
  return {
    kind: 'winner',
    winnerTombola,
    winnerPlayerId: top[0].playerId,
    totals,
  };
}

export const MIN_BET = 1;
export const MAX_BET = 10;

export function isValidBetAmount(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_BET && n <= MAX_BET;
}
