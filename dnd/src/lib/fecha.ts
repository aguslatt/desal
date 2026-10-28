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
