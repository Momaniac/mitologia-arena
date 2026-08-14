import { useEffect, useState } from 'react';
import { useRoomStore } from '../../state/roomStore';
import { verifyAdmin } from '../../services/adminAuth';
import { isSupabaseConfigured } from '../../services/supabase';
import { Icon } from '../components/Icon';
import { Tutorial } from './Tutorial';
import logoArena from '../../assets/brand/logo-arena.png';
import logoEmpresa from '../../assets/brand/logo-empresa.png';
import logoMitologia from '../../assets/brand/logo-mitologia.jpg';

type Stage = 'splash' | 'gate' | 'player-tutorial' | 'player-join' | 'admin-login' | 'admin-home';

/**
 * Marca del juego: logo de Mitología (arte del diseñador) + sello de Arena como
 * respaldo del programa. El logo de Arena es line-art negro, así que va sobre un
 * sello claro para que se lea en el tema oscuro.
 */
function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={logoMitologia}
        alt="Mitología"
        className={`w-full ${big ? 'max-w-[420px]' : 'max-w-[300px]'}`}
      />
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center rounded-full bg-[#f4f1ea] p-2 ring-1 ring-black/10">
          <img src={logoArena} alt="" width={38} height={38} />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.28em] text-accent-dark">
          Programa Arena
        </span>
      </div>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-5">
      <div className="w-full max-w-md animate-fade-up">{children}</div>
    </div>
  );
}

function ConfigBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-ink">
      Supabase no está configurado en este entorno. Define <code>VITE_SUPABASE_URL</code> y{' '}
      <code>VITE_SUPABASE_ANON_KEY</code>.
    </div>
  );
}

function ErrorBar({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-ink">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted hover:text-ink">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function Entry() {
  const [stage, setStage] = useState<Stage>('splash');
  const [adminName, setAdminName] = useState('');
  const clearError = useRoomStore((s) => s.clearError);

  const go = (s: Stage) => {
    clearError();
    setStage(s);
  };

  if (stage === 'splash') return <Splash onDone={() => setStage('gate')} />;
  if (stage === 'gate')
    return (
      <Gate
        onPlayer={() => go('player-tutorial')}
        onRejoin={() => go('player-join')}
        onAdmin={() => go('admin-login')}
      />
    );
  if (stage === 'player-tutorial') return <Tutorial onFinish={() => go('player-join')} />;
  if (stage === 'player-join') return <PlayerJoin onBack={() => go('gate')} />;
  if (stage === 'admin-login')
    return (
      <AdminLogin
        onBack={() => go('gate')}
        onSuccess={(name) => {
          setAdminName(name);
          go('admin-home');
        }}
      />
    );
  return <AdminHome name={adminName} onBack={() => go('gate')} />;
}

// ---------------------------------------------------------------------------

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-base p-6">
      <div className="animate-fade-up">
        <Brand size="lg" />
      </div>
      <div className="flex items-center gap-2 text-muted">
        <span className="h-2 w-2 animate-pulse-ring rounded-full bg-accent" />
        <span className="text-sm">Cargando…</span>
      </div>
      <div className="absolute bottom-6 flex items-center gap-2 opacity-70">
        <span className="text-xs text-muted">Una experiencia de</span>
        <img src={logoEmpresa} alt="Equilibrio Creciente" className="h-5" style={{ filter: 'invert(1)' }} />
      </div>
    </div>
  );
}

function Gate({
  onPlayer,
  onRejoin,
  onAdmin,
}: {
  onPlayer: () => void;
  onRejoin: () => void;
  onAdmin: () => void;
}) {
  return (
    <Screen>
      <div className="mb-8 flex justify-center">
        <Brand />
      </div>
      <h1 className="mb-1 text-center text-xl font-bold text-ink">¿Cómo quieres entrar?</h1>
      <p className="mb-6 text-center text-sm text-muted">Elige tu forma de acceso.</p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onPlayer}
          className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-5 text-left transition-colors hover:border-accent/60"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
            <Icon name="person" size={26} />
          </span>
          <span>
            <span className="block font-bold text-ink">Entrar como jugador</span>
            <span className="block text-sm text-muted">Únete a una sala con el código del moderador.</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onAdmin}
          className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-5 text-left transition-colors hover:border-link/60"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-link/15 text-link">
            <Icon name="shield" size={26} />
          </span>
          <span>
            <span className="block font-bold text-ink">Entrar como administrador</span>
            <span className="block text-sm text-muted">Personal Arena. Requiere nombre y llave.</span>
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={onRejoin}
        className="mx-auto mt-5 block text-sm text-link hover:underline"
      >
        Ya estaba jugando y se me salió — volver a entrar
      </button>
    </Screen>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <Icon name="arrow-left" size={16} />
      Volver
    </button>
  );
}

function PlayerJoin({ onBack }: { onBack: () => void }) {
  const join = useRoomStore((s) => s.join);
  const busy = useRoomStore((s) => s.busy);
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  return (
    <Screen>
      <BackLink onBack={onBack} />
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Icon name="person" size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Unirse a una sala</h2>
            <p className="text-sm text-muted">Ingresa el código que te dio el moderador.</p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-link/25 bg-link/10 p-3 text-xs text-ink/85">
          <strong className="text-link">¿Se te salió el juego?</strong> Entra con el mismo
          código y <strong>exactamente el mismo nombre</strong> que usaste al inicio:
          recuperas tus cartas, tus monedas y tu condición secreta, aunque la partida ya
          vaya avanzada.
        </div>

        <ConfigBanner />
        {error && <ErrorBar message={error} onClose={clearError} />}

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Código de sala</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. ABCDE"
          maxLength={6}
          className="mb-3 w-full rounded-lg border border-line bg-surface2 px-3 py-2.5 font-mono uppercase tracking-[0.3em] text-ink placeholder:text-muted/60"
        />
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="¿Cómo te llamas?"
          maxLength={24}
          className="mb-4 w-full rounded-lg border border-line bg-surface2 px-3 py-2.5 text-ink placeholder:text-muted/60"
        />
        <button
          type="button"
          disabled={busy || code.trim().length < 4 || !name.trim()}
          onClick={() => join(code, name)}
          className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink shadow hover:bg-accent-dark disabled:opacity-50"
        >
          {busy ? 'Uniéndote…' : 'Unirse'}
        </button>
      </div>
    </Screen>
  );
}

function AdminLogin({ onBack, onSuccess }: { onBack: () => void; onSuccess: (name: string) => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (verifyAdmin(name, key)) {
      onSuccess(name.trim());
    } else {
      setError('Nombre o llave incorrectos.');
    }
  }

  return (
    <Screen>
      <BackLink onBack={onBack} />
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-link/15 text-link">
            <Icon name="shield" size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Acceso de administrador</h2>
            <p className="text-sm text-muted">Solo personal de Arena.</p>
          </div>
        </div>

        {error && <ErrorBar message={error} onClose={() => setError(null)} />}

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Nombre</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Tu nombre"
          maxLength={40}
          className="mb-3 w-full rounded-lg border border-line bg-surface2 px-3 py-2.5 text-ink placeholder:text-muted/60"
        />
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Llave</label>
        <input
          value={key}
          type="password"
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Tu llave de acceso"
          maxLength={40}
          className="mb-4 w-full rounded-lg border border-line bg-surface2 px-3 py-2.5 text-ink placeholder:text-muted/60"
        />
        <button
          type="button"
          disabled={!name.trim() || !key.trim()}
          onClick={submit}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-link py-3 font-bold text-white shadow hover:bg-link/90 disabled:opacity-50"
        >
          <Icon name="key" size={18} />
          Entrar
        </button>
      </div>
    </Screen>
  );
}

function AdminHome({ name, onBack }: { name: string; onBack: () => void }) {
  const hostCreate = useRoomStore((s) => s.hostCreate);
  const busy = useRoomStore((s) => s.busy);
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);

  return (
    <Screen>
      <BackLink onBack={onBack} />
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-link/15 text-link">
          <Icon name="shield" size={26} />
        </span>
        <h2 className="text-lg font-bold text-ink">Hola, {name || 'administrador'}</h2>
        <p className="mb-5 mt-1 text-sm text-muted">
          Crea una sala y comparte el código para que los jugadores se unan desde sus teléfonos.
        </p>

        {error && <ErrorBar message={error} onClose={clearError} />}

        <button
          type="button"
          disabled={busy}
          onClick={() => hostCreate()}
          className="w-full rounded-lg bg-accent py-3 font-bold text-accent-ink shadow hover:bg-accent-dark disabled:opacity-50"
        >
          {busy ? 'Creando…' : 'Crear sala'}
        </button>
      </div>
    </Screen>
  );
}
