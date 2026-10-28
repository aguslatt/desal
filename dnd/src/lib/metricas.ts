import type { Fila } from "./store";

export interface Conteo { clave: string; n: number }

export interface Resumen {
  onboarding: { completado: number; salteado: number; tasa: number | null };
  filtros: { total: number; porTipo: Conteo[]; condiciones: Conteo[]; rubros: Conteo[]; barrios: Conteo[] };
  fichas: { total: number; porLugar: Conteo[] };
  recorridos: number;
  reportes: { eventos: number; guardados: number };
  comercios: { proClics: number; formularios: number; leadsGuardados: number };
}

const contar = (claves: string[]): Conteo[] => {
  const m = new Map<string, number>();
  for (const c of claves) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m].map(([clave, n]) => ({ clave, n })).sort((a, b) => b.n - a.n || a.clave.localeCompare(b.clave, "es"));
};

type Ev = { evento?: string; props?: Record<string, unknown> };

/** Totales a partir de eventos anónimos. No hay ninguna fila que identifique a una persona. */
export function resumir(eventos: Fila[], leads: Fila[], reportes: Fila[]): Resumen {
  const ev = eventos as Ev[];
  const de = (n: string) => ev.filter((e) => e.evento === n);
  const completado = de("onboarding_completado").length;
  const salteado = de("onboarding_salteado").length;
  const filtros = de("filtro_usado");
  const prop = (e: Ev, k: string) => (typeof e.props?.[k] === "string" ? (e.props[k] as string) : "");
  return {
    onboarding: { completado, salteado, tasa: completado + salteado ? Math.round((completado / (completado + salteado)) * 100) : null },
    filtros: {
      total: filtros.length,
      porTipo: contar(filtros.map((e) => prop(e, "filtro")).filter(Boolean)),
      condiciones: contar(filtros.filter((e) => prop(e, "filtro") === "condiciones").flatMap((e) => prop(e, "valor").split(",")).filter(Boolean)),
      rubros: contar(filtros.filter((e) => prop(e, "filtro") === "rubro" && prop(e, "valor") !== "todos").map((e) => prop(e, "valor"))),
      barrios: contar(filtros.filter((e) => prop(e, "filtro") === "barrio" && prop(e, "valor") !== "todos").map((e) => prop(e, "valor"))),
    },
    fichas: { total: de("ficha_vista").length, porLugar: contar(de("ficha_vista").map((e) => prop(e, "lugar")).filter(Boolean)) },
    recorridos: de("recorrido_abierto").length,
    reportes: { eventos: de("reporte_enviado").length, guardados: reportes.length },
    comercios: { proClics: de("pro_clic").length, formularios: de("lead_comercio_enviado").length, leadsGuardados: leads.length },
  };
}
