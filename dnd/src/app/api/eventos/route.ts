import { NextResponse } from "next/server";
import { lugares, programas } from "@/lib/datos";
import { validarEvento } from "@/lib/entrada";
import { store } from "@/lib/store";

const ids = new Set(lugares.map((l) => l.id));
const programaIds = new Set(programas.map((p) => p.id));

export async function POST(req: Request) {
  try {
    const e = validarEvento(await req.json(), ids, programaIds);
    if (!e) return new NextResponse(null, { status: 204 });
    await store().agregar("eventos", e);
  } catch {
    /* un evento perdido no importa */
  }
  return new NextResponse(null, { status: 204 });
}
