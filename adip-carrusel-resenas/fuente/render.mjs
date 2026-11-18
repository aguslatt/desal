// Exporta cada placa de carrusel.html a PNG (1080 × 1350) y arma la vista general.
// Uso: node render.mjs
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, "..", "png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, "carrusel.html")).href);
await page.evaluate(() => document.fonts.ready);

const slides = await page.$$(".slide");
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll(".slide")].map((s) => {
    const r = s.getBoundingClientRect();
    const worst = Math.max(...[...s.querySelectorAll(".cuerpo")].map((e) => {
      const last = e.lastElementChild.getBoundingClientRect();
      return last.bottom - r.top;
    }));
    return `${s.id}: contenido hasta y=${Math.round(worst)}`;
  }));
console.log(overflow.join("\n"));

for (let i = 0; i < slides.length; i++) {
  const n = String(i + 1).padStart(2, "0");
  await slides[i].screenshot({ path: path.join(out, `adip-resenas-${n}.png`) });
}

// Vista general
await page.setViewportSize({ width: 4 * 1080 + 5 * 40, height: 2 * 1350 + 3 * 40 });
await page.screenshot({ path: path.join(out, "vista-general.png"), fullPage: true });
await browser.close();
console.log(`${slides.length} placas exportadas en ${out}`);
