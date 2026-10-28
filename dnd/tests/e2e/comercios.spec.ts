import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { tabHasta } from "./helpers";

const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);

const CLAVE = "clave-de-prueba";
const auth = (clave = CLAVE) => ({ Authorization: `Basic ${Buffer.from(`admin:${clave}`).toString("base64")}` });

test("Para cafés: planes, y la información de accesibilidad es gratis", async ({ page }) => {
  await page.goto("/comercios");
  await expect(page.getByRole("heading", { level: 3, name: "Gratuito" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Pro" })).toBeVisible();
  await expect(page.getByRole("main").getByText("La información de accesibilidad es siempre gratuita")).toBeVisible();
  await expect(page.getByText("Gestión de consultas y reservas por texto")).toBeVisible();
});

test("fake door con teclado: el foco queda en el diálogo, los errores se explican y Escape devuelve el foco", async ({ page }) => {
  await page.goto("/comercios");
  const boton = page.getByRole("button", { name: "Quiero el plan Pro" });
  await tabHasta(page, boton);
  await page.keyboard.press("Enter");
  const dialogo = page.getByRole("dialog", { name: "Quiero el plan Pro" });
  await expect(dialogo).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // El foco no escapa del diálogo
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }

  // Errores en texto, asociados al campo
  await dialogo.getByRole("button", { name: "Enviar" }).click();
  await expect(dialogo.getByText("Escribí el nombre del café.")).toBeVisible();
  await expect(dialogo.getByText("Elegí el tipo de café.")).toBeVisible();
  await expect(dialogo.getByLabel("Nombre del café")).toHaveAttribute("aria-invalid", "true");
  await expect(dialogo.getByLabel("Nombre del café")).toHaveAttribute("aria-describedby", "nombre-err");
  expect(await axe(page)).toEqual([]);

  // Escape cierra y devuelve el foco al botón
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(boton).toBeFocused();
});

test("fake door: registra el interés y responde con el mensaje pedido", async ({ page }) => {
  await page.goto("/comercios");
  await page.getByRole("button", { name: "Quiero el plan Pro" }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Nombre del café").fill("Café de Prueba E2E");
  await d.getByLabel("Tipo de café").selectOption("Café de barrio");
  await d.getByLabel("Correo o teléfono").fill("123");
  await d.getByRole("button", { name: "Enviar" }).click();
  await expect(d.getByText(/Escribí un correo/)).toBeVisible();
  await d.getByLabel("Correo o teléfono").fill("prueba@ejemplo.com");
  await d.getByRole("button", { name: "Enviar" }).click();
  await expect(d.getByRole("heading", { name: "Estamos sumando los primeros comercios, te contactamos" })).toBeVisible();
  await expect(d.getByRole("heading")).toBeFocused();
  await page.waitForTimeout(300);
  expect(await axe(page)).toEqual([]);
});

test("panel Pro de ejemplo: datos marcados como ejemplo y gráficos con tabla", async ({ page }) => {
  await page.goto("/comercios/panel");
  await expect(page.getByText("Datos de ejemplo", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Visitas a la ficha por semana" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Contactos recibidos" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Condiciones más buscadas en tu zona" }).getByRole("row")).toHaveCount(7);
});

test("relevamientos: incluye la aclaración y el formulario", async ({ page }) => {
  await page.goto("/relevamientos");
  await expect(page.getByText("Se cobra el trabajo, no un resultado favorable.")).toBeVisible();
  await page.getByRole("button", { name: "Quiero que relevemos mi café" }).click();
  await expect(page.getByRole("dialog", { name: "Quiero un relevamiento" })).toBeVisible();
});

test("/metricas pide contraseña y no deja entrar con una incorrecta", async ({ request }) => {
  expect((await request.get("/metricas")).status()).toBe(401);
  const r = await request.get("/metricas", { headers: auth("mala") });
  expect(r.status()).toBe(401);
  expect(r.headers()["www-authenticate"]).toMatch(/Basic/);
  expect((await request.get("/metricas", { headers: auth() })).status()).toBe(200);
});

test("los eventos se registran sin datos personales y aparecen en /metricas", async ({ page, request, browser }) => {
  await page.goto("/necesidades");
  await page.getByRole("checkbox", { name: "Ingreso sin escalones", exact: true }).check();
  await page.getByRole("button", { name: "Ver cafés para mí" }).click();
  await page.getByRole("link", { name: /Ver ficha/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1000);

  // Lo guardado: solo nombre del evento, propiedades permitidas y hora. Nada que identifique a alguien.
  const guardados = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), "umbral-e2e", "eventos.json"), "utf8")) as { evento: string; props: Record<string, unknown>; t: string }[];
  const nombres = guardados.map((e) => e.evento);
  expect(nombres).toContain("onboarding_completado");
  expect(nombres).toContain("ficha_vista");
  for (const e of guardados) {
    expect(Object.keys(e).sort()).toEqual(["evento", "props", "t"]);
    expect(Object.keys(e.props).every((k) => ["filtro", "valor", "cantidad", "lugar", "tipo", "interes", "plan"].includes(k))).toBe(true);
  }

  const ctx = await browser.newContext({ httpCredentials: { username: "admin", password: CLAVE } });
  const m = await ctx.newPage();
  await m.goto("/metricas");
  await expect(m.getByRole("heading", { level: 1, name: "Métricas" })).toBeVisible();
  await expect(m.getByText("Completaron “Mis necesidades”")).toBeVisible();
  await expect(m.getByRole("row", { name: /Ingreso sin escalones/ })).toBeVisible();
  expect(await axe(m)).toEqual([]);
  await ctx.close();
  void request;
});
