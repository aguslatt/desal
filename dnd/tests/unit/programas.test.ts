import { describe, expect, it } from "vitest";
import { condiciones } from "@/lib/catalogo";
import { lugarPorId, lugares, programas } from "@/lib/datos";
import { buscarProgramas, mensajeProgramas, programaComoLugar, TIPOS_PROGRAMA } from "@/lib/programas";
import { estadoDe } from "@/lib/match";

const ids = new Set(condiciones.map((c) => c.id));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

describe("integridad de los programas", () => {
  it("tienen id único, café existente, fecha y horario válidos", () => {
    expect(new Set(programas.map((p) => p.id)).size).toBe(programas.length);
    for (const p of programas) {
      expect(lugarPorId(p.lugarId), p.id).toBeDefined();
      expect(p.fecha, p.id).toMatch(ISO);
      expect(p.desde, p.id).toMatch(HORA);
      expect(p.hasta, p.id).toMatch(HORA);
      expect(TIPOS_PROGRAMA, p.id).toContain(p.tipo);
      expect(["Gratis", "Con consumición"], p.id).toContain(p.precio);
      expect(p.descripcion.length, p.id).toBeGreaterThan(20);
    }
  });
  it("sus condiciones existen en el catálogo y cada dato dice quién y cuándo", () => {
    for (const p of programas) for (const [id, d] of Object.entries(p.datos)) {
      expect(ids.has(id), `${p.id}: condición "${id}"`).toBe(true);
      if (d.estado !== "sin_info") {
        expect(d.fuente?.fecha, `${p.id}.${id}`).toMatch(ISO);
        expect(["equipo", "comercio", "visitantes"], `${p.id}.${id}`).toContain(d.fuente?.tipo);
      }
    }
  });
  it("hay programas de todo tipo (al menos 8 tipos distintos) y varios días del finde", () => {
    expect(new Set(programas.map((p) => p.tipo)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(programas.map((p) => p.fecha)).size).toBeGreaterThanOrEqual(3);
  });
});

describe("programas y condiciones", () => {
  it("las condiciones del programa se suman a las del café y mandan sobre ellas", () => {
    const programa = programas.find((p) => p.id === "latte-art-lsa")!;
    const cafe = lugarPorId(programa.lugarId)!;
    const merged = programaComoLugar(programa, cafe);
    expect(estadoDe(merged, "lsa")).toBe("confirmado");
    expect(merged.datos.ingreso_sin_escalones).toEqual(cafe.datos.ingreso_sin_escalones); // lo físico del café se hereda
    const musica = programas.find((p) => p.id === "musica-vivo-sabado")!;
    expect(estadoDe(programaComoLugar(musica, lugarPorId(musica.lugarId)!), "musica_baja")).toBe("no_disponible");
  });
  it("lo que depende del momento NO se hereda del café (el LSA del café es de jueves y viernes)", () => {
    const cata = programas.find((p) => p.id === "cata-origen")!; // domingo a la tarde, el programa no declara LSA
    const cafe = lugarPorId(cata.lugarId)!;
    expect(estadoDe(cafe, "lsa")).toBe("confirmado");
    expect(estadoDe(programaComoLugar(cata, cafe), "lsa")).toBe("sin_info");
    expect(estadoDe(programaComoLugar(cata, cafe), "espacio_tranquilo")).toBe("sin_info");
  });
  it("lo que no dice ni el programa ni el café es 'sin información'", () => {
    const pan = programas.find((p) => p.id === "pan-en-familia")!;
    expect(estadoDe(programaComoLugar(pan, lugarPorId(pan.lugarId)!), "lsa")).toBe("sin_info");
  });
});

describe("buscar programas", () => {
  const ANTES = new Date("2026-10-28T12:00:00-03:00");
  it("ordena como los cafés: cumplen todo, luego sin información, luego no disponible", () => {
    const { items } = buscarProgramas(programas, lugares, { necesidades: ["lsa", "atencion_escrito"] }, ANTES);
    const grupos = items.map((i) => i.coincidencia.grupo);
    expect(grupos).toEqual([...grupos].sort());
    expect(items[0].programa.id).toMatch(/latte-art-lsa|charla-comercio-justo/);
    expect(items[0].coincidencia.grupo).toBe(0);
  });
  it("solo muestra programas futuros", () => {
    expect(buscarProgramas(programas, lugares, { necesidades: [] }, ANTES).items).toHaveLength(programas.length);
    expect(buscarProgramas(programas, lugares, { necesidades: [] }, new Date("2026-11-01T12:00:00-03:00")).items.every((i) => i.programa.fecha >= "2026-11-01")).toBe(true);
    expect(buscarProgramas(programas, lugares, { necesidades: [] }, new Date("2026-11-02T12:00:00-03:00")).items).toHaveLength(0);
  });
  it("filtra por día y por tipo", () => {
    expect(buscarProgramas(programas, lugares, { necesidades: [], dia: "2026-10-30" }, ANTES).items.every((i) => i.programa.fecha === "2026-10-30")).toBe(true);
    const musica = buscarProgramas(programas, lugares, { necesidades: [], tipo: "Música" }, ANTES).items;
    expect(musica.length).toBe(3);
    expect(musica.every((i) => i.programa.tipo === "Música")).toBe(true);
  });
  it("un programa de un café patrocinado solo aparece si cumple todas las condiciones", () => {
    const brunch = (n: string[]) => buscarProgramas(programas, lugares, { necesidades: n }, ANTES).items.some((i) => i.programa.id === "brunch-adaptado");
    expect(brunch([])).toBe(true);
    expect(brunch(["preparaciones", "alergenos"])).toBe(true);
    expect(brunch(["preparaciones", "lsa"])).toBe(false); // lsa: sin información
  });
  it("se pueden ocultar los programas con algo no disponible", () => {
    const n = ["musica_baja"];
    const todos = buscarProgramas(programas, lugares, { necesidades: n }, ANTES);
    const sin = buscarProgramas(programas, lugares, { necesidades: n, ocultarNoDisponible: true }, ANTES);
    expect(sin.items.every((i) => i.coincidencia.grupo !== 2)).toBe(true);
    expect(sin.items.length + sin.ocultos).toBe(todos.items.length);
  });
  it("redacta el anuncio de resultados", () => {
    const b = buscarProgramas(programas, lugares, { necesidades: ["lsa"] }, ANTES);
    expect(mensajeProgramas(b, true)).toMatch(/cumplen tus condiciones/);
    expect(mensajeProgramas({ items: [], cumplenTodo: 0, conSinInfo: 0 }, true)).toMatch(/Ningún programa/);
    expect(mensajeProgramas({ items: new Array(14), cumplenTodo: 0, conSinInfo: 0 }, false)).toBe("14 programas para elegir");
  });
});
