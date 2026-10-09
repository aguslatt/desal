import { catmullRom, dist, norm, sub, type Pt } from "./geom.ts";
import type { ListeningAnchors } from "./Listening.tsx";

/**
 * AYUDANTES PARA ARMAR LA CURVA DE CONEXIÓN (puros, en coordenadas de PANTALLA).
 *  · `connectionPoints(anchors)`  → puntos de control de la curva que nace cerca de B, pasa por el espacio entre las dos
 *    cabezas y sube (recorrido ABIERTO y claro, nunca un lazo).
 *  · `extendCurve(base, target, {avoid})` → continúa la curva hasta un destino (p. ej. el logo) esquivando cajas prohibidas
 *    (texto/logo) con `clearance` px de aire (por defecto 40) más la mitad del grosor del trazo.
 *  · `curveClearance(points, boxes, halfWidth)` → holgura mínima medida (px) entre el borde del trazo y las cajas.
 */
export type Box = { x0: number; y0: number; x1: number; y1: number };

export const inflate = (b: Box, m: number): Box => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m });

/** Distancia de un punto a una caja (0 si está dentro). */
export const distToBox = (p: Pt, b: Box): number => {
  const dx = Math.max(b.x0 - p[0], 0, p[0] - b.x1);
  const dy = Math.max(b.y0 - p[1], 0, p[1] - b.y1);
  return Math.hypot(dx, dy);
};

const insideStrict = (p: Pt, b: Box, eps = 0.01): boolean => p[0] > b.x0 + eps && p[0] < b.x1 - eps && p[1] > b.y0 + eps && p[1] < b.y1 - eps;

/** ¿El segmento a–b atraviesa el INTERIOR de la caja? (rozar el borde no cuenta) */
const segmentCrosses = (a: Pt, b: Pt, box: Box): boolean => {
  if (insideStrict(a, box) || insideStrict(b, box)) return true;
  // Liang–Barsky sobre la caja encogida 0,01
  const eps = 0.01;
  const x0 = box.x0 + eps;
  const x1 = box.x1 - eps;
  const y0 = box.y0 + eps;
  const y1 = box.y1 - eps;
  if (x1 <= x0 || y1 <= y0) return false;
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - x0, x1 - a[0], a[1] - y0, y1 - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 < t1;
};

/**
 * Holgura mínima (px) entre el BORDE del trazo (eje ± halfWidth) y las cajas, medida sobre la curva suavizada que se dibuja.
 * Negativa si el trazo entra en alguna caja. Usá el mismo `halfWidth` que el grosor real (ancho / 2).
 */
export const curveClearance = (control: readonly Pt[], boxes: readonly Box[], halfWidth = 0): number => {
  const pts = catmullRom(control, 4);
  let min = Infinity;
  for (const p of pts) {
    for (const b of boxes) {
      const inside = p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1;
      let d: number;
      if (inside) d = -Math.min(p[0] - b.x0, b.x1 - p[0], p[1] - b.y0, b.y1 - p[1]);
      else d = distToBox(p, b);
      min = Math.min(min, d - halfWidth);
    }
  }
  return min;
};

export type ExtendOptions = {
  /** cajas prohibidas (texto, logo, la pareja…) */
  avoid?: readonly Box[];
  /** aire mínimo entre el borde del trazo y las cajas (px). Por defecto 40. */
  clearance?: number;
  /** mitad del grosor del trazo (px). Por defecto 7 (curva de 14 px). */
  halfWidth?: number;
  /** dirección con que llega al destino (vector; se normaliza). Por defecto: la del último tramo. */
  arrive?: Pt;
  /** distancia del punto de entrada al destino sobre `arrive` (px). Por defecto 70. */
  arriveLen?: number;
};

type Node = { p: Pt };

/**
 * Spline de Hermite por puntos clave con tangentes dadas (vectores unitarios; la magnitud se toma de la distancia al vecino):
 * curva C¹ sin ganchos ni bucles. Devuelve una polilínea (≈ `per` puntos por tramo).
 */
export const hermite = (keys: readonly { p: Pt; dir: Pt }[], per = 10): Pt[] => {
  const out: Pt[] = [];
  const n = keys.length;
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    const chord = dist(a.p, b.p);
    const ma: Pt = [norm(a.dir)[0] * chord, norm(a.dir)[1] * chord];
    const mb: Pt = [norm(b.dir)[0] * chord, norm(b.dir)[1] * chord];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      out.push([h00 * a.p[0] + h10 * ma[0] + h01 * b.p[0] + h11 * mb[0], h00 * a.p[1] + h10 * ma[1] + h01 * b.p[1] + h11 * mb[1]]);
    }
  }
  out.push(keys[n - 1].p);
  return out;
};

/** Redondea las esquinas de una polilínea con arcos cuadráticos (radio ≤ `r`, ≤ 40 % de cada tramo). */
const fillet = (pts: readonly Pt[], r: number): Pt[] => {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const w = pts[i];
    const c = pts[i + 1];
    const l1 = dist(a, w);
    const l2 = dist(w, c);
    const rr = Math.min(r, l1 * 0.4, l2 * 0.4);
    if (rr < 4) {
      out.push(w);
      continue;
    }
    const u = norm(sub(a, w));
    const v = norm(sub(c, w));
    const p0: Pt = [w[0] + u[0] * rr, w[1] + u[1] * rr];
    const p1: Pt = [w[0] + v[0] * rr, w[1] + v[1] * rr];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      out.push([(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * w[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * w[1] + t * t * p1[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** Saca un punto fuera de las cajas (lo empuja al borde más cercano + 1 px). */
const pushOut = (p: Pt, boxes: readonly Box[]): Pt => {
  let q: Pt = p;
  for (let guard = 0; guard < 6; guard++) {
    const hit = boxes.find((b) => insideStrict(q, b, 0));
    if (!hit) return q;
    const dl = q[0] - hit.x0;
    const dr = hit.x1 - q[0];
    const dt = q[1] - hit.y0;
    const db = hit.y1 - q[1];
    const m = Math.min(dl, dr, dt, db);
    q = m === dl ? [hit.x0 - 1, q[1]] : m === dr ? [hit.x1 + 1, q[1]] : m === dt ? [q[0], hit.y0 - 1] : [q[0], hit.y1 + 1];
  }
  return q;
};

/**
 * Camino más corto de `a` a `b` que NO cruza el interior de las cajas (grafo de visibilidad por las esquinas).
 * Devuelve los puntos intermedios (sin a ni b). Si no hay camino, línea directa.
 */
const shortestPath = (a: Pt, b: Pt, boxes: readonly Box[]): Pt[] => {
  const nodes: Node[] = [{ p: a }, { p: b }];
  for (const bx of boxes) {
    nodes.push({ p: [bx.x0, bx.y0] }, { p: [bx.x1, bx.y0] }, { p: [bx.x1, bx.y1] }, { p: [bx.x0, bx.y1] });
  }
  const free = (u: Pt, v: Pt) => boxes.every((bx) => !segmentCrosses(u, v, bx));
  const n = nodes.length;
  const d = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const done = new Array<boolean>(n).fill(false);
  d[0] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0 || d[u] === Infinity) break;
    done[u] = true;
    if (u === 1) break;
    for (let v = 0; v < n; v++) {
      if (done[v]) continue;
      if (!free(nodes[u].p, nodes[v].p)) continue;
      const w = d[u] + dist(nodes[u].p, nodes[v].p);
      if (w < d[v]) {
        d[v] = w;
        prev[v] = u;
      }
    }
  }
  if (prev[1] < 0) return [];
  const out: Pt[] = [];
  for (let v = prev[1]; v > 0; v = prev[v]) out.push(nodes[v].p);
  return out.reverse();
};

/** Parte la polilínea para que ningún tramo supere `maxLen` (la suavización no se aleja de los tramos largos). */
const subdivide = (pts: readonly Pt[], maxLen: number): Pt[] => {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const m = Math.max(1, Math.ceil(dist(a, b) / maxLen));
    for (let k = 1; k <= m; k++) out.push([a[0] + ((b[0] - a[0]) * k) / m, a[1] + ((b[1] - a[1]) * k) / m]);
  }
  return out;
};

/**
 * Continúa la curva `base` (puntos de control) hasta `target` esquivando las cajas de `avoid` con `clearance` px de aire.
 * Devuelve los puntos de control de la curva COMPLETA (base + tramo nuevo): pasalos a <OpenCurve points=…>. La salida es
 * continua en tangente con la base y llega a `target` con la dirección `arrive`. Se verifica la holgura sobre la curva ya
 * suavizada y se ensancha el rodeo hasta cumplirla (`curveClearance` ≥ clearance).
 */
export const extendCurve = (base0: readonly Pt[], target: Pt, o: ExtendOptions = {}): Pt[] => {
  let base = base0;
  const avoid = o.avoid ?? [];
  const clearance = o.clearance ?? 40;
  const half = o.halfWidth ?? 7;
  // si la base ya entra en el aire prohibido, se corta donde empieza a entrar y se continúa desde ahí
  const trimBox = avoid.map((b) => inflate(b, clearance + half + 2));
  let cut = base.length;
  for (let i = 0; i < base.length; i++) {
    if (trimBox.some((b) => insideStrict(base[i], b, 0))) {
      // se corta con «pista» (≥ 140 px antes de la intrusión) para que el giro hacia el rodeo sea amplio
      let j = i;
      let acc = 0;
      while (j > 2 && acc < 140) {
        acc += dist(base[j], base[j - 1]);
        j--;
      }
      cut = Math.max(2, j);
      break;
    }
  }
  if (cut < base.length) base = base.slice(0, cut);
  const last = base[base.length - 1];
  const prevP = base[Math.max(0, base.length - 2)];
  const tan0 = norm(sub(last, prevP));
  const arrive = o.arrive ? norm(o.arrive) : null;
  const leadIn = 60;
  const arriveLen = o.arriveLen ?? 70;
  let margin = clearance + half + 2;
  let best: Pt[] = [...base, target];
  let bestC = -Infinity;
  for (let iter = 0; iter < 14; iter++) {
    const boxes = avoid.map((b) => inflate(b, margin));
    // los puntos de partida/llegada no pueden quedar dentro del aire prohibido: se corren hacia afuera
    const tgt = pushOut(target, boxes);
    const start0: Pt = base.length > 1 ? [last[0] + tan0[0] * leadIn, last[1] + tan0[1] * leadIn] : last;
    const start = pushOut(start0, boxes);
    const goal0: Pt = arrive ? [tgt[0] - arrive[0] * arriveLen, tgt[1] - arrive[1] * arriveLen] : tgt;
    const goal = pushOut(goal0, boxes);
    const inner = shortestPath(start, goal, boxes);
    const route: Pt[] = [...(base.length > 1 ? [start] : []), ...inner, ...(arrive ? [goal] : []), tgt];
    // esquinas redondeadas (la curva se ve barrida, no en ángulo) y tramos largos subdivididos para que la suavización no «corte»
    const dense = subdivide(fillet([last, ...route], 150), 90).slice(1);
    const ctrl: Pt[] = [...base, ...dense];
    const c = avoid.length ? curveClearance(ctrl, avoid, half) : Infinity;
    if (c > bestC) {
      bestC = c;
      best = ctrl;
    }
    if (c >= clearance - 0.5) return ctrl;
    margin += Math.max(4, clearance - c);
  }
  return best;
};

// ───────────────────────── curva de conexión A–B ─────────────────────────

export type ConnectionOptions = {
  /**
   * «rise»: una S suave que nace sobre la mano de B, sube por el espacio entre las dos cabezas y sigue hacia arriba.
   * «sweep»: gran curva barrida (como las de la referencia): nace en la mano de B, pasa entre las cabezas, rodea por arriba a A
   * y sale del cuadro por la izquierda.
   */
  shape?: "rise" | "sweep";
  /** y de pantalla donde termina la «rise» (por defecto, por encima de las cabezas). Usá 0 para salir del cuadro por arriba. */
  endY?: number;
  /** desvío lateral (px a escala 1) del tramo alto de la «rise»: + hacia la derecha. Por defecto 0. */
  drift?: number;
};

/**
 * Puntos de control de la curva que une a las dos personas: NACE cerca de B (sobre su mano abierta, con aire), pasa por el
 * espacio entre las dos cabezas y sigue hacia arriba. Recorrido abierto y claro, nunca un lazo.
 * Se calcula con las anclas de la escena asentada (`settledAnchors(place)`); si querés que nazca desde el otro extremo, invertí el arreglo.
 */
export const connectionPoints = (a: ListeningAnchors, o: ConnectionOptions = {}): Pt[] => {
  const s = a.scale;
  const [bx, by] = a.curveBirth;
  const gx = a.gap[0];
  const headTop = Math.min(a.headA[1], a.headB[1]) - 34 * s;
  const drift = (o.drift ?? 0) * s;
  const mid: Pt = [gx + 4 * s, (by + headTop) / 2];
  if (o.shape === "sweep") {
    return hermite(
      [
        { p: [bx, by], dir: [-0.35, -1] },
        { p: mid, dir: [-0.12, -1] },
        { p: [a.headA[0] + 90 * s, headTop - 150 * s], dir: [-0.8, -0.6] },
        { p: [a.headA[0] - 200 * s, headTop - 215 * s], dir: [-1, 0.02] },
        { p: [a.headA[0] - 520 * s, headTop - 140 * s], dir: [-1, 0.4] },
      ],
      9,
    );
  }
  const endY = o.endY ?? headTop - 170 * s;
  const top: Pt = [gx + 26 * s + drift * 0.3, headTop - 60 * s];
  const keys: { p: Pt; dir: Pt }[] = [
    { p: [bx, by], dir: [-0.4, -1] },
    { p: mid, dir: [-0.04, -1] },
    { p: top, dir: [0.2, -1] },
  ];
  if (endY < top[1] - 40) keys.push({ p: [gx + 44 * s + drift, endY], dir: [0.1, -1] });
  return hermite(keys, 9);
};
