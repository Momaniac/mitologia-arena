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

function localDevelopmentSession(
  participants: readonly string[],
  seed: number,
): GameSession {
  const assignments = assignUniqueConditions(participants, makeRng(seed));
  const playerSecrets = Object.fromEntries(
    participants.map((participantId) => [participantId, randomId('player')]),
  );
  return {
    gameId: randomId('local_game'),
    moderatorSecret: randomId('local_moderator'),
    playerSecrets,
    assignments,
  };
}

export async function createGameSession(
  participants: readonly string[],
  seed: number,
): Promise<GameSession> {
  try {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants, seed }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<GameSession>;
  } catch (error) {
    if (import.meta.env.DEV) return localDevelopmentSession(participants, seed);
    throw error;
  }
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
