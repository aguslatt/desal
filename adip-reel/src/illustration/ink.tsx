import type React from "react";
import { COLORS } from "../config/brand.ts";
import { Curve, catmullRom, clamp, densify, lerp, rad, smoothClosedPath, smoothstep, type Pt } from "./geom.ts";
import { noise1 } from "./noise.ts";

/**
 * TRAZO DE TINTA FINO — línea de marcador/lápiz de ancho variable (nunca un «tubo»).
 * Un trazo es una polilínea/curva por puntos que se convierte en UN polígono SVG relleno (sin filtros):
 *   · presión: el ancho oscila apenas con el recorrido y se afina al apoyar y al levantar la mano;
 *   · temblor: deriva lenta del eje (≈ 1,5 px) + micro-temblor (≈ 0,3 px), deterministas (dependen de la semilla y de la longitud);
 *   · dibujo progresivo con `progress` (0..1): la punta avanza con cabeza redondeada y, al llegar a 1, se afina como al levantar el marcador.
 * Unidades: px de la escena a escala 1 (la figura mide 440 px: el trazo base es INK_WIDTH ≈ 1 % de esa altura).
 */
export const INK_WIDTH = 4.4;

export type InkOptions = {
  /** grosor base (px de escena). Por defecto INK_WIDTH. */
  width?: number;
  seed?: number;
  /** fracción 0..1 del trazo ya dibujada. */
  progress?: number;
  /** longitud (px) en que el trazo «apoya» al empezar. Por defecto ≈ 3 × width. */
  taperStart?: number;
  /** longitud (px) en que el trazo se afina al terminar. Por defecto ≈ 5 × width. */
  taperEnd?: number;
  /** fracción del ancho en la punta inicial (0..1). */
  startWidth?: number;
  /** fracción del ancho en la punta final (0..1). */
  endWidth?: number;
  /** variación de presión 0..1 (0 = grosor constante). Por defecto 0,3. */
  pressure?: number;
  /** deriva lenta del eje en px (amplitud). Por defecto 1,5. */
  wobble?: number;
  /** micro-temblor en px (amplitud). Por defecto 0,28. */
  tremor?: number;
  /** true (por defecto): curva suave que pasa por los puntos; false: esquinas vivas. */
  smooth?: boolean;
  /** separación de muestreo en px (por defecto 3). */
  step?: number;
};

const circlePoly = (c: Pt, r: number): Pt[] => {
  const n = 8;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) pts.push([c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r]);
  return pts;
};

/** Polígono del contorno del trazo (puntos). Vacío si no hay nada que dibujar. */
export const inkOutline = (points: readonly Pt[], o: InkOptions = {}): Pt[] => {
  const width = o.width ?? INK_WIDTH;
  const seed = o.seed ?? 1;
  const progress = o.progress ?? 1;
  if (points.length < 2 || progress <= 0) return [];
  const step = o.step ?? 3;
  const smooth = o.smooth ?? true;
  const center = smooth ? catmullRom(points, step) : densify(points, step);
  const curve = new Curve(center);
  const L = curve.length;
  const sCut = L * Math.min(1, progress);
  if (L < 0.5 || sCut < 0.5) return [];
  const taperStart = o.taperStart ?? width * 3;
  const taperEnd = o.taperEnd ?? width * 5;
  const startW = o.startWidth ?? 0.5;
  const endW = o.endWidth ?? 0.25;
  const pressure = o.pressure ?? 0.3;
  const wobble = o.wobble ?? 1.5;
  const tremor = o.tremor ?? 0.28;
  // rampas proporcionales si el trazo es corto
  const k = Math.min(1, (L * 0.9) / (taperStart + taperEnd || 1));
  const tS = taperStart * k;
  const tE = taperEnd * k;

  const N = Math.max(2, Math.ceil(sCut / step));
  const left: Pt[] = [];
  const right: Pt[] = [];
  const last: { c: Pt; t: Pt; r: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const s = (sCut * i) / N;
    const base = curve.pointAt(s);
    const a = curve.pointAt(Math.max(0, s - step));
    const b = curve.pointAt(Math.min(L, s + step));
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const nx = -ty;
    const ny = tx;
    const off = wobble * noise1(seed, s / 46) + tremor * noise1(seed + 5, s / 7);
    const press = 1 + pressure * 0.5 * noise1(seed + 11, s / 38);
    const rampS = lerp(startW, 1, smoothstep(0, tS, s));
    const rampE = lerp(endW, 1, smoothstep(0, tE, L - s));
    const w = Math.max(width * 0.14, width * press * rampS * rampE);
    const cx = base[0] + nx * off;
    const cy = base[1] + ny * off;
    left.push([cx + nx * (w / 2), cy + ny * (w / 2)]);
    right.push([cx - nx * (w / 2), cy - ny * (w / 2)]);
    last.push({ c: [cx, cy], t: [tx, ty], r: w / 2 });
  }
  const poly: Pt[] = [...left];
  const end = last[last.length - 1];
  const first = last[0];
  const capN = 4;
  for (let j = 1; j < capN; j++) {
    const th = (j / capN) * Math.PI;
    const ca = Math.cos(th);
    const sa = Math.sin(th);
    poly.push([end.c[0] + (-end.t[1] * ca + end.t[0] * sa) * end.r, end.c[1] + (end.t[0] * ca + end.t[1] * sa) * end.r]);
  }
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  for (let j = 1; j < capN; j++) {
    const th = (j / capN) * Math.PI;
    const ca = Math.cos(th);
    const sa = Math.sin(th);
    poly.push([first.c[0] - (-first.t[1] * ca + first.t[0] * sa) * first.r, first.c[1] - (first.t[0] * ca + first.t[1] * sa) * first.r]);
  }
  return poly;
};

/** `d` de SVG (relleno) del trazo de tinta. */
export const inkPath = (points: readonly Pt[], o: InkOptions = {}): string => {
  const poly = inkOutline(points, o);
  if (poly.length < 3) {
    if (points.length && (o.progress ?? 1) > 0.02 && points.length >= 2) return smoothClosedPath(circlePoly(points[0], (o.width ?? INK_WIDTH) * 0.3));
    return "";
  }
  return smoothClosedPath(poly);
};

/**
 * Puntos de un círculo/óvalo dibujado a mano: sale de un punto, da la vuelta y se pasa apenas al cerrar (como las cabezas
 * de la referencia). `rotate` en grados; `startAngle` en grados (−90 = arriba).
 */
export const handCirclePoints = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  o: { rotate?: number; startAngle?: number; overlap?: number; seed?: number } = {},
): Pt[] => {
  const seed = o.seed ?? 1;
  const rot = rad(o.rotate ?? 0);
  const a0 = rad(o.startAngle ?? -118 + noise1(seed + 3, 0.5) * 18);
  const sweep = rad(360 + (o.overlap ?? 20));
  const drift = Math.min(rx, ry) * 0.06;
  const n = Math.max(18, Math.ceil(((rx + ry) * Math.PI * (sweep / (Math.PI * 2))) / 7));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + sweep * u;
    const wob = 1 + 0.025 * noise1(seed + 9, u * 3.1);
    const rr = 1 + (drift / Math.min(rx, ry)) * (u - 0.5);
    const px = Math.cos(a) * rx * wob * rr;
    const py = Math.sin(a) * ry * wob * rr;
    pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  return pts;
};

// ───────────────────────── Componentes SVG ─────────────────────────

type InkStrokeProps = InkOptions & {
  /** puntos por los que pasa el trazo. */
  points: readonly Pt[];
  color?: string;
  opacity?: number;
};

/** Trazo de tinta (fragmento SVG: va dentro de un <svg>). */
export const InkStroke: React.FC<InkStrokeProps> = ({ points, color = COLORS.black, opacity, ...o }) => {
  const d = inkPath(points, o);
  if (!d) return null;
  return <path d={d} fill={color} opacity={opacity} />;
};

/** Mancha de color plana (relleno) con el borde suavizado; `dx`,`dy` la desplazan (registro del color respecto de la línea). */
export const Flat: React.FC<{ poly: readonly Pt[]; color: string; dx?: number; dy?: number; opacity?: number; stroke?: string; strokeWidth?: number }> = ({ poly, color, dx = 0, dy = 0, opacity = 1, stroke, strokeWidth }) => {
  if (poly.length < 3 || opacity <= 0) return null;
  const d = smoothClosedPath(poly);
  return <path d={d} fill={color} opacity={opacity} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" transform={dx || dy ? `translate(${dx} ${dy})` : undefined} />;
};

export { clamp };
