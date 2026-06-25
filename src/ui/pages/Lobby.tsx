import { useState } from 'react';
import { useRoomStore } from '../../state/roomStore';
import { isSupabaseConfigured } from '../../services/supabase';
import type { LobbyPlayer, LobbyTeam } from '../../services/room';
import { GamePlay } from './GamePlay';

export function Lobby({ onShowTutorial }: { onShowTutorial: () => void }) {
  const role = useRoomStore((s) => s.role);
  const status = useRoomStore((s) => s.game?.status);

  if (!role) return <MultiplayerHome onShowTutorial={onShowTutorial} />;
  if (status && status !== 'lobby') return <GamePlay />;
  return role === 'host' ? <HostLobby /> : <PlayerLobby />;
}

function ConfigBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mx-auto mb-4 max-w-xl rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-ink">
      Supabase no está configurado en este entorno. Define{' '}
      <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
    </div>
  );
}

function ErrorBar() {
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);
  if (!error) return null;
  return (
    <div className="mx-auto mb-4 flex max-w-xl items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
      <span>{error}</span>
      <button type="button" onClick={clearError} className="text-ink/60 hover:text-ink">
        ✕
      </button>
    </div>
  );
}

function MultiplayerHome({ onShowTutorial }: { onShowTutorial: () => void }) {
  const hostCreate = useRoomStore((s) => s.hostCreate);
  const join = useRoomStore((s) => s.join);
  const busy = useRoomStore((s) => s.busy);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-ink">Mitología</h1>
          <p className="text-ink/60">Juego multijugador · Arena</p>
        </header>

        <ConfigBanner />
        <ErrorBar />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Host */}
          <section className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="mb-1 text-xl font-bold text-ink">Crear sala</h2>
            <p className="mb-4 text-sm text-ink/70">
              Eres el <strong>moderador</strong>. Se genera un código para que los
              jugadores se unan desde sus teléfonos.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => hostCreate()}
              className="w-full rounded-lg bg-accent py-3 font-bold text-ink shadow hover:bg-accent-dark disabled:opacity-50"
            >
              {busy ? 'Creando…' : 'Crear sala'}
            </button>
          </section>

          {/* Player */}
          <section className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="mb-1 text-xl font-bold text-ink">Unirse a una sala</h2>
            <p className="mb-3 text-sm text-ink/70">
              Ingresa el código que te dio el moderador y tu nombre.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código (ej. ABCDE)"
              maxLength={6}
              className="mb-2 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono uppercase tracking-widest text-ink"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={24}
              className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
            />
            <button
              type="button"
              disabled={busy || code.trim().length < 4 || !name.trim()}
              onClick={() => join(code, name)}
              className="w-full rounded-lg bg-link py-3 font-bold text-white shadow hover:bg-link/90 disabled:opacity-50"
            >
              {busy ? 'Uniéndote…' : 'Unirse'}
            </button>
          </section>
        </div>

        <div className="mt-6 text-center">
          <button type="button" onClick={onShowTutorial} className="text-sm text-link hover:underline">
            Ver tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

function membersOf(players: LobbyPlayer[], team: LobbyTeam): LobbyPlayer[] {
  return players.filter((p) => p.team_id === team.id);
}

function HostLobby() {
  const code = useRoomStore((s) => s.code);
  const players = useRoomStore((s) => s.players);
  const teams = useRoomStore((s) => s.teams);
  const autoAssign = useRoomStore((s) => s.autoAssign);
  const setRep = useRoomStore((s) => s.setRep);
  const start = useRoomStore((s) => s.start);
  const leave = useRoomStore((s) => s.leave);
  const refresh = useRoomStore((s) => s.refresh);
  const busy = useRoomStore((s) => s.busy);

  const connected = players.filter((p) => p.connected);
  const unassigned = connected.filter((p) => !p.team_id);

  const teamsValid =
    teams.length >= 2 &&
    teams.every((t) => membersOf(connected, t).length >= 1 && t.representative);

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <ErrorBar />
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Sala creada</h1>
            <p className="text-sm text-ink/60">Vista del moderador</p>
          </div>
          <button type="button" onClick={leave} className="text-sm text-link hover:underline">
            Cerrar sala
          </button>
        </header>

        <div className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center">
          <div className="text-xs font-semibold uppercase text-ink/60">Código de la sala</div>
          <div className="font-mono text-5xl font-extrabold tracking-[0.3em] text-ink">{code}</div>
          <p className="mt-1 text-sm text-ink/70">Compártelo para que los jugadores se unan desde sus teléfonos.</p>
        </div>

        <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-ink">
              Conectados: <span className="text-link">{connected.length}</span>
            </h3>
            <button
              type="button"
              onClick={refresh}
              className="rounded-lg border border-ink/10 bg-base px-3 py-1.5 text-sm font-semibold text-ink hover:border-link"
            >
              ↻ Actualizar
            </button>
          </div>
          {connected.length === 0 ? (
            <p className="text-sm text-ink/50">Aún no se une nadie. La lista se actualiza sola.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connected.map((p) => (
                <span key={p.id} className="rounded-full bg-base px-3 py-1 text-sm text-ink/80">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={autoAssign}
            disabled={busy || connected.length < 2}
            className="rounded-lg bg-link px-4 py-2 font-bold text-white hover:bg-link/90 disabled:opacity-50"
          >
            Armar equipos automáticamente
          </button>
          <button
            type="button"
            onClick={start}
            disabled={busy || !teamsValid}
            className="rounded-lg bg-accent px-4 py-2 font-bold text-ink hover:bg-accent-dark disabled:opacity-50"
          >
            Comenzar partida
          </button>
        </div>
        <p className="mb-4 text-xs text-ink/60">
          {teams.length === 0
            ? '1) Espera a que se unan ≥2 jugadores. 2) Pulsa "Armar equipos automáticamente". 3) Se habilitará "Comenzar partida".'
            : !teamsValid
              ? 'Cada equipo necesita al menos 1 integrante y un representante para comenzar.'
              : 'Todo listo: puedes comenzar la partida.'}
        </p>

        {unassigned.length > 0 && (
          <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
            <h3 className="mb-2 font-bold text-ink">Sin equipo ({unassigned.length})</h3>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p) => (
                <span key={p.id} className="rounded-full bg-base px-3 py-1 text-sm text-ink/80">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teams.map((t) => {
            const m = membersOf(connected, t);
            const sizeOk = m.length >= 4 && m.length <= 6;
            return (
              <div key={t.id} className="rounded-xl border border-ink/10 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-ink">{t.name}</h3>
                  <span className={`text-sm font-semibold ${sizeOk ? 'text-success' : 'text-danger'}`}>
                    {m.length} integrantes
                  </span>
                </div>
                <ul className="mb-2 space-y-1">
                  {m.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm text-ink">
                      <span>{p.name}</span>
                      {t.representative === p.auth_uid && (
                        <span className="rounded-full bg-link/15 px-2 py-0.5 text-[11px] font-bold text-link">
                          Representante
                        </span>
                      )}
                    </li>
                  ))}
                  {m.length === 0 && <li className="text-sm text-ink/50">Sin integrantes</li>}
                </ul>
                {m.length > 0 && (
                  <label className="block text-xs text-ink/60">
                    Representante
                    <select
                      value={t.representative ?? ''}
                      onChange={(e) => setRep(t.id, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 px-2 py-1.5 text-sm text-ink"
                    >
                      <option value="" disabled>
                        Elige…
                      </option>
                      {m.map((p) => (
                        <option key={p.id} value={p.auth_uid}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlayerLobby() {
  const code = useRoomStore((s) => s.code);
  const players = useRoomStore((s) => s.players);
  const teams = useRoomStore((s) => s.teams);
  const myUid = useRoomStore((s) => s.myUid);
  const leave = useRoomStore((s) => s.leave);

  const me = players.find((p) => p.auth_uid === myUid);
  const myTeam = teams.find((t) => t.id === me?.team_id);
  const myMates = myTeam ? players.filter((p) => p.team_id === myTeam.id) : [];

  return (
    <div className="min-h-screen bg-base p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <ErrorBar />
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Sala {code}</h1>
            <p className="text-sm text-ink/60">Hola, {me?.name ?? 'jugador'}</p>
          </div>
          <button type="button" onClick={leave} className="text-sm text-link hover:underline">
            Salir
          </button>
        </header>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
          {!myTeam ? (
            <>
              <div className="mb-2 text-4xl">⏳</div>
              <h2 className="text-lg font-bold text-ink">Esperando al moderador…</h2>
              <p className="mt-1 text-sm text-ink/70">
                {players.filter((p) => p.connected).length} jugadores en la sala. El
                moderador está armando los equipos.
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase text-ink/60">Tu equipo</div>
              <h2 className="text-2xl font-extrabold text-ink">{myTeam.name}</h2>
              <ul className="mt-3 space-y-1 text-left">
                {myMates.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-base px-3 py-1.5 text-sm text-ink">
                    <span>
                      {p.name}
                      {p.auth_uid === myUid && <span className="text-ink/50"> (tú)</span>}
                    </span>
                    {myTeam.representative === p.auth_uid && (
                      <span className="rounded-full bg-link/15 px-2 py-0.5 text-[11px] font-bold text-link">
                        Representante
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink/60">Esperando a que el moderador inicie la partida.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

