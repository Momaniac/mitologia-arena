import { useEffect, useRef } from 'react';
import { useSecondsLeft } from '../hooks/useSecondsLeft';
import { Icon } from './Icon';

type Props = {
  /** Instante de cierre (ISO, reloj del servidor). */
  endsAt: string;
  /** Duración total de la ronda de apuestas, para dibujar el avance. */
  totalSeconds: number;
  /**
   * Se dispara una sola vez al llegar a cero. Solo el moderador lo usa: es quien
   * cierra las apuestas y cobra la multa (modelo host-autoritativo).
   */
  onExpire?: () => void;
  /** Texto bajo el reloj (distinto para moderador y jugador). */
  hint?: string;
};

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
}

/** Cuenta regresiva de la ronda de apuestas, igual para moderador y jugadores. */
export function BettingTimer({ endsAt, totalSeconds, onExpire, hint }: Props) {
  const left = useSecondsLeft(endsAt) ?? 0;
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (left > 0 || !onExpire || fired.current === endsAt) return;
    fired.current = endsAt;
    onExpire();
  }, [left, onExpire, endsAt]);

  const pct = Math.max(0, Math.min(100, (left / Math.max(1, totalSeconds)) * 100));
  const urgent = left <= 10;
  const warn = !urgent && left <= 20;
  const color = urgent ? 'text-danger' : warn ? 'text-accent' : 'text-success';
  const bar = urgent ? 'bg-danger' : warn ? 'bg-accent' : 'bg-success';

  return (
    <div
      className={`rounded-xl border p-3 ${urgent ? 'border-danger/40 bg-danger/10' : 'border-line bg-surface'}`}
      role="timer"
      aria-live="off"
    >
      <div className="flex items-center gap-3">
        <Icon name="clock" size={22} className={color} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">
              {left > 0 ? 'Tiempo para apostar' : 'Se acabó el tiempo'}
            </span>
            <span
              className={`text-2xl font-extrabold tabular-nums ${color} ${urgent && left > 0 ? 'animate-pulse' : ''}`}
            >
              {mmss(left)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-linear ${bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
