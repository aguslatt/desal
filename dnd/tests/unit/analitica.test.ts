import { describe, expect, it } from "vitest";
import { analiticaCafe, eventosDemo, franjaDe, localDe, MINIMO_BUSQUEDAS, sumarDias, visitasReales, type EventoCrudo } from "@/lib/analitica";
import { lugares, programas } from "@/lib/datos";
import type { Reporte } from "@/lib/types";

const AHORA = new Date("2026-11-13T15:00:00Z"); // 12:00 en Buenos Aires
const cafe = lugares.find((l) => l.id === "cafe-nube-de-pan")!;
const progs = programas.filter((p) => p.lugarId === cafe.id);
const ev = (evento: string, t: string, props: Record<string, unknown> = {}): EventoCrudo => ({ evento, t, props: { lugar: cafe.id, ...props } });
const calc = (eventos: EventoCrudo[], dias = 7, reportes: Reporte[] = []) => analiticaCafe({ eventos, reportes, lugar: cafe, programas: progs, dias, ahora: AHORA });

describe("fechas locales de Buenos Aires", () => {
  it("convierte de UTC al huso -03 (un evento de madrugada UTC cae en el día anterior)", () => {
    expect(localDe("2026-11-13T02:30:00Z")).toMatchObject({ fecha: "2026-11-12", hora: 23 });
    expect(localDe("2026-11-13T15:00:00Z")).toMatchObject({ fecha: "2026-11-13", hora: 12 });
    expect(localDe("basura")).toBeNull();
  });
  it("el día de la semana empieza en lunes", () => {
    expect(localDe("2026-11-13T15:00:00Z")!.dia).toBe(4); // viernes
    expect(localDe("2026-11-15T15:00:00Z")!.dia).toBe(6); // domingo
  });
  it("reparte las horas en franjas", () => {
    expect([2, 6, 11, 12, 14, 15, 18, 19, 23].map(franjaDe)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it("suma días entre meses", () => {
    expect(sumarDias("2026-11-01", -1)).toBe("2026-10-31");
    expect(sumarDias("2026-12-30", 3)).toBe("2027-01-02");
  });
});

describe("analítica de un café", () => {
  it("cuenta solo los eventos de ese café y de sus programas", () => {
    const a = calc([
      ev("ficha_vista", "2026-11-12T15:00:00Z"),
      ev("ficha_vista", "2026-11-12T16:00:00Z", { lugar: "otro-cafe" }),
      { evento: "programa_visto", t: "2026-11-12T16:00:00Z", props: { programa: progs[0]?.id ?? "x" } },
      { evento: "programa_visto", t: "2026-11-12T16:00:00Z", props: { programa: "de-otro-cafe" } },
    ]);
    expect(a.kpis.find((k) => k.clave === "fichas")!.actual).toBe(1);
    expect(a.kpis.find((k) => k.clave === "programas")!.actual).toBe(progs.length ? 1 : 0);
  });
  it("compara con el período anterior de la misma duración", () => {
    const a = calc([
      ...Array.from({ length: 6 }, () => ev("ficha_vista", "2026-11-12T15:00:00Z")), // últimos 7 días
      ...Array.from({ length: 4 }, () => ev("ficha_vista", "2026-11-03T15:00:00Z")), // 7 días anteriores
    ]);
    const k = a.kpis.find((x) => x.clave === "fichas")!;
    expect(k).toMatchObject({ actual: 6, anterior: 4, variacion: 50 });
  });
  it("sin datos del período anterior no inventa una variación", () => {
    const a = calc([ev("ficha_vista", "2026-11-12T15:00:00Z")]);
    expect(a.kpis.find((x) => x.clave === "fichas")!.variacion).toBeNull();
  });
  it("arma la serie por día con todos los días del período, aunque no haya visitas", () => {
    const a = calc([ev("ficha_vista", "2026-11-11T15:00:00Z"), ev("ficha_vista", "2026-11-11T18:00:00Z")], 7);
    expect(a.porDia).toHaveLength(7);
    expect(a.porDia[0].fecha).toBe("2026-11-07");
    expect(a.porDia.at(-1)!.fecha).toBe("2026-11-13");
    expect(a.porDia.find((d) => d.fecha === "2026-11-11")!.fichas).toBe(2);
    expect(a.porDia.filter((d) => d.fichas === 0)).toHaveLength(6);
  });
  it("ignora lo que queda fuera del período", () => {
    const a = calc([ev("ficha_vista", "2026-10-01T15:00:00Z")], 7);
    expect(a.kpis.find((k) => k.clave === "fichas")!.actual).toBe(0);
  });
  it("el mapa de calor cuenta por día de la semana y franja horaria", () => {
    const a = calc([
      ev("ficha_vista", "2026-11-13T15:00:00Z"), // viernes 12 h → mediodía
      ev("ficha_vista", "2026-11-13T15:30:00Z"),
      ev("ficha_vista", "2026-11-13T23:00:00Z"), // viernes 20 h → noche
    ]);
    expect(a.calor[4][2]).toBe(2);
    expect(a.calor[4][4]).toBe(1);
    expect(a.calorMax).toBe(2);
  });
  it("cuenta contactos por tipo", () => {
    const a = calc([ev("contacto_clic", "2026-11-12T15:00:00Z", { tipo: "telefono" }), ev("contacto_clic", "2026-11-12T15:00:00Z", { tipo: "telefono" }), ev("contacto_clic", "2026-11-12T15:00:00Z", { tipo: "correo" })]);
    expect(a.contactos).toEqual([{ tipo: "telefono", n: 2 }, { tipo: "correo", n: 1 }]);
  });
  it("cuenta los reportes del período y los del anterior", () => {
    const r = (id: string, fecha: string, lugarId = cafe.id): Reporte => ({ id, lugarId, fecha, respuestas: {} });
    const a = calc([], 7, [r("1", "2026-11-12"), r("2", "2026-11-10"), r("3", "2026-11-02"), r("4", "2026-11-12", "otro")]);
    expect(a.kpis.find((k) => k.clave === "reportes")).toMatchObject({ actual: 2, anterior: 1 });
    expect(a.reportes.map((x) => x.id)).toEqual(["1", "2"]);
  });
});

describe("qué buscan las personas (anónimo)", () => {
  const visita = (valor: string) => ev("ficha_vista", "2026-11-12T15:00:00Z", { valor });
  it("no muestra nada con pocas visitas, para cuidar el anonimato", () => {
    const a = calc(Array.from({ length: MINIMO_BUSQUEDAS - 1 }, () => visita("ascensor")));
    expect(a.busquedasVisibles).toBe(false);
    expect(a.busquedas).toEqual([]);
    expect(a.visitasConCondiciones).toBe(MINIMO_BUSQUEDAS - 1);
  });
  it("con suficientes visitas muestra las condiciones, ordenadas, con el estado que tiene el café", () => {
    const a = calc([...Array.from({ length: 4 }, () => visita("ingreso_sin_escalones,ascensor")), ...Array.from({ length: 2 }, () => visita("ascensor"))]);
    expect(a.busquedasVisibles).toBe(true);
    expect(a.busquedas[0]).toMatchObject({ id: "ascensor", n: 6, estado: "sin_info" });
    expect(a.busquedas[1]).toMatchObject({ id: "ingreso_sin_escalones", n: 4, estado: "confirmado" });
  });
  it("una misma visita no cuenta dos veces la misma condición", () => {
    const a = calc(Array.from({ length: 5 }, () => visita("rampa,rampa,rampa")));
    expect(a.busquedas.find((b) => b.id === "rampa")!.n).toBe(5);
  });
});

describe("datos de ejemplo", () => {
  it("son deterministas por café y distintos entre cafés", () => {
    const a = eventosDemo("cafe-nube-de-pan", [], AHORA);
    expect(eventosDemo("cafe-nube-de-pan", [], AHORA)).toEqual(a);
    expect(eventosDemo("cafe-rincon-quieto", [], AHORA)).not.toEqual(a);
  });
  it("alimentan todos los gráficos del panel", () => {
    const a = calc(eventosDemo(cafe.id, progs.map((p) => p.id), AHORA), 30);
    expect(a.kpis.find((k) => k.clave === "fichas")!.actual).toBeGreaterThan(50);
    expect(a.busquedasVisibles).toBe(true);
    expect(a.calorMax).toBeGreaterThan(0);
    expect(a.porDia.some((d) => d.fichas > 0)).toBe(true);
  });
  it("no mezclan eventos de otros cafés", () => {
    expect(eventosDemo("x", [], AHORA).every((e) => e.props?.lugar === "x" || e.evento === "programa_visto")).toBe(true);
  });
  it("las visitas reales se cuentan aparte (para decidir cuándo dejar de mostrar el ejemplo)", () => {
    expect(visitasReales([ev("ficha_vista", "2026-11-12T15:00:00Z"), ev("ficha_vista", "2026-01-01T15:00:00Z")], cafe.id, AHORA)).toBe(1);
  });
});
