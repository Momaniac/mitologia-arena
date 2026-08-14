/** Límites del cronómetro de apuestas, en segundos. */
export const BET_MIN_SECONDS = 10;
export const BET_MAX_SECONDS = 300; // 5 minutos: máximo pedido por el cliente.
export const BET_STEP_SECONDS = 5;

/** Atajos frecuentes; todos dentro de [BET_MIN_SECONDS, BET_MAX_SECONDS]. */
export const BET_PRESETS = [30, 60, 120, 300];

/** Deja `seconds` dentro de los límites y alineado al paso del fader. */
export function clampBetSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return BET_MIN_SECONDS;
  const stepped = Math.round(seconds / BET_STEP_SECONDS) * BET_STEP_SECONDS;
  return Math.max(BET_MIN_SECONDS, Math.min(BET_MAX_SECONDS, stepped));
}

/** "45 s", "1:30", "5:00" — etiqueta legible de una duración. */
export function formatDuration(total: number): string {
  if (total < 60) return `${total} s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
