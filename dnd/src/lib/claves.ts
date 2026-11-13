import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/** Claves con scrypt y sal propia. Nunca se guarda la clave, solo "sal:hash". */
const LARGO = 64;

function derivar(clave: string, sal: Buffer): Promise<Buffer> {
  return new Promise((ok, mal) => scrypt(clave.normalize("NFKC"), sal, LARGO, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? mal(e) : ok(k))));
}

export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  return `${sal.toString("hex")}:${(await derivar(clave, sal)).toString("hex")}`;
}

export async function verificarClave(clave: string, guardado: string): Promise<boolean> {
  const [salHex, hashHex] = guardado.split(":");
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const obtenido = await derivar(clave, Buffer.from(salHex, "hex"));
  return esperado.length === obtenido.length && timingSafeEqual(esperado, obtenido);
}

/** Clave provisoria legible (sin caracteres que se confunden). Se muestra una sola vez. */
export function claveProvisoria(): string {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export const MIN_CLAVE = 10;
export function problemaClave(c: string): string | null {
  if (c.length < MIN_CLAVE) return `La clave tiene que tener al menos ${MIN_CLAVE} caracteres.`;
  if (c.length > 100) return "La clave es demasiado larga (máximo 100 caracteres).";
  if (!/[a-zA-Z]/.test(c) || !/\d/.test(c)) return "La clave tiene que incluir letras y números.";
  return null;
}
