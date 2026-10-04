// Herramienta de QA visual: capturas de la web en distintas posiciones de scroll.
// Uso: node scripts/shoot.mjs <url-path> <out-prefix> [desktop|mobile] y1,y2,...(en múltiplos de viewport)
import { chromium } from "playwright-core";
const [,, path = "/", out = ".shots/s", device = "desktop", ys = "0"] = process.argv;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const mobile = device === "mobile";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const ctx = await browser.newContext(mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => { if (!window.__keepLoader) sessionStorage.setItem("desal-seen", "1"); });
const page = await ctx.newPage();
page.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url()); });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log("console." + m.type(), m.text().slice(0, 300)); });
await page.goto(BASE + path, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const vh = mobile ? 844 : 810;
for (const y of ys.split(",")) {
  let px;
  if (y.startsWith("#")) { const [id, off = "0"] = y.slice(1).split("@"); px = await page.evaluate(([i, o, vh]) => Math.round(document.getElementById(i).getBoundingClientRect().top + window.scrollY + o * vh), [id, parseFloat(off), vh]); }
  else px = Math.round(parseFloat(y) * vh);
  await page.evaluate((p) => window.scrollTo(0, p), px);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}-${mobile ? "m" : "d"}-${y}.png` });
  console.log("shot", y, px);
}
const h = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("height", h, "vh=", (h / vh).toFixed(1));
await browser.close();
