import { FIGURE_LABEL, type Figure } from '../../engine/types';
import { TOKEN_ART } from '../figureArt';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 32, md: 48, lg: 64 };

type Props = {
  figure: Figure;
  size?: Size;
  showLabel?: boolean;
  faded?: boolean;
};

/** Ficha de figura: medallón ilustrado (ver ASSETS.md · src/assets/tokens). */
export function TokenIcon({ figure, size = 'md', showLabel = false, faded = false }: Props) {
  const px = SIZE_PX[size];
  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${faded ? 'opacity-50' : ''}`}
      title={FIGURE_LABEL[figure]}
    >
      <img
        src={TOKEN_ART[figure]}
        alt={FIGURE_LABEL[figure]}
        width={px}
        height={px}
        draggable={false}
        className="object-contain"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}
      />
      {showLabel && <span className="text-xs font-medium text-ink/80">{FIGURE_LABEL[figure]}</span>}
    </div>
  );
}
