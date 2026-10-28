import { describe, expect, it } from "vitest";
import { autorizado } from "@/lib/auth";
import { validarEvento, validarLead } from "@/lib/entrada";
import { resumir } from "@/lib/metricas";

const b64 = (s: string) => `Basic ${btoa(s)}`;

describe("validarLead", () => {
  const ok = { nombre: "Café Ejemplo", rubro: "Café", contacto: "hola@ejemplo.com" };
  it("acepta correo o teléfono", () => {
    expect(validarLead(ok)).toMatchObject({ ok: true });
    expect(validarLead({ ...ok, contacto: "+54 11 5555-0123" })).toMatchObject({ ok: true });
  });
  it("explica cada error en texto y dice qué campo es", () => {
    expect(validarLead({ ...ok, nombre: "" })).toMatchObject({ ok: false, campo: "nombre", error: "Escribí el nombre del local." });
    expect(validarLead({ ...ok, rubro: "Ferretería" })).toMatchObject({ ok: false, campo: "rubro" });
    expect(validarLead({ ...ok, contacto: "123" })).toMatchObject({ ok: false, campo: "contacto" });
  });
  it("guarda solo los campos permitidos", () => {
    const v = validarLead({ ...ok, interes: "relevamiento", dni: "123", ip: "1.2.3.4" });
    expect(v.ok && Object.keys(v.lead).sort()).toEqual(["contacto", "interes", "nombre", "rubro"]);
    expect(v.ok && v.lead.interes).toBe("relevamiento");
  });
});

describe("validarEvento", () => {
  const L = new Set(["cafe-nube-de-pan"]);
  it("acepta eventos conocidos y descarta propiedades no permitidas", () => {
    const e = validarEvento({ evento: "ficha_vista", props: { lugar: "cafe-nube-de-pan", email: "a@b.c", userId: "42" } }, L);
    expect(e?.props).toEqual({ lugar: "cafe-nube-de-pan" });
  });
  it("rechaza eventos desconocidos y lugares inventados", () => {
    expect(validarEvento({ evento: "otro" }, L)).toBeNull();
    expect(validarEvento({ evento: "ficha_vista", props: { lugar: "x" } }, L)?.props).toEqual({});
  });
  it("no guarda nada que identifique a alguien", () => {
    const e = validarEvento({ evento: "filtro_usado", props: { filtro: "rubro", valor: "cine", ip: "1.1.1.1" } }, L);
    expect(JSON.stringify(e)).not.toMatch(/ip|1\.1\.1\.1|agent/);
  });
});

describe("contraseña de /metricas", () => {
  it("acepta solo la contraseña correcta, con cualquier usuario", () => {
    expect(autorizado(b64("cualquiera:secreta"), "secreta")).toBe(true);
    expect(autorizado(b64(":secreta"), "secreta")).toBe(true);
    expect(autorizado(b64("x:otra"), "secreta")).toBe(false);
    expect(autorizado(b64("x:secret"), "secreta")).toBe(false);
  });
  it("sin contraseña configurada o sin encabezado, nadie entra", () => {
    expect(autorizado(b64("x:"), "")).toBe(false);
    expect(autorizado(b64("x:y"), undefined)).toBe(false);
    expect(autorizado(null, "secreta")).toBe(false);
    expect(autorizado("Basic ???", "secreta")).toBe(false);
  });
  it("la contraseña puede tener dos puntos", () => {
    expect(autorizado(b64("u:a:b"), "a:b")).toBe(true);
  });
});

describe("resumir métricas", () => {
  const ev = (evento: string, props: Record<string, unknown> = {}) => ({ evento, props });
  const r = resumir(
    [
      ev("onboarding_completado"), ev("onboarding_completado"), ev("onboarding_completado"), ev("onboarding_salteado"),
      ev("filtro_usado", { filtro: "condiciones", valor: "rampa,ascensor" }), ev("filtro_usado", { filtro: "condiciones", valor: "rampa" }),
      ev("filtro_usado", { filtro: "rubro", valor: "cine" }), ev("filtro_usado", { filtro: "rubro", valor: "todos" }),
      ev("ficha_vista", { lugar: "a" }), ev("ficha_vista", { lugar: "a" }), ev("ficha_vista", { lugar: "b" }),
      ev("recorrido_abierto"), ev("reporte_enviado"), ev("pro_clic"), ev("pro_clic"), ev("lead_comercio_enviado"),
    ],
    [{ id: "1" }],
    [{ id: "r" }, { id: "s" }],
  );
  it("cuenta cada evento", () => {
    expect(r.onboarding).toEqual({ completado: 3, salteado: 1, tasa: 75 });
    expect(r.fichas.total).toBe(3);
    expect(r.fichas.porLugar[0]).toEqual({ clave: "a", n: 2 });
    expect(r.recorridos).toBe(1);
    expect(r.reportes).toEqual({ eventos: 1, guardados: 2 });
    expect(r.comercios).toEqual({ proClics: 2, formularios: 1, leadsGuardados: 1 });
  });
  it("separa qué filtros y qué condiciones se usaron", () => {
    expect(r.filtros.total).toBe(4);
    expect(r.filtros.condiciones).toEqual([{ clave: "rampa", n: 2 }, { clave: "ascensor", n: 1 }]);
    expect(r.filtros.rubros).toEqual([{ clave: "cine", n: 1 }]);
  });
  it("sin datos no inventa nada", () => {
    expect(resumir([], [], []).onboarding.tasa).toBeNull();
  });
});
