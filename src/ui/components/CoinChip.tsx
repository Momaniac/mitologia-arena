import type { CSSProperties } from 'react';

/**
 * Ficha de casino. En las dinámicas reales de Arena la moneda de cambio son
 * fichas de casino de colores; el juego lo refleja. El COLOR cambia según el
 * valor de la apuesta.
 *
 * Valores: roja=1, verde=5, azul=10, blanca=50, negra=100.
 *
 * Regla de color (default, ajustable): se muestra la ficha de mayor denominación
 * que no exceda el monto (por umbral). Hoy el tope de apuesta es 10, así que solo
 * aparecen roja/verde/azul; blanca/negra quedan listas por si el rango crece.
 *
 * Placeholder premium (disco CSS) hasta que el diseñador entregue las imágenes de
 * fichas — ver ASSETS.md: bastará con reemplazar el disco por <img>.
 */
type ChipTier = {
  value: number;
  color: string;
  ring: string;
  textDark: boolean;
  label: string;
};

const CHIP_TIERS: ChipTier[] = [
  { value: 1, color: '#d9382c', ring: 'rgba(255,255,255,0.75)', textDark: false, label: 'Roja' },
  { value: 5, color: '#2b9c48', ring: 'rgba(255,255,255,0.75)', textDark: false, label: 'Verde' },
  { value: 10, color: '#2b73c4', ring: 'rgba(255,255,255,0.75)', textDark: false, label: 'Azul' },
  { value: 50, color: '#ececec', ring: 'rgba(0,0,0,0.28)', textDark: true, label: 'Blanca' },
  { value: 100, color: '#1b1b1b', ring: 'rgba(255,255,255,0.7)', textDark: false, label: 'Negra' },
];

/** Ficha de mayor denominación que no excede el monto. */
function chipTierForAmount(amount: number): ChipTier {
  let tier = CHIP_TIERS[0];
  for (const t of CHIP_TIERS) {
    if (amount >= t.value) tier = t;
  }
  return tier;
}

type Props = {
  /** Monto apostado; determina el color de la ficha. */
  value: number;
  /** Diámetro en px. */
  size?: number;
  /** Muestra el monto en el centro (si no, muestra el valor de la ficha). */
  showAmount?: boolean;
};

export function CoinChip({ value, size = 40, showAmount = true }: Props) {
  const tier = chipTierForAmount(value);
  const style: CSSProperties = {
    width: size,
    height: size,
    background: tier.color,
    color: tier.textDark ? '#1d1c1a' : '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
    fontSize: Math.max(11, Math.round(size * 0.3)),
  };
  const ringStyle: CSSProperties = {
    inset: Math.round(size * 0.11),
    border: `2px dashed ${tier.ring}`,
  };
  return (
    <span
      className="relative inline-grid place-items-center rounded-full font-extrabold"
      style={style}
      title={`Ficha ${tier.label} · vale ${tier.value}`}
    >
      <span className="pointer-events-none absolute rounded-full" style={ringStyle} />
      <span className="relative">{showAmount ? value : tier.value}</span>
    </span>
  );
}
