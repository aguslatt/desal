import { NextResponse } from "next/server";
import { validarLead } from "@/lib/entrada";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el formulario." }, { status: 400 });
  }
  const v = validarLead(cuerpo);
  if (!v.ok) return NextResponse.json({ campo: v.campo, error: v.error }, { status: 422 });
  try {
    await store().agregar("leads", { id: crypto.randomUUID(), fecha: new Date().toISOString(), ...v.lead });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar tu interés. Probá de nuevo en un rato." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
