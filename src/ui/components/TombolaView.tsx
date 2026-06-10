import type { Token } from '../../engine/types';
import { TokenIcon } from './TokenIcon';

type Props = {
  id: 'A' | 'B';
  drawn: Token[];
  selected?: boolean;
  onSelect?: () => void;
  totalBets?: number;
};

export function TombolaView({ id, drawn, selected, onSelect, totalBets }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-accent bg-accent/10 shadow-lg'
          : 'border-ink/10 bg-white hover:border-link'
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-bold text-ink">Tómbola {id}</h3>
        {totalBets !== undefined && (
          <span className="text-sm text-ink/70">{totalBets} 🪙 totales</span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {drawn.map((t) => (
          <TokenIcon key={t.id} figure={t.figure} size="md" />
        ))}
      </div>
    </button>
  );
}
