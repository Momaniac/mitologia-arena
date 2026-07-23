import { FIGURES, type Card, type Figure } from './types';
import { type RNG, shuffle } from './rng';

/** 30 cartas en total: 6 por cada una de las 5 figuras. */
export function buildDeck(): Card[] {
  const out: Card[] = [];
  for (const f of FIGURES) {
    for (let i = 0; i < 6; i++) {
      out.push({ id: `${f}-${i}`, figure: f });
    }
  }
  return out;
}

export type DealResult = {
  hands: Card[][];
  remaining: Card[];
};

/**
 * Reparte 3 cartas a cada uno de los `numPlayers` jugadores.
 * Lanza si no hay suficientes cartas.
 */
export function dealHands(numPlayers: number, rng: RNG): DealResult {
  if (numPlayers * 3 > 30) throw new Error('Demasiados jugadores para 30 cartas');
  const shuffled = shuffle(buildDeck(), rng);
  const hands: Card[][] = [];
  for (let p = 0; p < numPlayers; p++) {
    hands.push(shuffled.slice(p * 3, p * 3 + 3));
  }
  return { hands, remaining: shuffled.slice(numPlayers * 3) };
}

/**
 * Reparte 3 cartas a cada jugador de forma INDEPENDIENTE (cada mano sale de un
 * mazo completo recién barajado). A diferencia de `dealHands`, no agota un mazo
 * compartido de 30, por lo que escala a partidas individuales con muchos
 * jugadores (>10). Respeta la regla "cada jugador recibe 3 cartas aleatorias".
 */
export function dealHandsIndependent(numPlayers: number, rng: RNG): Card[][] {
  const hands: Card[][] = [];
  for (let p = 0; p < numPlayers; p++) {
    hands.push(shuffle(buildDeck(), rng).slice(0, 3));
  }
  return hands;
}

/** Combinación secreta a partir de una mano ordenada por el jugador. */
export function handToCombination(hand: Card[]): [Figure, Figure, Figure] {
  if (hand.length !== 3) throw new Error('La mano debe tener 3 cartas');
  return [hand[0].figure, hand[1].figure, hand[2].figure];
}
