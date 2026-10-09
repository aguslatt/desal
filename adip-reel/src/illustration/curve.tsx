import React from "react";
import { ROLE } from "../config/brand.ts";
import { Curve, catmullRom, clamp, clamp01, lerp, smoothstep, type Pt, type TipInfo } from "./geom.ts";
import { hash01, noise1 } from "./noise.ts";

/**
 * CURVA ABIERTA DE CRAYÓN — el «hilo» naranja: una curva barrida de UN solo color, de grosor irregular, extremos redondeados y
 * borde granulado (textura barata: sin filtros SVG, sin patrones; un puñado de `<path>`), que se dibuja progresivamente.
 *
 *  · Se define por PUNTOS de control (la curva pasa por ellos: Catmull-Rom centrípeta, sin lazos) en las unidades del contenedor
 *    donde la pongas (si la ponés en pantalla: px de pantalla; el grosor `width` está en esas mismas unidades: ≈ 14 px de pantalla).
 *  · `progress` 0..1 = fracción dibujada (la punta redonda avanza); `from` 0..1 = fracción donde empieza (para «borrar» la cola).
 *  · `makeOpenCurve(points)` expone longitud y `pointAt(progress)` (posición + tangente) para anclar cosas a la punta.
 *  · Determinista: el grano y la irregularidad dependen de la semilla y de la longitud de arco (no «nadan» al dibujarse).
 */
export const CURVE_WIDTH = 14;

export type OpenCurveGeometry = {
  /** polilínea densa del eje */
  readonly points: readonly Pt[];
  /** longitud total */
  readonly length: number;
  /** punta (posición, tangente y ángulo) cuando se dibujó la fracción `progress` (0..1) */
  readonly pointAt: (progress: number) => TipInfo;
  /** lo mismo por longitud de arco absoluta */
  readonly at: (length: number) => TipInfo;
  readonly curve: Curve;
};

const cache = new Map<string, OpenCurveGeometry>();

/** Geometría de la curva (memoizada por sus puntos de control). Los extremos NO se cierran: nunca es un lazo. */
export const makeOpenCurve = (control: readonly Pt[]): OpenCurveGeometry => {
  const key = control.map((p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`).join(";");
  const hit = cache.get(key);
  if (hit) return hit;
  const pts = catmullRom(control, 3);
  const curve = new Curve(pts);
  const geo: OpenCurveGeometry = {
    points: pts,
    length: curve.length,
    pointAt: (p) => curve.tipAt(clamp01(p) * curve.length),
    at: (s) => curve.tipAt(s),
    curve,
  };
  if (cache.size > 60) cache.clear();
  cache.set(key, geo);
  return geo;
};

export type OpenCurveProps = {
  /** puntos de control (en las unidades de este SVG) */
  points: readonly Pt[];
  /** fracción 0..1 dibujada */
  progress?: number;
  /** fracción 0..1 donde empieza el trazo visible */
  from?: number;
  /** grosor (px del contenedor). 14 = curva principal; 4–6 = curvas secundarias finas. */
  width?: number;
  /** color de la paleta (por defecto el naranja del hilo) */
  color?: string;
  /** color del papel que asoma por la textura de crayón (por defecto el gris del manual) */
  paper?: string;
  seed?: number;
  /** 0..1 cantidad de grano (0 = plano). Por defecto 1. */
  grain?: number;
  opacity?: number;
};

type Ribbon = { body: string; specks: string; dust: string; streak: string };

const SPACING = 3;

/** Contornos del crayón entre dos longitudes de arco. Pura. */
export const crayonRibbon = (geo: OpenCurveGeometry, sFrom: number, sTo: number, width: number, seed: number, grain: number): Ribbon => {
  const L = geo.length;
  const empty: Ribbon = { body: "", specks: "", dust: "", streak: "" };
  if (L < 2 || sTo - sFrom < 0.5) return empty;
  const w0 = width;
  const k = w0 / CURVE_WIDTH;
  const N = Math.max(2, Math.ceil((sTo - sFrom) / SPACING));
  const left: Pt[] = [];
  const right: Pt[] = [];
  const centers: { c: Pt; t: Pt; r: number }[] = [];
  const tIn = Math.max(12, w0 * 4);
  const tOut = Math.max(14, w0 * 4.5);
  const streakPts: Pt[][] = [[], []];
  for (let i = 0; i <= N; i++) {
    const s = sFrom + ((sTo - sFrom) * i) / N;
    const info = geo.at(s);
    const nx = -info.ty;
    const ny = info.tx;
    // grosor irregular: variación lenta (presión de la mano) + otra más rápida; la punta inicial «apoya» y la final se redondea
    const irr = 1 + 0.15 * noise1(seed + 1, s / 260) + 0.07 * noise1(seed + 2, s / 64);
    const rampIn = lerp(0.62, 1, smoothstep(0, tIn, s));
    const rampOut = lerp(0.7, 1, smoothstep(0, tOut, L - s));
    const w = w0 * irr * rampIn * rampOut;
    const off = w0 * 0.09 * noise1(seed + 6, s / 210);
    const cx = info.x + nx * off;
    const cy = info.y + ny * off;
    // borde granulado: rugosidad fina en cada orilla
    const rl = 0.5 * w + 1.15 * k * noise1(seed + 3, s / 2.3) * grain + 0.55 * k * noise1(seed + 13, s / 0.9) * grain;
    const rr = 0.5 * w + 1.15 * k * noise1(seed + 4, s / 2.3) * grain + 0.55 * k * noise1(seed + 14, s / 0.9) * grain;
    left.push([cx + nx * rl, cy + ny * rl]);
    right.push([cx - nx * rr, cy - ny * rr]);
    centers.push({ c: [cx, cy], t: [info.tx, info.ty], r: w / 2 });
    streakPts[0].push([cx + nx * w * 0.2, cy + ny * w * 0.2]);
    streakPts[1].push([cx - nx * w * 0.27, cy - ny * w * 0.27]);
  }
  // contorno: izquierda → tapa redonda → derecha (volviendo) → tapa redonda
  const poly: Pt[] = [...left];
  const last = centers[centers.length - 1];
  const first = centers[0];
  const cap = (c: (typeof centers)[number], sign: 1 | -1, out: Pt[]) => {
    const n = 6;
    for (let j = 1; j < n; j++) {
      const th = (j / n) * Math.PI;
      const ca = Math.cos(th);
      const sa = Math.sin(th);
      out.push([c.c[0] + sign * (-c.t[1] * ca + c.t[0] * sa) * c.r, c.c[1] + sign * (c.t[0] * ca + c.t[1] * sa) * c.r]);
    }
  };
  cap(last, 1, poly);
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  cap(first, -1, poly);
  const f = (v: number) => Math.round(v * 10) / 10;
  let body = `M${f(poly[0][0])} ${f(poly[0][1])}`;
  for (let i = 1; i < poly.length; i++) body += `L${f(poly[i][0])} ${f(poly[i][1])}`;
  body += "Z";

  // granos: puntos del color del papel DENTRO del cuerpo (huecos del diente del papel) y polvo del color del crayón en las orillas
  let specks = "";
  let dust = "";
  if (grain > 0) {
    const step = Math.max(2.2, 4 * k);
    const s0 = Math.floor(sFrom / step);
    const s1 = Math.ceil(sTo / step);
    for (let q = s0; q <= s1; q++) {
      const h1 = hash01(seed * 17 + 3, q, 1);
      const h2 = hash01(seed * 17 + 5, q, 2);
      const h3 = hash01(seed * 17 + 7, q, 3);
      const h4 = hash01(seed * 17 + 11, q, 4);
      const s = clamp(q * step + h1 * step, sFrom, sTo);
      const info = geo.at(s);
      const nx = -info.ty;
      const ny = info.tx;
      const irr = 1 + 0.15 * noise1(seed + 1, s / 260) + 0.07 * noise1(seed + 2, s / 64);
      const halfw = 0.5 * w0 * irr;
      if (h2 < 0.9 * grain) {
        // el diente del papel asoma sobre todo hacia las orillas
        const side = h3 < 0.5 ? 1 : -1;
        const u = side * (0.3 + 0.62 * Math.pow(h4, 0.7)) * halfw;
        const r = (0.55 + 1.15 * hash01(seed * 17 + 13, q, 5)) * Math.max(0.55, k);
        const x = info.x + nx * u;
        const y = info.y + ny * u;
        specks += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
      }
      if (h1 < 0.6 * grain) {
        const side = h3 < 0.5 ? 1 : -1;
        const u = side * (halfw + (0.2 + 3.0 * h4) * Math.max(0.5, k));
        const r = (0.4 + 0.9 * h2) * Math.max(0.55, k);
        const x = info.x + nx * u;
        const y = info.y + ny * u;
        dust += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
      }
    }
  }
  let streak = "";
  if (grain > 0) {
    const sp = streakPts[0].slice(3, -3);
    if (sp.length > 4) {
      streak += `M${f(sp[0][0])} ${f(sp[0][1])}`;
      for (let i = 1; i < sp.length; i++) streak += `L${f(sp[i][0])} ${f(sp[i][1])}`;
    }
  }
  return { body, specks, dust, streak };
};

/**
 * Curva de crayón. Va dentro de un <svg> (o usá `<OpenCurveSvg>`, que trae el suyo de 1080×1920).
 * Todo el trazo visible se genera con `crayonRibbon` (≈ 4 `<path>`), apto para curvas largas.
 */
export const OpenCurve: React.FC<OpenCurveProps> = ({ points, progress = 1, from = 0, width = CURVE_WIDTH, color = ROLE.thread, paper = ROLE.paper, seed = 7, grain = 1, opacity = 1 }) => {
  const geo = makeOpenCurve(points);
  const p = clamp01(progress);
  const sTo = geo.length * p;
  const sFrom = geo.length * clamp01(from);
  const r = crayonRibbon(geo, sFrom, sTo, width, seed, grain);
  if (!r.body) return null;
  const k = width / CURVE_WIDTH;
  return (
    <g opacity={opacity}>
      <path d={r.body} fill={color} />
      {r.dust ? <path d={r.dust} fill={color} opacity={0.9} /> : null}
      {r.streak ? <path d={r.streak} fill="none" stroke={paper} strokeOpacity={0.3} strokeWidth={Math.max(0.8, 1.3 * k)} strokeLinecap="round" strokeDasharray={`${54 * k} ${22 * k} ${12 * k} ${70 * k} ${30 * k} ${16 * k}`} /> : null}
      {r.specks ? <path d={r.specks} fill={paper} opacity={0.6} /> : null}
    </g>
  );
};

/** Lo mismo con su propio <svg> de 1080×1920 (para ponerla suelta en la escena en coordenadas de pantalla). */
export const OpenCurveSvg: React.FC<OpenCurveProps & { style?: React.CSSProperties }> = ({ style, ...p }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
    <OpenCurve {...p} />
  </svg>
);

