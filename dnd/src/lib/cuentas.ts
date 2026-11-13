import { timingSafeEqual } from "node:crypto";
import { claveProvisoria, hashClave, problemaClave, verificarClave } from "./claves";
import type { Sesion } from "./sesion";
import { store } from "./store";

/** Cuenta de un café con plan Pro. Se guarda solo el correo y el hash de la clave. */
export interface Cuenta {
  id: string; // el correo en minúsculas
  email: string;
  cafeId: string;
  hash: string;
  estado: "activa" | "suspendida";
  /** la clave provisoria obliga a elegir una propia en el primer ingreso */
  debeCambiar: boolean;
  creada: string;
}

export const normalizarEmail = (e: string) => e.trim().toLowerCase();
export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  const largo = Math.max(x.length, y.length);
  const px = Buffer.alloc(largo);
  const py = Buffer.alloc(largo);
  x.copy(px);
  y.copy(py);
  return timingSafeEqual(px, py) && x.length === y.length;
}

/* Límite de intentos: 5 fallidos por correo y 15 minutos (en memoria de la instancia). */
const intentos = new Map<string, { n: number; hasta: number }>();
export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 15 * 60 * 1000;

export function bloqueado(email: string, ahora = Date.now()): boolean {
  const i = intentos.get(normalizarEmail(email));
  return !!i && i.n >= MAX_INTENTOS && i.hasta > ahora;
}
function fallo(email: string, ahora = Date.now()) {
  const k = normalizarEmail(email);
  const i = intentos.get(k);
  intentos.set(k, !i || i.hasta <= ahora ? { n: 1, hasta: ahora + BLOQUEO_MS } : { n: i.n + 1, hasta: i.hasta });
}
export const reiniciarIntentos = () => intentos.clear();

export type Resultado =
  | { ok: true; sesion: Omit<Sesion, "exp">; debeCambiar: boolean }
  | { ok: false; motivo: "datos" | "bloqueado" | "suspendida" | "sin_configurar" };

/**
 * Perfil "admin": una sola cuenta, definida por ADMIN_EMAIL y ADMIN_PASSWORD (variables de entorno).
 * Perfil "cafe": cuentas creadas por la admin, guardadas en la tabla `cuentas`.
 */
export async function autenticar(emailEntrada: string, clave: string): Promise<Resultado> {
  const email = normalizarEmail(emailEntrada);
  if (bloqueado(email)) return { ok: false, motivo: "bloqueado" };
  const adminEmail = process.env.ADMIN_EMAIL ? normalizarEmail(process.env.ADMIN_EMAIL) : "";
  const adminClave = process.env.ADMIN_PASSWORD ?? "";

  if (adminEmail && adminClave && igual(email, adminEmail)) {
    if (igual(clave, adminClave)) return { ok: true, sesion: { u: adminEmail, rol: "admin" }, debeCambiar: false };
    fallo(email);
    return { ok: false, motivo: "datos" };
  }

  const cuenta = (await store().listar("cuentas")).find((c) => c.id === email) as Cuenta | undefined;
  if (!cuenta) {
    await hashClave(clave); // mismo costo que una cuenta real: no revela si el correo existe
    fallo(email);
    return { ok: false, motivo: !adminEmail && !adminClave ? "sin_configurar" : "datos" };
  }
  if (!(await verificarClave(clave, cuenta.hash))) {
    fallo(email);
    return { ok: false, motivo: "datos" };
  }
  if (cuenta.estado !== "activa") return { ok: false, motivo: "suspendida" };
  intentos.delete(email);
  return { ok: true, sesion: { u: cuenta.email, rol: "cafe", cafeId: cuenta.cafeId }, debeCambiar: cuenta.debeCambiar };
}

export async function listarCuentas(): Promise<Cuenta[]> {
  return (await store().listar("cuentas")) as unknown as Cuenta[];
}

export async function cuentaDe(email: string): Promise<Cuenta | undefined> {
  return (await listarCuentas()).find((c) => c.id === normalizarEmail(email));
}

export type ErrorCuenta = "email" | "duplicada" | "cafe_con_cuenta";

/** Crea la cuenta de un café con una clave provisoria, que se devuelve UNA sola vez. */
export async function crearCuenta(emailEntrada: string, cafeId: string): Promise<{ ok: true; clave: string } | { ok: false; error: ErrorCuenta }> {
  const email = normalizarEmail(emailEntrada);
  if (!emailValido(email)) return { ok: false, error: "email" };
  const todas = await listarCuentas();
  if (todas.some((c) => c.id === email) || (process.env.ADMIN_EMAIL && igual(email, normalizarEmail(process.env.ADMIN_EMAIL)))) return { ok: false, error: "duplicada" };
  if (todas.some((c) => c.cafeId === cafeId)) return { ok: false, error: "cafe_con_cuenta" };
  const clave = claveProvisoria();
  const cuenta: Cuenta = { id: email, email, cafeId, hash: await hashClave(clave), estado: "activa", debeCambiar: true, creada: new Date().toISOString() };
  await store().poner("cuentas", cuenta as unknown as Record<string, unknown> & { id: string });
  return { ok: true, clave };
}

async function actualizar(email: string, cambios: Partial<Cuenta>) {
  const c = await cuentaDe(email);
  if (!c) return false;
  await store().poner("cuentas", { ...c, ...cambios } as unknown as Record<string, unknown> & { id: string });
  return true;
}

export const suspender = (email: string) => actualizar(email, { estado: "suspendida" });
export const reactivar = (email: string) => actualizar(email, { estado: "activa" });
export const eliminarCuenta = (email: string) => store().quitar("cuentas", normalizarEmail(email));

export async function reiniciarClave(email: string): Promise<string | null> {
  const clave = claveProvisoria();
  return (await actualizar(email, { hash: await hashClave(clave), debeCambiar: true })) ? clave : null;
}

export async function cambiarClave(email: string, actual: string, nueva: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await cuentaDe(email);
  if (!c || !(await verificarClave(actual, c.hash))) return { ok: false, error: "La clave actual no es correcta." };
  const p = problemaClave(nueva);
  if (p) return { ok: false, error: p };
  if (await verificarClave(nueva, c.hash)) return { ok: false, error: "La clave nueva tiene que ser distinta de la actual." };
  await actualizar(email, { hash: await hashClave(nueva), debeCambiar: false });
  return { ok: true };
}
