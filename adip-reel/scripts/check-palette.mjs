// Verifica que el código NO usa los colores que dejaron de predominar (crema #FFF6E7, verde oscuro #074434 y derivados)
// (la paleta oficial vive en src/config/brand.ts: es el ÚNICO lugar donde se definen colores). Uso: node scripts/check-palette.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const BAN = [/#FFF6E7/i, /#074434/i, /#3E6B5C/i, /#F7F4EE/i, /#24332B/i, /COLORS\.(cream|ink|inkSoft|surface|surfaceLine)\b/];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : []; });
let bad = 0;
for (const f of walk(new URL("../src", import.meta.url).pathname)) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => { for (const r of BAN) if (r.test(l) && !/brand\.ts$/.test(f) && !/^\s*(\/\/|\*|\/\*)/.test(l)) { console.log(`FAIL ${f}:${i + 1} usa un color retirado: ${l.trim().slice(0, 100)}`); bad++; } });
}
if (bad) process.exit(1);
console.log("Paleta: sin crema / verde oscuro retirados en src/.");
