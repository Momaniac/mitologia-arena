import type { Card } from '../../engine/types';
import { TokenIcon } from './TokenIcon';

type Props = {
  hand: Card[];
  selected: Card[];
  onAdd: (card: Card) => void;
  onClear: () => void;
};

export function CardHand({ hand, selected, onAdd, onClear }: Props) {
  const remaining = hand.filter((c) => !selected.find((s) => s.id === c.id));
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-ink mb-2">Tu mano</h4>
        <div className="flex gap-3">
          {remaining.length === 0 && (
            <p className="text-sm text-ink/50">Todas seleccionadas.</p>
          )}
          {remaining.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAdd(c)}
              className="p-3 rounded-xl border-2 border-ink/10 bg-white hover:border-link"
            >
              <TokenIcon figure={c.figure} size="lg" showLabel />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-ink">
            Tu combinación (orden: izquierda → derecha)
          </h4>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-link hover:underline"
            >
              Reiniciar
            </button>
          )}
        </div>
        <div className="flex gap-3 min-h-[88px]">
          {[0, 1, 2].map((i) =>
            selected[i] ? (
              <div
                key={selected[i].id}
                className="p-3 rounded-xl bg-accent/20 border-2 border-accent"
              >
                <TokenIcon figure={selected[i].figure} size="lg" showLabel />
              </div>
            ) : (
              <div
                key={i}
                className="p-3 rounded-xl border-2 border-dashed border-ink/20 w-[88px] h-[88px] flex items-center justify-center text-ink/40 text-2xl"
              >
                {i + 1}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
