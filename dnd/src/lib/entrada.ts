import { condiciones } from "./catalogo";
import type { Evento } from "./analytics";

/**
 * Validación de lo que entra por la API. Todo lo que no esté en la lista se descarta:
 * ni eventos ni leads guardan IP, user agent, ni identificadores de persona.
 */
export const EVENTOS: Evento[] = [
  "onboarding_completado",
  "onboarding_salteado",
  "filtro_usado",
  "ficha_vista",
  "plan_visto",
  "recorrido_abierto",
  "reporte_enviado",
  "pro_clic",
  "lead_comercio_enviado",
];

const PROPS_PERMITIDAS = ["filtro", "valor", "cantidad", "lugar", "tipo", "interes", "plan"] as const;

export function validarEvento(x: unknown, lugarIds: Set<string>, planIds: Set<string> = new Set()): { evento: string; props: Record<string, string | number | boolean>; t: string } | null {
  if (typeof x !== "object" || x === null) return null;
  const { evento, props } = x as { evento?: unknown; props?: unknown };
  if (typeof evento !== "string" || !(EVENTOS as string[]).includes(evento)) return null;
  const out: Record<string, string | number | boolean> = {};
  if (typeof props === "object" && props !== null) {
    for (const k of PROPS_PERMITIDAS) {
      const v = (props as Record<string, unknown>)[k];
      if (typeof v === "string") {
        if (k === "lugar" && !lugarIds.has(v)) continue;
        if (k === "plan" && !planIds.has(v)) continue;
        out[k] = v.slice(0, k === "valor" ? 300 : 60);
      } else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      else if (typeof v === "boolean") out[k] = v;
    }
  }
  return { evento, props: out, t: new Date().toISOString() };
}

export const RUBROS_COMERCIO = ["Café de barrio", "Café de especialidad", "Café con jardín", "Café-librería", "Café cultural", "Café-bar", "Panadería con salón", "Otro"] as const;
export type Interes = "pro" | "relevamiento";

export type LeadValidado = { ok: true; lead: { nombre: string; rubro: string; contacto: string; interes: Interes } } | { ok: false; campo: "nombre" | "rubro" | "contacto"; error: string };

const esEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const esTelefono = (s: string) => /^[\d\s()+\-.]+$/.test(s) && s.replace(/\D/g, "").length >= 8;

export function validarLead(x: unknown): LeadValidado {
  const r = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const nombre = typeof r.nombre === "string" ? r.nombre.trim() : "";
  const rubro = typeof r.rubro === "string" ? r.rubro : "";
  const contacto = typeof r.contacto === "string" ? r.contacto.trim() : "";
  if (nombre.length < 2) return { ok: false, campo: "nombre", error: "Escribí el nombre del café." };
  if (nombre.length > 80) return { ok: false, campo: "nombre", error: "El nombre es muy largo (máximo 80 caracteres)." };
  if (!(RUBROS_COMERCIO as readonly string[]).includes(rubro)) return { ok: false, campo: "rubro", error: "Elegí el tipo de café." };
  if (!esEmail(contacto) && !esTelefono(contacto)) return { ok: false, campo: "contacto", error: "Escribí un correo (nombre@ejemplo.com) o un teléfono con al menos 8 números." };
  if (contacto.length > 120) return { ok: false, campo: "contacto", error: "El contacto es muy largo." };
  return { ok: true, lead: { nombre, rubro, contacto, interes: r.interes === "relevamiento" ? "relevamiento" : "pro" } };
}

const condicionIds = new Set(condiciones.map((c) => c.id));
export const esCondicion = (id: string) => condicionIds.has(id);
