import { NextResponse } from "next/server";
import { lugares, planes } from "@/lib/datos";
import { validarEvento } from "@/lib/entrada";
import { store } from "@/lib/store";

const ids = new Set(lugares.map((l) => l.id));
const planIds = new Set(planes.map((p) => p.id));

export async function POST(req: Request) {
  try {
    const e = validarEvento(await req.json(), ids, planIds);
    if (!e) return new NextResponse(null, { status: 204 });
    await store().agregar("eventos", e);
  } catch {
    /* un evento perdido no importa */
  }
  return new NextResponse(null, { status: 204 });
}
