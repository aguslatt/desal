import { parsePath, reduceInstructions } from "@remotion/paths";

/**
 * Geometría 2D pura (sin React). Convención: unidades de MUNDO, y hacia abajo (como SVG/pantalla).
 * Un punto es una tupla `[x, y]`.
 */
export type Pt = readonly [number, number];

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
};
/** Easing suave (in-out cúbico) 0..1. */
export const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const len = (a: Pt): number => Math.hypot(a[0], a[1]);
export const norm = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
/** Perpendicular (gira 90° en sentido horario en pantalla): (x, y) → (−y, x). */
export const perp = (a: Pt): Pt => [-a[1], a[0]];
export const rotate = (a: Pt, rad: number, o: Pt = [0, 0]): Pt => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const x = a[0] - o[0];
  const y = a[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
export const deg = (d: number): number => (d * Math.PI) / 180;

/** Formato compacto de números para atributos SVG. */
export const f1 = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

// ───────────────────────── Curvas de Catmull-Rom (centrípeta) ─────────────────────────

/**
 * Curva suave que pasa por `pts` (Catmull-Rom centrípeta: sin lazos ni sobrepicos aunque los puntos
 * estén muy desparejos). Devuelve una polilínea densa (≈ un punto cada `step` u).
 */
export const catmullRom = (pts: readonly Pt[], step = 6, closed = false): Pt[] => {
  const n = pts.length;
  if (n < 2) return pts.slice();
  if (n === 2) return densify(pts, step);
  const out: Pt[] = [];
  const get = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n];
    if (i < 0) return sub(mul(pts[0], 2), pts[1]);
    if (i >= n) return sub(mul(pts[n - 1], 2), pts[n - 2]);
    return pts[i];
  };
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const d01 = Math.pow(dist(p0, p1), 0.5) || 1e-4;
    const d12 = Math.pow(dist(p1, p2), 0.5) || 1e-4;
    const d23 = Math.pow(dist(p2, p3), 0.5) || 1e-4;
    const t0 = 0;
    const t1 = t0 + d01;
    const t2 = t1 + d12;
    const t3 = t2 + d23;
    const segLen = dist(p1, p2);
    const m = Math.max(2, Math.ceil(segLen / step));
    for (let k = 0; k < m; k++) {
      const t = t1 + ((t2 - t1) * k) / m;
      const a1 = mix(p0, p1, (t - t0) / (t1 - t0));
      const a2 = mix(p1, p2, (t - t1) / (t2 - t1));
      const a3 = mix(p2, p3, (t - t2) / (t3 - t2));
      const b1 = mix(a1, a2, (t - t0) / (t2 - t0));
      const b2 = mix(a2, a3, (t - t1) / (t3 - t1));
      out.push(mix(b1, b2, (t - t1) / (t2 - t1)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};

/** Inserta puntos intermedios para que ningún tramo supere `step`. */
export const densify = (pts: readonly Pt[], step: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const d = dist(pts[i], pts[i + 1]);
    const m = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < m; k++) out.push(mix(pts[i], pts[i + 1], k / m));
  }
  out.push(pts[pts.length - 1]);
  return out;
};

// ───────────────────────── Curva parametrizada por longitud de arco ─────────────────────────

export type TipInfo = {
  readonly x: number;
  readonly y: number;
  /** tangente unitaria */
  readonly tx: number;
  readonly ty: number;
  /** ángulo de la tangente en grados (0 = hacia +x, 90 = hacia abajo) */
  readonly angle: number;
  /** longitud de arco recorrida hasta este punto (u de mundo) */
  readonly length: number;
};

/** Polilínea con longitudes acumuladas: posición/tangente a una longitud de arco dada. */
export class Curve {
  readonly pts: readonly Pt[];
  readonly cum: Float64Array;
  readonly length: number;

  constructor(pts: readonly Pt[]) {
    this.pts = pts;
    this.cum = new Float64Array(pts.length);
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      acc += dist(pts[i - 1], pts[i]);
      this.cum[i] = acc;
    }
    this.length = acc;
  }

  /** índice del segmento que contiene la longitud `s` */
  private seg(s: number): number {
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /** punto a longitud de arco `s` (se satura en los extremos) */
  pointAt(s: number): Pt {
    const n = this.pts.length;
    if (n === 0) return [0, 0];
    if (n === 1 || s <= 0) return this.pts[0];
    if (s >= this.length) return this.pts[n - 1];
    const i = this.seg(s);
    const a = this.pts[i];
    const b = this.pts[i + 1];
    const seglen = this.cum[i + 1] - this.cum[i] || 1;
    return mix(a, b, (s - this.cum[i]) / seglen);
  }

  /** tangente unitaria a longitud `s` (promediada en una ventana corta para no ser «poligonal») */
  tangentAt(s: number): Pt {
    const w = Math.max(2, this.length * 0.004);
    const a = this.pointAt(Math.max(0, s - w));
    const b = this.pointAt(Math.min(this.length, s + w));
    return norm(sub(b, a));
  }

  /** punta del trazo cuando se dibujó la fracción `p` (0..1) de su longitud */
  tip(p: number): TipInfo {
    const s = clamp01(p) * this.length;
    const [x, y] = this.pointAt(s);
    const [tx, ty] = this.tangentAt(s);
    return { x, y, tx, ty, angle: (Math.atan2(ty, tx) * 180) / Math.PI, length: s };
  }

  /** subpolilínea entre las longitudes s0 y s1 */
  slice(s0: number, s1: number): Pt[] {
    const out: Pt[] = [this.pointAt(s0)];
    for (let i = 0; i < this.pts.length; i++) {
      if (this.cum[i] > s0 && this.cum[i] < s1) out.push(this.pts[i]);
    }
    out.push(this.pointAt(s1));
    return out;
  }
}

// ───────────────────────── Paths SVG → polilínea ─────────────────────────

/**
 * Aplana un path SVG (M L C Q S T H V Z y relativos) a una polilínea. Solo el primer trazo continuo:
 * los `M` posteriores se tratan como `L` (el hilo es UNA curva continua).
 */
export const flattenPath = (d: string, tol = 4): Pt[] => {
  const ins = reduceInstructions(parsePath(d));
  const out: Pt[] = [];
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  for (const i of ins) {
    if (i.type === "M") {
      cur = [i.x, i.y];
      start = cur;
      out.push(cur);
    } else if (i.type === "L") {
      cur = [i.x, i.y];
      out.push(cur);
    } else if (i.type === "C") {
      const p0 = cur;
      const p1: Pt = [i.cp1x, i.cp1y];
      const p2: Pt = [i.cp2x, i.cp2y];
      const p3: Pt = [i.x, i.y];
      const approx = dist(p0, p1) + dist(p1, p2) + dist(p2, p3);
      const m = Math.max(4, Math.ceil(approx / tol));
      for (let k = 1; k <= m; k++) {
        const t = k / m;
        const u = 1 - t;
        out.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
      cur = p3;
    } else if (i.type === "Z") {
      out.push(start);
      cur = start;
    }
  }
  // elimina duplicados consecutivos
  return out.filter((p, k) => k === 0 || dist(p, out[k - 1]) > 1e-6);
};

// ───────────────────────── Polígonos → path suave ─────────────────────────

/** Path SVG cerrado y suave a partir de un polígono (cuadráticas por los puntos medios). */
export const smoothClosedPath = (poly: readonly Pt[]): string => {
  const n = poly.length;
  if (n < 3) return "";
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = "";
  const m0 = mid(poly[n - 1], poly[0]);
  d += `M${f1(m0[0])} ${f1(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const m = mid(p, poly[(i + 1) % n]);
    d += `Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`;
  }
  return d + "Z";
};

/** Path SVG abierto con L (polilínea). */
export const polylinePath = (pts: readonly Pt[]): string => {
  let d = "";
  for (let i = 0; i < pts.length; i++) d += `${i === 0 ? "M" : "L"}${f1(pts[i][0])} ${f1(pts[i][1])}`;
  return d;
};

/** Punto dentro de un polígono (par-impar). */
export const pointInPolygon = (p: Pt, poly: readonly Pt[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Elipse aproximada como polígono (para rellenos). */
export const ellipsePoly = (cx: number, cy: number, rx: number, ry: number, rotDeg = 0, n = 28): Pt[] => {
  const out: Pt[] = [];
  const r = deg(rotDeg);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(rotate([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], r, [cx, cy]));
  }
  return out;
};
