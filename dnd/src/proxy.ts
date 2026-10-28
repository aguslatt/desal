import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/auth";

/** /metricas pide contraseña. Sin METRICAS_PASSWORD configurada, queda cerrada para todos. */
export function proxy(req: NextRequest) {
  const password = process.env.METRICAS_PASSWORD;
  if (!password) {
    return new NextResponse("Las métricas están cerradas: falta configurar METRICAS_PASSWORD.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (autorizado(req.headers.get("authorization"), password)) return NextResponse.next();
  return new NextResponse("Necesitás la contraseña para ver las métricas.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Umbral métricas", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const config = { matcher: ["/metricas", "/metricas/:path*"] };
