import { analiticaCafe, eventosDemo, visitasReales, type Analitica, type EventoCrudo } from "./analitica";
import { cafesAdmin } from "./cafes-vivos";
import { ES_DEMO, programas, reportesDemo } from "./datos";
import { discrepancias } from "./discrepancia";
import { store } from "./store";
import type { Discrepancia, Lugar, Programa, Reporte } from "./types";

export const PERIODOS = [7, 30, 90] as const;
/** Con menos visitas reales que esto (y datos de demostración activados), el panel muestra datos de ejemplo. */
export const VISITAS_PARA_DEJAR_EL_EJEMPLO = 20;

export interface DatosPanel {
  lugar: Lugar;
  programas: Programa[];
  analitica: Analitica;
  /** los números son de ejemplo (todavía no hay visitas reales suficientes) */
  esEjemplo: boolean;
  discrepancias: Discrepancia[];
}

export async function cargarPanel(cafeId: string, dias: number, ahora = new Date()): Promise<DatosPanel | null> {
  const cafe = (await cafesAdmin()).find((c) => c.lugar.id === cafeId);
  if (!cafe) return null;
  const lugar = cafe.lugar;
  const progs = programas.filter((p) => p.lugarId === lugar.id);
  const [eventos, guardados] = await Promise.all([store().listar("eventos"), store().listar("reportes")]);
  const reportes = [...reportesDemo, ...(guardados as unknown as Reporte[])].filter((r) => r.lugarId === lugar.id);

  const esEjemplo = ES_DEMO && visitasReales(eventos as EventoCrudo[], lugar.id, ahora) < VISITAS_PARA_DEJAR_EL_EJEMPLO;
  const fuente = esEjemplo ? eventosDemo(lugar.id, progs.map((p) => p.id), ahora) : (eventos as EventoCrudo[]);
  return {
    lugar,
    programas: progs,
    analitica: analiticaCafe({ eventos: fuente, reportes, lugar, programas: progs, dias, ahora }),
    esEjemplo,
    discrepancias: discrepancias(lugar, reportes),
  };
}

export const periodoValido = (v: string | undefined): number => {
  const n = Number(v);
  return (PERIODOS as readonly number[]).includes(n) ? n : 30;
};
