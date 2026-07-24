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

  return (
    <div className="inline-block rounded-2xl bg-surface p-3 shadow-elev ring-1 ring-accent/10">
      <div className="flex">
        {/* Eje Y — letras */}
        <div className="mr-1.5 flex flex-col justify-center gap-1.5">
          {ROW_LABELS.map((label) => (
            <div
              key={label}
              className={`${cellSize} flex items-center justify-center font-mono text-xs font-bold text-muted`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid principal */}
        <div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {board.flatMap((row, r) =>
              row.map((cell, c) => {
                const highlighted = highlightCols.includes(c);
                const animated = animatedPlacements.some((p) => p.row === r && p.col === c);
                const preview = previewPlacements.find((p) => p.row === r && p.col === c);
                const isClickable = clickableColumns?.includes(c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${cellSize} flex items-center justify-center rounded-xl shadow-well transition-all ${
                      highlighted
                        ? 'bg-accent/25 ring-2 ring-accent'
                        : 'bg-surface2'
                    } ${isClickable ? 'cursor-pointer ring-1 ring-transparent hover:bg-accent/15 hover:ring-accent/50' : ''}`}
                    onClick={() => isClickable && onColumnClick?.(c)}
                  >
                    {preview ? (
                      <div
                        className="relative animate-token-drop"
                        style={{ '--drop-distance': `${(r + 1) * -56}px` } as CSSProperties}
                      >
                        <div className="rounded-full opacity-75 ring-2 ring-dashed ring-accent">
                          <TokenIcon figure={preview.figure} size="sm" />
                        </div>
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-ink shadow">
                          {preview.index + 1}
                        </span>
                      </div>
                    ) : cell ? (
                      <div
                        className={animated ? 'animate-token-drop' : undefined}
                        style={
                          animated
                            ? ({ '--drop-distance': `${(r + 1) * -56}px` } as CSSProperties)
                            : undefined
                        }
                      >
                        <TokenIcon figure={cell} size="sm" />
                      </div>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
          {/* Eje X — números */}
          <div className="mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }, (_, c) => (
              <div
                key={c}
                className={`${labelWidth} text-center font-mono text-xs font-bold text-muted ${
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
