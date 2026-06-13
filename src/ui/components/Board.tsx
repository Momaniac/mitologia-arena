import type { CSSProperties } from 'react';
import type { Board as BoardType } from '../../engine/types';
import { TokenIcon } from './TokenIcon';

type Props = {
  board: BoardType;
  highlightCols?: number[];
  animatedPlacements?: { row: number; col: number }[];
};

export function Board({ board, highlightCols = [], animatedPlacements = [] }: Props) {
  return (
    <div className="inline-block bg-ink/90 p-2 rounded-xl shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {board.flatMap((row, r) =>
          row.map((cell, c) => {
            const highlighted = highlightCols.includes(c);
            const animated = animatedPlacements.some(
              (p) => p.row === r && p.col === c,
            );
            return (
              <div
                key={`${r}-${c}`}
                className={`w-14 h-14 rounded-md flex items-center justify-center transition-all ${
                  highlighted ? 'bg-accent/30 ring-2 ring-accent' : 'bg-base/15'
                }`}
              >
                {cell ? (
                  <div
                    className={animated ? 'animate-token-drop' : undefined}
                    style={animated ? { '--drop-distance': `${(r + 1) * -64}px` } as CSSProperties : undefined}
                  >
                    <TokenIcon figure={cell} size="sm" />
                  </div>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
      <div className="grid grid-cols-5 gap-1 mt-1">
        {[0, 1, 2, 3, 4].map((c) => (
          <div
            key={c}
            className="w-14 text-center text-xs text-base/70 font-mono"
          >
            {c + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
