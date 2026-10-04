// Genera los renders PLACEHOLDER de cada pieza (PNG transparente → WebP) con el mismo estudio 3D del sitio.
// Uso: levantar `npm run dev` y correr `npm run render:pieces` (o BASE_URL=... node scripts/render-pieces.mjs ring:a)
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = new URL("../public/pieces/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const kinds = ["ring", "signet", "hoops", "pendant", "nugget", "cuff", "mark"];
const views = ["a", "b", "c"];
const only = process.argv.slice(2);
const jobs = kinds.flatMap((k) => views.map((v) => `${k}:${v}`)).filter((j) => !only.length || only.includes(j) || only.includes(j.split(":")[0]));

const SIZES_FILE = new URL("../src/content/pieceSizes.json", import.meta.url).pathname;
const sizes = existsSync(SIZES_FILE) ? JSON.parse(readFileSync(SIZES_FILE, "utf8")) : {};
const SIZE = Number(process.env.SIZE ?? 1400);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("pageerror", e.message));

for (const job of jobs) {
  const [kind, view] = job.split(":");
  await page.goto(`${BASE}/render/${kind}?view=${view}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const buf = await page.screenshot({ omitBackground: true, type: "png" });
  // recorta al contenido real (alpha) con aire mínimo
  const trimmed = await sharp(buf).trim({ threshold: 1 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(meta.width, meta.height) * 0.03);
  const out = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 95 })
    .toBuffer();
  await sharp(out).toFile(`${OUT}${kind}-${view}.webp`);
  const m2 = await sharp(out).metadata();
  sizes[`${kind}-${view}`] = [m2.width, m2.height];
  writeFileSync(SIZES_FILE, JSON.stringify(sizes, null, 2));
  console.log(job, `${m2.width}x${m2.height}`);
}
await browser.close();
