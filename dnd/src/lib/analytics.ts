/**
 * Eventos anónimos. Fase 4 los envía a /api/eventos; por ahora se acumulan en memoria
 * (sin ningún identificador de persona).
 */
export type Evento =
  | "onboarding_completado"
  | "onboarding_salteado"
  | "filtro_usado"
  | "ficha_vista"
  | "recorrido_abierto"
  | "reporte_enviado"
  | "pro_clic"
  | "lead_comercio_enviado";

export function track(evento: Evento, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __umbralEventos?: unknown[] };
  (w.__umbralEventos ??= []).push({ evento, props, t: Date.now() });
}
