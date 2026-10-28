import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(import.meta.dirname, "../../src/app/globals.css"), "utf8");

/** Extrae las variables de un bloque, ej. ":root[data-theme="dark"] {". */
function tokens(selector: string): Record<string, string> {
  const i = css.indexOf(`${selector} {`);
  if (i < 0) throw new Error(`No encontré ${selector}`);
  const bloque = css.slice(i, css.indexOf("}", i));
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const base = tokens(":root");
const temas: Record<string, Record<string, string>> = {
  claro: base,
  oscuro: { ...base, ...tokens(':root[data-theme="dark"]') },
  "alto contraste claro": { ...base, ...tokens(':root[data-contrast="high"]') },
  "alto contraste oscuro": { ...base, ...tokens(':root[data-contrast="high"]'), ...tokens(':root[data-theme="dark"]'), ...tokens(':root[data-theme="dark"][data-contrast="high"]') },
};

describe.each(Object.entries(temas))("contraste en tema %s", (_n, t) => {
  it("texto principal y secundario >= 7:1 sobre fondo y superficies", () => {
    for (const fondo of ["bg", "surface", "surface-2"]) {
      expect(ratio(t.text, t[fondo])).toBeGreaterThanOrEqual(7);
      expect(ratio(t["text-muted"], t[fondo])).toBeGreaterThanOrEqual(7);
    }
  });
  it("los tres estados >= 7:1 sobre su fondo y sobre la superficie", () => {
    for (const [fg, bg] of [["ok", "ok-bg"], ["no", "no-bg"], ["unk", "unk-bg"]]) {
      expect(ratio(t[fg], t[bg]), fg).toBeGreaterThanOrEqual(7);
      expect(ratio(t[fg], t.surface), fg).toBeGreaterThanOrEqual(7);
    }
  });
  it("botón principal, enlaces, foco y aviso >= 7:1", () => {
    expect(ratio(t["accent-text"], t.accent)).toBeGreaterThanOrEqual(7);
    expect(ratio(t.accent, t.bg)).toBeGreaterThanOrEqual(7);
    expect(ratio(t.focus, t.bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(t.warn, t["warn-bg"])).toBeGreaterThanOrEqual(7);
  });
  it("bordes de campos >= 3:1 (WCAG 1.4.11)", () => {
    expect(ratio(t.border, t.bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(t.border, t.surface)).toBeGreaterThanOrEqual(3);
  });
});
