import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { condiciones, ESTILOS } from "@/lib/catalogo";
import { barrios, ES_DEMO, lugares, reportesDemo } from "@/lib/datos";
import { discrepancias } from "@/lib/discrepancia";
import { fotosCreditos } from "@/lib/fotos";

/**
 * Integridad: estos tests valen para CUALQUIER conjunto de datos (también los relevamientos reales).
 * Corrélos con `npm run validar-datos` después de reemplazar src/data/lugares.json.
 */
describe("integridad de los datos", () => {
  const ids = new Set(condiciones.map((c) => c.id));
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  it("los lugares tienen id único (slug) y campos obligatorios", () => {
    expect(new Set(lugares.map((l) => l.id)).size).toBe(lugares.length);
    for (const l of lugares) {
      expect(l.id, l.nombre).toMatch(/^[a-z0-9-]+$/);
      for (const k of ["nombre", "rubro", "estilo", "barrio", "direccion", "descripcion", "horarios"] as const) expect(l[k], `${l.id}.${k}`).toBeTruthy();
      expect(["cafe"], l.id).toContain(l.rubro);
      expect(ESTILOS, l.id).toContain(l.estilo);
      expect(typeof l.patrocinado).toBe("boolean");
    }
  });
  it("las coordenadas caen dentro de CABA", () => {
    for (const l of lugares) {
      expect(l.lat, l.id).toBeGreaterThan(-34.71);
      expect(l.lat, l.id).toBeLessThan(-34.52);
      expect(l.lng, l.id).toBeGreaterThan(-58.54);
      expect(l.lng, l.id).toBeLessThan(-58.33);
    }
  });
  it("solo usan condiciones del catálogo y cada dato dice quién y cuándo", () => {
    for (const l of lugares) {
      for (const [id, d] of Object.entries(l.datos)) {
        expect(ids.has(id), `${l.id}: condición desconocida "${id}"`).toBe(true);
        expect(["confirmado", "no_disponible", "sin_info"], `${l.id}.${id}`).toContain(d.estado);
        if (d.estado !== "sin_info") {
          expect(d.fuente?.fecha, `${l.id}.${id} sin fecha`).toMatch(ISO);
          expect(["equipo", "comercio", "visitantes"], `${l.id}.${id}`).toContain(d.fuente?.tipo);
        }
        if (d.fuente?.tipo === "visitantes") expect(d.fuente.cantidad, `${l.id}.${id}`).toBeGreaterThan(0);
      }
    }
  });
  it("las condiciones con mínimo (ancho de puerta) confirmadas traen un valor numérico", () => {
    for (const l of lugares) for (const c of condiciones.filter((x) => x.minimo !== undefined)) {
      const d = l.datos[c.id];
      if (d?.estado === "confirmado") expect(Number.isFinite(Number(d.valor)), `${l.id}.${c.id}`).toBe(true);
    }
  });
  it("momentos y recorrido tienen el formato esperado", () => {
    for (const l of lugares) {
      for (const m of l.momentos) { expect([1, 2, 3]).toContain(m.ruido); expect([1, 2, 3]).toContain(m.concurrencia); expect(m.franja).toBeTruthy(); }
      for (const p of l.recorrido) { expect(p.alt, `${l.id} recorrido`).toBeTruthy(); expect(p.descripcion).toBeTruthy(); }
      for (const f of l.fotos) expect(f.alt, `${l.id} foto sin texto alternativo`).toBeTruthy();
    }
  });
  it("las fotos reales existen en public/, tienen texto alternativo y, si requieren atribución, su crédito", () => {
    const publico = path.join(import.meta.dirname, "../../public");
    const creditos = new Set(fotosCreditos.map((f) => f.id));
    for (const l of lugares) for (const f of l.fotos) {
      if (!f.src) continue;
      expect(fs.existsSync(path.join(publico, f.src)), `${l.id}: falta ${f.src}`).toBe(true);
      for (const parte of (f.srcSet ?? "").split(",").map((x) => x.trim().split(" ")[0]).filter(Boolean)) {
        expect(fs.existsSync(path.join(publico, parte)), `${l.id}: falta ${parte}`).toBe(true);
      }
      if (f.credito) expect(creditos.has(f.credito), `${l.id}: crédito ${f.credito} no está en fotos.json`).toBe(true);
      expect(f.alt.length, `${l.id}: alt muy corto`).toBeGreaterThan(15);
    }
  });
  it("cada foto con licencia libre trae autor, licencia y enlace al original", () => {
    for (const f of fotosCreditos) {
      expect(f.licencia, f.id).toMatch(/CC|Public|PD/i);
      expect(f.pagina, f.id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(f.autor.length, `${f.id}: sin autor`).toBeGreaterThan(1);
    }
  });
  it("los reportes apuntan a lugares existentes", () => {
    const l = new Set(lugares.map((x) => x.id));
    for (const r of reportesDemo) expect(l.has(r.lugarId), r.id).toBe(true);
  });
  it("ningún lugar patrocinado se cuela sin etiqueta: el campo es booleano y no hay más de uno por defecto", () => {
    expect(lugares.filter((x) => x.patrocinado).length).toBeLessThanOrEqual(3);
  });
});

describe.runIf(ES_DEMO)("datos de demostración", () => {
  it("son 15 cafés variados: completos, casi vacíos, un patrocinado y varios barrios", () => {
    expect(lugares).toHaveLength(15);
    const n = lugares.map((l) => Object.keys(l.datos).length);
    expect(Math.max(...n)).toBeGreaterThan(25);
    expect(Math.min(...n)).toBeLessThan(5);
    expect(lugares.filter((l) => l.patrocinado)).toHaveLength(1);
    expect(barrios.length).toBeGreaterThanOrEqual(12);
  });
  it("hay una discrepancia entre lo publicado y los reportes, solo en el Café El Retoño Gris", () => {
    expect(lugares.filter((l) => discrepancias(l, reportesDemo).length > 0).map((l) => l.id)).toEqual(["cafe-el-retono-gris"]);
  });
  it("el recorrido de demo (3 condiciones) tiene lugares que cumplen todo", () => {
    expect(lugares.filter((l) => ["ingreso_sin_escalones", "atencion_escrito", "espacio_tranquilo"].every((c) => l.datos[c]?.estado === "confirmado")).length).toBeGreaterThanOrEqual(3);
  });
});
