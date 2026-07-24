import { useMemo, useState } from 'react';
import { useRoomStore } from '../../state/roomStore';
import { Board } from '../components/Board';
import { TokenIcon } from '../components/TokenIcon';
import { CardHand } from '../components/CardHand';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { CoinChip } from '../components/CoinChip';
import { availableColumns, lowestFreeRow, placeTokens } from '../../engine/board';
import { FIGURES } from '../../engine/types';
import type {
  Board as BoardType,
  Card as CardType,
  Combination,
  Figure,
  Token,
} from '../../engine/types';
import type { LobbyPlayer, PlayerSecret } from '../../services/room';

/** Los ids de carta son `${figura}-${n}`; deriva la figura de la carta pública. */
function figureFromCardId(id: string | null | undefined): Figure | null {
  if (!id) return null;
  const f = id.split('-')[0] as Figure;
  return FIGURES.includes(f) ? f : null;
}

/** Monto de monedas con ícono de ficha. */
function Coins({ n }: { n: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {n}
      <Icon name="chip" size={14} className="text-accent" />
    </span>
  );
}

/** Rondas ganadas con ícono de trofeo. */
function Wins({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon name="trophy" size={14} className="text-accent" />
      {n}
    </span>
  );
}

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
  const mySecret = useRoomStore((s) => s.mySecret);
  const leave = useRoomStore((s) => s.leave);
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);
  const [cardsOpen, setCardsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      {cardsOpen && <MyCardsModal onClose={() => setCardsOpen(false)} />}
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Mitología · {code}</h1>
            <p className="text-sm text-muted">
              {role === 'host' ? 'Moderador' : 'Jugador'} · Ronda {round || '—'} · {phase}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role === 'player' && mySecret && (
              <button
                type="button"
                onClick={() => setCardsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink shadow hover:bg-accent-dark"
              >
                <Icon name="cards" size={16} />
                Mis cartas
              </button>
            )}
            <button
              type="button"
              onClick={leave}
              className="inline-flex items-center gap-1 text-sm text-link hover:underline"
            >
              <Icon name="logout" size={16} />
              Salir
            </button>
          </div>
        </header>
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
            <span>{error}</span>
            <button type="button" onClick={clearError} aria-label="Cerrar">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ---- helpers de identidad -------------------------------------------------

function useMe(): LobbyPlayer | null {
  const players = useRoomStore((s) => s.players);
  const myUid = useRoomStore((s) => s.myUid);
  return players.find((p) => p.auth_uid === myUid) ?? null;
}

// =====================================================================
// MIS CARTAS (siempre disponible para el jugador)
// =====================================================================

function MyCardsModal({ onClose }: { onClose: () => void }) {
  const mySecret = useRoomStore((s) => s.mySecret);
  const me = useMe();
  if (!mySecret) return null;
  const revealedId = me?.revealed_card_id ?? null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-up rounded-2xl border border-line bg-surface p-6 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">Mis cartas</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-muted hover:bg-surface2 hover:text-ink">
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Tu combinación secreta {mySecret.combination ? '(orden: izquierda → derecha)' : '(aún sin definir)'}
        </p>
        <div className="mb-4 flex gap-3">
          {mySecret.hand.map((c) => {
            const isRevealed = c.id === revealedId;
            return (
              <div key={c.id} className="relative w-[92px]">
                <Card figure={c.figure} className={isRevealed ? 'ring-2 ring-link' : ''} />
                {isRevealed && (
                  <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-link px-2 py-0.5 text-[10px] font-bold text-white">
                    Pública
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {mySecret.combination && (
          <div className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase text-muted">Orden de tu combinación</div>
            <div className="flex gap-2">
              {mySecret.combination.map((f, i) => <TokenIcon key={i} figure={f} size="sm" />)}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-link/20 bg-link/10 p-3">
          <div className="text-xs font-semibold uppercase text-link">Tu condición secreta</div>
          <div className="mt-1 text-sm font-bold text-ink">{mySecret.condition.label}</div>
          <p className="mt-1 text-xs text-muted">Si se cumple al final, tu puntaje se multiplica ×2.</p>
        </div>

        <p className="mt-3 text-center text-sm text-ink/85">
          Monedas disponibles: <strong><Coins n={mySecret.coins} /></strong>
        </p>
        <p className="mt-1 text-center text-xs text-muted">Solo tú y el moderador pueden ver esta información.</p>
      </div>
    </div>
  );
}

// =====================================================================
// CARTAS PÚBLICAS (visibles para todos)
// =====================================================================

function PublicCards() {
  const players = useRoomStore((s) => s.players);
  const myUid = useRoomStore((s) => s.myUid);
  const connected = players.filter((p) => p.connected);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-2 font-bold text-ink">Cartas públicas</h3>
      <div className="flex flex-wrap gap-2">
        {connected.map((p) => {
          const fig = figureFromCardId(p.revealed_card_id);
          const isMe = p.auth_uid === myUid;
          return (
            <div key={p.id} className={`flex items-center gap-2 rounded-lg border p-2 ${isMe ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface2'}`}>
              {fig ? <TokenIcon figure={fig} size="sm" /> : <div className="h-8 w-8 rounded-full bg-line" />}
              <div>
                <div className="text-sm font-semibold text-ink">
                  {p.name}
                  {isMe && <span className="text-muted"> (tú)</span>}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span>{fig ? figLabel(fig) : 'sin revelar'}</span>
                  <span>·</span>
                  <Wins n={p.rounds_won} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function figLabel(f: Figure): string {
  return { dragon: 'Dragón', hydra: 'Hydra', fenix: 'Fénix', kraken: 'Kraken', minotauro: 'Minotauro' }[f];
}

// =====================================================================
// SETUP
// =====================================================================

function SetupView() {
  const role = useRoomStore((s) => s.role);
  if (role === 'host') return <HostSetup />;
  return <PlayerSetup />;
}

function HostSetup() {
  const players = useRoomStore((s) => s.players);
  const hostStart = useRoomStore((s) => s.hostStart);
  const busy = useRoomStore((s) => s.busy);
  const connected = players.filter((p) => p.connected);
  const allReady = connected.length >= 2 && connected.every((p) => p.setup_done);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-1 text-xl font-bold text-ink">Preparación de jugadores</h2>
        <p className="mb-4 text-sm text-muted">
          Cada jugador define su combinación y su carta pública desde su teléfono.
        </p>
        <ul className="mb-4 space-y-2">
          {connected.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
              <span className="font-semibold text-ink">{p.name}</span>
              {p.setup_done ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-success">
                  <Icon name="check" size={15} />
                  Listo
                </span>
              ) : (
                <span className="text-sm font-bold text-muted">Definiendo…</span>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={!allReady || busy}
          onClick={hostStart}
          className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink hover:bg-accent-dark disabled:opacity-50"
        >
          Iniciar rondas
        </button>
      </div>
      <ModeratorPanel />
    </div>
  );
}

function PlayerSetup() {
  const me = useMe();
  const mySecret = useRoomStore((s) => s.mySecret);
  const defineSetup = useRoomStore((s) => s.defineSetup);
  const busy = useRoomStore((s) => s.busy);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);

  if (!me || !mySecret) {
    return <Waiting text="Cargando tus cartas…" />;
  }

  if (me.setup_done) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
          <Icon name="check" size={26} />
        </span>
        <h2 className="text-lg font-bold text-ink">Combinación definida</h2>
        <p className="mt-1 text-sm text-muted">Esperando a que el moderador inicie las rondas.</p>
        <div className="mt-4 text-left"><ConditionCard /></div>
      </div>
    );
  }

  const hand = mySecret.hand;
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-1 text-xl font-bold text-ink">Define tu combinación</h2>
      <p className="mb-4 text-sm text-muted">
        Ordena tus 3 cartas (el orden importa) y elige cuál mostrar públicamente.
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
          <div className="flex gap-3">
            {selected.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setRevealed(c.id)}
                className="w-[84px] rounded-xl"
              >
                <Card figure={c.figure} className={revealed === c.id ? 'ring-2 ring-link' : ''} />
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={selected.length !== 3 || !revealed || busy}
        onClick={() => revealed && defineSetup(selected.map((c) => c.figure) as Combination, revealed)}
        className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink hover:bg-accent-dark disabled:opacity-50"
      >
        Confirmar combinación
      </button>
    </div>
  );
}

function ConditionCard() {
  const mySecret = useRoomStore((s) => s.mySecret);
  if (!mySecret) return null;
  return (
    <div className="rounded-lg border border-link/20 bg-link/10 p-3">
      <div className="text-xs font-semibold uppercase text-link">Tu condición secreta</div>
      <div className="mt-1 text-sm font-bold text-ink">{mySecret.condition.label}</div>
      <p className="mt-1 text-xs text-muted">Si se cumple al final, tu puntaje se multiplica ×2.</p>
    </div>
  );
}

// =====================================================================
// PANEL DEL MODERADOR (secretos + apuestas en vivo + historial)
// =====================================================================

function countFigures(tokens: Token[]): Record<Figure, number> {
  const c = Object.fromEntries(FIGURES.map((f) => [f, 0])) as Record<Figure, number>;
  for (const t of tokens) c[t.figure] += 1;
  return c;
}

function ModeratorPanel() {
  const detail = useRoomStore((s) => s.hostDetail);
  const players = useRoomStore((s) => s.players);
  const phase = useRoomStore((s) => s.game?.phase);
  const round = useRoomStore((s) => s.game?.round) ?? 0;
  const [open, setOpen] = useState(true);
  if (!detail) return null;
  const countsA = countFigures(detail.tombolaA);
  const countsB = countFigures(detail.tombolaB);
  const nameOf = (playerId: string) => players.find((p) => p.id === playerId)?.name ?? '—';

  return (
    <div className="rounded-xl border border-link/25 bg-link/5 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-2 flex w-full items-center justify-between font-bold text-ink"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="lock" size={16} className="text-link" />
          Panel del moderador
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} className="text-muted" />
      </button>
      {open && (
        <div className="space-y-4">
          {/* Apuestas en vivo de la ronda actual */}
          {(phase === 'BETTING' || phase === 'ROUND_END') && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-muted">
                Apuestas en vivo · Ronda {round}
              </div>
              {detail.currentBets.length === 0 ? (
                <p className="text-xs text-muted">Aún no hay apuestas registradas.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted">
                        <th className="p-2">Jugador</th>
                        <th className="p-2">Tómbola</th>
                        <th className="p-2">Apuesta</th>
                        <th className="p-2">Columnas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.currentBets.map((b) => (
                        <tr key={b.player_id} className="border-t border-line">
                          <td className="p-2 font-semibold text-ink">{nameOf(b.player_id)}</td>
                          <td className="p-2 text-ink/80">{b.tombola}</td>
                          <td className="p-2 text-ink/80"><Coins n={b.amount} /></td>
                          <td className="p-2 font-mono text-xs text-ink/80">{b.columns.map((c) => c + 1).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Fichas restantes en tómbolas */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-muted">Fichas restantes en tómbolas</div>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((id) => {
                const counts = id === 'A' ? countsA : countsB;
                const total = id === 'A' ? detail.tombolaA.length : detail.tombolaB.length;
                return (
                  <div key={id} className="rounded-lg bg-surface p-2">
                    <div className="mb-1 flex justify-between text-sm font-bold text-ink">
                      <span>Tómbola {id}</span>
                      <span className="tabular-nums">{total}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {FIGURES.map((f) => (
                        <div key={f} className="flex flex-col items-center">
                          <TokenIcon figure={f} size="sm" />
                          <span className="font-mono text-[11px] text-muted">{counts[f]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info secreta por jugador */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-muted">Jugadores (información secreta)</div>
            <div className="space-y-2">
              {players.filter((p) => p.connected).map((p) => {
                const sec = detail.secrets.find((s) => s.player_id === p.id);
                return (
                  <div key={p.id} className="rounded-lg bg-surface p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{p.name}</span>
                      <span className="inline-flex items-center gap-2 text-muted">
                        <Coins n={sec?.coins ?? '—'} />
                        <Wins n={p.rounds_won} />
                        {p.bet_submitted && (
                          <span className="inline-flex items-center gap-0.5 text-success">
                            <Icon name="check" size={13} />
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted">Combo:</span>
                      {sec?.combination
                        ? sec.combination.map((f, i) => <TokenIcon key={i} figure={f} size="sm" />)
                        : <span className="text-xs text-muted">sin definir</span>}
                    </div>
                    <div className="text-xs text-muted">Condición: {sec?.condition.label ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial de rondas resueltas */}
          {detail.history.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-muted">
                Historial de rondas ({detail.history.length})
              </div>
              <div className="space-y-2">
                {detail.history.map((r) => (
                  <div key={r.round} className="rounded-lg bg-surface p-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-bold text-ink">Ronda {r.round}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.winnerPlayerId ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {r.winnerPlayerId ? `Ganó ${nameOf(r.winnerPlayerId)} · Tómbola ${r.winnerTombola}` : 'Empate (repetida)'}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {r.bets.map((b) => (
                            <tr key={b.player_id} className={b.player_id === r.winnerPlayerId ? 'font-semibold text-ink' : 'text-muted'}>
                              <td className="py-0.5 pr-2">{nameOf(b.player_id)}</td>
                              <td className="pr-2">Tómbola {b.tombola}</td>
                              <td className="pr-2"><Coins n={b.amount} /></td>
                              <td className="font-mono">{b.columns.map((c) => c + 1).join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
  const me = useMe();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="order-2 lg:order-1">{role === 'host' ? <HostRound /> : <PlayerRound />}</div>
      <aside className="order-1 space-y-4 lg:order-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-ink">Tablero</h3>
            {role === 'player' && me && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                <Icon name="trophy" size={13} />
                {me.rounds_won} ganadas
              </span>
            )}
          </div>
          <div className="flex justify-center overflow-x-auto">
            <Board board={board as BoardType} />
          </div>
          {lastPlacements && (
            <p className="mt-2 text-center text-xs text-muted">Acomodo de la última ronda aplicado.</p>
          )}
        </div>
        <PublicCards />
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
        <div key={id} className="rounded-xl border border-line bg-surface2 p-3">
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
  const players = useRoomStore((s) => s.players);
  const lastResult = useRoomStore((s) => s.game?.last_result);
  const hostResolve = useRoomStore((s) => s.hostResolve);
  const hostAdvance = useRoomStore((s) => s.hostAdvance);
  const busy = useRoomStore((s) => s.busy);
  const round = useRoomStore((s) => s.game?.round) ?? 0;

  const connected = players.filter((p) => p.connected);
  const submitted = connected.filter((p) => p.bet_submitted).length;
  const allIn = connected.length > 0 && submitted === connected.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 text-lg font-bold text-ink">Ronda {round}</h2>
        <DrawDisplay />
      </div>

      {phase === 'BETTING' && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">
            Apuestas recibidas: {submitted} / {connected.length}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {connected.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${p.bet_submitted ? 'bg-success/15 text-success' : 'bg-surface2 text-muted'}`}
              >
                {p.name}
                {p.bet_submitted && <Icon name="check" size={13} />}
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled={!allIn || busy}
            onClick={hostResolve}
            className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink hover:bg-accent-dark disabled:opacity-50"
          >
            Resolver ronda
          </button>
        </div>
      )}

      {phase === 'ROUND_END' && lastResult && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <ResultBanner />
          <button
            type="button"
            disabled={busy}
            onClick={hostAdvance}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-3 font-bold text-accent-ink hover:bg-accent-dark disabled:opacity-50"
          >
            {lastResult.kind === 'void' ? (
              <>
                <Icon name="refresh" size={18} />
                Repetir ronda
              </>
            ) : round >= 5 ? (
              'Ver resultados'
            ) : (
              'Siguiente ronda'
            )}
          </button>
        </div>
      )}

      <ModeratorPanel />
    </div>
  );
}

function PlayerRound() {
  const phase = useRoomStore((s) => s.game?.phase);
  const me = useMe();

  if (phase === 'ROUND_END') {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <ResultBanner />
        <p className="mt-2 text-sm text-muted">Esperando al moderador…</p>
      </div>
    );
  }

  if (me?.bet_submitted) {
    return (
      <Waiting text="Apuesta enviada. Esperando a los demás jugadores.">
        <DrawDisplay />
      </Waiting>
    );
  }

  return <PlayerBet />;
}

function ResultBanner() {
  const lastResult = useRoomStore((s) => s.game?.last_result);
  if (!lastResult) return null;
  if (lastResult.kind === 'void') {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm">
        <p className="font-bold text-ink">¡Empate! La ronda se repite con las mismas fichas.</p>
        <p className="text-muted">
          Totales — A: {lastResult.totals.A} · B: {lastResult.totals.B}.
          {lastResult.reason === 'tombola-tie' ? ' Empate entre tómbolas.' : ' Empate entre apuestas máximas.'}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm">
      <p className="font-bold text-ink">Ganó la Tómbola {lastResult.tombola} (menor total).</p>
      <p className="text-muted">Totales — A: {lastResult.totals.A} · B: {lastResult.totals.B}. Fichas colocadas en el tablero.</p>
    </div>
  );
}

// ---- apuesta + colocación del jugador --------------------------------------

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

function PlayerBet() {
  const draw = useRoomStore((s) => s.game?.current_draw);
  const board = (useRoomStore((s) => s.game?.board) ?? []) as BoardType;
  const mySecret = useRoomStore((s) => s.mySecret) as PlayerSecret | null;
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
  const lastIndex = draft.columns.reduce<number>((last, col, index) => (col === null ? last : index), -1);
  const anyPlaced = lastIndex !== -1;
  const clickable = nextIndex === -1 ? [] : availableColumns(previewBoard);
  const ready = draft.columns.every((c) => c !== null);
  const validation = ready ? placeTokens(board, figures, draft.columns as number[], figures) : null;

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
  function undoLast() {
    if (lastIndex === -1) return;
    const columns = draft.columns.slice();
    columns[lastIndex] = null;
    setDraft({ ...draft, columns });
  }
  function reset() {
    setDraft({ ...draft, columns: [null, null, null, null] });
  }

  if (!draw) return <Waiting text="Preparando ronda…" />;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Tu apuesta</h2>
          <span className="text-sm text-muted">Tienes <Coins n={coins} /></span>
        </div>
        <DrawDisplay />
      </div>

      {/* Tómbola + monto */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex gap-2">
          {(['A', 'B'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTombola(t)}
              className={`flex-1 rounded-lg border-2 py-2 font-semibold ${draft.tombola === t ? 'border-accent-dark bg-accent text-accent-ink' : 'border-line bg-surface2 text-muted'}`}
            >
              Tómbola {t}
            </button>
          ))}
        </div>
        <label className="block">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted">Monto</span>
            <span className="inline-flex items-center gap-2 font-bold text-ink">
              <CoinChip value={draft.amount} size={30} />
              {draft.amount}
            </span>
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
        <p className="mt-1 text-xs italic text-muted">Gana la tómbola con menor total apostado.</p>
      </div>

      {/* Orden + colocación */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="mb-2 font-bold text-ink">Define el orden y coloca</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {orderedTokens.map((tk, slot) => (
            <div key={tk.id} className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface2 px-2 py-1.5">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-muted">{slot + 1}</span>
                <TokenIcon figure={tk.figure} size="sm" />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Mover antes" onClick={() => move(slot, -1)} disabled={slot === 0} className="grid h-5 w-5 place-items-center rounded border border-line bg-surface text-muted disabled:opacity-30">
                  <Icon name="chevron-left" size={12} />
                </button>
                <span className="min-w-4 text-center text-[11px] font-bold text-muted">{draft.columns[slot] === null ? '·' : (draft.columns[slot] as number) + 1}</span>
                <button type="button" aria-label="Mover después" onClick={() => move(slot, 1)} disabled={slot === orderedTokens.length - 1} className="grid h-5 w-5 place-items-center rounded border border-line bg-surface text-muted disabled:opacity-30">
                  <Icon name="chevron-right" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center overflow-x-auto">
          <Board board={board} previewPlacements={placements} onColumnClick={clickCol} clickableColumns={clickable} compact />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={undoLast}
            disabled={!anyPlaced}
            className="flex-1 rounded-lg border border-line bg-surface2 py-2 text-sm font-semibold text-ink hover:border-link disabled:cursor-not-allowed disabled:opacity-40"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!anyPlaced}
            className="flex-1 rounded-lg border border-line bg-surface2 py-2 text-sm font-semibold text-ink hover:border-link disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>
      </div>

      {validation && !validation.ok && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">{validation.reason}</div>
      )}
      <button
        type="button"
        disabled={!ready || validation?.ok === false || busy}
        onClick={() => submitBet(draft.tombola, draft.amount, draft.order, draft.columns as number[])}
        className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink shadow hover:bg-accent-dark disabled:opacity-50"
      >
        Confirmar apuesta
      </button>
    </div>
  );
}

function Waiting({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center">
      <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-surface2 text-muted">
        <Icon name="hourglass" size={22} />
      </span>
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
  const board = (useRoomStore((s) => s.game?.board) ?? []) as BoardType;
  const players = useRoomStore((s) => s.players);
  const myUid = useRoomStore((s) => s.myUid);
  const leave = useRoomStore((s) => s.leave);
  const roundsWonOf = (playerId: string) => players.find((p) => p.id === playerId)?.rounds_won ?? 0;
  const authOf = (playerId: string) => players.find((p) => p.id === playerId)?.auth_uid;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="order-2 rounded-2xl border border-line bg-surface p-6 lg:order-1">
        <h2 className="mb-4 text-2xl font-extrabold text-ink">Resultados finales</h2>
        <ol className="space-y-2">
          {scores.map((s, i) => {
            const isMe = authOf(s.playerId) === myUid;
            return (
              <li key={s.playerId} className={`flex items-center justify-between rounded-lg p-3 ${i === 0 ? 'bg-accent/20 shadow-glow' : isMe ? 'bg-link/10' : 'bg-surface2'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 font-bold text-ink tabular-nums">{i + 1}.</span>
                  <span className="font-semibold text-ink">
                    {s.name}
                    {isMe && <span className="text-muted"> (tú)</span>}
                  </span>
                  {s.conditionMet && (
                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Condición ×2</span>
                  )}
                  <span className="text-xs text-muted"><Wins n={roundsWonOf(s.playerId)} /></span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-ink tabular-nums">{s.total}</div>
                  <div className="text-xs text-muted">{s.raw} combos × {s.multiplier}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={leave} className="mt-6 w-full rounded-lg bg-link py-3 font-bold text-white hover:bg-link/90">
          Volver al inicio
        </button>
      </div>
      <aside className="order-1 lg:order-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-2 font-bold text-ink">Tablero final</h3>
          <div className="flex justify-center overflow-x-auto">
            <Board board={board} />
          </div>
          <p className="mt-2 text-center text-xs text-muted">Así quedó el tablero tras las 5 rondas.</p>
        </div>
      </aside>
    </div>
  );
}
