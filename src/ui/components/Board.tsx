import { type CSSProperties } from 'react';
import type { Board as BoardType, Figure } from '../../engine/types';
import { COLS } from '../../engine/board';
import { TokenIcon } from './TokenIcon';

/** Etiquetas del eje Y de abajo hacia arriba: fila 4=a, fila 3=b, ... fila 0=e */
const ROW_LABELS = ['e', 'd', 'c', 'b', 'a'] as const;

type PreviewPlacement = {
  row: number;
  col: number;
  figure: Figure;
  index: number; // Orden de colocación (0-3)
};

type Props = {
  board: BoardType;
  highlightCols?: number[];
  animatedPlacements?: { row: number; col: number }[];
  /** Fichas en modo preview (semitransparentes, para el picker visual) */
  previewPlacements?: PreviewPlacement[];
  /** Callback al hacer clic en una columna (para el picker visual) */
  onColumnClick?: (col: number) => void;
  /** Columnas clickeables (las que tienen espacio libre) */
  clickableColumns?: number[];
  /** Compact mode for embedding in the column picker section */
  compact?: boolean;
};

export function Board({
  board,
  highlightCols = [],
  animatedPlacements = [],
  previewPlacements = [],
  onColumnClick,
  clickableColumns,
  compact = false,
}: Props) {
  const cellSize = compact ? 'w-12 h-12' : 'w-14 h-14';
  const labelWidth = compact ? 'w-12' : 'w-14';
  const tokenSize = compact ? 'sm' : 'sm';

  return (
    <div className="inline-block bg-ink/90 p-2 rounded-xl shadow-lg">
      <div className="flex">
        {/* Eje Y — letras */}
        <div className="flex flex-col gap-1 mr-1 justify-center">
          {ROW_LABELS.map((label) => (
            <div
              key={label}
              className={`${cellSize} flex items-center justify-center text-xs text-base/70 font-mono font-bold`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid principal */}
        <div>
          <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {board.flatMap((row, r) =>
              row.map((cell, c) => {
                const highlighted = highlightCols.includes(c);
                const animated = animatedPlacements.some(
                  (p) => p.row === r && p.col === c,
                );
                const preview = previewPlacements.find(
                  (p) => p.row === r && p.col === c,
                );
                const isClickable = clickableColumns?.includes(c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${cellSize} rounded-md flex items-center justify-center transition-all ${
                      highlighted ? 'bg-accent/30 ring-2 ring-accent' : 'bg-base/15'
                    } ${isClickable ? 'cursor-pointer hover:bg-accent/20 hover:ring-1 hover:ring-accent/50' : ''}`}
                    onClick={() => isClickable && onColumnClick?.(c)}
                  >
                    {preview ? (
                      <div className="relative animate-token-drop"
                        style={{ '--drop-distance': `${(r + 1) * -56}px` } as CSSProperties}
                      >
                        <div className="opacity-70 ring-2 ring-dashed ring-accent rounded-full">
                          <TokenIcon figure={preview.figure} size={tokenSize} />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-accent text-ink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                          {preview.index + 1}
                        </span>
                      </div>
                    ) : cell ? (
                      <div
                        className={animated ? 'animate-token-drop' : undefined}
                        style={animated ? { '--drop-distance': `${(r + 1) * -56}px` } as CSSProperties : undefined}
                      >
                        <TokenIcon figure={cell} size={tokenSize} />
                      </div>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
          {/* Eje X — números */}
          <div className={`grid gap-1 mt-1`} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }, (_, c) => (
              <div
                key={c}
                className={`${labelWidth} text-center text-xs text-base/70 font-mono font-bold ${
                  onColumnClick && clickableColumns?.includes(c)
                    ? 'cursor-pointer hover:text-accent'
                    : ''
                }`}
                onClick={() => clickableColumns?.includes(c) && onColumnClick?.(c)}
              >
                {c + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
