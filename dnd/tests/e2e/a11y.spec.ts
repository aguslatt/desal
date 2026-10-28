import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const RUTAS = [
  "/",
  "/diseno",
  "/necesidades",
  "/lugares",
  "/lugares?vista=mapa",
  "/lugares/cafe-nube-de-pan",
  "/lugares/bodegon-el-retono-gris",
  "/lugares/pizzeria-horno-barrio-alto",
  "/lugares/cafe-nube-de-pan/reporte",
  "/lugares/cafe-nube-de-pan/reporte?tipo=dato",
  "/lugares/cafe-nube-de-pan/recorrido",
  "/lugares/pizzeria-horno-barrio-alto/recorrido",
  "/comercios",
  "/comercios/panel",
  "/accesibilidad",
  "/relevamientos",
];

const MODOS: Record<string, Record<string, unknown>> = {
  claro: {},
  oscuro: { tema: "dark" },
  "alto contraste": { contraste: "high" },
  "alto contraste oscuro": { contraste: "high", tema: "dark" },
  "texto enorme": { texto: "200" },
  "lectura fácil": { facil: true },
  "con necesidades": { necesidades: ["ingreso_sin_escalones", "atencion_escrito", "espacio_tranquilo", "ascensor"] },
};

async function auditar(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  return r.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

for (const [modo, prefs] of Object.entries(MODOS)) {
  test.describe(`axe · ${modo}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((p) => localStorage.setItem("umbral:prefs", JSON.stringify(p)), prefs);
    });
    for (const ruta of RUTAS) {
      test(ruta, async ({ page }) => {
        await page.goto(ruta);
        await page.waitForLoadState("networkidle");
        if (/lugares\/[^/?]+$/.test(ruta)) await page.getByRole("button", { name: "Abrir todo" }).click();
        expect(await auditar(page)).toEqual([]);
      });
    }
  });
}

test("axe · panel de visualización abierto", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Visualización" }).click();
  expect(await auditar(page)).toEqual([]);
});

test("un solo h1 y landmarks en cada página", async ({ page }) => {
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await expect(page.locator("h1"), ruta).toHaveCount(1);
    await expect(page.locator("html"), ruta).toHaveAttribute("lang", "es-AR");
    await expect(page.getByRole("main"), ruta).toHaveCount(1);
  }
});
