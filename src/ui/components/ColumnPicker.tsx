import { availableColumns, lowestFreeRow } from '../../engine/board';
import type { Board as BoardType, Figure } from '../../engine/types';
import { useGameStore } from '../../state/gameStore';
import { Board } from './Board';
import { TokenIcon } from './TokenIcon';

type PreviewPlacement = {
  row: number;
  col: number;
  figure: Figure;
  index: number;
};

function buildPlacementPreview(
  board: BoardType,
  figures: readonly Figure[],
  columns: readonly (number | null)[],
): { previewBoard: BoardType; placements: PreviewPlacement[] } {
  const previewBoard = board.map((row) => row.slice());
  const placements: PreviewPlacement[] = [];

  for (let i = 0; i < figures.length; i++) {
    const col = columns[i];
    if (col === null) continue;
    const row = lowestFreeRow(previewBoard, col);
    if (row === null) continue;
    previewBoard[row][col] = figures[i];
    placements.push({ row, col, figure: figures[i], index: i });
  }

  return { previewBoard, placements };
}

export function ColumnPicker() {
  const draft = useGameStore((s) => s.draftBet);
  const drawn = useGameStore((s) => s.currentDraw);
  const board = useGameStore((s) => s.board);
  const setCol = useGameStore((s) => s.setDraftColumn);
  const updateDraft = useGameStore((s) => s.updateDraftBet);
  if (!draft || !drawn) return null;

  const draftColumns = draft.columns;
  const tokens = draft.tombola === 'A' ? drawn.A : drawn.B;
  const figures = tokens.map((token) => token.figure);
  const nextIndex = draftColumns.findIndex((col) => col === null);
  const lastIndex = draftColumns.reduce<number>(
    (last, col, index) => (col === null ? last : index),
    -1,
  );
  const { previewBoard, placements } = buildPlacementPreview(
    board,
    figures,
    draftColumns,
  );
  const clickableColumns = nextIndex === -1 ? [] : availableColumns(previewBoard);

  function handleColumnClick(col: number) {
    if (nextIndex === -1) return;
    setCol(nextIndex, col);
  }

  function undoLast() {
    if (lastIndex === -1) return;
    const nextColumns = draftColumns.slice();
    nextColumns[lastIndex] = null;
    updateDraft({ columns: nextColumns });
  }

  function clearColumns() {
    updateDraft({ columns: [null, null, null, null] });
  }

  return (
    <div className="p-4 rounded-xl border border-ink/10 bg-white">
      <h3 className="font-bold text-ink mb-2">Posición de colocación</h3>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tokens.map((tk, i) => {
          const placed = draftColumns[i] !== null;
          const active = i === nextIndex;
          return (
            <div
              key={tk.id}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                active
                  ? 'border-accent bg-accent/20'
                  : placed
                    ? 'border-link/30 bg-link/10'
                    : 'border-ink/10 bg-base'
              }`}
            >
              <span className="text-xs font-bold text-ink/60">{i + 1}</span>
              <TokenIcon figure={tk.figure} size="sm" />
              <span className="min-w-5 text-center text-xs font-bold text-ink/70">
                {draftColumns[i] === null ? '-' : draftColumns[i]! + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center overflow-x-auto pb-1">
        <Board
          board={board}
          previewPlacements={placements}
          onColumnClick={handleColumnClick}
          clickableColumns={clickableColumns}
          compact
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={undoLast}
          disabled={lastIndex === -1}
          className="flex-1 rounded-lg border border-ink/10 bg-base px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:border-link"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={clearColumns}
          disabled={lastIndex === -1}
          className="flex-1 rounded-lg border border-ink/10 bg-base px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:border-link"
        >
          Limpiar
        </button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleColumnClick(c)}
            disabled={!clickableColumns.includes(c)}
            className="rounded border border-ink/10 bg-base py-1.5 text-xs font-bold text-ink/70 disabled:cursor-not-allowed disabled:opacity-35 hover:border-link"
          >
            {c + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
