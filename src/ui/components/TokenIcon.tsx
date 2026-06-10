import { FIGURE_EMOJI, FIGURE_LABEL, type Figure } from '../../engine/types';

const FIGURE_BG: Record<Figure, string> = {
  dragon: 'bg-dragon',
  hydra: 'bg-hydra',
  fenix: 'bg-fenix',
  kraken: 'bg-kraken',
  minotauro: 'bg-minotauro',
};

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-3xl',
};

type Props = {
  figure: Figure;
  size?: Size;
  showLabel?: boolean;
  faded?: boolean;
};

export function TokenIcon({ figure, size = 'md', showLabel = false, faded = false }: Props) {
  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${faded ? 'opacity-50' : ''}`}
      title={FIGURE_LABEL[figure]}
    >
      <span
        className={`${SIZE_CLASSES[size]} ${FIGURE_BG[figure]} rounded-full flex items-center justify-center text-white shadow-md border-2 border-ink/30`}
        aria-label={FIGURE_LABEL[figure]}
      >
        {FIGURE_EMOJI[figure]}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-ink">{FIGURE_LABEL[figure]}</span>
      )}
    </div>
  );
}
