import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { claveProvisoria, hashClave, problemaClave, verificarClave } from "@/lib/claves";
import { COOKIE, crearToken, DURACION_MS, leerToken } from "@/lib/sesion";

const SECRETO = "un-secreto-de-prueba-bien-largo-123";

describe("claves", () => {
  it("el hash no contiene la clave y verifica solo la correcta", async () => {
    const h = await hashClave("Clave-Segura-1");
    expect(h).not.toContain("Clave-Segura-1");
    expect(await verificarClave("Clave-Segura-1", h)).toBe(true);
    expect(await verificarClave("clave-segura-1", h)).toBe(false);
    expect(await verificarClave("", h)).toBe(false);
    expect(await verificarClave("x", "basura")).toBe(false);
  });
  it("la misma clave da hashes distintos (sal propia)", async () => {
    expect(await hashClave("Igual12345")).not.toBe(await hashClave("Igual12345"));
  });
  it("las claves provisorias son largas, distintas y sin caracteres confusos", () => {
    const a = claveProvisoria();
    expect(a).toHaveLength(14);
    expect(a).not.toMatch(/[0OIl1]/);
    expect(claveProvisoria()).not.toBe(a);
  });
  it("exige claves de al menos 10 caracteres con letras y números", () => {
    expect(problemaClave("corta1")).toMatch(/al menos 10/);
    expect(problemaClave("sololetrasaqui")).toMatch(/letras y números/);
    expect(problemaClave("12345678901")).toMatch(/letras y números/);
    expect(problemaClave("Buena-clave-123")).toBeNull();
  });
});

describe("sesión firmada", () => {
  it("crea y lee una sesión válida", () => {
    const t = crearToken({ u: "ana@ejemplo.com", rol: "cafe", cafeId: "cafe-nube-de-pan" }, SECRETO)!;
    expect(leerToken(t, SECRETO)).toMatchObject({ u: "ana@ejemplo.com", rol: "cafe", cafeId: "cafe-nube-de-pan" });
    expect(COOKIE).toBe("umbral_sesion");
  });
  it("rechaza tokens alterados, de otro secreto o vencidos", () => {
    const ahora = Date.now();
    const t = crearToken({ u: "x@x.co", rol: "cafe", cafeId: "a" }, SECRETO, ahora)!;
    const [cuerpo, firma] = t.split(".");
    const otro = Buffer.from(JSON.stringify({ u: "x@x.co", rol: "admin", exp: ahora + 1e9 })).toString("base64url");
    expect(leerToken(`${otro}.${firma}`, SECRETO)).toBeNull(); // subir de perfil a mano
    expect(leerToken(`${cuerpo}.${firma}x`, SECRETO)).toBeNull();
    expect(leerToken(t, "otro-secreto-distinto-123456")).toBeNull();
    expect(leerToken(t, SECRETO, ahora + DURACION_MS + 1)).toBeNull();
    expect(leerToken(undefined, SECRETO)).toBeNull();
    expect(leerToken("basura", SECRETO)).toBeNull();
  });
  it("sin SESSION_SECRET (o muy corto) no hay sesión", () => {
    expect(crearToken({ u: "a@a.co", rol: "admin" }, undefined)).toBeNull();
    expect(crearToken({ u: "a@a.co", rol: "admin" }, "corto")).toBeNull();
    expect(leerToken("a.b", undefined)).toBeNull();
  });
  it("un perfil de café sin café asignado no es válido", () => {
    const cuerpo = Buffer.from(JSON.stringify({ u: "a@a.co", rol: "cafe", exp: Date.now() + 1e6 })).toString("base64url");
    const { createHmac } = require("node:crypto");
    const firma = createHmac("sha256", SECRETO).update(cuerpo).digest("base64url");
    expect(leerToken(`${cuerpo}.${firma}`, SECRETO)).toBeNull();
  });
});

describe("cuentas y perfiles", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "umbral-cuentas-"));
  let m: typeof import("@/lib/cuentas");
  beforeAll(async () => {
    process.env.DATA_DIR = dir;
    process.env.ADMIN_EMAIL = "Admin@Umbral.test";
    process.env.ADMIN_PASSWORD = "clave-admin-de-prueba-9";
    m = await import("@/lib/cuentas");
  });
  beforeEach(() => m.reiniciarIntentos());
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("la admin principal entra con las variables de entorno (correo sin distinguir mayúsculas)", async () => {
    const r = await m.autenticar("admin@umbral.test", "clave-admin-de-prueba-9");
    expect(r).toMatchObject({ ok: true, sesion: { rol: "admin" } });
    expect(await m.autenticar("admin@umbral.test", "mala")).toEqual({ ok: false, motivo: "datos" });
  });
  it("crea la cuenta de un café con clave provisoria que se muestra una vez y nunca se guarda", async () => {
    const c = await m.crearCuenta("Dueña@Cafe.test", "cafe-nube-de-pan");
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    const guardado = fs.readFileSync(path.join(dir, "cuentas.json"), "utf8");
    expect(guardado).not.toContain(c.clave);
    expect(guardado).toContain("dueña@cafe.test"); // el correo se guarda en minúsculas
    const r = await m.autenticar("dueña@cafe.test", c.clave);
    expect(r).toMatchObject({ ok: true, debeCambiar: true, sesion: { rol: "cafe", cafeId: "cafe-nube-de-pan" } });
  });
  it("no permite duplicar correos, ni dos cuentas para el mismo café, ni usar el correo de la admin", async () => {
    expect(await m.crearCuenta("dueña@cafe.test", "otro-cafe")).toEqual({ ok: false, error: "duplicada" });
    expect(await m.crearCuenta("otra@cafe.test", "cafe-nube-de-pan")).toEqual({ ok: false, error: "cafe_con_cuenta" });
    expect(await m.crearCuenta("admin@umbral.test", "x")).toEqual({ ok: false, error: "duplicada" });
    expect(await m.crearCuenta("no-es-un-correo", "x")).toEqual({ ok: false, error: "email" });
  });
  it("una cuenta suspendida no puede entrar y reactivarla lo permite", async () => {
    const c = await m.crearCuenta("susp@cafe.test", "cafe-rincon-quieto");
    if (!c.ok) throw new Error("no creó");
    await m.suspender("susp@cafe.test");
    expect(await m.autenticar("susp@cafe.test", c.clave)).toEqual({ ok: false, motivo: "suspendida" });
    await m.reactivar("susp@cafe.test");
    expect(await m.autenticar("susp@cafe.test", c.clave)).toMatchObject({ ok: true });
  });
  it("tras 5 intentos fallidos bloquea el correo, incluso con la clave correcta", async () => {
    for (let i = 0; i < 5; i++) await m.autenticar("admin@umbral.test", "mala");
    expect(await m.autenticar("admin@umbral.test", "clave-admin-de-prueba-9")).toEqual({ ok: false, motivo: "bloqueado" });
  });
  it("cambiar la clave: pide la actual, valida la nueva y deja de exigir el cambio", async () => {
    const c = await m.crearCuenta("cambio@cafe.test", "cafe-faro-chico");
    if (!c.ok) throw new Error("no creó");
    expect(await m.cambiarClave("cambio@cafe.test", "incorrecta", "Nueva-clave-123")).toEqual({ ok: false, error: "La clave actual no es correcta." });
    expect(await m.cambiarClave("cambio@cafe.test", c.clave, "corta")).toMatchObject({ ok: false });
    expect(await m.cambiarClave("cambio@cafe.test", c.clave, c.clave)).toMatchObject({ ok: false });
    expect(await m.cambiarClave("cambio@cafe.test", c.clave, "Nueva-clave-123")).toEqual({ ok: true });
    expect(await m.autenticar("cambio@cafe.test", c.clave)).toEqual({ ok: false, motivo: "datos" });
    expect(await m.autenticar("cambio@cafe.test", "Nueva-clave-123")).toMatchObject({ ok: true, debeCambiar: false });
  });
  it("reiniciar la clave genera una nueva provisoria", async () => {
    const nueva = await m.reiniciarClave("cambio@cafe.test");
    expect(nueva).toHaveLength(14);
    expect(await m.autenticar("cambio@cafe.test", nueva!)).toMatchObject({ ok: true, debeCambiar: true });
    expect(await m.reiniciarClave("nadie@cafe.test")).toBeNull();
  });
  it("eliminar la cuenta quita el acceso", async () => {
    await m.eliminarCuenta("susp@cafe.test");
    expect((await m.autenticar("susp@cafe.test", "lo-que-sea-123")).ok).toBe(false);
  });
});
