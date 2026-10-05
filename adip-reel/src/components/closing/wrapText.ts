import { measureText } from "@remotion/layout-utils";
import { FONT } from "../../config/brand.ts";
import "../../lib/fonts.ts";

/**
 * Partido de líneas natural SIN retipear el guion: el texto sale de script.ts y acá solo se decide
 * dónde cortarlo. Usa la medición real de Montserrat (solo válida con la fuente ya cargada).
 *
 * Criterio: la menor cantidad de líneas que entra en `maxWidth`; entre las particiones posibles,
 * la de renglón más ancho más corto (líneas equilibradas). Nunca deja una línea terminada en
 * artículo, preposición o clítico ("de", "la", "te"…): esas palabras se pegan a la siguiente.
 */
export type WrapFont = {
  readonly fontSize: number;
  readonly weight: number;
  readonly letterSpacing: number;
};

const NO_BREAK_AFTER = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "lo", "los", "me", "o", "para", "por", "si", "te", "u", "un", "una", "y",
]);

const bareWord = (w: string): string => w.toLowerCase().replace(/[^\p{L}]/gu, "");

export const measureLine = (text: string, font: WrapFont): number =>
  measureText({
    text,
    fontFamily: FONT.family,
    fontSize: font.fontSize,
    fontWeight: String(font.weight),
    letterSpacing: `${font.letterSpacing}px`,
    validateFontIsLoaded: true,
  }).width;

/** Todas las formas de elegir `k` cortes entre `n - 1` huecos entre palabras (índices 1..n-1). */
const cutSets = (n: number, k: number): number[][] => {
  if (k === 0) return [[]];
  const out: number[][] = [];
  const rec = (from: number, acc: number[]) => {
    if (acc.length === k) {
      out.push(acc.slice());
      return;
    }
    for (let i = from; i <= n - 1; i++) {
      acc.push(i);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(1, []);
  return out;
};

export const wrapNatural = (text: string, font: WrapFont, maxWidth: number): string[] => {
  const words = text.split(" ");
  for (let lines = 1; lines <= words.length; lines++) {
    let best: { rows: string[]; widest: number } | null = null;
    for (const cuts of cutSets(words.length, lines - 1)) {
      if (cuts.some((c) => NO_BREAK_AFTER.has(bareWord(words[c - 1])))) continue;
      const bounds = [0, ...cuts, words.length];
      const rows = bounds.slice(1).map((end, i) => words.slice(bounds[i], end).join(" "));
      const widest = Math.max(...rows.map((r) => measureLine(r, font)));
      if (widest > maxWidth) continue;
      if (!best || widest < best.widest) best = { rows, widest };
    }
    if (best) return best.rows;
  }
  return [text];
};
