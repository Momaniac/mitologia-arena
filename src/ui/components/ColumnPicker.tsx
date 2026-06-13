import { useGameStore } from '../../state/gameStore';
import { TokenIcon } from './TokenIcon';

export function ColumnPicker() {
  const draft = useGameStore((s) => s.draftBet);
  const drawn = useGameStore((s) => s.currentDraw);
  const setCol = useGameStore((s) => s.setDraftColumn);
  if (!draft || !drawn) return null;
  const tokens = draft.tombola === 'A' ? drawn.A : drawn.B;

  return (
    <div className="p-4 rounded-xl border border-ink/10 bg-white">
      <h3 className="font-bold text-ink mb-2">Posición de colocación</h3>
      <p className="text-xs text-ink/60 mb-3">
        Si ganas, estas 4 fichas (en este orden) caerán por gravedad sobre las
        columnas elegidas. Deben formar un gusanito y tocar al menos una ficha
        previa desde la ronda 2.
      </p>
      <div className="space-y-2">
        {tokens.map((tk, i) => (
          <div key={tk.id} className="flex items-center gap-3">
            <span className="text-sm text-ink/60 w-6">#{i + 1}</span>
            <TokenIcon figure={tk.figure} size="sm" />
            <div className="flex gap-1 flex-1">
              {[0, 1, 2, 3, 4].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCol(i, c)}
                  className={`flex-1 py-1.5 rounded border text-sm font-semibold ${
                    draft.columns[i] === c
                      ? 'bg-link text-white border-link'
                      : 'bg-base border-ink/10 text-ink/70 hover:border-link'
                  }`}
                >
                  {c + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
