import { NextResponse } from "next/server";
import { obtenerLugares } from "@/lib/cafes-vivos";
import { validarReporte } from "@/lib/reporte";
import { store } from "@/lib/store";


export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el reporte." }, { status: 400 });
  }
  const v = validarReporte(cuerpo, new Set((await obtenerLugares()).map((l) => l.id)));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 422 });
  const fila = { id: crypto.randomUUID(), fecha: new Date().toISOString().slice(0, 10), ...v.reporte };
  try {
    await store().agregar("reportes", fila);
  } catch {
    return NextResponse.json({ error: "No pudimos guardar el reporte. Probá de nuevo." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, id: fila.id }, { status: 201 });
}
