import { condicion } from "./catalogo";
import type { Coincidencia, Estado, Estilo, Lugar } from "./types";

/** Estado de una condición en un lugar. Lo que no está cargado es "sin_info", nunca "sí". */
export function estadoDe(lugar: Lugar, condicionId: string): Estado {
  const dato = lugar.datos[condicionId];
  if (!dato || dato.estado === "sin_info") return "sin_info";
  if (dato.estado === "confirmado") {
    const min = condicion(condicionId).minimo;
    if (min !== undefined) {
      const n = Number(dato.valor);
      if (Number.isNaN(n)) return "sin_info";
      return n >= min ? "confirmado" : "no_disponible";
    }
  }
  return dato.estado;
}

export function coincidencia(lugar: Lugar, necesidades: string[]): Coincidencia {
  const detalle: Record<string, Estado> = {};
  let cumple = 0;
  let sinInfo = 0;
  let noDisponible = 0;
  for (const id of necesidades) {
    const e = estadoDe(lugar, id);
    detalle[id] = e;
    if (e === "confirmado") cumple++;
    else if (e === "sin_info") sinInfo++;
    else noDisponible++;
  }
  const grupo = noDisponible > 0 ? 2 : sinInfo > 0 ? 1 : 0;
  return { total: necesidades.length, cumple, sinInfo, noDisponible, grupo, detalle };
}

export function textoCoincidencia(c: Coincidencia): string {
  if (c.total === 0) return "";
  const partes = [`Cumple ${c.cumple} de ${c.total}`];
  if (c.sinInfo > 0) partes.push(`${c.sinInfo} sin información`);
  if (c.noDisponible > 0) partes.push(`${c.noDisponible} no disponible${c.noDisponible > 1 ? "s" : ""}`);
  return partes.join(" · ");
}

const confirmados = (l: Lugar) => Object.values(l.datos).filter((d) => d.estado === "confirmado").length;

export interface Filtros {
  necesidades: string[];
  estilo?: Estilo;
  barrio?: string;
  /** Oculta los lugares con algo "No disponible" en lo que necesitás, en vez de mandarlos al final. */
  ocultarNoDisponible?: boolean;
}

export interface Resultado {
  lugar: Lugar;
  coincidencia: Coincidencia;
}

export interface Busqueda {
  items: Resultado[];
  /** Lugares que cumplen todo lo que marcaste. */
  cumplenTodo: number;
  /** Lugares con alguna condición sin información (y nada no disponible). */
  conSinInfo: number;
  ocultos: number;
}

/**
 * Orden: 1) cumplen todo, 2) con condiciones sin información, 3) con "No disponible".
 * Un lugar patrocinado solo entra si cumple TODAS las condiciones elegidas.
 * El patrocinio no cambia la posición: se ordena igual que el resto. Ante un empate,
 * van primero los lugares con más datos confirmados (no se muestra como puntaje).
 */
export function buscar(lugares: Lugar[], f: Filtros): Busqueda {
  let ocultos = 0;
  const items: Resultado[] = [];
  for (const lugar of lugares) {
    if (f.estilo && lugar.estilo !== f.estilo) continue;
    if (f.barrio && lugar.barrio !== f.barrio) continue;
    const c = coincidencia(lugar, f.necesidades);
    if (lugar.patrocinado && c.grupo !== 0) continue;
    if (f.ocultarNoDisponible && c.grupo === 2) {
      ocultos++;
      continue;
    }
    items.push({ lugar, coincidencia: c });
  }
  items.sort(
    (a, b) =>
      a.coincidencia.grupo - b.coincidencia.grupo ||
      b.coincidencia.cumple - a.coincidencia.cumple ||
      a.coincidencia.noDisponible - b.coincidencia.noDisponible ||
      // Desempate neutral (nunca patrocinio): primero los lugares con más datos confirmados.
      confirmados(b.lugar) - confirmados(a.lugar) ||
      a.lugar.nombre.localeCompare(b.lugar.nombre, "es"),
  );
  return {
    items,
    cumplenTodo: items.filter((i) => i.coincidencia.grupo === 0).length,
    conSinInfo: items.filter((i) => i.coincidencia.grupo === 1).length,
    ocultos,
  };
}

export function mensajeResultado(b: Busqueda, hayNecesidades: boolean): string {
  const n = b.items.length;
  const lugares = (k: number) => `${k} ${k === 1 ? "café" : "cafés"}`;
  if (!hayNecesidades) return `${lugares(n)} para elegir`;
  if (n === 0) return "Ningún café cumple tus condiciones. Probá sacando alguna.";
  const base = `${lugares(b.cumplenTodo)} ${b.cumplenTodo === 1 ? "cumple" : "cumplen"} tus condiciones`;
  return b.conSinInfo > 0 ? `${base} y ${b.conSinInfo} con información incompleta` : base;
}
