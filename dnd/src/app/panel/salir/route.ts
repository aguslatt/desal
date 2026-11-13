import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/sesion";

/**
 * Corta la sesión cuando la cuenta ya no está activa (suspendida o eliminada). Se hace en una ruta porque
 * Next no deja modificar cookies mientras se dibuja una página.
 */
export function GET(req: Request) {
  const motivo = new URL(req.url).searchParams.get("motivo") === "acceso" ? "?motivo=acceso" : "";
  const res = NextResponse.redirect(new URL(`/panel/ingresar${motivo}`, req.url));
  res.cookies.delete(COOKIE);
  return res;
}
