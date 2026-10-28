/**
 * Eventos anónimos: solo el nombre del evento y unas pocas propiedades (filtro, lugar, etc.).
 * No se envía ni se guarda ningún identificador de persona. Se respeta "No rastrear" del navegador.
 */
export type Evento =
  | "onboarding_completado"
  | "onboarding_salteado"
  | "filtro_usado"
  | "ficha_vista"
  | "plan_visto"
  | "recorrido_abierto"
  | "reporte_enviado"
  | "pro_clic"
  | "lead_comercio_enviado";

export function track(evento: Evento, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const cuerpo = JSON.stringify({ evento, props });
  try {
    if (navigator.sendBeacon?.("/api/eventos", new Blob([cuerpo], { type: "application/json" }))) return;
    void fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true });
  } catch {
    /* la medición nunca rompe la app */
  }
}

/** Registra solo las condiciones que se acaban de marcar (no las que ya estaban ni las que se sacan). */
export function trackCondicionesMarcadas(antes: string[], despues: string[]) {
  for (const id of despues.filter((x) => !antes.includes(x))) track("filtro_usado", { filtro: "condiciones", valor: id });
}
