import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cuentaDe } from "./cuentas";
import { COOKIE, crearToken, DURACION_MS, leerToken, type Rol, type Sesion } from "./sesion";

export async function getSesion(): Promise<Sesion | null> {
  const jar = await cookies();
  return leerToken(jar.get(COOKIE)?.value, process.env.SESSION_SECRET);
}

export async function iniciarSesion(s: Omit<Sesion, "exp">): Promise<boolean> {
  const token = crearToken(s, process.env.SESSION_SECRET);
  if (!token) return false;
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DURACION_MS / 1000 });
  return true;
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

/**
 * Exige un perfil. Sin sesión va al ingreso; con otro perfil, a su propio panel.
 * Para los cafés revisa en cada pedido que la cuenta siga activa (si la admin la suspende, se corta el acceso).
 */
export async function requerirSesion(rol: Rol, opciones: { permitirCambiar?: boolean } = {}): Promise<Sesion> {
  const s = await getSesion();
  if (!s) redirect("/panel/ingresar");
  if (s.rol !== rol) redirect("/panel");
  if (s.rol === "cafe") {
    const c = await cuentaDe(s.u);
    if (!c || c.estado !== "activa" || c.cafeId !== s.cafeId) redirect("/panel/salir?motivo=acceso");
    if (s.cambiar && !opciones.permitirCambiar) redirect("/panel/cafe/clave");
  }
  return s;
}
