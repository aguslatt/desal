// Verifica que public/fonts/Montserrat-VF.ttf es la Montserrat variable REAL (eje wght 100–900) antes de renderizar.
// Uso: node scripts/check-fonts.mjs   (también se verifica en el render: src/lib/fonts.ts)
import { readFileSync } from "node:fs";
const buf = readFileSync(new URL("../public/fonts/Montserrat-VF.ttf", import.meta.url));
const u32 = (o) => buf.readUInt32BE(o), u16 = (o) => buf.readUInt16BE(o), tag = (o) => buf.toString("ascii", o, o + 4);
const n = u16(4);
const tables = {};
for (let i = 0; i < n; i++) { const o = 12 + i * 16; tables[tag(o)] = { off: u32(o + 8), len: u32(o + 12) }; }
let bad = 0;
const ok = (c, m) => { console.log((c ? "OK  " : "FAIL") + " " + m); if (!c) bad++; };
ok(!!tables.fvar, "tabla fvar (fuente variable)");
if (tables.fvar) {
  const o = tables.fvar.off, axesOff = u16(o + 4), count = u16(o + 8), size = u16(o + 10);
  for (let i = 0; i < count; i++) {
    const a = o + axesOff + i * size;
    const fx = (p) => buf.readInt32BE(p) / 65536;
    if (tag(a) === "wght") { ok(fx(a + 4) <= 100 && fx(a + 12) >= 900, `eje wght ${fx(a + 4)}–${fx(a + 12)} (default ${fx(a + 8)})`); }
  }
}
const name = tables.name ? buf.toString("latin1", tables.name.off, tables.name.off + tables.name.len) : "";
ok(/Montserrat/i.test(name) || buf.includes(Buffer.from("M\0o\0n\0t\0s\0e\0r\0r\0a\0t")), "nombre de familia Montserrat");
ok(buf.length > 400000, `tamaño ${(buf.length / 1024).toFixed(0)} KB`);
if (bad) process.exit(1);
console.log("\nMontserrat real verificada.");
