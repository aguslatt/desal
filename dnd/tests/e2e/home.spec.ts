import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { tabHasta } from "./helpers";

test("demo viva: al tocar condiciones los cafés se reordenan y se anuncia el resultado", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("group", { name: "¿Qué necesitás saber antes de ir?" });
  const estado = demo.getByRole("status");
  await expect(estado).toContainText("cumplen tus condiciones");
  const antes = await estado.innerText();

  const chip = demo.getByRole("button", { name: "Espacio tranquilo" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(estado).not.toHaveText(antes);
  await expect(demo.getByRole("listitem").filter({ hasText: "Cumple 3 de 3" }).first()).toBeVisible();

  // Con una condición que casi nadie cumple, los resultados cambian
  await demo.getByRole("button", { name: "Música a volumen bajo" }).click();
  await expect(demo.getByRole("button", { name: /Ver los \d+ cafés? que cumplen?|Ver los cafés/ })).toBeVisible();
});

test("demo viva: se usa con teclado y lleva al listado con esas condiciones", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("group", { name: "¿Qué necesitás saber antes de ir?" });
  await tabHasta(page, demo.getByRole("button", { name: "Baño accesible" }));
  await page.keyboard.press("Space");
  await tabHasta(page, demo.getByRole("button", { name: /Ver los .* cafés? que cumplen?/ }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lugares$/);
  await expect(page.getByText("Condiciones que necesito (3)")).toBeVisible();
});

test("escenarios: precargan condiciones concretas y llevan al listado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Prefiero escribir/ }).click();
  await expect(page).toHaveURL(/\/lugares$/);
  await expect(page.getByText("Condiciones que necesito (3)")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /cafés? (cumple|cumplen)/ })).toBeVisible();
});

test("preguntas frecuentes: se abren y se cierran con teclado", async ({ page }) => {
  await page.goto("/");
  const q = page.getByRole("button", { name: "¿Tiene costo?" });
  await tabHasta(page, q);
  await page.keyboard.press("Enter");
  await expect(q).toHaveAttribute("aria-expanded", "true");
  const respuesta = page.getByRole("region", { name: "¿Tiene costo?" });
  await expect(respuesta).toContainText("ver la información de accesibilidad es gratis");
  await expect(respuesta).toContainText("un plan Pro pago");
  await expect(respuesta).toContainText("ningún dato de accesibilidad queda detrás de un plan pago");
  await page.keyboard.press("Enter");
  await expect(q).toHaveAttribute("aria-expanded", "false");
});

test("listado: filtros fijos a un costado en escritorio y el resultado sigue anunciándose", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/lugares");
  const filtros = page.getByRole("complementary", { name: "Filtros" }).first();
  await expect(filtros).toBeVisible();
  const caja = await filtros.boundingBox();
  const lista = await page.locator("article").first().boundingBox();
  expect(caja!.x + caja!.width).toBeLessThanOrEqual(lista!.x); // al costado, no arriba
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(200);
  expect((await filtros.boundingBox())!.y).toBeGreaterThanOrEqual(0); // sigue a la vista
  await page.getByLabel("Estilo de café").selectOption("Café-bar");
  await expect(page.getByRole("status").filter({ hasText: "cafés para elegir" })).toHaveText("2 cafés para elegir");
});

test("imagen para compartir el link (Open Graph)", async ({ request, page }) => {
  const r = await request.get("/opengraph-image");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("image/png");
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
});

test("axe: demo viva con condiciones activadas y pregunta abierta", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("group", { name: "¿Qué necesitás saber antes de ir?" }).getByRole("button", { name: "Baño accesible" }).click();
  await page.getByRole("button", { name: "¿Tiene costo?" }).click();
  await page.waitForTimeout(500);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
});

test("menú: 'Programas' en la navegación y 'Mis necesidades' dentro de Configuración", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("link", { name: "Programas" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Planes" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Mis necesidades" })).toHaveCount(0);

  const boton = page.getByRole("button", { name: "Configuración" });
  await boton.click();
  const panel = page.getByRole("group", { name: "Configuración", exact: true });
  await expect(panel.getByRole("heading", { name: "Mis necesidades" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Visualización" })).toBeVisible();
  await expect(panel.getByRole("group", { name: "Modos de visualización" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(boton).toBeFocused();

  await boton.click();
  await panel.getByRole("link", { name: "Marcar mis necesidades" }).click();
  await expect(page).toHaveURL(/\/necesidades$/);
  await expect(page.getByRole("heading", { level: 1, name: "¿Qué necesitás saber antes de salir?" })).toBeVisible();
});

test("los links viejos de /planes redirigen a /programas", async ({ page }) => {
  await page.goto("/planes");
  await expect(page).toHaveURL(/\/programas$/);
  await page.goto("/planes/latte-art-lsa");
  await expect(page).toHaveURL(/\/programas\/latte-art-lsa$/);
  await expect(page.getByRole("heading", { level: 1, name: /latte art/i })).toBeVisible();
});

test("portada: 'Además de las fichas' explica programas, recorrido de cinco pasos y momentos tranquilos", async ({ page }) => {
  await page.goto("/");
  const seccion = page.getByRole("region", { name: /Más que una ficha/ });
  await expect(seccion.getByText("Además de las fichas de cada café, Umbral suma")).toBeVisible();
  await expect(seccion).toContainText("programas del finde");
  await expect(seccion).toContainText("recorrido visual de cinco pasos");
  await expect(seccion).toContainText("de la vereda a la mesa y el baño");
  await expect(seccion).toContainText("gráfico de momentos tranquilos");
  await expect(seccion).toContainText("nivel de ruido y de gente por franja horaria");

  await expect(seccion.getByRole("link", { name: /Programas del finde/ })).toHaveAttribute("href", "/programas");
  await expect(seccion.getByRole("link", { name: /Recorrido visual/ })).toHaveAttribute("href", /\/recorrido$/);
  await expect(seccion.getByRole("link", { name: /Momentos tranquilos/ })).toHaveAttribute("href", /#momentos$/);
});

test("ficha: el índice 'En esta ficha' lleva a cada sección", async ({ page }) => {
  await page.goto("/lugares/tostadores-pasaje-cobre");
  const indice = page.getByRole("navigation", { name: "En esta ficha" });
  for (const t of ["Tus condiciones", "Recorrido visual de 5 pasos", "Momentos tranquilos", /Programas del finde \(\d+\)/, "Toda la información"]) {
    await expect(indice.getByRole("link", { name: t })).toBeVisible();
  }
  await indice.getByRole("link", { name: "Momentos tranquilos" }).click();
  await expect(page).toHaveURL(/#momentos$/);
  await expect(page.getByRole("heading", { level: 2, name: "Momentos tranquilos" })).toBeInViewport();
  // Un café sin recorrido no ofrece el acceso al recorrido
  await page.goto("/lugares/horno-de-barrio-alto");
  await expect(page.getByRole("navigation", { name: "En esta ficha" }).getByRole("link", { name: /Recorrido/ })).toHaveCount(0);
});
