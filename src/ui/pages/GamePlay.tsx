import { useMemo, useState } from 'react';
import { useRoomStore } from '../../state/roomStore';
import { Board } from '../components/Board';
import { TokenIcon } from '../components/TokenIcon';
import { CardHand } from '../components/CardHand';
import {
  availableColumns,
  lowestFreeRow,
  placeTokens,
} from '../../engine/board';
import { FIGURES } from '../../engine/types';
import type {
  Board as BoardType,
  Card,
  Combination,
  Figure,
  Token,
} from '../../engine/types';
import type { LobbyTeam } from '../../services/room';

export function GamePlay() {
  const status = useRoomStore((s) => s.game?.status);
  if (status === 'setup') return <Shell><SetupView /></Shell>;
  if (status === 'finished') return <Shell><ResultsView /></Shell>;
  return <Shell><PlayingView /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const code = useRoomStore((s) => s.code);
  const round = useRoomStore((s) => s.game?.round);
  const phase = useRoomStore((s) => s.game?.phase);
  const role = useRoomStore((s) => s.role);
  const leave = useRoomStore((s) => s.leave);
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);
  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Mitología · {code}</h1>
            <p className="text-sm text-ink/60">
              {role === 'host' ? 'Moderador' : 'Jugador'} · Ronda {round || '—'} · {phase}
            </p>
          </div>
          <button type="button" onClick={leave} className="text-sm text-link hover:underline">
            Salir
          </button>
        </header>
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
            <span>{error}</span>
            <button type="button" onClick={clearError}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ---- helpers de identidad -------------------------------------------------

function useMyTeam(): LobbyTeam | null {
  const teams = useRoomStore((s) => s.teams);
  const players = useRoomStore((s) => s.players);
  const myUid = useRoomStore((s) => s.myUid);
  const me = players.find((p) => p.auth_uid === myUid);
  return teams.find((t) => t.id === me?.team_id) ?? null;
}

function useIsRep(): boolean {
  const myTeam = useMyTeam();
  const myUid = useRoomStore((s) => s.myUid);
  return !!myTeam && myTeam.representative === myUid;
}

// =====================================================================
// SETUP
// =====================================================================

function SetupView() {
  const role = useRoomStore((s) => s.role);
  if (role === 'host') return <HostSetup />;
  return <TeamSetup />;
}

function HostSetup() {
  const teams = useRoomStore((s) => s.teams);
  const hostStart = useRoomStore((s) => s.hostStart);
  const busy = useRoomStore((s) => s.busy);
  const allReady = teams.length >= 2 && teams.every((t) => t.setup_done);
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="mb-1 text-xl font-bold text-ink">Configuración de equipos</h2>
      <p className="mb-4 text-sm text-ink/70">
        Cada representante define la combinación y la carta pública de su equipo.
      </p>
      <ul className="mb-4 space-y-2">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg bg-base px-3 py-2">
            <span className="font-semibold text-ink">{t.name}</span>
            <span className={`text-sm font-bold ${t.setup_done ? 'text-success' : 'text-ink/40'}`}>
              {t.setup_done ? '✓ Listo' : 'Definiendo…'}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={!allReady || busy}
        onClick={hostStart}
        className="mb-4 w-full rounded-lg bg-accent py-3 font-bold text-ink hover:bg-accent-dark disabled:opacity-50"
      >
        Iniciar rondas
      </button>
      <ModeratorPanel />
    </div>
  );
}

function TeamSetup() {
  const isRep = useIsRep();
  const myTeam = useMyTeam();
  const mySecret = useRoomStore((s) => s.mySecret);
  const defineSetup = useRoomStore((s) => s.defineSetup);
  const busy = useRoomStore((s) => s.busy);
  const [selected, setSelected] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);

  if (!myTeam || !mySecret) {
    return <Waiting text="Cargando tu equipo…" />;
  }

  if (myTeam.setup_done) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
        <div className="text-3xl">✓</div>
        <h2 className="text-lg font-bold text-ink">Combinación definida</h2>
        <p className="mt-1 text-sm text-ink/70">Esperando a que el moderador inicie las rondas.</p>
      </div>
    );
  }

  if (!isRep) {
    return (
      <Waiting text={`Tu representante está definiendo la combinación de ${myTeam.name}.`}>
        <ConditionCard />
      </Waiting>
    );
  }

  const hand = mySecret.hand;
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="mb-1 text-xl font-bold text-ink">Define la combinación de {myTeam.name}</h2>
      <p className="mb-4 text-sm text-ink/70">
        Ordena las 3 cartas (el orden importa) y elige cuál mostrar públicamente.
      </p>
      <ConditionCard />
      <div className="my-4">
        <CardHand
          hand={hand}
          selected={selected}
          onAdd={(c) => setSelected([...selected, c])}
          onClear={() => setSelected([])}
        />
      </div>
      {selected.length === 3 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-ink">Carta pública</h4>
          <div className="flex gap-2">
            {selected.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setRevealed(c.id)}
                className={`rounded-xl border-2 p-2 ${revealed === c.id ? 'border-link bg-link/10' : 'border-ink/10'}`}
              >
                <TokenIcon figure={c.figure} size="md" showLabel />
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={selected.length !== 3 || !revealed || busy}
        onClick={() => revealed && defineSetup(selected.map((c) => c.figure) as Combination, revealed)}
        className="w-full rounded-lg bg-accent py-3 font-bold text-ink hover:bg-accent-dark disabled:opacity-50"
      >
        Confirmar combinación
      </button>
    </div>
  );
}

function countFigures(tokens: Token[]): Record<Figure, number> {
  const c = Object.fromEntries(FIGURES.map((f) => [f, 0])) as Record<Figure, number>;
  for (const t of tokens) c[t.figure] += 1;
  return c;
}

function ModeratorPanel() {
  const detail = useRoomStore((s) => s.hostDetail);
  const teams = useRoomStore((s) => s.teams);
  const players = useRoomStore((s) => s.players);
  const [open, setOpen] = useState(true);
  if (!detail) return null;
  const countsA = countFigures(detail.tombolaA);
  const countsB = countFigures(detail.tombolaB);

  return (
    <div className="rounded-xl border border-link/20 bg-link/5 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-2 flex w-full items-center justify-between font-bold text-ink"
      >
        <span>🔒 Panel del moderador</span>
        <span className="text-ink/50">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-ink/60">
              Fichas restantes en tómbolas
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((id) => {
                const counts = id === 'A' ? countsA : countsB;
                const total = id === 'A' ? detail.tombolaA.length : detail.tombolaB.length;
                return (
                  <div key={id} className="rounded-lg bg-white p-2">
                    <div className="mb-1 flex justify-between text-sm font-bold text-ink">
                      <span>Tómbola {id}</span>
                      <span>{total}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {FIGURES.map((f) => (
                        <div key={f} className="flex flex-col items-center">
                          <TokenIcon figure={f} size="sm" />
                          <span className="text-[11px] font-mono">{counts[f]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-ink/60">Equipos (información secreta)</div>
            <div className="space-y-2">
              {teams.map((t) => {
                const sec = detail.secrets.find((s) => s.team_id === t.id);
                const members = players.filter((p) => p.team_id === t.id).length;
                return (
                  <div key={t.id} className="rounded-lg bg-white p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{t.name}</span>
                      <span className="font-mono text-ink/70">
                        {sec?.coins ?? '—'} 🪙 · {members} int. {t.bet_submitted ? '· ✓ apostó' : ''}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-ink/50">Combo:</span>
                      {sec?.combination
                        ? sec.combination.map((f, i) => <TokenIcon key={i} figure={f} size="sm" />)
                        : <span className="text-xs text-ink/40">sin definir</span>}
                    </div>
                    <div className="text-xs text-ink/60">Condición: {sec?.condition.label ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionCard() {
  const mySecret = useRoomStore((s) => s.mySecret);
  if (!mySecret) return null;
  return (
    <div className="rounded-lg border border-link/20 bg-link/5 p-3">
      <div className="text-xs font-semibold uppercase text-link">Condición secreta del equipo</div>
      <div className="mt-1 text-sm font-bold text-ink">{mySecret.condition.label}</div>
      <p className="mt-1 text-xs text-ink/60">Si se cumple al final, el puntaje del equipo se multiplica ×2.</p>
    </div>
  );
}

// =====================================================================
// PLAYING
// =====================================================================

function PlayingView() {
  const role = useRoomStore((s) => s.role);
  const board = useRoomStore((s) => s.game?.board) ?? [];
  const lastPlacements = useRoomStore((s) => s.game?.last_result?.kind === 'winner');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
      <div className="order-2 lg:order-1">{role === 'host' ? <HostRound /> : <PlayerRound />}</div>
      <aside className="order-1 lg:order-2 lg:w-[360px]">
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <h3 className="mb-2 font-bold text-ink">Tablero</h3>
          <div className="flex justify-center">
            <Board board={board as BoardType} />
          </div>
          {lastPlacements && (
            <p className="mt-2 text-center text-xs text-ink/50">
              Acomodo de la última ronda aplicado.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function DrawDisplay() {
  const draw = useRoomStore((s) => s.game?.current_draw);
  if (!draw) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['A', 'B'] as const).map((id) => (
        <div key={id} className="rounded-xl border border-ink/10 bg-white p-3">
          <div className="mb-1 font-bold text-ink">Tómbola {id}</div>
          <div className="flex flex-wrap gap-1">
            {draw[id].map((t) => (
              <TokenIcon key={t.id} figure={t.figure} size="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HostRound() {
  const phase = useRoomStore((s) => s.game?.phase);
  const teams = useRoomStore((s) => s.teams);
  const lastResult = useRoomStore((s) => s.game?.last_result);
  const hostResolve = useRoomStore((s) => s.hostResolve);
  const hostAdvance = useRoomStore((s) => s.hostAdvance);
  const busy = useRoomStore((s) => s.busy);
  const round = useRoomStore((s) => s.game?.round) ?? 0;

  const submitted = teams.filter((t) => t.bet_submitted).length;
  const allIn = submitted === teams.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="mb-2 text-lg font-bold text-ink">Ronda {round}</h2>
        <DrawDisplay />
      </div>

      {phase === 'BETTING' && (
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-ink">
            Apuestas recibidas: {submitted} / {teams.length}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {teams.map((t) => (
              <span
                key={t.id}
                className={`rounded-full px-3 py-1 text-sm ${t.bet_submitted ? 'bg-success/15 text-success' : 'bg-base text-ink/50'}`}
              >
                {t.name} {t.bet_submitted ? '✓' : '…'}
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled={!allIn || busy}
            onClick={hostResolve}
            className="w-full rounded-lg bg-accent py-3 font-bold text-ink hover:bg-accent-dark disabled:opacity-50"
          >
            Resolver ronda
          </button>
        </div>
      )}

      {phase === 'ROUND_END' && lastResult && (
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <ResultBanner />
          <button
            type="button"
            disabled={busy}
            onClick={hostAdvance}
            className="mt-3 w-full rounded-lg bg-accent py-3 font-bold text-ink hover:bg-accent-dark disabled:opacity-50"
          >
            {lastResult.kind === 'void'
              ? '🔄 Repetir ronda'
              : round >= 5
                ? 'Ver resultados'
                : 'Siguiente ronda'}
          </button>
        </div>
      )}

      <ModeratorPanel />
    </div>
  );
}

function PlayerRound() {
  const phase = useRoomStore((s) => s.game?.phase);
  const isRep = useIsRep();
  const myTeam = useMyTeam();

  if (phase === 'ROUND_END') {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-4">
        <ResultBanner />
        <p className="mt-2 text-sm text-ink/60">Esperando al moderador…</p>
      </div>
    );
  }

  if (!isRep) {
    return (
      <Waiting text={`Tu representante (${myTeam?.name ?? ''}) está decidiendo la apuesta.`}>
        <DrawDisplay />
        <div className="mt-3"><MyCardsPanel /></div>
      </Waiting>
    );
  }

  if (myTeam?.bet_submitted) {
    return (
      <Waiting text="Apuesta enviada. Esperando a los demás equipos.">
        <DrawDisplay />
      </Waiting>
    );
  }

  return <RepBet />;
}

function ResultBanner() {
  const lastResult = useRoomStore((s) => s.game?.last_result);
  if (!lastResult) return null;
  if (lastResult.kind === 'void') {
    return (
      <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
        <p className="font-bold text-ink">¡Empate! La ronda se repite con las mismas fichas.</p>
        <p className="text-ink/70">
          Totales — A: {lastResult.totals.A} · B: {lastResult.totals.B}.
          {lastResult.reason === 'tombola-tie' ? ' Empate entre tómbolas.' : ' Empate entre apuestas máximas.'}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-success/10 p-3 text-sm">
      <p className="font-bold text-ink">Ganó la Tómbola {lastResult.tombola} (menor total).</p>
      <p className="text-ink/70">Totales — A: {lastResult.totals.A} · B: {lastResult.totals.B}. Fichas colocadas en el tablero.</p>
    </div>
  );
}

// ---- apuesta + colocación del representante --------------------------------

type Draft = {
  tombola: 'A' | 'B';
  amount: number;
  order: number[];
  columns: (number | null)[];
};

function buildPreview(board: BoardType, figures: Figure[], columns: (number | null)[]) {
  const pv = board.map((row) => row.slice());
  const placements: { row: number; col: number; figure: Figure; index: number }[] = [];
  for (let i = 0; i < figures.length; i++) {
    const col = columns[i];
    if (col === null || col === undefined) continue;
    const row = lowestFreeRow(pv, col);
    if (row === null) continue;
    pv[row][col] = figures[i];
    placements.push({ row, col, figure: figures[i], index: i });
  }
  return { previewBoard: pv, placements };
}

function RepBet() {
  const draw = useRoomStore((s) => s.game?.current_draw);
  const board = (useRoomStore((s) => s.game?.board) ?? []) as BoardType;
  const mySecret = useRoomStore((s) => s.mySecret);
  const submitBet = useRoomStore((s) => s.submitBet);
  const busy = useRoomStore((s) => s.busy);
  const coins = mySecret?.coins ?? 0;
  const maxBet = Math.min(10, Math.max(1, coins));

  const [draft, setDraft] = useState<Draft>({
    tombola: 'A',
    amount: Math.min(3, maxBet),
    order: [0, 1, 2, 3],
    columns: [null, null, null, null],
  });

  const tokens: Token[] = draw ? draw[draft.tombola] : [];
  const orderedTokens = draft.order.map((i) => tokens[i]).filter(Boolean);
  const figures = orderedTokens.map((t) => t.figure);

  const { previewBoard, placements } = useMemo(
    () => buildPreview(board, figures, draft.columns),
    [board, figures, draft.columns],
  );
  const nextIndex = draft.columns.findIndex((c) => c === null);
  const clickable = nextIndex === -1 ? [] : availableColumns(previewBoard);
  const ready = draft.columns.every((c) => c !== null);
  const validation = ready
    ? placeTokens(board, figures, draft.columns as number[], figures)
    : null;

  function setTombola(t: 'A' | 'B') {
    setDraft({ ...draft, tombola: t, order: [0, 1, 2, 3], columns: [null, null, null, null] });
  }
  function clickCol(col: number) {
    if (nextIndex === -1) return;
    const cols = draft.columns.slice();
    cols[nextIndex] = col;
    setDraft({ ...draft, columns: cols });
  }
  function move(slot: number, dir: -1 | 1) {
    const target = slot + dir;
    if (target < 0 || target >= draft.order.length) return;
    const order = draft.order.slice();
    const columns = draft.columns.slice();
    [order[slot], order[target]] = [order[target], order[slot]];
    [columns[slot], columns[target]] = [columns[target], columns[slot]];
    setDraft({ ...draft, order, columns });
  }
  function reset() {
    setDraft({ ...draft, columns: [null, null, null, null] });
  }

  if (!draw) return <Waiting text="Preparando ronda…" />;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink/10 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Tu apuesta</h2>
          <span className="text-sm text-ink/70">{coins} 🪙 del equipo</span>
        </div>
        <DrawDisplay />
      </div>

      {/* Tómbola + monto */}
      <div className="rounded-xl border border-ink/10 bg-white p-4">
        <div className="mb-3 flex gap-2">
          {(['A', 'B'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTombola(t)}
              className={`flex-1 rounded-lg border-2 py-2 font-semibold ${draft.tombola === t ? 'border-accent-dark bg-accent text-ink' : 'border-ink/10 bg-base text-ink/70'}`}
            >
              Tómbola {t}
            </button>
          ))}
        </div>
        <label className="block">
          <div className="flex justify-between text-sm">
            <span className="text-ink/70">Monto</span>
            <span className="font-bold text-ink">{draft.amount} 🪙</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxBet}
            value={Math.min(draft.amount, maxBet)}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
            className="w-full accent-accent"
          />
        </label>
        <p className="mt-1 text-xs italic text-ink/60">Gana la tómbola con menor total apostado.</p>
      </div>

      {/* Orden + colocación */}
      <div className="rounded-xl border border-ink/10 bg-white p-4">
        <h3 className="mb-2 font-bold text-ink">Define el orden y coloca</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {orderedTokens.map((tk, slot) => (
            <div key={tk.id} className="flex flex-col items-center gap-1 rounded-lg border border-ink/10 bg-base px-2 py-1.5">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-ink/60">{slot + 1}</span>
                <TokenIcon figure={tk.figure} size="sm" />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(slot, -1)} disabled={slot === 0} className="h-5 w-5 rounded border border-ink/10 bg-white text-xs disabled:opacity-30">◀</button>
                <span className="min-w-4 text-center text-[11px] font-bold text-ink/70">{draft.columns[slot] === null ? '·' : (draft.columns[slot] as number) + 1}</span>
                <button type="button" onClick={() => move(slot, 1)} disabled={slot === orderedTokens.length - 1} className="h-5 w-5 rounded border border-ink/10 bg-white text-xs disabled:opacity-30">▶</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center overflow-x-auto">
          <Board board={board} previewPlacements={placements} onColumnClick={clickCol} clickableColumns={clickable} compact />
        </div>
        <button type="button" onClick={reset} className="mt-2 w-full rounded-lg border border-ink/10 bg-base py-2 text-sm font-semibold text-ink">Limpiar</button>
      </div>

      {validation && !validation.ok && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">{validation.reason}</div>
      )}
      <button
        type="button"
        disabled={!ready || validation?.ok === false || busy}
        onClick={() => submitBet(draft.tombola, draft.amount, draft.order, draft.columns as number[])}
        className="w-full rounded-lg bg-accent py-3 font-bold text-ink shadow hover:bg-accent-dark disabled:opacity-50"
      >
        Confirmar apuesta
      </button>
    </div>
  );
}

function MyCardsPanel() {
  const mySecret = useRoomStore((s) => s.mySecret);
  if (!mySecret) return null;
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-3">
      <div className="mb-1 text-xs font-semibold uppercase text-ink/50">Combinación del equipo</div>
      <div className="flex gap-2">
        {mySecret.combination
          ? mySecret.combination.map((f, i) => <TokenIcon key={i} figure={f} size="sm" />)
          : <span className="text-sm text-ink/50">Sin definir</span>}
      </div>
      <div className="mt-2 text-xs text-ink/60">Condición: {mySecret.condition.label}</div>
    </div>
  );
}

function Waiting({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
      <div className="mb-2 text-3xl">⏳</div>
      <p className="font-semibold text-ink">{text}</p>
      {children && <div className="mt-4 text-left">{children}</div>}
    </div>
  );
}

// =====================================================================
// RESULTS
// =====================================================================

function ResultsView() {
  const scores = useRoomStore((s) => s.game?.final_scores) ?? [];
  const leave = useRoomStore((s) => s.leave);
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="mb-4 text-2xl font-extrabold text-ink">Resultados finales</h2>
      <ol className="space-y-2">
        {scores.map((s, i) => (
          <li key={s.teamId} className={`flex items-center justify-between rounded-lg p-3 ${i === 0 ? 'bg-accent/20 shadow-glow' : 'bg-base'}`}>
            <div className="flex items-center gap-3">
              <span className="w-6 font-bold text-ink">{i + 1}.</span>
              <span className="font-semibold text-ink">{s.name}</span>
              {s.conditionMet && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Condición ×2</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-ink">{s.total}</div>
              <div className="text-xs text-ink/60">{s.raw} combos × {s.multiplier}</div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={leave} className="mt-6 w-full rounded-lg bg-link py-3 font-bold text-white">
        Volver al inicio
      </button>
    </div>
  );
}
