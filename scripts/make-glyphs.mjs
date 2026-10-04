// Contornos de letras (Inter Black) para el configurador de collares: A–Z, Ñ y 0–9 → src/three/glyphs.json
import opentype from "opentype.js";
import { readFileSync, writeFileSync } from "node:fs";

const buf = readFileSync("node_modules/@fontsource/inter/files/inter-latin-900-normal.woff");
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789".split("");
const out = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  const p = g.getPath(0, 0, font.unitsPerEm); // y hacia abajo
  out[ch] = { adv: g.advanceWidth / font.unitsPerEm, cmds: p.commands.map((c) => [c.type, ...["x1", "y1", "x2", "y2", "x", "y"].filter((k) => k in c).map((k) => +(c[k] / font.unitsPerEm).toFixed(4))]) };
}
writeFileSync("src/three/glyphs.json", JSON.stringify(out));
console.log("glifos:", Object.keys(out).length, "upm", font.unitsPerEm);
