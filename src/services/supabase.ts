import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True si las variables de entorno de Supabase están configuradas. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // No detenemos la app: el modo local (1 dispositivo) sigue funcionando.
  console.warn(
    '[mitologia] Supabase no configurado: define VITE_SUPABASE_URL y ' +
      'VITE_SUPABASE_ANON_KEY (.env.local en dev, variables de entorno en Vercel).',
  );
}

export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'mitologia.auth',
    },
  },
);

// Mantén el token de Realtime sincronizado con la sesión: sin esto, la conexión
// realtime puede quedarse con la clave anónima y RLS bloquear los eventos.
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) supabase.realtime.setAuth(session.access_token);
});

/**
 * Garantiza una sesión anónima persistente: identidad por dispositivo usada
 * para RLS y reconexión. Devuelve el uid del usuario.
 */
export async function ensureAnonSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  if (!session) {
    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!signIn.session) throw new Error('No se pudo iniciar sesión anónima.');
    session = signIn.session;
  }
  // Asegura que Realtime use el JWT del usuario (no solo la anon key).
  supabase.realtime.setAuth(session.access_token);
  return session.user.id;
}

// ---------------------------------------------------------------------------
// Reloj del servidor
// ---------------------------------------------------------------------------
// El cronómetro de apuestas se guarda como un instante absoluto (games.betting_ends_at)
// medido con el reloj de Postgres. Los teléfonos pueden ir adelantados o atrasados,
// así que cada dispositivo mide su desfase una vez y lo aplica a la cuenta regresiva:
// así todos ven el mismo número de segundos.

let clockOffsetMs = 0;

/** Mide el desfase entre el reloj local y el del servidor (mejor esfuerzo). */
export async function syncServerClock(): Promise<void> {
  try {
    const sent = Date.now();
    const { data, error } = await supabase.rpc('server_now');
    if (error || !data) return;
    const received = Date.now();
    const serverMs = new Date(data as string).getTime();
    if (Number.isNaN(serverMs)) return;
    // Se asume latencia simétrica: el servidor respondió a mitad del viaje.
    clockOffsetMs = serverMs - (sent + (received - sent) / 2);
  } catch {
    /* sin sincronía: se usa el reloj local */
  }
}

/** "Ahora" según el reloj del servidor, en milisegundos. */
export function serverNow(): number {
  return Date.now() + clockOffsetMs;
}
