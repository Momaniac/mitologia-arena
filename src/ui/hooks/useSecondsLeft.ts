import { useEffect, useState } from 'react';
import { serverNow } from '../../services/supabase';

/** Segundos que faltan para `endsAt`, según el reloj del servidor. */
export function remainingSeconds(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - serverNow()) / 1000));
}

/**
 * Cuenta regresiva en vivo hacia `endsAt` (ISO, reloj del servidor).
 * Devuelve null cuando no hay cronómetro corriendo.
 *
 * Todos los dispositivos comparan el mismo instante de cierre contra el reloj
 * del servidor, así que ven el mismo número aunque sus teléfonos estén
 * descuadrados. El valor se refresca cada 250 ms: al cambiar `endsAt` puede
 * quedar un cuarto de segundo desactualizado, algo imperceptible en pantalla.
 */
export function useSecondsLeft(endsAt: string | null | undefined): number | null {
  const [left, setLeft] = useState(() => (endsAt ? remainingSeconds(endsAt) : null));

  useEffect(() => {
    if (!endsAt) {
      const id = setTimeout(() => setLeft(null), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setLeft(remainingSeconds(endsAt)), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return left;
}
