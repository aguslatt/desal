import type React from "react";
import { COLORS } from "../config/brand.ts";
import { Curve, catmullRom, densify, deg, f1, lerp, smoothClosedPath, smoothstep, type Pt } from "./geom.ts";
import { noise1 } from "./noise.ts";

/**
 * TRAZO DE TINTA A MANO — contorno de ancho variable (nunca un «tubo»).
 * Un trazo es una polilínea/curva por puntos; se convierte en UN polígono SVG relleno (sin filtros):
 *   · presión: el ancho oscila suavemente (ruido) y se afina al apoyar y al levantar la mano;
 *   · temblor: la línea se desvía de su eje con una deriva lenta + un micro-temblor;
 *   · dibujo progresivo con `progress` (0..1): la punta avanza con cabeza redondeada y, al llegar a 1,
 *     se afina como cuando se levanta el marcador (sin saltos).
 * Determinista: depende solo de (puntos, opciones, semilla).
 */
export type InkOptions = {
  /** grosor base en u de mundo (≈ 14 para una persona de ~1000 u). */
  width?: number;
  seed?: number;
  /** fracción 0..1 del trazo ya dibujada. */
  progress?: number;
  /** longitud (u) en que el trazo «apoya» al empezar. Por defecto ≈ 2,2 × width. */
  taperStart?: number;
  /** longitud (u) en que el trazo se afina al terminar. Por defecto ≈ 4 × width. */
  taperEnd?: number;
  /** fracción del ancho en la punta inicial (0..1). */
  startWidth?: number;
  /** fracción del ancho en la punta final (0..1). */
  endWidth?: number;
  /** variación de presión 0..1 (0 = grosor constante). Por defecto 0,3. */
  pressure?: number;
  /** deriva lenta de la línea, en múltiplos del ancho. Por defecto 0,3. */
  wobble?: number;
  /** micro-temblor, en múltiplos del ancho. Por defecto 0,08. */
  tremor?: number;
  /** true (por defecto): curva suave que pasa por los puntos; false: esquinas vivas. */
  smooth?: boolean;
  /** separación de muestreo en u (por defecto según el ancho). */
  step?: number;
};

const circlePath = (c: Pt, r: number): string => {
  const n = 10;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) pts.push([c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r]);
  return smoothClosedPath(pts);
};

/** Polígono del contorno del trazo (puntos). */
export const inkOutline = (points: readonly Pt[], o: InkOptions = {}): Pt[] => {
  const width = o.width ?? 14;
  const seed = o.seed ?? 1;
  const progress = o.progress ?? 1;
  if (points.length < 2 || progress <= 0) return [];
  const step = o.step ?? Math.max(2.5, Math.min(9, width * 0.5));
  const smooth = o.smooth ?? true;
  const center = smooth ? catmullRom(points, step) : densify(points, step);
  const curve = new Curve(center);
  const L = curve.length;
  const sCut = L * Math.min(1, progress);
  if (L < 0.4 || sCut < 0.4) return [];
  const taperStart = o.taperStart ?? width * 2.2;
  const taperEnd = o.taperEnd ?? width * 4;
  const startW = o.startWidth ?? 0.45;
  const endW = o.endWidth ?? 0.22;
  const pressure = o.pressure ?? 0.3;
  const wobble = o.wobble ?? 0.3;
  const tremor = o.tremor ?? 0.08;
  // rampas proporcionales si el trazo es corto
  const k = Math.min(1, (L * 0.9) / (taperStart + taperEnd || 1));
  const tS = taperStart * k;
  const tE = taperEnd * k;

  const N = Math.max(2, Math.ceil(sCut / step));
  const left: Pt[] = [];
  const right: Pt[] = [];
  const centers: { c: Pt; t: Pt; r: number }[] = [];
  const lam1 = width * 7;
  const lam2 = width * 1.7;
  for (let i = 0; i <= N; i++) {
    const s = (sCut * i) / N;
    const base = curve.pointAt(s);
    const a = curve.pointAt(Math.max(0, s - step * 0.8));
    const b = curve.pointAt(Math.min(L, s + step * 0.8));
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const nx = -ty;
    const ny = tx;
    const off = width * (wobble * 0.5 * noise1(seed, s / lam1) + tremor * noise1(seed + 5, s / lam2));
    const press = 1 + pressure * 0.55 * noise1(seed + 11, s / (width * 9));
    const rampS = lerp(startW, 1, smoothstep(0, tS, s));
    const rampE = lerp(endW, 1, smoothstep(0, tE, L - s));
    const w = Math.max(width * 0.12, width * press * rampS * rampE);
    const cx = base[0] + nx * off;
    const cy = base[1] + ny * off;
    left.push([cx + nx * (w / 2), cy + ny * (w / 2)]);
    right.push([cx - nx * (w / 2), cy - ny * (w / 2)]);
    centers.push({ c: [cx, cy], t: [tx, ty], r: w / 2 });
  }
  // tapas redondas
  const poly: Pt[] = [...left];
  const last = centers[centers.length - 1];
  const capN = 4;
  for (let j = 1; j < capN; j++) {
    const th = (j / capN) * Math.PI;
    const ca = Math.cos(th);
    const sa = Math.sin(th);
    poly.push([last.c[0] + (-last.t[1] * ca + last.t[0] * sa) * last.r, last.c[1] + (last.t[0] * ca + last.t[1] * sa) * last.r]);
  }
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  const first = centers[0];
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
    if (points.length && (o.progress ?? 1) > 0) return circlePath(points[0], (o.width ?? 14) * 0.3);
    return "";
  }
  return smoothClosedPath(poly);
};

/** Puntos de un círculo/elipse dibujado a mano: espiral que no cierra del todo (se pasa un poco). */
export const handEllipsePoints = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  opts: { rotate?: number; startAngle?: number; overlap?: number; seed?: number; drift?: number; sweep?: number } = {},
): Pt[] => {
  const seed = opts.seed ?? 1;
  const rot = deg(opts.rotate ?? 0);
  const a0 = deg(opts.startAngle ?? -115 + noise1(seed + 3, 0.5) * 25);
  const sweep = deg(opts.sweep ?? 360 + (opts.overlap ?? 26));
  const drift = opts.drift ?? Math.min(rx, ry) * 0.07;
  const n = Math.max(16, Math.ceil(((rx + ry) * Math.PI * (sweep / (Math.PI * 2))) / 9));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + sweep * u;
    const wob = 1 + 0.03 * noise1(seed + 9, u * 3.1);
    const rr = 1 + (drift / Math.min(rx, ry)) * (u - 0.5);
    const px = Math.cos(a) * rx * wob * rr;
    const py = Math.sin(a) * ry * wob * rr;
    pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  return pts;
};

// ───────────────────────── Componentes SVG ─────────────────────────

type InkStrokeProps = InkOptions & {
  /** puntos por los que pasa el trazo (mundo). */
  points: readonly Pt[];
  color?: string;
  opacity?: number;
};

/** Trazo de tinta (fragmento SVG: va dentro de un <svg>, p. ej. <InkSvg>). */
export const InkStroke: React.FC<InkStrokeProps> = ({ points, color = COLORS.black, opacity, ...o }) => {
  const d = inkPath(points, o);
  if (!d) return null;
  return <path d={d} fill={color} opacity={opacity} />;
};

type InkEllipseProps = InkOptions & {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  /** inclinación en grados */
  rotate?: number;
  /** cuánto se pasa el trazo al cerrar el óvalo (grados) */
  overlap?: number;
  startAngle?: number;
  color?: string;
  opacity?: number;
};

/** Círculo/óvalo dibujado a mano (como las cabezas de la referencia). */
export const InkEllipse: React.FC<InkEllipseProps> = ({ cx, cy, rx, ry, rotate, overlap, startAngle, color = COLORS.black, opacity, ...o }) => {
  const pts = handEllipsePoints(cx, cy, rx, ry ?? rx, { rotate, overlap, startAngle, seed: o.seed });
  const d = inkPath(pts, { taperStart: (o.width ?? 14) * 2.5, taperEnd: (o.width ?? 14) * 3, startWidth: 0.5, endWidth: 0.3, ...o });
  if (!d) return null;
  return <path d={d} fill={color} opacity={opacity} />;
};

/**
 * Lienzo SVG de mundo: 1×1 con overflow visible, posicionado en (x, y) del mundo; sus hijos usan
 * coordenadas de mundo relativas a ese punto. Sirve para poner trazos sueltos en el mundo.
 */
export const InkSvg: React.FC<{ x?: number; y?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x = 0, y = 0, children, style }) => (
  <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: x, top: y, overflow: "visible", pointerEvents: "none", ...style }}>
    {children}
  </svg>
);

export { f1 };
