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

  await tabHasta(page, page.getByRole("button", { name: "Ver cafés para mí" }));
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
  const estado = page.getByRole("status").filter({ hasText: "cafés para elegir" });
  await expect(estado).toHaveText("15 cafés para elegir");
  await page.getByLabel("Estilo de café").selectOption("Café de especialidad");
  await expect(page.getByRole("status").filter({ hasText: "cafés para elegir" })).toHaveText("4 cafés para elegir");
});

test("el mapa muestra los mismos lugares que el listado y se opera con teclado", async ({ page }) => {
  await page.goto("/lugares?vista=mapa");
  await expect(page.getByText("El mapa muestra los mismos cafés que el listado")).toBeVisible();
  const marcadores = page.locator(".leaflet-marker-icon");
  await expect(marcadores.first()).toBeVisible();

  // Los 15 cafés están representados: marcadores sueltos o grupos con su cantidad.
  const etiquetas = await marcadores.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
  const representados = etiquetas.reduce((n, t) => n + (/^(\d+) cafés/.exec(t)?.[1] ? Number(/^(\d+) cafés/.exec(t)![1]) : 1), 0);
  expect(representados).toBe(15);

  // Un marcador suelto: Enter abre el resumen, el foco pasa a "Ver ficha", Escape cierra y vuelve.
  const m = page.locator('.leaflet-marker-icon[aria-label$="Enter para ver el resumen."]').first();
  await m.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".leaflet-popup")).toContainText("Ver ficha");
  await expect(page.locator('.leaflet-popup a[href^="/lugares"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".leaflet-popup")).toHaveCount(0);
  await expect(m).toBeFocused();
});

test("el mapa agrupa marcadores cercanos y Enter acerca hasta separarlos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/lugares?vista=mapa");
  const grupo = page.locator('.leaflet-marker-icon[aria-label*="cafés en esta zona"]').first();
  await expect(grupo).toBeVisible();
  const antes = await page.locator(".leaflet-marker-icon").count();
  await grupo.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.locator(".leaflet-marker-icon").count()).toBeGreaterThan(antes);
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

test("recorrido de demo COMPLETO solo con teclado (el del pitch)", async ({ page }) => {
  await page.goto("/");
  const enter = () => page.keyboard.press("Enter");

  // 1. Mis necesidades: tres condiciones
  await tabHasta(page, page.getByRole("link", { name: "Marcar lo que necesito" }));
  await enter();
  for (const n of ["Ingreso sin escalones", "Atención por escrito", "Espacio tranquilo"]) {
    await tabHasta(page, page.getByRole("checkbox", { name: n, exact: true }));
    await page.keyboard.press("Space");
  }
  await tabHasta(page, page.getByRole("button", { name: "Ver cafés para mí" }));
  await enter();

  // 2. Listado con "Cumple 3 de 3"
  await expect(page.locator("article").first()).toContainText("Cumple 3 de 3");

  // 3. Ficha con "Tus condiciones", fuente y fecha
  await tabHasta(page, page.locator("article").first().getByRole("link", { name: /Ver ficha/ }));
  await enter();
  const tus = page.getByRole("region", { name: "Tus condiciones" });
  await expect(tus).toContainText("Cumple 3 de 3");
  await expect(tus).toContainText(/\d{2}\/\d{2}\/\d{4}|visitantes? lo/);

  // 4. Recorrido visual
  await tabHasta(page, page.getByRole("link", { name: "Abrir el recorrido" }));
  await enter();
  await expect(page.getByRole("heading", { level: 1, name: /Recorrido visual/ })).toBeVisible();
  await tabHasta(page, page.getByRole("button", { name: "Paso siguiente" }));
  await enter();
  await expect(page.getByRole("heading", { level: 2, name: "El ingreso" })).toBeFocused();

  // 5. Reporte rápido
  await tabHasta(page, page.getByRole("link", { name: "Contar cómo te fue" }));
  await enter();
  for (let q = 0; q < 6; q++) {
    await tabHasta(page, page.getByRole("radio", { name: "Sí", exact: true }));
    await page.keyboard.press("ArrowRight"); // elige "No"
    await tabHasta(page, page.getByRole("button", { name: "Siguiente" }));
    await enter();
  }
  for (let q = 0; q < 2; q++) { // horario (opcional) y "¿algo diferente?"
    if (q === 1) { await tabHasta(page, page.getByRole("radio", { name: "Sí", exact: true })); await page.keyboard.press("ArrowRight"); }
    await tabHasta(page, page.getByRole("button", { name: "Siguiente" }));
    await enter();
  }
  await tabHasta(page, page.getByRole("button", { name: "Siguiente" })); // foto (opcional)
  await enter();
  await tabHasta(page, page.getByRole("button", { name: "Enviar reporte" }));
  await enter();
  await expect(page.getByRole("heading", { level: 2, name: "¡Gracias! Recibimos tu reporte" })).toBeFocused();

  // Extra: lectura fácil, también con teclado
  await tabHasta(page, page.getByRole("button", { name: "Visualización" }));
  await enter();
  await tabHasta(page, page.getByRole("checkbox", { name: /Lectura fácil/ }));
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-easy", "on");
});
