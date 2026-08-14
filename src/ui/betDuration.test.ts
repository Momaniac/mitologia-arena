import { describe, expect, it } from 'vitest';
import {
  BET_MAX_SECONDS,
  BET_MIN_SECONDS,
  BET_PRESETS,
  clampBetSeconds,
  formatDuration,
} from './betDuration';

describe('clampBetSeconds', () => {
  it('respeta el máximo de 5 minutos pedido por el cliente', () => {
    expect(BET_MAX_SECONDS).toBe(300);
    expect(clampBetSeconds(600)).toBe(300);
    expect(clampBetSeconds(301)).toBe(300);
  });

  it('respeta el mínimo', () => {
    expect(clampBetSeconds(0)).toBe(BET_MIN_SECONDS);
    expect(clampBetSeconds(-40)).toBe(BET_MIN_SECONDS);
  });

  it('alinea al paso de 5 s', () => {
    expect(clampBetSeconds(47)).toBe(45);
    expect(clampBetSeconds(48)).toBe(50);
  });

  it('no rompe con valores inválidos', () => {
    expect(clampBetSeconds(Number.NaN)).toBe(BET_MIN_SECONDS);
  });

  it('deja pasar los atajos tal cual', () => {
    for (const preset of BET_PRESETS) expect(clampBetSeconds(preset)).toBe(preset);
  });
});

describe('formatDuration', () => {
  it('usa segundos por debajo del minuto y mm:ss por encima', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(300)).toBe('5:00');
  });
});
