"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cafesAdmin, guardarRegistro } from "@/lib/cafes-vivos";
import { validarCafe, type EntradaCafe, type ErroresCafe } from "@/lib/cafe-form";
import { autenticar, cambiarClave, crearCuenta, eliminarCuenta, emailValido, reactivar, reiniciarClave, suspender } from "@/lib/cuentas";
import { cerrarSesion, iniciarSesion, requerirSesion } from "@/lib/panel-sesion";

export interface Estado {
  errores?: ErroresCafe;
  mensaje?: string;
  /** clave provisoria: se muestra UNA vez */
  clave?: string;
  valores?: EntradaCafe;
}

const texto = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as EntradaCafe;
const refrescar = () => revalidatePath("/", "layout");

export async function ingresarAccion(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get("email") ?? "");
  const r = await autenticar(email, String(fd.get("clave") ?? ""));
  if (!r.ok) {
    const mensajes = {
      datos: "El correo o la clave no son correctos.",
      bloqueado: "Demasiados intentos. Esperá 15 minutos y volvé a probar.",
      suspendida: "Esta cuenta está suspendida. Escribile a la administración.",
      sin_configurar: "El panel todavía no está configurado (faltan variables de entorno).",
    } as const;
    return { mensaje: mensajes[r.motivo], valores: { email } };
  }
  const ok = await iniciarSesion({ ...r.sesion, ...(r.debeCambiar ? { cambiar: true } : {}) });
  if (!ok) return { mensaje: "El panel no está configurado: falta SESSION_SECRET.", valores: { email } };
  redirect("/panel");
}

export async function salirAccion() {
  await cerrarSesion();
  redirect("/panel/ingresar");
}

/* ---------------- Perfil admin ---------------- */

export async function guardarCafeAccion(_: Estado, fd: FormData): Promise<Estado> {
  await requerirSesion("admin");
  const valores = texto(fd);
  const idEditado = valores.__id || undefined;
  const todos = await cafesAdmin();
  const ocupados = new Set(todos.map((c) => c.lugar.id));
  // También cuentan los eliminados: reutilizar su id mezclaría registros viejos con el café nuevo.
  const r = validarCafe(valores, { idsOcupados: ocupados, idEditado });
  if (!r.ok) return { errores: r.errores, valores, mensaje: "Revisá los campos marcados: hay datos que corregir." };
  const previo = todos.find((c) => c.lugar.id === r.lugar.id);
  await guardarRegistro({ id: r.lugar.id, estado: previo?.estado ?? "activo", lugar: r.lugar });
  refrescar();
  redirect(`/panel/admin/cafes?ok=${encodeURIComponent(idEditado ? `Guardamos los cambios de ${r.lugar.nombre}.` : `Agregamos ${r.lugar.nombre}.`)}`);
}

export async function accionCafe(fd: FormData) {
  await requerirSesion("admin");
  const id = String(fd.get("id") ?? "");
  const op = String(fd.get("op") ?? "");
  const cafe = (await cafesAdmin()).find((c) => c.lugar.id === id);
  if (!cafe) redirect(`/panel/admin/cafes?ok=${encodeURIComponent("No encontramos ese café.")}`);
  if (op === "ocultar" || op === "mostrar") {
    await guardarRegistro({ id, estado: op === "ocultar" ? "oculto" : "activo", lugar: cafe.editado ? cafe.lugar : undefined });
  } else if (op === "eliminar") {
    await guardarRegistro({ id, estado: "eliminado" });
  }
  refrescar();
  const msg = op === "ocultar" ? `Ocultamos ${cafe.lugar.nombre}: ya no se ve en la app.` : op === "mostrar" ? `${cafe.lugar.nombre} vuelve a verse en la app.` : `Eliminamos ${cafe.lugar.nombre}.`;
  redirect(`/panel/admin/cafes?ok=${encodeURIComponent(msg)}`);
}

export async function crearCuentaAccion(_: Estado, fd: FormData): Promise<Estado> {
  await requerirSesion("admin");
  const email = String(fd.get("email") ?? "").trim();
  const cafeId = String(fd.get("cafeId") ?? "");
  const errores: ErroresCafe = {};
  if (!emailValido(email.toLowerCase())) errores.email = "Escribí un correo válido (nombre@ejemplo.com).";
  if (!(await cafesAdmin()).some((c) => c.lugar.id === cafeId)) errores.cafeId = "Elegí el café.";
  if (Object.keys(errores).length) return { errores, valores: { email, cafeId } };
  const r = await crearCuenta(email, cafeId);
  if (!r.ok) {
    const m = { email: "Escribí un correo válido (nombre@ejemplo.com).", duplicada: "Ya existe una cuenta con ese correo.", cafe_con_cuenta: "Ese café ya tiene una cuenta." } as const;
    return { errores: { [r.error === "cafe_con_cuenta" ? "cafeId" : "email"]: m[r.error] }, valores: { email, cafeId } };
  }
  refrescar();
  return { mensaje: `Cuenta creada para ${email}. Copiá la clave provisoria ahora: no la vas a volver a ver.`, clave: r.clave, valores: {} };
}

export async function accionCuenta(_: Estado, fd: FormData): Promise<Estado> {
  await requerirSesion("admin");
  const email = String(fd.get("email") ?? "");
  const op = String(fd.get("op") ?? "");
  if (op === "suspender") await suspender(email);
  else if (op === "reactivar") await reactivar(email);
  else if (op === "eliminar") await eliminarCuenta(email);
  else if (op === "reiniciar") {
    const clave = await reiniciarClave(email);
    refrescar();
    return clave ? { mensaje: `Nueva clave provisoria para ${email}. Copiala ahora: no la vas a volver a ver.`, clave } : { mensaje: "No encontramos esa cuenta." };
  }
  refrescar();
  return { mensaje: op === "suspender" ? "Cuenta suspendida." : op === "reactivar" ? "Cuenta reactivada." : "Cuenta eliminada." };
}

/* ---------------- Perfil café ---------------- */

export async function cambiarClaveAccion(_: Estado, fd: FormData): Promise<Estado> {
  const s = await requerirSesion("cafe", { permitirCambiar: true });
  const nueva = String(fd.get("nueva") ?? "");
  if (nueva !== String(fd.get("repetir") ?? "")) return { errores: { repetir: "Las dos claves nuevas no coinciden." } };
  const r = await cambiarClave(s.u, String(fd.get("actual") ?? ""), nueva);
  if (!r.ok) return { errores: { [r.error.startsWith("La clave actual") ? "actual" : "nueva"]: r.error } };
  await iniciarSesion({ u: s.u, rol: "cafe", cafeId: s.cafeId });
  redirect("/panel/cafe?ok=clave");
}
