import { getConditionsRepository } from './_lib/conditionsRepository.js';

type ApiRequest = {
  method?: string;
  query: Record<string, unknown>;
};

type ApiResponse = {
  status(code: number): { json(payload: unknown): void };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const gameId = String(req.query.gameId ?? '');
  const playerId = String(req.query.playerId ?? '');
  const playerSecret = String(req.query.playerSecret ?? '');
  const condition = await getConditionsRepository().getPlayerCondition(
    gameId,
    playerId,
    playerSecret,
  );

  if (!condition) {
    res.status(403).json({ error: 'Esta información es privada.' });
    return;
  }

  res.status(200).json({ condition });
}
