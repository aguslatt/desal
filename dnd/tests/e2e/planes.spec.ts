import { expect, test } from "@playwright/test";
import { tabHasta } from "./helpers";

test("planes: listado, filtros anunciados y plan con condiciones", async ({ page }) => {
  await page.goto("/planes");
  await expect(page.getByRole("heading", { level: 1, name: "Planes adaptados para el finde" })).toBeVisible();
  const estado = page.getByRole("status").filter({ hasText: "planes para elegir" });
  await expect(estado).toHaveText("14 planes para elegir");
  await page.getByLabel("Tipo de plan").selectOption("Música");
  await expect(page.getByRole("status").filter({ hasText: "planes para elegir" })).toHaveText("3 planes para elegir");
  await page.getByLabel("Tipo de plan").selectOption("");
  await page.getByLabel("Día").selectOption({ label: "Domingo 01/11" });
  await expect(page.getByRole("status").filter({ hasText: "planes para elegir" })).toContainText("planes para elegir");
});

test("planes con mis necesidades: los que cumplen todo van primero", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ necesidades: ["lsa", "atencion_escrito"] })));
  await page.goto("/planes");
  await expect(page.getByRole("status").filter({ hasText: "cumplen tus condiciones" })).toContainText("2 planes cumplen tus condiciones");
  await expect(page.locator("article").first()).toContainText("Cumple 2 de 2");
  const titulo = await page.locator("article").first().getByRole("heading", { level: 2 }).innerText();
  expect(titulo).toMatch(/intérprete de LSA|comercio justo/);
});

test("plan: abrir con teclado y ver 'Tus condiciones' con fuente y fecha", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ necesidades: ["lsa", "reserva"] })));
  await page.goto("/planes");
  const primero = page.locator("article").first();
  await tabHasta(page, primero.getByRole("link", { name: /Ver plan/ }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const tus = page.getByRole("region", { name: "Tus condiciones" });
  await expect(tus).toContainText("Cumple 2 de 2");
  await expect(tus).toContainText(/Informado por el comercio|Relevamiento del equipo/);
  await expect(page.getByText("Las condiciones del plan se suman a las del café")).toBeVisible();
});

test("la portada y la ficha del café muestran los planes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "Planes de todo tipo, adaptados." })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(3);
  await page.goto("/lugares/tostadores-pasaje-cobre");
  await expect(page.getByRole("heading", { level: 2, name: "Planes en este café" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Taller de latte art con intérprete de LSA" })).toBeVisible();
});

test("plan de un café patrocinado no aparece si no cumple lo que elegiste", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ necesidades: ["lsa"] })));
  await page.goto("/planes");
  await expect(page.getByText("Brunch dominguero")).toHaveCount(0);
});
