import { describe, expect, it } from 'vitest';
import { buildDeck, dealHands } from './deck';
import { buildTombola } from './tombolas';
import { makeRng } from './rng';

describe('deck', () => {
  it('mazo tiene 30 cartas con 6 por figura', () => {
    const deck = buildDeck();
    expect(deck.length).toBe(30);
    const counts: Record<string, number> = {};
    for (const c of deck) counts[c.figure] = (counts[c.figure] ?? 0) + 1;
    expect(counts).toEqual({
      dragon: 6,
      hydra: 6,
      fenix: 6,
      kraken: 6,
      minotauro: 6,
    });
  });

  it('reparte 3 cartas por jugador sin repetir', () => {
    const rng = makeRng(42);
    const { hands, remaining } = dealHands(5, rng);
    expect(hands).toHaveLength(5);
    for (const h of hands) expect(h).toHaveLength(3);
    const ids = new Set<string>();
    for (const h of hands) for (const c of h) ids.add(c.id);
    for (const c of remaining) ids.add(c.id);
    expect(ids.size).toBe(30);
  });

  it('lanza si hay demasiados jugadores', () => {
    expect(() => dealHands(11, makeRng(1))).toThrow();
  });
});

describe('tombolas', () => {
  it('cada tómbola tiene 20 fichas con 4 por figura', () => {
    const t = buildTombola('A');
    expect(t.length).toBe(20);
    const counts: Record<string, number> = {};
    for (const f of t) counts[f.figure] = (counts[f.figure] ?? 0) + 1;
    expect(counts).toEqual({
      dragon: 4,
      hydra: 4,
      fenix: 4,
      kraken: 4,
      minotauro: 4,
    });
  });
});
