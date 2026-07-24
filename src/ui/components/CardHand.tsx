import type { Card as CardType } from '../../engine/types';
import { Card } from './Card';

type Props = {
  hand: CardType[];
  selected: CardType[];
  onAdd: (card: CardType) => void;
  onClear: () => void;
};

export function CardHand({ hand, selected, onAdd, onClear }: Props) {
  const remaining = hand.filter((c) => !selected.find((s) => s.id === c.id));
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-ink">Tu mano</h4>
        <div className="flex gap-3">
          {remaining.length === 0 && <p className="text-sm text-muted">Todas seleccionadas.</p>}
          {remaining.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAdd(c)}
              className="w-[92px] rounded-xl transition-transform hover:-translate-y-1"
            >
              <Card figure={c.figure} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ink">
            Tu combinación (orden: izquierda → derecha)
          </h4>
          {selected.length > 0 && (
            <button type="button" onClick={onClear} className="text-xs text-link hover:underline">
              Reiniciar
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {[0, 1, 2].map((i) =>
            selected[i] ? (
              <div key={selected[i].id} className="relative w-[92px]">
                <span className="absolute -top-2 left-1/2 z-10 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink shadow">
                  {i + 1}
                </span>
                <Card figure={selected[i].figure} className="ring-2 ring-accent" />
              </div>
            ) : (
              <div
                key={i}
                className="flex aspect-[3/4] w-[92px] items-center justify-center rounded-xl border-2 border-dashed border-line text-2xl text-muted"
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
