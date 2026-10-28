import { NextResponse } from "next/server";
import { lugares } from "@/lib/datos";
import { validarReporte } from "@/lib/reporte";
import { store } from "@/lib/store";

const ids = new Set(lugares.map((l) => l.id));

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el reporte." }, { status: 400 });
  }
  const v = validarReporte(cuerpo, ids);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 422 });
  const fila = { id: crypto.randomUUID(), fecha: new Date().toISOString().slice(0, 10), ...v.reporte };
  try {
    await store().agregar("reportes", fila);
  } catch {
    return NextResponse.json({ error: "No pudimos guardar el reporte. Probá de nuevo." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, id: fila.id }, { status: 201 });
}
