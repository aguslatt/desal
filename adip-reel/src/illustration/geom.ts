/**
 * Geometría 2D pura (sin React). Unidades de pantalla (px) a escala 1; y hacia abajo.
 * Un punto es una tupla `[x, y]`.
 */
export type Pt = readonly [number, number];

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Escalón suave 0..1 entre a y b. */
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
};
/** Easing suave (in-out cúbico). */
export const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
/** Parte de un intervalo: 0 antes de `a`, 1 después de `b`. */
export const part = (v: number, a: number, b: number): number => clamp01((v - a) / (b - a || 1));

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const norm = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
/** Perpendicular (+90° en pantalla, sentido horario): (x, y) → (−y, x). */
export const perp = (a: Pt): Pt => [-a[1], a[0]];
export const rad = (d: number): number => (d * Math.PI) / 180;
export const rotate = (a: Pt, r: number, o: Pt = [0, 0]): Pt => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  const x = a[0] - o[0];
  const y = a[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
/** Vector unitario «hacia arriba» inclinado `a` grados hacia adelante (+x): (sin a, −cos a). */
export const up = (a: number): Pt => [Math.sin(rad(a)), -Math.cos(rad(a))];
/** Vector unitario «hacia adelante» perpendicular a up(a): (cos a, sin a). */
export const fwd = (a: number): Pt => [Math.cos(rad(a)), Math.sin(rad(a))];
/** Formato compacto para atributos SVG. */
export const f1 = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

// ───────────────────────── IK de dos huesos ─────────────────────────

/**
 * Cinemática inversa de 2 huesos en el plano. Devuelve la articulación intermedia (codo/rodilla) y el extremo
 * alcanzado (si `target` está fuera de alcance, el miembro se estira hacia él). `bend` = +1 / −1 elige hacia qué
 * lado se dobla (+1: la articulación queda a la derecha del vector raíz→objetivo en pantalla, sentido horario).
 * Los huesos conservan SIEMPRE su largo.
 */
export const ik2 = (root: Pt, target: Pt, l1: number, l2: number, bend: 1 | -1): { mid: Pt; end: Pt } => {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d0 = Math.hypot(dx, dy) || 1e-6;
  // nunca se estira del todo (evita el «salto» del codo al enderezarse): tope al 99 % del alcance
  const d = clamp(d0, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.99);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = Math.acos(cosA);
  const ang = base + bend * a;
  const mid: Pt = [root[0] + Math.cos(ang) * l1, root[1] + Math.sin(ang) * l1];
  const end: Pt = [root[0] + (dx / d0) * d, root[1] + (dy / d0) * d];
  return { mid, end };
};

// ───────────────────────── Catmull-Rom (centrípeta) ─────────────────────────

/** Inserta puntos para que ningún tramo supere `step`. */
export const densify = (pts: readonly Pt[], step: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const d = dist(pts[i], pts[i + 1]);
    const m = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < m; k++) out.push(mix(pts[i], pts[i + 1], k / m));
  }
  if (pts.length) out.push(pts[pts.length - 1]);
  return out;
};

/**
 * Curva suave que pasa por `pts` (Catmull-Rom centrípeta: sin lazos ni sobrepicos con puntos desparejos).
 * Devuelve una polilínea densa (≈ un punto cada `step`).
 */
export const catmullRom = (pts: readonly Pt[], step = 4, closed = false): Pt[] => {
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
    const t1 = d01;
    const t2 = t1 + d12;
    const t3 = t2 + d23;
    const m = Math.max(2, Math.ceil(dist(p1, p2) / step));
    for (let k = 0; k < m; k++) {
      const t = t1 + ((t2 - t1) * k) / m;
      const a1 = mix(p0, p1, t / t1);
      const a2 = mix(p1, p2, (t - t1) / (t2 - t1));
      const a3 = mix(p2, p3, (t - t2) / (t3 - t2));
      const b1 = mix(a1, a2, t / t2);
      const b2 = mix(a2, a3, (t - t1) / (t3 - t1));
      out.push(mix(b1, b2, (t - t1) / (t2 - t1)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};

// ───────────────────────── Curva con longitud de arco ─────────────────────────

export type TipInfo = {
  readonly x: number;
  readonly y: number;
  /** tangente unitaria */
  readonly tx: number;
  readonly ty: number;
  /** ángulo de la tangente en grados (0 = +x, 90 = hacia abajo) */
  readonly angle: number;
  /** longitud de arco hasta este punto */
  readonly length: number;
};

/** Polilínea con longitudes acumuladas: posición/tangente por longitud de arco. */
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

  pointAt(s: number): Pt {
    const n = this.pts.length;
    if (n === 0) return [0, 0];
    if (n === 1 || s <= 0) return this.pts[0];
    if (s >= this.length) return this.pts[n - 1];
    const i = this.seg(s);
    const seglen = this.cum[i + 1] - this.cum[i] || 1;
    return mix(this.pts[i], this.pts[i + 1], (s - this.cum[i]) / seglen);
  }

  /** tangente unitaria (promediada en una ventana corta para no ser poligonal) */
  tangentAt(s: number): Pt {
    const w = Math.max(3, this.length * 0.004);
    const a = this.pointAt(Math.max(0, s - w));
    const b = this.pointAt(Math.min(this.length, s + w));
    return norm(sub(b, a));
  }

  tipAt(s: number): TipInfo {
    const sc = clamp(s, 0, this.length);
    const [x, y] = this.pointAt(sc);
    const [tx, ty] = this.tangentAt(sc);
    return { x, y, tx, ty, angle: (Math.atan2(ty, tx) * 180) / Math.PI, length: sc };
  }
}

// ───────────────────────── Paths SVG ─────────────────────────

/** Path SVG cerrado y suave a partir de un polígono (cuadráticas por los puntos medios). */
export const smoothClosedPath = (poly: readonly Pt[]): string => {
  const n = poly.length;
  if (n < 3) return "";
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(poly[n - 1], poly[0]);
  let d = `M${f1(m0[0])} ${f1(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const m = mid(p, poly[(i + 1) % n]);
    d += `Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`;
  }
  return d + "Z";
};

/**
 * Recorta un polígono con el semiplano { p : (p − o)·d ≤ lim } (Sutherland–Hodgman con un solo borde; `d` unitario).
 * Sirve para REVELAR un relleno plano avanzando con el trazo (un barrido a lo largo de `d`) en vez de aparecer por opacidad.
 */
export const clipPoly = (poly: readonly Pt[], o: Pt, d: Pt, lim: number): Pt[] => {
  const s = (p: Pt) => (p[0] - o[0]) * d[0] + (p[1] - o[1]) * d[1] - lim;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = s(a);
    const sb = s(b);
    if (sa <= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const u = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    }
  }
  return out;
};

/** Barrido por la propia extensión del polígono: t = 0 nada, t = 1 completo; avanza en la dirección `d` (unitaria). */
export const sweepPoly = (poly: readonly Pt[], d: Pt, t: number): Pt[] => {
  if (t >= 1) return poly.slice();
  if (t <= 0 || poly.length < 3) return [];
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of poly) {
    const v = p[0] * d[0] + p[1] * d[1];
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return clipPoly(poly, [0, 0], d, lo + (hi - lo) * t);
};

/** Elipse como polígono (rellenos). */
export const ellipsePoly = (cx: number, cy: number, rx: number, ry: number, rotDeg = 0, n = 24): Pt[] => {
  const out: Pt[] = [];
  const r = rad(rotDeg);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(rotate([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], r, [cx, cy]));
  }
  return out;
};

/**
 * Desplaza una polilínea densa lateralmente: para cada punto, `off(i, t)` (t = 0..1 a lo largo) da la distancia con signo
 * (positiva = lado «derecho» de la marcha en pantalla, es decir perp(tangente)).
 */
export const offsetLine = (pts: readonly Pt[], off: (i: number, t: number) => number): Pt[] => {
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const t = norm(sub(b, a));
    const nrm = perp(t);
    const o = off(i, n > 1 ? i / (n - 1) : 0);
    out.push([pts[i][0] + nrm[0] * o, pts[i][1] + nrm[1] * o]);
  }
  return out;
};
