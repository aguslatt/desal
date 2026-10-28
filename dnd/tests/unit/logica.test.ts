import { describe, expect, it } from "vitest";
import { condiciones } from "@/lib/catalogo";
import { barrios, lugares, reportesDemo, lugarPorId } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { diasEntre } from "@/lib/fecha";
import { buscar, coincidencia, estadoDe, mensajeResultado, textoCoincidencia } from "@/lib/match";

const TRES = ["ingreso_sin_escalones", "atencion_escrito", "espacio_tranquilo"];

describe("datos de demostración", () => {
  it("tienen 15 lugares con ids únicos", () => {
    expect(lugares).toHaveLength(15);
    expect(new Set(lugares.map((l) => l.id)).size).toBe(15);
  });
  it("solo usan condiciones del catálogo y fuentes con fecha", () => {
    const ids = new Set(condiciones.map((c) => c.id));
    for (const l of lugares) {
      for (const [id, d] of Object.entries(l.datos)) {
        expect(ids.has(id), `${l.id}: ${id}`).toBe(true);
        if (d.estado !== "sin_info") {
          expect(d.fuente?.fecha, `${l.id}: ${id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
        if (d.fuente?.tipo === "visitantes") expect(d.fuente.cantidad).toBeGreaterThan(0);
      }
    }
  });
  it("hay variedad: completos, casi vacíos, un patrocinado y varios barrios", () => {
    const n = lugares.map((l) => Object.keys(l.datos).length);
    expect(Math.max(...n)).toBeGreaterThan(25);
    expect(Math.min(...n)).toBeLessThan(5);
    expect(lugares.filter((l) => l.patrocinado)).toHaveLength(1);
    expect(barrios.length).toBeGreaterThanOrEqual(12);
  });
  it("tienen al menos una discrepancia, y solo en el bodegón", () => {
    const con = lugares.filter((l) => discrepancias(l, reportesDemo).length > 0);
    expect(con.map((l) => l.id)).toEqual(["bodegon-el-retono-gris"]);
  });
});

describe("estado y coincidencia", () => {
  it("lo que no está cargado es 'sin_info', nunca 'confirmado'", () => {
    const l = lugarPorId("pizzeria-horno-barrio-alto")!;
    expect(estadoDe(l, "ingreso_sin_escalones")).toBe("sin_info");
    expect(coincidencia(l, TRES).cumple).toBe(0);
  });
  it("una puerta angosta no cuenta como cumplida", () => {
    const base = lugarPorId("cafe-nube-de-pan")!;
    const angosta = { ...base, datos: { ...base.datos, ancho_puerta: { ...base.datos.ancho_puerta, valor: 70 } } };
    expect(estadoDe(base, "ancho_puerta")).toBe("confirmado");
    expect(estadoDe(angosta, "ancho_puerta")).toBe("no_disponible");
  });
  it("arma el texto 'Cumple N de M · K sin información'", () => {
    const c = coincidencia(lugarPorId("bar-tinta-y-soda")!, [...TRES, "ascensor"]);
    expect(textoCoincidencia(c)).toBe("Cumple 3 de 4 · 1 sin información");
  });
});

describe("búsqueda y orden", () => {
  it("ordena: cumplen todo, luego sin información, luego no disponible", () => {
    const { items } = buscar(lugares, { necesidades: TRES });
    const grupos = items.map((i) => i.coincidencia.grupo);
    expect(grupos).toEqual([...grupos].sort());
    expect(grupos[0]).toBe(0);
    expect(grupos.at(-1)).toBe(2);
  });
  it("los que tienen 'No disponible' se pueden ocultar", () => {
    const todos = buscar(lugares, { necesidades: TRES });
    const sin = buscar(lugares, { necesidades: TRES, ocultarNoDisponible: true });
    expect(sin.items.every((i) => i.coincidencia.grupo !== 2)).toBe(true);
    expect(sin.items.length + sin.ocultos).toBe(todos.items.length);
  });
  it("el patrocinado solo aparece si cumple todas las condiciones elegidas", () => {
    const aparece = (necesidades: string[]) =>
      buscar(lugares, { necesidades }).items.some((i) => i.lugar.patrocinado);
    expect(aparece(TRES)).toBe(true);
    expect(aparece([...TRES, "ascensor"])).toBe(false); // sin información: no entra
    expect(aparece([...TRES, "mesas_altura"])).toBe(false); // no disponible: no entra
    expect(aparece([])).toBe(true); // sin filtros, no hay nada que incumplir
  });
  it("el patrocinio no mejora la posición", () => {
    const { items } = buscar(lugares, { necesidades: TRES });
    const i = items.findIndex((x) => x.lugar.patrocinado);
    const antes = items.slice(0, i);
    expect(antes.every((x) => x.coincidencia.cumple >= items[i].coincidencia.cumple)).toBe(true);
  });
  it("filtra por rubro y barrio", () => {
    const { items } = buscar(lugares, { necesidades: [], rubro: "cine", barrio: "Belgrano" });
    expect(items.map((i) => i.lugar.id)).toEqual(["cine-club-lupa-norte"]);
  });
  it("el recorrido de demo tiene resultados que cumplen 3 de 3", () => {
    const { cumplenTodo } = buscar(lugares, { necesidades: TRES });
    expect(cumplenTodo).toBeGreaterThanOrEqual(3);
  });
  it("redacta el anuncio para lectores de pantalla", () => {
    const b = buscar(lugares, { necesidades: TRES });
    expect(mensajeResultado(b, true)).toMatch(/cumplen tus condiciones/);
    expect(mensajeResultado({ ...b, items: [] }, true)).toMatch(/Ningún lugar/);
  });
});

describe("discrepancias", () => {
  const bodegon = lugarPorId("bodegon-el-retono-gris")!;
  it("detecta reportes recientes que contradicen lo publicado", () => {
    const d = discrepancias(bodegon, reportesDemo);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ condicionId: "ingreso_sin_escalones", reportes: 3 });
  });
  it("ignora reportes viejos", () => {
    const tarde = new Date("2027-03-01T12:00:00-03:00");
    expect(diasEntre("2026-10-03", tarde)).toBeGreaterThan(60);
    expect(discrepancias(bodegon, reportesDemo, tarde)).toHaveLength(0);
  });
  it("un solo reporte no alcanza", () => {
    expect(discrepancias(lugarPorId("mesa-larga-del-oeste")!, reportesDemo)).toHaveLength(0);
  });
});
