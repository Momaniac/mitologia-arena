import { FIGURE_LABEL, type Figure } from '../../engine/types';
import { CARD_ART } from '../figureArt';

/**
 * Naipe (carta) de una figura. La ilustración es circular con fondo negro, así
 * que la carta también es negra para que el círculo se funda sin costura. Lleva
 * un marco ornamental dorado con gemas en las esquinas, al estilo de los naipes
 * de juegos de mesa mitológicos. Ver ASSETS.md · src/assets/cards.
 */
const GOLD_FRAME = 'linear-gradient(155deg,#f6d97a 0%,#caa23c 42%,#8a6d1f 72%,#e7c665 100%)';

function CornerGems() {
  const gem = 'absolute h-1.5 w-1.5 rotate-45 rounded-[1px] bg-accent shadow';
  return (
    <>
      <span className={`${gem} left-1 top-1`} />
      <span className={`${gem} right-1 top-1`} />
      <span className={`${gem} bottom-1 left-1`} />
      <span className={`${gem} bottom-1 right-1`} />
    </>
  );
}

export function Card({ figure, className = '' }: { figure: Figure; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0a0a0d] p-2 shadow-elev ${className}`}>
      <div className="rounded-lg p-[2px]" style={{ background: GOLD_FRAME }}>
        <div className="overflow-hidden rounded-[7px] bg-black">
          <img
            src={CARD_ART[figure]}
            alt={FIGURE_LABEL[figure]}
            draggable={false}
            className="aspect-square w-full object-cover"
          />
          <div className="border-t border-accent/25 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-accent/90">
            {FIGURE_LABEL[figure]}
          </div>
        </div>
      </div>
      <CornerGems />
    </div>
  );
}
