import { getConditionsRepository } from './_lib/conditionsRepository';

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
  const moderatorSecret = String(req.query.moderatorSecret ?? '');
  const assignments = await getConditionsRepository().getModeratorAssignments(
    gameId,
    moderatorSecret,
  );

  if (!assignments) {
    res.status(403).json({ error: 'Esta información es privada.' });
    return;
  }

  res.status(200).json({ assignments });
}
