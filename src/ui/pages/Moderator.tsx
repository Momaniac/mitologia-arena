import { FIGURE_LABEL, FIGURES, type Figure, type Token } from '../../engine/types';
import { useGameStore } from '../../state/gameStore';
import { TokenIcon } from '../components/TokenIcon';

function countFigures(tokens: Token[]): Record<Figure, number> {
  const counts = Object.fromEntries(FIGURES.map((f) => [f, 0])) as Record<
    Figure,
    number
  >;
  for (const t of tokens) counts[t.figure] += 1;
  return counts;
}

function TombolaRemaining({ id, tokens }: { id: 'A' | 'B'; tokens: Token[] }) {
  const counts = countFigures(tokens);
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-bold">Tómbola {id}</span>
        <span className="font-mono text-accent">{tokens.length} fichas restantes</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {FIGURES.map((f) => (
          <div key={f} className="flex flex-col items-center gap-1">
            <TokenIcon figure={f} size="sm" />
            <span className="font-mono text-sm">{counts[f]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Moderator({ onClose }: { onClose: () => void }) {
  const players = useGameStore((s) => s.players);
  const history = useGameStore((s) => s.history);
  const round = useGameStore((s) => s.round);
  const phase = useGameStore((s) => s.phase);
  const tombolas = useGameStore((s) => s.tombolas);
  const currentDraw = useGameStore((s) => s.currentDraw);

  return (
    <div className="min-h-screen bg-ink text-white p-6">
      <header className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold">Vista del Moderador</h1>
          <p className="text-white/60 text-sm">
            Información completa de la partida — no debe mostrarse a los
            jugadores.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-accent hover:bg-accent-dark text-ink font-bold px-4 py-2 rounded-lg"
        >
          ← Volver al juego
        </button>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h2 className="text-lg font-bold mb-3">
            Estado actual: Ronda {round} · {phase}
          </h2>
        </section>

        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h2 className="text-lg font-bold mb-1">Estado de las tómbolas</h2>
          <p className="text-white/60 text-sm mb-3">
            Fichas que quedan en cada tómbola. Cada ronda se extraen 4 de A y 4 de
            B; las de la tómbola ganadora se colocan en el tablero y las de la otra
            se eliminan del juego. Ambas tómbolas deben bajar de 20 a 0 a lo largo
            de las 5 rondas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <TombolaRemaining id="A" tokens={tombolas.A} />
            <TombolaRemaining id="B" tokens={tombolas.B} />
          </div>
          {currentDraw && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-white/60 mb-2">
                Fichas extraídas en la ronda actual (fuera de las tómbolas)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm font-semibold">Extraídas de A</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {currentDraw.A.map((t) => (
                      <TokenIcon key={t.id} figure={t.figure} size="sm" />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold">Extraídas de B</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {currentDraw.B.map((t) => (
                      <TokenIcon key={t.id} figure={t.figure} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h2 className="text-lg font-bold mb-3">Jugadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {players.map((p) => (
              <div key={p.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold">{p.name}</span>
                    {p.isBot && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-link/30 rounded-full">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-accent">{p.coins} 🪙</span>
                </div>
                <div className="text-xs text-white/60 mb-1">
                  Combinación secreta
                </div>
                <div className="flex gap-2 mb-2">
                  {p.combination.map((f, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <TokenIcon figure={f} size="sm" />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-white/60 mb-1">Condición</div>
                <div className="text-sm mb-2">{p.condition.label}</div>
                <div className="text-xs text-white/60 mb-1">Carta revelada</div>
                <div className="text-sm">
                  {FIGURE_LABEL[
                    p.hand.find((c) => c.id === p.revealedCardId)!.figure
                  ]}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h2 className="text-lg font-bold mb-3">
            Historial de rondas ({history.length})
          </h2>
          {history.length === 0 && (
            <p className="text-white/60 text-sm">Aún no hay rondas jugadas.</p>
          )}
          <div className="space-y-3">
            {history.map((r, index) => (
              <div
                key={`${r.round}-${index}`}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Ronda {r.round}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.winnerPlayerId
                        ? 'bg-success/30'
                        : 'bg-danger/30'
                    }`}
                  >
                    {r.winnerPlayerId
                      ? `Ganador: Tómbola ${r.winnerTombola}`
                      : `Empate: se repite (${r.voidedReason})`}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/60 text-xs">
                      <th className="pb-1">Jugador</th>
                      <th>Tómbola</th>
                      <th>Apuesta</th>
                      <th>Columnas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.bets.map((b) => {
                      const player = players.find((p) => p.id === b.playerId);
                      const isWinner = b.playerId === r.winnerPlayerId;
                      return (
                        <tr
                          key={b.playerId}
                          className={isWinner ? 'text-accent font-semibold' : ''}
                        >
                          <td className="py-0.5">{player?.name}</td>
                          <td>{b.tombola}</td>
                          <td>{b.amount} 🪙</td>
                          <td className="font-mono text-xs">
                            {b.columns.map((c) => c + 1).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
