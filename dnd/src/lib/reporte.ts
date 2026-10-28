import { condiciones } from "./catalogo";
import type { Reporte, Respuesta } from "./types";

export const RESPUESTAS: { v: Respuesta; t: string }[] = [
  { v: "si", t: "Sí" },
  { v: "no", t: "No" },
  { v: "no_se", t: "No lo sé" },
  { v: "no_aplica", t: "No aplica" },
];

export const FRANJAS = ["Mañana (9 a 12 h)", "Mediodía (12 a 15 h)", "Tarde (15 a 19 h)", "Noche (19 a 23 h)", "No me acuerdo"] as const;

/** Las preguntas del reporte salen del catálogo: cada condición con `reporte` tiene la suya. */
export const preguntasReporte = condiciones.filter((c) => c.reporte).map((c) => ({ id: c.id, texto: c.reporte!.pregunta }));

export const MAX_COMENTARIO = 500;
const ids = new Set(condiciones.map((c) => c.id));
const preguntaIds = new Set(preguntasReporte.map((p) => p.id));
const RESP = new Set<string>(RESPUESTAS.map((r) => r.v));

export type Validado = { ok: true; reporte: Omit<Reporte, "id" | "fecha"> } | { ok: false; error: string };

/** Valida un reporte entrante. No acepta ni guarda nada que no esté en la lista: sin datos personales. */
export function validarReporte(x: unknown, lugarIds: Set<string>): Validado {
  if (typeof x !== "object" || x === null) return { ok: false, error: "Formato inválido." };
  const r = x as Record<string, unknown>;
  if (typeof r.lugarId !== "string" || !lugarIds.has(r.lugarId)) return { ok: false, error: "Lugar desconocido." };
  const tipo = r.tipo === "dato" ? "dato" : "visita";
  const comentario = typeof r.comentario === "string" ? r.comentario.trim().slice(0, MAX_COMENTARIO) : undefined;

  if (tipo === "dato") {
    if (typeof r.corrige !== "string" || !ids.has(r.corrige)) return { ok: false, error: "Elegí qué dato es incorrecto." };
    if (!comentario) return { ok: false, error: "Contanos qué dice la realidad." };
    return { ok: true, reporte: { lugarId: r.lugarId, tipo, corrige: r.corrige, comentario, respuestas: {} } };
  }

  const respuestas: Record<string, Respuesta> = {};
  if (typeof r.respuestas === "object" && r.respuestas !== null) {
    for (const [k, v] of Object.entries(r.respuestas)) {
      if (preguntaIds.has(k) && typeof v === "string" && RESP.has(v)) respuestas[k] = v as Respuesta;
    }
  }
  if (Object.keys(respuestas).length === 0) return { ok: false, error: "Respondé al menos una pregunta." };
  const difiere = typeof r.difiere === "string" && RESP.has(r.difiere) ? (r.difiere as Respuesta) : undefined;
  if (difiere === "si" && !comentario) return { ok: false, error: "Contanos qué encontraste distinto." };
  const horario = typeof r.horario === "string" && (FRANJAS as readonly string[]).includes(r.horario) ? r.horario : undefined;
  return {
    ok: true,
    reporte: { lugarId: r.lugarId, tipo, respuestas, difiere, horario, comentario, conFoto: r.conFoto === true },
  };
}
