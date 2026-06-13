import { Redis } from '@upstash/redis';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assignUniqueConditions } from '../../src/engine/conditions';
import type { Condition } from '../../src/engine/types';
import { makeRng } from '../../src/engine/rng';

export type GameRecord = {
  gameId: string;
  participants: string[];
  assignments: Record<string, Condition>;
  playerSecrets: Record<string, string>;
  moderatorSecret: string;
  createdAt: string;
  seed: number;
};

type CreateGameInput = {
  gameId?: string;
  participants: string[];
  seed?: number;
};

type ConditionsRepository = {
  createOrGetGame(input: CreateGameInput): Promise<GameRecord>;
  getPlayerCondition(
    gameId: string,
    playerId: string,
    playerSecret: string,
  ): Promise<Condition | null>;
  getModeratorAssignments(
    gameId: string,
    moderatorSecret: string,
  ): Promise<Record<string, Condition> | null>;
};

const GAME_KEY_PREFIX = 'mitologia:game:';

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createGameRecord(input: CreateGameInput): GameRecord {
  const seed = input.seed ?? Date.now();
  const gameId = input.gameId ?? randomId('game');
  const participants = input.participants;
  const assignments = assignUniqueConditions(participants, makeRng(seed));
  const playerSecrets = Object.fromEntries(
    participants.map((participantId) => [participantId, randomId('player')]),
  );

  return {
    gameId,
    participants,
    assignments,
    playerSecrets,
    moderatorSecret: randomId('moderator'),
    createdAt: new Date().toISOString(),
    seed,
  };
}

function redisRepository(redis: Redis): ConditionsRepository {
  async function getGame(gameId: string): Promise<GameRecord | null> {
    return redis.get<GameRecord>(`${GAME_KEY_PREFIX}${gameId}`);
  }

  return {
    async createOrGetGame(input) {
      const gameId = input.gameId ?? randomId('game');
      const key = `${GAME_KEY_PREFIX}${gameId}`;
      const existing = await redis.get<GameRecord>(key);
      if (existing) return existing;

      const next = createGameRecord({ ...input, gameId });
      const result = await redis.set(key, next, { nx: true });
      if (result === 'OK') return next;

      const saved = await redis.get<GameRecord>(key);
      if (saved) return saved;
      throw new Error('No fue posible asignar una condición única. Revisa la configuración de la partida.');
    },

    async getPlayerCondition(gameId, playerId, playerSecret) {
      const game = await getGame(gameId);
      if (!game || game.playerSecrets[playerId] !== playerSecret) return null;
      return game.assignments[playerId] ?? null;
    },

    async getModeratorAssignments(gameId, moderatorSecret) {
      const game = await getGame(gameId);
      if (!game || game.moderatorSecret !== moderatorSecret) return null;
      return game.assignments;
    },
  };
}

declare global {
  var __mitologiaLocalGames: Map<string, GameRecord> | undefined;
}

function localDevelopmentRepository(): ConditionsRepository {
  const games = globalThis.__mitologiaLocalGames ?? new Map<string, GameRecord>();
  globalThis.__mitologiaLocalGames = games;
  const filePath = join(
    tmpdir(),
    `mitologia-local-games-${Buffer.from(process.cwd()).toString('base64url')}.json`,
  );

  function loadGames() {
    if (games.size > 0 || !existsSync(filePath)) return;
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, GameRecord>;
    for (const [gameId, record] of Object.entries(raw)) games.set(gameId, record);
  }

  function saveGames() {
    writeFileSync(
      filePath,
      JSON.stringify(Object.fromEntries(games.entries()), null, 2),
    );
  }

  return {
    async createOrGetGame(input) {
      loadGames();
      const gameId = input.gameId ?? randomId('game');
      const existing = games.get(gameId);
      if (existing) return existing;
      const next = createGameRecord({ ...input, gameId });
      games.set(gameId, next);
      saveGames();
      return next;
    },

    async getPlayerCondition(gameId, playerId, playerSecret) {
      loadGames();
      const game = games.get(gameId);
      if (!game || game.playerSecrets[playerId] !== playerSecret) return null;
      return game.assignments[playerId] ?? null;
    },

    async getModeratorAssignments(gameId, moderatorSecret) {
      loadGames();
      const game = games.get(gameId);
      if (!game || game.moderatorSecret !== moderatorSecret) return null;
      return game.assignments;
    },
  };
}

export function getConditionsRepository(): ConditionsRepository {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisRepository(new Redis({ url, token }));

  if (process.env.NODE_ENV !== 'production') return localDevelopmentRepository();

  throw new Error('Faltan UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.');
}
