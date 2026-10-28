/**
 * Fecha de referencia para "reciente" y "hace X días".
 * Con datos de demostración la fijamos para que la demo se vea igual siempre.
 * Con relevamientos reales: poné NEXT_PUBLIC_FECHA_REFERENCIA="" y se usa la fecha actual.
 */
const FIJA = process.env.NEXT_PUBLIC_FECHA_REFERENCIA ?? "2026-10-28";

export function hoy(): Date {
  return FIJA ? new Date(`${FIJA}T12:00:00-03:00`) : new Date();
}

export function diasEntre(desdeISO: string, hasta: Date = hoy()): number {
  const d = new Date(`${desdeISO}T12:00:00-03:00`);
  return Math.round((hasta.getTime() - d.getTime()) / 86_400_000);
}

export function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "Sábado 31/10". */
export function diaCorto(iso: string): string {
  const d = new Date(`${iso}T12:00:00-03:00`);
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "18 a 20 h" a partir de "18:00" y "20:00" (con minutos si no son en punto). */
export function franja(desde: string, hasta: string): string {
  const f = (h: string) => (h.endsWith(":00") ? String(Number(h.slice(0, 2))) : `${Number(h.slice(0, 2))}:${h.slice(3)}`);
  return `${f(desde)} a ${f(hasta)} h`;
}
