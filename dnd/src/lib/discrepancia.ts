import { condiciones } from "./catalogo";
import { diasEntre, hoy } from "./fecha";
import type { Discrepancia, Lugar, Reporte } from "./types";

export const VENTANA_DIAS = 60;
export const MINIMO_REPORTES = 2;

/**
 * Hay discrepancia cuando un dato figura como "confirmado" y al menos
 * MINIMO_REPORTES reportes de los últimos VENTANA_DIAS (posteriores al dato) dicen lo contrario.
 */
export function discrepancias(lugar: Lugar, reportes: Reporte[], ahora: Date = hoy()): Discrepancia[] {
  const propios = reportes.filter((r) => r.lugarId === lugar.id && diasEntre(r.fecha, ahora) <= VENTANA_DIAS);
  const out: Discrepancia[] = [];
  for (const c of condiciones) {
    const dato = lugar.datos[c.id];
    if (!c.reporte || dato?.estado !== "confirmado") continue;
    const contradicen = propios.filter(
      (r) =>
        r.respuestas[c.id] === c.reporte!.contradiceConRespuesta &&
        (!dato.fuente || r.fecha >= dato.fuente.fecha),
    );
    if (contradicen.length >= MINIMO_REPORTES) {
      const fechas = contradicen.map((r) => r.fecha).sort();
      out.push({ condicionId: c.id, reportes: contradicen.length, desde: fechas[0], hasta: fechas.at(-1)! });
    }
  }
  return out;
}
