import { estadoDe } from "./match";
import type { Estado, Lugar, Programa, Reporte } from "./types";

/**
 * Analítica de un café a partir de eventos anónimos. Nada de lo que entra o sale identifica a una persona:
 * los eventos solo traen qué pasó, dónde y cuándo; las condiciones que buscan se muestran agregadas y solo
 * cuando hay suficientes visitas.
 */
export interface EventoCrudo {
  evento?: string;
  props?: Record<string, unknown>;
  t?: string;
}

export const ZONA = "America/Argentina/Buenos_Aires";
export const FRANJAS = ["Madrugada", "Mañana", "Mediodía", "Tarde", "Noche"] as const;
export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
/** Mínimo de visitas con condiciones marcadas para mostrar "qué buscan" (cuida el anonimato). */
export const MINIMO_BUSQUEDAS = 5;

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short" });

/** Fecha local de Buenos Aires, día de la semana (0 = lunes) y hora, a partir de un instante ISO. */
export function localDe(iso: string): { fecha: string; dia: number; hora: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const dia = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  return { fecha: `${p.year}-${p.month}-${p.day}`, dia, hora: Number(p.hour) % 24 };
}

export const franjaDe = (hora: number) => (hora < 6 ? 0 : hora < 12 ? 1 : hora < 15 ? 2 : hora < 19 ? 3 : 4);

export function sumarDias(fechaISO: string, n: number): string {
  const d = new Date(`${fechaISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export interface Kpi {
  clave: string;
  etiqueta: string;
  actual: number;
  anterior: number;
  /** variación porcentual contra el período anterior; null si antes no había datos */
  variacion: number | null;
}

export interface Analitica {
  dias: number;
  desde: string;
  hasta: string;
  kpis: Kpi[];
  porDia: { fecha: string; fichas: number; programas: number }[];
  busquedas: { id: string; n: number; estado: Estado }[];
  visitasConCondiciones: number;
  busquedasVisibles: boolean;
  contactos: { tipo: string; n: number }[];
  calor: number[][]; // [día][franja]
  calorMax: number;
  reportes: Reporte[];
  hayDatos: boolean;
}

const de = (ev: EventoCrudo[], nombre: string) => ev.filter((e) => e.evento === nombre);
const prop = (e: EventoCrudo, k: string) => (typeof e.props?.[k] === "string" ? (e.props[k] as string) : "");

interface Entrada {
  eventos: EventoCrudo[];
  reportes: Reporte[];
  lugar: Lugar;
  /** programas de este café */
  programas: Programa[];
  dias: number;
  /** hoy (instante) */
  ahora: Date;
}

export function analiticaCafe({ eventos, reportes, lugar, programas, dias, ahora }: Entrada): Analitica {
  const hasta = localDe(ahora.toISOString())!.fecha;
  const desde = sumarDias(hasta, -(dias - 1));
  const desdeAnt = sumarDias(desde, -dias);
  const idsProg = new Set(programas.map((p) => p.id));

  // Eventos de este café, con su fecha local.
  const propios = eventos
    .map((e) => ({ e, l: e.t ? localDe(e.t) : null }))
    .filter((x) => x.l && x.e.evento)
    .filter(({ e }) => {
      if (e.evento === "programa_visto") return idsProg.has(prop(e, "programa"));
      return prop(e, "lugar") === lugar.id;
    }) as { e: EventoCrudo; l: NonNullable<ReturnType<typeof localDe>> }[];

  const enRango = (l: { fecha: string }, a: string, b: string) => l.fecha >= a && l.fecha <= b;
  const actual = propios.filter((x) => enRango(x.l, desde, hasta));
  const previo = propios.filter((x) => enRango(x.l, desdeAnt, sumarDias(desde, -1)));
  const cuenta = (lista: typeof propios, nombre: string) => lista.filter((x) => x.e.evento === nombre).length;

  const reportesDe = reportes.filter((r) => r.lugarId === lugar.id);
  const repActual = reportesDe.filter((r) => r.fecha >= desde && r.fecha <= hasta);
  const repPrevio = reportesDe.filter((r) => r.fecha >= desdeAnt && r.fecha < desde);

  const def: [string, string, string | null][] = [
    ["fichas", "Visitas a tu ficha", "ficha_vista"],
    ["programas", "Visitas a tus programas", "programa_visto"],
    ["recorridos", "Recorridos visuales abiertos", "recorrido_abierto"],
    ["contactos", "Contactos (llamar o escribir)", "contacto_clic"],
    ["guardados", "Veces que te guardaron", "cafe_guardado"],
  ];
  const kpis: Kpi[] = def.map(([clave, etiqueta, nombre]) => {
    const a = cuenta(actual, nombre!);
    const b = cuenta(previo, nombre!);
    return { clave, etiqueta, actual: a, anterior: b, variacion: b > 0 ? Math.round(((a - b) / b) * 100) : null };
  });
  kpis.push({ clave: "reportes", etiqueta: "Reportes recibidos", actual: repActual.length, anterior: repPrevio.length, variacion: repPrevio.length > 0 ? Math.round(((repActual.length - repPrevio.length) / repPrevio.length) * 100) : null });

  // Por día
  const porDia: Analitica["porDia"] = [];
  for (let i = 0; i < dias; i++) {
    const f = sumarDias(desde, i);
    porDia.push({
      fecha: f,
      fichas: actual.filter((x) => x.l.fecha === f && x.e.evento === "ficha_vista").length,
      programas: actual.filter((x) => x.l.fecha === f && x.e.evento === "programa_visto").length,
    });
  }

  // Qué buscan quienes llegaron a la ficha (agregado y con mínimo)
  const fichas = actual.filter((x) => x.e.evento === "ficha_vista");
  const conCond = fichas.filter((x) => prop(x.e, "valor"));
  const conteo = new Map<string, number>();
  for (const x of conCond) for (const id of new Set(prop(x.e, "valor").split(",").filter(Boolean))) conteo.set(id, (conteo.get(id) ?? 0) + 1);
  const visibles = conCond.length >= MINIMO_BUSQUEDAS;
  const busquedas = visibles
    ? [...conteo].map(([id, n]) => ({ id, n, estado: estadoDe(lugar, id) })).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id))
    : [];

  // Contactos por tipo
  const ct = new Map<string, number>();
  for (const x of actual.filter((y) => y.e.evento === "contacto_clic")) ct.set(prop(x.e, "tipo") || "otro", (ct.get(prop(x.e, "tipo") || "otro") ?? 0) + 1);

  // Mapa de calor: visitas a la ficha por día de la semana y franja horaria
  const calor = DIAS_SEMANA.map(() => FRANJAS.map(() => 0));
  for (const x of fichas) calor[x.l.dia][franjaDe(x.l.hora)]++;
  const calorMax = Math.max(0, ...calor.flat());

  return {
    dias, desde, hasta, kpis, porDia, busquedas, visitasConCondiciones: conCond.length, busquedasVisibles: visibles,
    contactos: [...ct].map(([tipo, n]) => ({ tipo, n })).sort((a, b) => b.n - a.n),
    calor, calorMax,
    reportes: repActual.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    hayDatos: propios.length > 0,
  };
}

/* ---------------- Datos de ejemplo (rotulados siempre) ---------------- */

function semilla(texto: string) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 100000) / 100000;
}

const BUSQUEDAS_COMUNES = ["ingreso_sin_escalones", "atencion_escrito", "espacio_tranquilo", "bano_accesible", "musica_baja", "carta_facil", "rampa", "ancho_puerta", "lsa", "baja_concurrencia"];

/**
 * Eventos inventados, deterministas por café, para mostrar cómo se ve el panel antes de que haya visitas reales.
 * El panel siempre avisa que son de ejemplo.
 */
export function eventosDemo(lugarId: string, programasIds: string[], ahora: Date, dias = 90): EventoCrudo[] {
  const r = semilla(lugarId);
  const out: EventoCrudo[] = [];
  const hoyISO = localDe(ahora.toISOString())!.fecha;
  const base = 6 + Math.floor(r() * 14);
  for (let i = dias - 1; i >= 0; i--) {
    const f = sumarDias(hoyISO, -i);
    const dow = (new Date(`${f}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = lunes
    const finde = dow >= 4 ? 1.5 : 1;
    const tendencia = 0.7 + 0.6 * ((dias - i) / dias);
    const n = Math.round(base * finde * tendencia * (0.6 + r() * 0.8));
    for (let k = 0; k < n; k++) {
      const hora = [9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21][Math.floor(r() * 12)];
      const t = new Date(`${f}T${String(hora).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}:00-03:00`).toISOString();
      const cantNec = r() < 0.55 ? 1 + Math.floor(r() * 3) : 0;
      const nec = Array.from({ length: cantNec }, () => BUSQUEDAS_COMUNES[Math.floor(Math.pow(r(), 1.6) * BUSQUEDAS_COMUNES.length)]);
      out.push({ evento: "ficha_vista", props: { lugar: lugarId, ...(nec.length ? { valor: [...new Set(nec)].join(",") } : {}) }, t });
      if (r() < 0.32) out.push({ evento: "recorrido_abierto", props: { lugar: lugarId }, t });
      if (r() < 0.1) out.push({ evento: "contacto_clic", props: { lugar: lugarId, tipo: r() < 0.6 ? "telefono" : "correo" }, t });
      if (r() < 0.07) out.push({ evento: "cafe_guardado", props: { lugar: lugarId }, t });
      if (programasIds.length && r() < 0.22) out.push({ evento: "programa_visto", props: { programa: programasIds[Math.floor(r() * programasIds.length)] }, t });
    }
  }
  return out;
}

/** Cuántas visitas reales tiene un café en los últimos `dias` (para decidir si se muestran datos de ejemplo). */
export function visitasReales(eventos: EventoCrudo[], lugarId: string, ahora: Date, dias = 90): number {
  const desde = sumarDias(localDe(ahora.toISOString())!.fecha, -(dias - 1));
  return eventos.filter((e) => e.evento === "ficha_vista" && prop(e, "lugar") === lugarId && e.t && (localDe(e.t)?.fecha ?? "") >= desde).length;
}
