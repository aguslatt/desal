import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión sin estado: una cookie con el perfil y el vencimiento, firmada con HMAC-SHA256.
 * Sin SESSION_SECRET no se puede iniciar sesión (nunca hay una clave por defecto).
 */
export type Rol = "admin" | "cafe";

export interface Sesion {
  /** correo de quien inició sesión */
  u: string;
  rol: Rol;
  /** solo para el perfil "cafe": a qué café pertenece */
  cafeId?: string;
  /** vencimiento (ms desde 1970) */
  exp: number;
}

export const COOKIE = "umbral_sesion";
export const DURACION_MS = 8 * 60 * 60 * 1000; // 8 horas

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const firmar = (cuerpo: string, secreto: string) => createHmac("sha256", secreto).update(cuerpo).digest();

export function crearToken(s: Omit<Sesion, "exp">, secreto: string | undefined, ahora = Date.now()): string | null {
  if (!secreto || secreto.length < 16) return null;
  const cuerpo = b64(JSON.stringify({ ...s, exp: ahora + DURACION_MS } satisfies Sesion));
  return `${cuerpo}.${b64(firmar(cuerpo, secreto))}`;
}

export function leerToken(token: string | undefined, secreto: string | undefined, ahora = Date.now()): Sesion | null {
  if (!token || !secreto || secreto.length < 16) return null;
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return null;
  const esperada = firmar(cuerpo, secreto);
  let dada: Buffer;
  try {
    dada = Buffer.from(firma, "base64url");
  } catch {
    return null;
  }
  if (dada.length !== esperada.length || !timingSafeEqual(dada, esperada)) return null;
  try {
    const s = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as Sesion;
    if (typeof s.u !== "string" || (s.rol !== "admin" && s.rol !== "cafe") || typeof s.exp !== "number" || s.exp < ahora) return null;
    if (s.rol === "cafe" && typeof s.cafeId !== "string") return null;
    return s;
  } catch {
    return null;
  }
}
