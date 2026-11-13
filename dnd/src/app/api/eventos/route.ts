import { NextResponse } from "next/server";
import { programas } from "@/lib/datos";
import { obtenerLugares } from "@/lib/cafes-vivos";
import { validarEvento } from "@/lib/entrada";
import { store } from "@/lib/store";

const programaIds = new Set(programas.map((p) => p.id));

export async function POST(req: Request) {
  try {
    const e = validarEvento(await req.json(), new Set((await obtenerLugares()).map((l) => l.id)), programaIds);
    if (!e) return new NextResponse(null, { status: 204 });
    await store().agregar("eventos", e);
  } catch {
    /* un evento perdido no importa */
  }
  return new NextResponse(null, { status: 204 });
}
