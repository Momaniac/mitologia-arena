import { availableColumns, lowestFreeRow } from '../../engine/board';
import type { Board as BoardType, Figure, Token } from '../../engine/types';
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
  const setMyCardsOpen = useGameStore((s) => s.setMyCardsOpen);
  if (!draft || !drawn) return null;

  const draftColumns = draft.columns;
  const draftOrder = draft.order;
  const tombolaTokens: Token[] = draft.tombola === 'A' ? drawn.A : drawn.B;
  // Fichas en el orden de colocación elegido por el jugador.
  const orderedTokens = draftOrder.map((i) => tombolaTokens[i]);
  const figures = orderedTokens.map((token) => token.figure);

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
  const clickableColumns =
    nextIndex === -1 ? [] : availableColumns(previewBoard);

  const anyPlaced = lastIndex !== -1;

  function handleColumnClick(col: number) {
    if (nextIndex === -1) return;
    setCol(nextIndex, col);
  }

  function moveToken(slot: number, dir: -1 | 1) {
    const target = slot + dir;
    if (target < 0 || target >= draftOrder.length) return;
    const nextOrder = draftOrder.slice();
    const nextColumns = draftColumns.slice();
    // Cada ficha conserva la columna que tenía asignada al reordenarse.
    [nextOrder[slot], nextOrder[target]] = [nextOrder[target], nextOrder[slot]];
    [nextColumns[slot], nextColumns[target]] = [nextColumns[target], nextColumns[slot]];
    updateDraft({ order: nextOrder, columns: nextColumns });
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-bold text-ink">Posición de colocación</h3>
        <button
          type="button"
          onClick={() => setMyCardsOpen(true)}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-ink shadow hover:bg-accent-dark"
        >
          🃏 Mis cartas
        </button>
      </div>
      <p className="mb-3 text-xs text-ink/60">
        ¿Olvidaste tu combinación? Consúltala aquí mismo sin perder de vista tu
        jugada.
      </p>

      {/* Paso 1 — Define el orden de las fichas */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-link text-[11px] font-bold text-white">
            1
          </span>
          <h4 className="text-sm font-semibold text-ink">Define el orden</h4>
        </div>
        <p className="mb-2 text-xs text-ink/60">
          Reordena las fichas con las flechas. Se colocarán siguiendo este orden
          (1 → 4), formando el gusanito.
        </p>
        <div className="flex flex-wrap items-stretch gap-2">
          {orderedTokens.map((tk, slot) => {
            const active = slot === nextIndex;
            const placed = draftColumns[slot] !== null;
            return (
              <div
                key={tk.id}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-1.5 ${
                  active
                    ? 'border-accent bg-accent/20'
                    : placed
                      ? 'border-link/30 bg-link/10'
                      : 'border-ink/10 bg-base'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-ink/60">{slot + 1}</span>
                  <TokenIcon figure={tk.figure} size="sm" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mover antes"
                    onClick={() => moveToken(slot, -1)}
                    disabled={slot === 0}
                    className="h-5 w-5 rounded border border-ink/10 bg-white text-xs font-bold text-ink/70 disabled:opacity-30 hover:border-link"
                  >
                    ◀
                  </button>
                  <span className="min-w-4 text-center text-[11px] font-bold text-ink/70">
                    {draftColumns[slot] === null ? '·' : draftColumns[slot]! + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Mover después"
                    onClick={() => moveToken(slot, 1)}
                    disabled={slot === orderedTokens.length - 1}
                    className="h-5 w-5 rounded border border-ink/10 bg-white text-xs font-bold text-ink/70 disabled:opacity-30 hover:border-link"
                  >
                    ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso 2 — Coloca en el tablero */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-link text-[11px] font-bold text-white">
            2
          </span>
          <h4 className="text-sm font-semibold text-ink">Coloca en el tablero</h4>
        </div>
        <p className="mb-2 text-xs text-ink/60">
          Toca una columna para soltar la siguiente ficha (la marcada con borde
          amarillo). Caen por gravedad.
        </p>

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
            disabled={!anyPlaced}
            className="flex-1 rounded-lg border border-ink/10 bg-base px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:border-link"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={clearColumns}
            disabled={!anyPlaced}
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
    </div>
  );
}
