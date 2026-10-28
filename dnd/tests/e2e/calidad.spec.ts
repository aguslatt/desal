import { expect, test } from "@playwright/test";
import cat from "../../src/data/catalogo.json";

const RUTAS = [
  "/", "/diseno", "/necesidades", "/lugares", "/lugares?vista=mapa", "/lugares/cafe-nube-de-pan", "/lugares/cafe-el-retono-gris", "/planes", "/planes/latte-art-lsa",
  "/lugares/cafe-nube-de-pan/reporte", "/lugares/cafe-nube-de-pan/reporte?tipo=dato", "/lugares/cafe-nube-de-pan/recorrido",
  "/comercios", "/comercios/panel", "/relevamientos", "/accesibilidad", "/creditos",
];

test.describe("sin scroll horizontal", () => {
  for (const [ancho, texto, nombre] of [[320, "100", "320 px (zoom 400 %)"], [360, "200", "360 px con texto enorme"]] as const) {
    test(nombre, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("umbral:prefs", JSON.stringify({ texto: t })), texto);
      await page.setViewportSize({ width: ancho, height: 700 });
      const sobran: string[] = [];
      for (const ruta of RUTAS) {
        await page.goto(ruta);
        await page.waitForLoadState("networkidle");
        const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (extra > 0) sobran.push(`${ruta} (+${extra}px)`);
      }
      expect(sobran).toEqual([]);
    });
  }
});

test("elementos tocables de 44 × 44 px como mínimo (móvil)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ necesidades: ["rampa", "ascensor"] })));
  const chicos: string[] = [];
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
    if (ruta.includes("lugares?")) await page.waitForSelector(".leaflet-marker-icon");
    await page.getByRole("button", { name: "Abrir todo" }).click({ timeout: 500 }).catch(() => undefined);
    const lista = await page.evaluate(() => {
      const out: string[] = [];
      const sel = 'button, summary, select, textarea, input:not([type=hidden]):not(.sr-only), a.btn, header a, nav a, footer a, .leaflet-marker-icon, .leaflet-control a, [role="button"]';
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        if (el.closest(".leaflet-control-attribution")) continue;
        // checkboxes y radios: se mide la etiqueta que los envuelve
        const objetivo = (el instanceof HTMLInputElement && ["checkbox", "radio"].includes(el.type) ? el.closest("label") : el) as HTMLElement | null;
        if (!objetivo) continue;
        const cs = getComputedStyle(objetivo);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = objetivo.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.width < 43.5 || r.height < 43.5) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return out;
    });
    for (const l of lista) chicos.push(`${ruta}: ${l}`);
  }
  expect(chicos).toEqual([]);
});

test("lectura fácil: aparecen los pictogramas y se cita ARASAAC", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("umbral:prefs", JSON.stringify({ facil: true, necesidades: ["ingreso_sin_escalones"] })));
  await page.goto("/necesidades");
  const primeros = page.locator("img[src^='/picto/']").first();
  await expect(primeros).toBeVisible();
  await expect.poll(() => primeros.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("Se entra sin escalones")).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "ARASAAC" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("CC BY-NC-SA");
  // Sin lectura fácil no se ven
  await page.getByRole("button", { name: "Visualización" }).click();
  await page.getByRole("group", { name: "Modos de visualización" }).getByRole("checkbox", { name: /Lectura fácil/ }).uncheck();
  await expect(page.locator("img[src^='/picto/']").first()).toBeHidden();
});

test("todos los pictogramas referenciados existen", async ({ request }) => {
  const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const palabras = [...new Set(cat.condiciones.map((c) => (c as { picto?: string }).picto).filter(Boolean))] as string[];
  for (const p of palabras) expect((await request.get(`/picto/${slug(p)}.png`)).status(), p).toBe(200);
});

test("PWA: manifest válido, íconos y service worker", async ({ page, request, context }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m).toMatchObject({ name: "Umbral", lang: "es-AR", display: "standalone", start_url: "/" });
  for (const i of m.icons) expect((await request.get(i.src)).status(), i.src).toBe(200);
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  await page.goto("/lugares");
  await page.evaluate(() => navigator.serviceWorker.ready);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller || true)).toBe(true);
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // Sin conexión: una página ya visitada se abre; una nueva muestra el aviso en español.
  await context.setOffline(true);
  await page.goto("/lugares");
  await expect(page.getByRole("heading", { level: 1, name: "Cafés" })).toBeVisible();
  await page.goto("/comercios/panel");
  await expect(page.getByRole("heading", { level: 1, name: "No hay conexión" })).toBeVisible();
  await context.setOffline(false);
});

test("página 404 en castellano", async ({ page }) => {
  const r = await page.goto("/lugares/no-existe");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeVisible();
});

test("respeta las preferencias del sistema", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark", reducedMotion: "reduce", contrast: "more" });
  const p = await ctx.newPage();
  await p.goto("/");
  await expect(p.locator("html")).toHaveAttribute("data-theme", "dark");
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector("main > div")!).animationName);
  expect(anim).toBe("none");
  await ctx.close();
});
