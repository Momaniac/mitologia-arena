// Acceso de administradores: personal de la empresa que corre las dinámicas
// presenciales. Solo ellos pueden crear salas.
//
// v1 (aceptado por el cliente): validación del lado del CLIENTE. Frena el uso
// casual de quien solo tenga el enlace, pero la llave viaja en el bundle y es
// visible para alguien técnico. Endurecer del lado del servidor (Supabase) en
// una versión futura si se requiere protección real.
const ADMINS: Record<string, string> = {
  diego: 'D2314',
};

/** True si el nombre + llave corresponden a un administrador válido. */
export function verifyAdmin(name: string, key: string): boolean {
  const expected = ADMINS[name.trim().toLowerCase()];
  return expected !== undefined && expected === key.trim();
}
