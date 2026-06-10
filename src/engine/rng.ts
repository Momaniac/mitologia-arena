/**
 * Mulberry32 — RNG con seed, determinístico, suficiente para juego no criptográfico.
 * Permite tests reproducibles.
 */
export type RNG = () => number;

export function makeRng(seed: number = Date.now()): RNG {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: RNG, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

export function shuffle<T>(arr: readonly T[], rng: RNG): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickN<T>(arr: readonly T[], n: number, rng: RNG): T[] {
  return shuffle(arr, rng).slice(0, n);
}
