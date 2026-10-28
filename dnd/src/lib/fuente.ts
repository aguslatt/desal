import { diasEntre, formatearFecha } from "./fecha";
import type { Dato } from "./types";

const ORIGEN = { equipo: "Relevamiento del equipo", comercio: "Informado por el comercio" } as const;

/** "Relevamiento del equipo · 12/10/2026", "3 visitantes lo confirmaron en el último mes", etc. */
export function textoFuente(dato: Dato): string {
  const f = dato.fuente;
  if (!f || dato.estado === "sin_info") return "";
  if (f.tipo === "visitantes") {
    const n = f.cantidad ?? 1;
    const verbo = dato.estado === "confirmado" ? "confirmaron" : "reportaron";
    const quien = n === 1 ? "1 visitante lo" : `${n} visitantes lo`;
    const cuando = diasEntre(f.fecha) <= 31 ? "en el último mes" : `· último reporte ${formatearFecha(f.fecha)}`;
    return `${quien} ${n === 1 ? verbo.replace("aron", "ó") : verbo} ${cuando}`;
  }
  return `${ORIGEN[f.tipo]} · ${formatearFecha(f.fecha)}`;
}

export function textoValor(dato: Dato, unidad?: string): string {
  if (dato.valor === undefined || dato.valor === "") return "";
  return unidad ? `${dato.valor} ${unidad}` : String(dato.valor);
}
