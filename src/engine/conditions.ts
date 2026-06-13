import { type Board, type Condition, type Figure } from './types';
import { type RNG, shuffle } from './rng.js';

export const SECRET_CONDITIONS: Condition[] = [
  { id: 'dragon_gt_hydra', label: 'Dragón > Hydra', left: ['dragon'], right: ['hydra'] },
  { id: 'dragon_gt_minotauro', label: 'Dragón > Minotauro', left: ['dragon'], right: ['minotauro'] },
  { id: 'dragon_gt_fenix', label: 'Dragón > Fénix', left: ['dragon'], right: ['fenix'] },
  { id: 'dragon_gt_kraken', label: 'Dragón > Kraken', left: ['dragon'], right: ['kraken'] },
  { id: 'hydra_gt_dragon', label: 'Hydra > Dragón', left: ['hydra'], right: ['dragon'] },
  { id: 'hydra_gt_minotauro', label: 'Hydra > Minotauro', left: ['hydra'], right: ['minotauro'] },
  { id: 'hydra_gt_fenix', label: 'Hydra > Fénix', left: ['hydra'], right: ['fenix'] },
  { id: 'hydra_gt_kraken', label: 'Hydra > Kraken', left: ['hydra'], right: ['kraken'] },
  { id: 'minotauro_gt_dragon', label: 'Minotauro > Dragón', left: ['minotauro'], right: ['dragon'] },
  { id: 'minotauro_gt_hydra', label: 'Minotauro > Hydra', left: ['minotauro'], right: ['hydra'] },
  { id: 'minotauro_gt_fenix', label: 'Minotauro > Fénix', left: ['minotauro'], right: ['fenix'] },
  { id: 'minotauro_gt_kraken', label: 'Minotauro > Kraken', left: ['minotauro'], right: ['kraken'] },
  { id: 'fenix_gt_dragon', label: 'Fénix > Dragón', left: ['fenix'], right: ['dragon'] },
  { id: 'fenix_gt_hydra', label: 'Fénix > Hydra', left: ['fenix'], right: ['hydra'] },
  { id: 'fenix_gt_minotauro', label: 'Fénix > Minotauro', left: ['fenix'], right: ['minotauro'] },
  { id: 'fenix_gt_kraken', label: 'Fénix > Kraken', left: ['fenix'], right: ['kraken'] },
  { id: 'kraken_gt_dragon', label: 'Kraken > Dragón', left: ['kraken'], right: ['dragon'] },
  { id: 'kraken_gt_hydra', label: 'Kraken > Hydra', left: ['kraken'], right: ['hydra'] },
  { id: 'kraken_gt_minotauro', label: 'Kraken > Minotauro', left: ['kraken'], right: ['minotauro'] },
  { id: 'kraken_gt_fenix', label: 'Kraken > Fénix', left: ['kraken'], right: ['fenix'] },
  { id: 'dragon_hydra_gt_minotauro_fenix', label: '(Dragón + Hydra) > (Minotauro + Fénix)', left: ['dragon', 'hydra'], right: ['minotauro', 'fenix'] },
  { id: 'dragon_hydra_gt_minotauro_kraken', label: '(Dragón + Hydra) > (Minotauro + Kraken)', left: ['dragon', 'hydra'], right: ['minotauro', 'kraken'] },
  { id: 'dragon_hydra_gt_fenix_kraken', label: '(Dragón + Hydra) > (Fénix + Kraken)', left: ['dragon', 'hydra'], right: ['fenix', 'kraken'] },
  { id: 'dragon_minotauro_gt_hydra_fenix', label: '(Dragón + Minotauro) > (Hydra + Fénix)', left: ['dragon', 'minotauro'], right: ['hydra', 'fenix'] },
  { id: 'dragon_minotauro_gt_hydra_kraken', label: '(Dragón + Minotauro) > (Hydra + Kraken)', left: ['dragon', 'minotauro'], right: ['hydra', 'kraken'] },
  { id: 'dragon_minotauro_gt_fenix_kraken', label: '(Dragón + Minotauro) > (Fénix + Kraken)', left: ['dragon', 'minotauro'], right: ['fenix', 'kraken'] },
  { id: 'dragon_fenix_gt_hydra_minotauro', label: '(Dragón + Fénix) > (Hydra + Minotauro)', left: ['dragon', 'fenix'], right: ['hydra', 'minotauro'] },
  { id: 'dragon_fenix_gt_hydra_kraken', label: '(Dragón + Fénix) > (Hydra + Kraken)', left: ['dragon', 'fenix'], right: ['hydra', 'kraken'] },
  { id: 'dragon_fenix_gt_minotauro_kraken', label: '(Dragón + Fénix) > (Minotauro + Kraken)', left: ['dragon', 'fenix'], right: ['minotauro', 'kraken'] },
  { id: 'dragon_kraken_gt_hydra_minotauro', label: '(Dragón + Kraken) > (Hydra + Minotauro)', left: ['dragon', 'kraken'], right: ['hydra', 'minotauro'] },
  { id: 'dragon_kraken_gt_hydra_fenix', label: '(Dragón + Kraken) > (Hydra + Fénix)', left: ['dragon', 'kraken'], right: ['hydra', 'fenix'] },
  { id: 'dragon_kraken_gt_minotauro_fenix', label: '(Dragón + Kraken) > (Minotauro + Fénix)', left: ['dragon', 'kraken'], right: ['minotauro', 'fenix'] },
  { id: 'hydra_minotauro_gt_dragon_fenix', label: '(Hydra + Minotauro) > (Dragón + Fénix)', left: ['hydra', 'minotauro'], right: ['dragon', 'fenix'] },
  { id: 'hydra_minotauro_gt_dragon_kraken', label: '(Hydra + Minotauro) > (Dragón + Kraken)', left: ['hydra', 'minotauro'], right: ['dragon', 'kraken'] },
  { id: 'hydra_minotauro_gt_fenix_kraken', label: '(Hydra + Minotauro) > (Fénix + Kraken)', left: ['hydra', 'minotauro'], right: ['fenix', 'kraken'] },
  { id: 'hydra_fenix_gt_dragon_minotauro', label: '(Hydra + Fénix) > (Dragón + Minotauro)', left: ['hydra', 'fenix'], right: ['dragon', 'minotauro'] },
  { id: 'hydra_fenix_gt_dragon_kraken', label: '(Hydra + Fénix) > (Dragón + Kraken)', left: ['hydra', 'fenix'], right: ['dragon', 'kraken'] },
  { id: 'hydra_fenix_gt_minotauro_kraken', label: '(Hydra + Fénix) > (Minotauro + Kraken)', left: ['hydra', 'fenix'], right: ['minotauro', 'kraken'] },
  { id: 'hydra_kraken_gt_dragon_minotauro', label: '(Hydra + Kraken) > (Dragón + Minotauro)', left: ['hydra', 'kraken'], right: ['dragon', 'minotauro'] },
  { id: 'hydra_kraken_gt_dragon_fenix', label: '(Hydra + Kraken) > (Dragón + Fénix)', left: ['hydra', 'kraken'], right: ['dragon', 'fenix'] },
  { id: 'hydra_kraken_gt_minotauro_fenix', label: '(Hydra + Kraken) > (Minotauro + Fénix)', left: ['hydra', 'kraken'], right: ['minotauro', 'fenix'] },
  { id: 'minotauro_fenix_gt_dragon_hydra', label: '(Minotauro + Fénix) > (Dragón + Hydra)', left: ['minotauro', 'fenix'], right: ['dragon', 'hydra'] },
  { id: 'minotauro_fenix_gt_dragon_kraken', label: '(Minotauro + Fénix) > (Dragón + Kraken)', left: ['minotauro', 'fenix'], right: ['dragon', 'kraken'] },
  { id: 'minotauro_fenix_gt_hydra_kraken', label: '(Minotauro + Fénix) > (Hydra + Kraken)', left: ['minotauro', 'fenix'], right: ['hydra', 'kraken'] },
  { id: 'minotauro_kraken_gt_dragon_hydra', label: '(Minotauro + Kraken) > (Dragón + Hydra)', left: ['minotauro', 'kraken'], right: ['dragon', 'hydra'] },
  { id: 'minotauro_kraken_gt_dragon_fenix', label: '(Minotauro + Kraken) > (Dragón + Fénix)', left: ['minotauro', 'kraken'], right: ['dragon', 'fenix'] },
  { id: 'minotauro_kraken_gt_hydra_fenix', label: '(Minotauro + Kraken) > (Hydra + Fénix)', left: ['minotauro', 'kraken'], right: ['hydra', 'fenix'] },
  { id: 'fenix_kraken_gt_dragon_hydra', label: '(Fénix + Kraken) > (Dragón + Hydra)', left: ['fenix', 'kraken'], right: ['dragon', 'hydra'] },
  { id: 'fenix_kraken_gt_dragon_minotauro', label: '(Fénix + Kraken) > (Dragón + Minotauro)', left: ['fenix', 'kraken'], right: ['dragon', 'minotauro'] },
  { id: 'fenix_kraken_gt_hydra_minotauro', label: '(Fénix + Kraken) > (Hydra + Minotauro)', left: ['fenix', 'kraken'], right: ['hydra', 'minotauro'] },
];

export function buildConditionCatalog(): Condition[] {
  return SECRET_CONDITIONS.slice();
}

/** Cuenta fichas de cada figura presentes en el tablero. */
export function countFigures(board: Board): Record<Figure, number> {
  const c: Record<Figure, number> = {
    dragon: 0,
    hydra: 0,
    fenix: 0,
    kraken: 0,
    minotauro: 0,
  };
  for (const row of board) {
    for (const cell of row) {
      if (cell) c[cell]++;
    }
  }
  return c;
}

export function evaluateCondition(board: Board, condition: Condition): boolean {
  const counts = countFigures(board);
  const leftTotal = condition.left.reduce((sum, figure) => sum + counts[figure], 0);
  const rightTotal = condition.right.reduce((sum, figure) => sum + counts[figure], 0);
  return leftTotal > rightTotal;
}

export function assignUniqueConditions(
  participantIds: readonly string[],
  rng: RNG,
): Record<string, Condition> {
  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    throw new Error('No se pueden asignar condiciones a participantes repetidos.');
  }
  if (participantIds.length > SECRET_CONDITIONS.length) {
    throw new Error('No fue posible asignar una condición única. Revisa la configuración de la partida.');
  }
  const shuffled = shuffle(SECRET_CONDITIONS, rng);
  const assignments: Record<string, Condition> = {};
  participantIds.forEach((participantId, index) => {
    assignments[participantId] = shuffled[index];
  });
  return assignments;
}
