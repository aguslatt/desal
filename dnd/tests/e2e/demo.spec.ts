import { expect, test } from "@playwright/test";
import { tabHasta } from "./helpers";

/** Recorrido de demo del pitch, usando solo teclado. */
test("recorrido de demo con teclado: necesidades → listado → ficha", async ({ page }) => {
  await page.goto("/");

  // El primer Tab es el skip link.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir al contenido" })).toBeFocused();

  // 1. Mis necesidades: marcar tres condiciones.
  await tabHasta(page, page.getByRole("link", { name: "Marcar lo que necesito" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "¿Qué necesitás saber antes de salir?" })).toBeVisible();

  for (const nombre of ["Ingreso sin escalones", "Atención por escrito", "Espacio tranquilo"]) {
    await tabHasta(page, page.getByRole("checkbox", { name: nombre, exact: true }));
    await page.keyboard.press("Space");
    await expect(page.getByRole("checkbox", { name: nombre, exact: true })).toBeChecked();
  }
  await expect(page.getByRole("status").filter({ hasText: "3 condiciones marcadas" })).toBeVisible();

  await tabHasta(page, page.getByRole("button", { name: "Ver lugares para mí" }));
  await page.keyboard.press("Enter");

  // 2. Listado filtrado con las coincidencias.
  await expect(page).toHaveURL(/\/lugares/);
  await expect(page.getByRole("status").filter({ hasText: "cumplen tus condiciones" })).toBeVisible();
  const primera = page.locator("article").first();
  await expect(primera).toContainText("Cumple 3 de 3");

  // 3. Abrir una ficha con "Tus condiciones".
  await tabHasta(page, primera.getByRole("link", { name: /Ver ficha/ }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const tus = page.getByRole("region", { name: "Tus condiciones" });
  await expect(tus).toContainText("Cumple 3 de 3");
  await expect(tus).toContainText("Confirmado");
  await expect(tus).toContainText(/Relevamiento del equipo|Informado por el comercio|visitantes?/);
});

test("el listado se anuncia al cambiar los filtros", async ({ page }) => {
  await page.goto("/lugares");
  const estado = page.getByRole("status").filter({ hasText: "lugares para elegir" });
  await expect(estado).toHaveText("15 lugares para elegir");
  await page.getByLabel("Rubro").selectOption("cine");
  await expect(page.getByRole("status").filter({ hasText: "lugares para elegir" })).toHaveText("2 lugares para elegir");
});

test("el mapa y el listado muestran los mismos lugares, y los marcadores se operan con teclado", async ({ page }) => {
  await page.goto("/lugares?vista=mapa");
  await expect(page.getByText("El mapa muestra los mismos lugares que el listado")).toBeVisible();
  const marcadores = page.locator(".leaflet-marker-icon");
  await expect(marcadores).toHaveCount(15);
  const m = marcadores.first();
  await m.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".leaflet-popup")).toContainText("Ver ficha");
  await expect(page.locator('.leaflet-popup a[href^="/lugares"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".leaflet-popup")).toHaveCount(0);
  await expect(m).toBeFocused();
});

test("patrocinado: solo aparece si cumple todas las condiciones", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ necesidades: ["ingreso_sin_escalones", "ascensor"] })));
  await page.goto("/lugares");
  await expect(page.getByText("Patrocinado")).toHaveCount(0);
});

test("preferencias de visualización: Escape cierra el panel y el texto grande no rompe el diseño", async ({ page }) => {
  await page.goto("/lugares");
  const boton = page.getByRole("button", { name: "Visualización" });
  await boton.click();
  await expect(boton).toHaveAttribute("aria-expanded", "true");
  await page.getByText("Enorme", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(boton).toBeFocused();
  await expect(boton).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("html")).toHaveAttribute("data-text", "200");
  await page.setViewportSize({ width: 360, height: 800 });
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sobra).toBeLessThanOrEqual(0);
});
