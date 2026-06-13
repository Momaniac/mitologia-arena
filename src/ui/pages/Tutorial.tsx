import { useState } from 'react';
import { TUTORIAL_STEPS } from '../../tutorial/steps';
import { FIGURE_EMOJI, FIGURE_LABEL, type Figure } from '../../engine/types';

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [i, setI] = useState(0);
  const step = TUTORIAL_STEPS[i];
  const isLast = i === TUTORIAL_STEPS.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl border-t-4 border-accent">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-ink/50">
            Paso {i + 1} de {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            onClick={onFinish}
            className="text-xs text-link hover:underline"
          >
            Saltar tutorial
          </button>
        </div>

        <div className="w-full bg-ink/10 h-1 rounded-full mb-6">
          <div
            className="bg-accent h-1 rounded-full transition-all"
            style={{ width: `${((i + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <h2 className="text-2xl font-extrabold text-ink mb-3">{step.title}</h2>
        <p className="text-ink/80 leading-relaxed mb-6 whitespace-pre-line">{step.body}</p>

        {step.highlight && (
          <div className="flex gap-3 justify-center mb-6">
            {(step.highlight as Figure[]).map((f) => (
              <div
                key={f}
                className="flex flex-col items-center"
              >
                <span className="text-3xl">{FIGURE_EMOJI[f]}</span>
                <span className="text-xs text-ink/70">{FIGURE_LABEL[f]}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setI((x) => Math.max(0, x - 1))}
            disabled={i === 0}
            className="px-4 py-2 rounded-lg text-ink/70 disabled:opacity-30 hover:bg-ink/5"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onFinish() : setI((x) => x + 1))}
            className="bg-accent hover:bg-accent-dark text-ink font-bold px-6 py-2 rounded-lg"
          >
            {isLast ? 'Empezar a jugar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
