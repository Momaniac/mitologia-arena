import { assignUniqueConditions } from '../engine/conditions';
import { makeRng } from '../engine/rng';
import type { Condition } from '../engine/types';

export type GameSession = {
  gameId: string;
  moderatorSecret: string;
  playerSecrets: Record<string, string>;
  assignments: Record<string, Condition>;
};

const SESSION_KEY = 'mitologia.session';

type StoredSession = {
  gameId: string;
  playerId: string;
  playerSecret: string;
  moderatorSecret: string;
};

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function createGameSession(
  participants: readonly string[],
  seed: number,
): Promise<GameSession> {
  const assignments = assignUniqueConditions(participants, makeRng(seed));
  const playerSecrets = Object.fromEntries(
    participants.map((participantId) => [participantId, randomId('player')]),
  );

  return {
    gameId: randomId('game'),
    moderatorSecret: randomId('moderator'),
    playerSecrets,
    assignments,
  };
}

export function rememberSession(session: GameSession, playerId: string): void {
  const playerSecret = session.playerSecrets[playerId];
  if (!playerSecret) return;
  const stored: StoredSession = {
    gameId: session.gameId,
    playerId,
    playerSecret,
    moderatorSecret: session.moderatorSecret,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
}
