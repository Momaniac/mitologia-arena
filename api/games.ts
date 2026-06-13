import { getConditionsRepository } from './_lib/conditionsRepository.js';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status(code: number): { json(payload: unknown): void };
};

function parseBody(req: ApiRequest) {
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body ?? {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req);
    const participants = Array.isArray(body.participants)
      ? body.participants.map(String)
      : [];

    if (participants.length === 0) {
      res.status(400).json({ error: 'La partida debe tener participantes.' });
      return;
    }

    const game = await getConditionsRepository().createOrGetGame({
      gameId: typeof body.gameId === 'string' ? body.gameId : undefined,
      participants,
      seed: typeof body.seed === 'number' ? body.seed : undefined,
    });

    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error inesperado.',
    });
  }
}
