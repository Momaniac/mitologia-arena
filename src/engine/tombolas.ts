import { FIGURES, type Token } from './types';
import { type RNG, shuffle } from './rng';

/** Cada tómbola: 20 fichas (4 por figura). */
export function buildTombola(id: 'A' | 'B'): Token[] {
  const out: Token[] = [];
  for (const f of FIGURES) {
    for (let i = 0; i < 4; i++) {
      out.push({ id: `${id}-${f}-${i}`, figure: f });
    }
  }
  return out;
}

export type TombolaState = {
  A: Token[];
  B: Token[];
};

export function buildTombolas(): TombolaState {
  return { A: buildTombola('A'), B: buildTombola('B') };
}

/**
 * Extrae 4 fichas aleatorias sin reemplazo de la tómbola dada.
 * Retorna { drawn, remaining }.
 */
export function drawFour(
  tombola: Token[],
  rng: RNG,
): { drawn: Token[]; remaining: Token[] } {
  if (tombola.length < 4) {
    return { drawn: tombola.slice(), remaining: [] };
  }
  const shuffled = shuffle(tombola, rng);
  return { drawn: shuffled.slice(0, 4), remaining: shuffled.slice(4) };
}
