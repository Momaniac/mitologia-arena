import { useRoomStore } from '../../state/roomStore';
import { Icon } from '../components/Icon';
import { GamePlay } from './GamePlay';

export function Lobby() {
  const role = useRoomStore((s) => s.role);
  const status = useRoomStore((s) => s.game?.status);

  if (status && status !== 'lobby') return <GamePlay />;
  return role === 'host' ? <HostLobby /> : <PlayerLobby />;
}

function ErrorBar() {
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);
  if (!error) return null;
  return (
    <div className="mx-auto mb-4 flex max-w-xl items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
      <span>{error}</span>
      <button type="button" onClick={clearError} aria-label="Cerrar" className="text-muted hover:text-ink">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

function HostLobby() {
  const code = useRoomStore((s) => s.code);
  const players = useRoomStore((s) => s.players);
  const start = useRoomStore((s) => s.start);
  const leave = useRoomStore((s) => s.leave);
  const refresh = useRoomStore((s) => s.refresh);
  const busy = useRoomStore((s) => s.busy);

  const connected = players.filter((p) => p.connected);
  const canStart = connected.length >= 2;

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <ErrorBar />
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Sala creada</h1>
            <p className="text-sm text-muted">Vista del moderador</p>
          </div>
          <button
            type="button"
            onClick={leave}
            className="inline-flex items-center gap-1 text-sm text-link hover:underline"
          >
            <Icon name="logout" size={16} />
            Cerrar sala
          </button>
        </header>

        <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Código de la sala</div>
          <div className="font-mono text-5xl font-extrabold tracking-[0.3em] text-ink">{code}</div>
          <p className="mt-1 text-sm text-muted">Compártelo para que los jugadores se unan desde sus teléfonos.</p>
        </div>

        <div className="mb-4 rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-ink">
              Jugadores conectados: <span className="text-accent">{connected.length}</span>
            </h3>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold text-ink hover:border-link"
            >
              <Icon name="refresh" size={15} />
              Actualizar
            </button>
          </div>
          {connected.length === 0 ? (
            <p className="text-sm text-muted">Aún no se une nadie. La lista se actualiza sola.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connected.map((p) => (
                <span key={p.id} className="rounded-full bg-surface2 px-3 py-1 text-sm text-ink/85">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={start}
          disabled={busy || !canStart}
          className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink hover:bg-accent-dark disabled:opacity-50"
        >
          Comenzar partida
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          {canStart
            ? 'Todos jugarán de forma individual. Cada uno recibirá sus 3 cartas y su condición secreta.'
            : 'Se necesitan al menos 2 jugadores conectados para comenzar.'}
        </p>
      </div>
    </div>
  );
}

function PlayerLobby() {
  const code = useRoomStore((s) => s.code);
  const players = useRoomStore((s) => s.players);
  const myUid = useRoomStore((s) => s.myUid);
  const leave = useRoomStore((s) => s.leave);

  const me = players.find((p) => p.auth_uid === myUid);
  const connected = players.filter((p) => p.connected);

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <ErrorBar />
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Sala {code}</h1>
            <p className="text-sm text-muted">Hola, {me?.name ?? 'jugador'}</p>
          </div>
          <button
            type="button"
            onClick={leave}
            className="inline-flex items-center gap-1 text-sm text-link hover:underline"
          >
            <Icon name="logout" size={16} />
            Salir
          </button>
        </header>

        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
            <Icon name="hourglass" size={24} />
          </span>
          <h2 className="text-lg font-bold text-ink">Esperando al moderador…</h2>
          <p className="mt-1 text-sm text-muted">
            {connected.length} jugadores en la sala. La partida empezará cuando el moderador la inicie.
          </p>
          <ul className="mt-4 space-y-1 text-left">
            {connected.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5 text-sm text-ink"
              >
                <span>
                  {p.name}
                  {p.auth_uid === myUid && <span className="text-muted"> (tú)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
