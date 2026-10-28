import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { preguntasReporte, validarReporte } from "@/lib/reporte";

const L = new Set(["cafe-nube-de-pan"]);
const base = { lugarId: "cafe-nube-de-pan", respuestas: { ingreso_sin_escalones: "no" } };

describe("validarReporte", () => {
  it("las preguntas salen del catálogo e incluyen las del brief", () => {
    const t = preguntasReporte.map((p) => p.texto);
    expect(t).toContain("¿Había escalones en el ingreso?");
    expect(t).toContain("¿La rampa estaba disponible cuando llegaste?");
    expect(t).toContain("¿Pudiste comunicarte por escrito?");
  });
  it("acepta un reporte válido", () => {
    expect(validarReporte({ ...base, horario: "Noche (19 a 23 h)", conFoto: true }, L)).toMatchObject({ ok: true });
  });
  it("rechaza lugares inexistentes y reportes vacíos, con mensaje en texto", () => {
    expect(validarReporte({ ...base, lugarId: "x" }, L)).toEqual({ ok: false, error: "Lugar desconocido." });
    expect(validarReporte({ lugarId: "cafe-nube-de-pan", respuestas: {} }, L)).toMatchObject({ ok: false });
  });
  it("si dice que encontró algo distinto, exige contar qué", () => {
    expect(validarReporte({ ...base, difiere: "si" }, L)).toMatchObject({ ok: false });
    expect(validarReporte({ ...base, difiere: "si", comentario: "Había 2 escalones" }, L)).toMatchObject({ ok: true });
  });
  it("descarta campos desconocidos: no se guarda nada fuera de la lista", () => {
    const v = validarReporte({ ...base, email: "a@b.c", nombre: "Ana", respuestas: { ...base.respuestas, otra: "si", rampa: "raro" } }, L);
    expect(v.ok && JSON.stringify(v.reporte)).not.toMatch(/email|nombre|otra|raro/);
  });
  it("reporte de dato incorrecto: pide condición y descripción", () => {
    expect(validarReporte({ lugarId: "cafe-nube-de-pan", tipo: "dato", corrige: "rampa" }, L)).toMatchObject({ ok: false });
    expect(validarReporte({ lugarId: "cafe-nube-de-pan", tipo: "dato", corrige: "rampa", comentario: "La rampa no está" }, L)).toMatchObject({ ok: true });
  });
  it("recorta comentarios largos", () => {
    const v = validarReporte({ ...base, comentario: "x".repeat(900) }, L);
    expect(v.ok && v.reporte.comentario?.length).toBe(500);
  });
});

describe("store con archivos", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "umbral-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  it("guarda y lista filas", async () => {
    process.env.DATA_DIR = dir;
    const { store } = await import("@/lib/store");
    await store().agregar("reportes", { id: "1" });
    await store().agregar("reportes", { id: "2" });
    expect((await store().listar("reportes")).map((f) => f.id)).toEqual(["1", "2"]);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "reportes.json"), "utf8"))).toHaveLength(2);
  });
});
