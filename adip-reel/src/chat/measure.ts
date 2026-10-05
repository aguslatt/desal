import { FONT } from "../config/brand.ts";

/**
 * Medición de texto Montserrat con canvas 2D (mismo motor de texto que el DOM: mismo kerning).
 * Devuelve null si la fuente aún no está cargada o si no hay DOM (scripts de Node): en ese caso
 * NO se cachea nada, así nunca queda memorizada una medida con la fuente de reemplazo.
 */
const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;

export const measureTextWidth = (text: string, size: number, weight: number): number | null => {
  if (typeof document === "undefined") return null;
  const font = `${weight} ${size}px ${FONT.family}`;
  const key = `${font}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!document.fonts.check(font)) return null;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  ctx.fontKerning = "normal";
  const w = ctx.measureText(text).width;
  cache.set(key, w);
  return w;
};
