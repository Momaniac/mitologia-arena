import { useState } from 'react';
import { type Card } from '../../engine/types';
import { placeTokens } from '../../engine/board';
import { useGameStore } from '../../state/gameStore';
import { Board } from '../components/Board';
import { CardHand } from '../components/CardHand';
import { PlayerStrip } from '../components/PlayerStrip';
import { TombolaView } from '../components/TombolaView';
import { BetPanel } from '../components/BetPanel';
import { ColumnPicker } from '../components/ColumnPicker';
import { TokenIcon } from '../components/TokenIcon';

export function Game({ onOpenModerator }: { onOpenModerator: () => void }) {
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const humanId = useGameStore((s) => s.humanId);
  const board = useGameStore((s) => s.board);
  const round = useGameStore((s) => s.round);
  const lastPlacements = useGameStore((s) => s.lastPlacements);

  const human = players.find((p) => p.id === humanId);
  if (!human) return null;

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <header className="flex items-center justify-between mb-4 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Mitología</h1>
          <p className="text-sm text-ink/60">
            Ronda {round || '—'} · {phaseLabel(phase)}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenModerator}
          className="text-link text-sm hover:underline"
        >
          Vista moderador →
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <section className="space-y-4">
          {phase === 'DEAL_CARDS' && <DealCardsView />}
          {phase === 'REVEAL_CARD' && <RevealCardView />}
          {(phase === 'BETTING' ||
            phase === 'POSITION_SELECT' ||
            phase === 'ROUND_END') && <RoundView phase={phase} />}
          {phase === 'RESULTS' && <ResultsView />}
        </section>

        <aside className="space-y-4 lg:w-[420px]">
          <div className="p-4 rounded-xl bg-white border border-ink/10">
            <h3 className="font-bold text-ink mb-2">Tablero</h3>
            <div className="flex justify-center">
              <Board board={board} animatedPlacements={lastPlacements} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-ink/10">
            <h3 className="font-bold text-ink mb-2">Jugadores</h3>
            <PlayerStrip players={players} humanId={humanId} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function phaseLabel(p: string): string {
  switch (p) {
    case 'DEAL_CARDS':
      return 'Definiendo combinación';
    case 'REVEAL_CARD':
      return 'Revelando carta pública';
    case 'BETTING':
      return 'Apuestas';
    case 'POSITION_SELECT':
      return 'Selección de posición';
    case 'ROUND_END':
      return 'Resolución';
    case 'RESULTS':
      return 'Resultados finales';
    default:
      return p;
  }
}

function DealCardsView() {
  const pending = useGameStore((s) => s.pendingHand);
  const selected = useGameStore((s) => s.selectedOrder);
  const setOrder = useGameStore((s) => s.setHumanCombinationOrder);
  const confirm = useGameStore((s) => s.confirmCombination);
  if (!pending) return null;

  return (
    <div className="p-6 rounded-xl bg-white border border-ink/10">
      <h2 className="text-xl font-bold text-ink mb-1">Define tu combinación secreta</h2>
      <p className="text-sm text-ink/70 mb-4">
        Recibiste 3 cartas. El orden importa: cada combinación detectada en el
        tablero al final dará 1 punto (directa o inversa).
      </p>
      <CardHand
        hand={pending}
        selected={selected}
        onAdd={(c: Card) => setOrder([...selected, c])}
        onClear={() => setOrder([])}
      />
      <button
        type="button"
        disabled={selected.length !== 3}
        onClick={confirm}
        className="mt-6 bg-accent disabled:bg-ink/20 disabled:cursor-not-allowed hover:bg-accent-dark text-ink font-bold px-6 py-2 rounded-lg"
      >
        Confirmar combinación
      </button>
    </div>
  );
}

function RevealCardView() {
  const human = useGameStore((s) =>
    s.players.find((p) => p.id === s.humanId),
  );
  const reveal = useGameStore((s) => s.revealCard);
  const [picked, setPicked] = useState<string | null>(null);
  if (!human) return null;
  return (
    <div className="p-6 rounded-xl bg-white border border-ink/10">
      <h2 className="text-xl font-bold text-ink mb-1">Revela una carta</h2>
      <p className="text-sm text-ink/70 mb-4">
        Elige cuál de tus 3 cartas mostrarás públicamente durante toda la
        partida. Las otras dos seguirán siendo secretas.
      </p>
      <div className="mb-4 rounded-lg border border-link/20 bg-link/5 p-3">
        <div className="text-xs font-semibold uppercase text-link">
          Tu condición secreta
        </div>
        <div className="mt-1 text-sm font-bold text-ink">{human.condition.label}</div>
        <p className="mt-1 text-xs text-ink/60">
          Ya fue asignada por el sistema y no puede cambiarse durante la partida.
        </p>
      </div>
      <div className="flex gap-3 mb-4">
        {human.hand.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setPicked(c.id)}
            className={`p-3 rounded-xl border-2 transition ${
              picked === c.id
                ? 'border-accent bg-accent/20'
                : 'border-ink/10 bg-white hover:border-link'
            }`}
          >
            <TokenIcon figure={c.figure} size="lg" showLabel />
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!picked}
        onClick={() => picked && reveal(picked)}
        className="bg-accent disabled:bg-ink/20 disabled:cursor-not-allowed hover:bg-accent-dark text-ink font-bold px-6 py-2 rounded-lg"
      >
        Revelar y comenzar
      </button>
    </div>
  );
}

function RoundView({ phase }: { phase: string }) {
  const draft = useGameStore((s) => s.draftBet);
  const drawn = useGameStore((s) => s.currentDraw);
  const updateDraft = useGameStore((s) => s.updateDraftBet);
  const submit = useGameStore((s) => s.submitHumanBet);
  const resolution = useGameStore((s) => s.lastResolution);
  const proceed = useGameStore((s) => s.proceedToResults);
  const round = useGameStore((s) => s.round);
  const board = useGameStore((s) => s.board);

  if (!drawn) return <p className="text-ink/70">Preparando ronda…</p>;

  if (phase === 'ROUND_END' && resolution) {
    return (
      <div className="p-6 rounded-xl bg-white border border-ink/10">
        <h2 className="text-xl font-bold text-ink mb-2">Resolución ronda {round}</h2>
        <p className="text-sm text-ink/70 mb-2">
          Totales — Tómbola A: <strong>{resolution.totals.A}</strong> · Tómbola B:{' '}
          <strong>{resolution.totals.B}</strong>
        </p>
        {resolution.kind === 'winner' ? (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 mb-4">
            <p className="font-bold text-ink">
              Gana la Tómbola {resolution.winnerTombola} (menor total).
            </p>
            <p className="text-sm text-ink/80 mt-1">
              Las fichas válidas de esta ronda se colocaron en el tablero.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 mb-4">
            <p className="font-bold text-ink">Ronda anulada.</p>
            <p className="text-sm text-ink/80 mt-1">
              {resolution.reason === 'tombola-tie'
                ? 'Empate entre tómbolas — todas las monedas se devuelven.'
                : 'Empate entre las apuestas máximas — todas las monedas se devuelven.'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={proceed}
          className="bg-accent hover:bg-accent-dark text-ink font-bold px-6 py-2 rounded-lg"
        >
          {round >= 5 ? 'Ver resultados finales' : 'Siguiente ronda →'}
        </button>
      </div>
    );
  }

  const selectedTokens = draft && drawn ? drawn[draft.tombola] : [];
  const selectedFigures = selectedTokens.map((token) => token.figure);
  const selectedColumns = draft?.columns ?? [];
  const columnsReady = selectedColumns.every((c) => c !== null);
  const placementResult =
    draft && columnsReady
      ? placeTokens(
          board,
          selectedFigures,
          selectedColumns as [number, number, number, number],
          selectedFigures,
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white border border-ink/10">
        <h2 className="text-xl font-bold text-ink mb-1">Fichas extraídas</h2>
        <p className="text-sm text-ink/70 mb-4">
          Selecciona la tómbola, monto y posición de colocación. Recuerda: gana
          la <strong>menor apuesta total</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TombolaView
            id="A"
            drawn={drawn.A}
            selected={draft?.tombola === 'A'}
            onSelect={() => updateDraft({ tombola: 'A' })}
          />
          <TombolaView
            id="B"
            drawn={drawn.B}
            selected={draft?.tombola === 'B'}
            onSelect={() => updateDraft({ tombola: 'B' })}
          />
        </div>
      </div>
      <BetPanel />
      <ColumnPicker />
      {placementResult && !placementResult.ok && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
          {placementResult.reason || 'Este acomodo no es válido. Ajusta la posición de tus fichas.'}
        </div>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!draft || !columnsReady || placementResult?.ok === false}
        className="w-full bg-accent disabled:bg-ink/20 disabled:cursor-not-allowed hover:bg-accent-dark text-ink font-bold py-3 rounded-lg shadow"
      >
        Confirmar apuesta
      </button>
    </div>
  );
}

function ResultsView() {
  const scores = useGameStore((s) => s.finalScores);
  const players = useGameStore((s) => s.players);
  const reset = useGameStore((s) => s.resetGame);
  if (!scores) return null;
  const ranked = scores
    .map((s) => ({ ...s, player: players.find((p) => p.id === s.playerId)! }))
    .sort((a, b) => b.total - a.total);
  return (
    <div className="p-6 rounded-xl bg-white border border-ink/10">
      <h2 className="text-2xl font-extrabold text-ink mb-4">
        Resultados finales
      </h2>
      <ol className="space-y-2">
        {ranked.map((s, i) => (
          <li
            key={s.playerId}
            className={`p-3 rounded-lg flex items-center justify-between ${
              i === 0 ? 'bg-accent/20 shadow-glow' : 'bg-base'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-ink w-6">{i + 1}.</span>
              <span className="font-semibold text-ink">{s.player.name}</span>
              {s.conditionMet && (
                <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">
                  Condición ×2
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-ink">{s.total}</div>
              <div className="text-xs text-ink/60">
                {s.rawCombinations} combos × {s.multiplier}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={reset}
        className="mt-6 w-full bg-link hover:bg-link/90 text-white font-bold py-3 rounded-lg"
      >
        Jugar otra partida
      </button>
    </div>
  );
}
