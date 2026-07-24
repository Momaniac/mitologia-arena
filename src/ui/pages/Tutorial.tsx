import { useState } from 'react';
import { TUTORIAL_STEPS } from '../../tutorial/steps';
import { type Figure } from '../../engine/types';
import { TokenIcon } from '../components/TokenIcon';
import { Icon } from '../components/Icon';

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [i, setI] = useState(0);
  const step = TUTORIAL_STEPS[i];
  const isLast = i === TUTORIAL_STEPS.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-xl animate-fade-up rounded-2xl border border-line border-t-4 border-t-accent bg-surface p-8 shadow-elev">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            Paso {i + 1} de {TUTORIAL_STEPS.length}
          </span>
          <button type="button" onClick={onFinish} className="text-xs text-link hover:underline">
            Saltar tutorial
          </button>
        </div>

        <div className="mb-6 h-1 w-full rounded-full bg-line">
          <div
            className="h-1 rounded-full bg-accent transition-all"
            style={{ width: `${((i + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <h2 className="mb-3 text-2xl font-extrabold text-ink">{step.title}</h2>
        <p className="mb-6 whitespace-pre-line leading-relaxed text-ink/80">{step.body}</p>

        {step.highlight && (
          <div className="mb-6 flex justify-center gap-4">
            {(step.highlight as Figure[]).map((f) => (
              <TokenIcon key={f} figure={f} size="md" showLabel />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setI((x) => Math.max(0, x - 1))}
            disabled={i === 0}
            className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-muted hover:bg-ink/5 disabled:opacity-30"
          >
            <Icon name="arrow-left" size={18} />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onFinish() : setI((x) => x + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2 font-bold text-accent-ink hover:bg-accent-dark"
          >
            {isLast ? (
              <>
                <Icon name="play" size={18} />
                Empezar a jugar
              </>
            ) : (
              <>
                Siguiente
                <Icon name="arrow-right" size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
