import {
  BET_MAX_SECONDS,
  BET_MIN_SECONDS,
  BET_PRESETS,
  BET_STEP_SECONDS,
  clampBetSeconds,
  formatDuration,
} from '../betDuration';

type Props = {
  /** Duración elegida, en segundos. */
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
  /** Encabezado del control. */
  label?: string;
};

/**
 * Fader para que el moderador fije el tiempo de apuestas con libertad, de 10 s
 * a 5 minutos. El servidor vuelve a acotar el valor, así que la UI no es la
 * única defensa.
 */
export function TimeFader({ value, onChange, disabled, label = 'Tiempo para apostar' }: Props) {
  const pct = ((value - BET_MIN_SECONDS) / (BET_MAX_SECONDS - BET_MIN_SECONDS)) * 100;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        <span className="text-2xl font-extrabold tabular-nums text-accent">
          {formatDuration(value)}
        </span>
      </div>

      <input
        type="range"
        className="time-fader"
        style={{ '--fader-pct': `${pct}%` } as React.CSSProperties}
        min={BET_MIN_SECONDS}
        max={BET_MAX_SECONDS}
        step={BET_STEP_SECONDS}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clampBetSeconds(Number(e.target.value)))}
        aria-label={label}
        aria-valuetext={formatDuration(value)}
      />

      <div className="flex justify-between text-[11px] tabular-nums text-muted">
        <span>{formatDuration(BET_MIN_SECONDS)}</span>
        <span>{formatDuration(BET_MAX_SECONDS)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {BET_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold disabled:opacity-50 ${
              value === s
                ? 'border-accent-dark bg-accent text-accent-ink'
                : 'border-line bg-surface2 text-muted'
            }`}
          >
            {formatDuration(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
