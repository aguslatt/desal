import React, { useId } from "react";
import { COLORS } from "../config/brand.ts";
import { mulberry32 } from "../lib/rng.ts";
import { useCamera, type CameraState } from "../world/cameraContext.ts";
import { Curve, catmullRom, clamp, clamp01, flattenPath, lerp, polylinePath, smoothClosedPath, smoothstep, type Pt, type TipInfo } from "./geom.ts";
import { noise1 } from "./noise.ts";

/**
 * CURVA DE CRAYÓN — el «hilo» naranja: una curva barrida de un solo color, de grosor irregular y borde
 * granulado, que se dibuja progresivamente y nunca parece un tubo.
 *
 *  · Se define en unidades de MUNDO (`d` de SVG o `points` por los que pasa).
 *  · El grosor se da EN PANTALLA (px) y se compensa con la cámara (`useCamera()`), de modo que se ve casi
 *    constante al acercar/alejar (≈ 14 px por defecto).
 *  · Textura barata (sin filtros SVG): el borde es un patrón de puntos (diente del papel) detrás de un núcleo
 *    sólido, más motas claras/oscuras dentro. El grano está fijo a la PANTALLA (como el diente del papel: el
 *    trazo se desliza sobre él), así no «nada» ni parpadea cuando la cámara se mueve.
 *  · Para anclar cosas a la punta: `makeCurve({...}).tip(progress)` → {x, y, tx, ty, angle, length}.
 */
export type CrayonSource = {
  /** path SVG en unidades de mundo (UNA curva continua). */
  d?: string;
  /** o puntos por los que pasa la curva (Catmull-Rom). */
  points?: readonly Pt[];
};

export type CrayonData = {
  /** polilínea densa del eje (mundo). */
  readonly curve: Curve;
  /** longitud total en u de mundo. */
  readonly length: number;
  /** posición, tangente y longitud de la punta cuando se dibujó la fracción `progress` (0..1). */
  readonly tip: (progress: number) => TipInfo;
  /** punto/tangente a una longitud de arco absoluta (u). */
  readonly at: (length: number) => TipInfo;
};

const cache = new Map<string, CrayonData>();

/**
 * Pre-calcula la curva (se memoiza por su definición). Úsalo para obtener longitud y punta:
 *   const c = makeCurve({ d }); c.length; c.tip(0.4).x
 */
export const makeCurve = (src: CrayonSource): CrayonData => {
  const key = src.d ? `d:${src.d}` : `p:${JSON.stringify(src.points)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pts: Pt[] = src.d ? flattenPath(src.d, 3) : catmullRom(src.points ?? [], 3);
  const curve = new Curve(pts);
  const data: CrayonData = {
    curve,
    length: curve.length,
    tip: (p) => curve.tip(p),
    at: (s) => {
      const [x, y] = curve.pointAt(s);
      const [tx, ty] = curve.tangentAt(s);
      return { x, y, tx, ty, angle: (Math.atan2(ty, tx) * 180) / Math.PI, length: s };
    },
  };
  if (cache.size > 80) cache.clear();
  cache.set(key, data);
  return data;
};

export type CrayonOptions = {
  /** fracción 0..1 dibujada (la punta). */
  progress?: number;
  /** fracción 0..1 donde empieza el trazo visible (para «borrar» la cola). Por defecto 0. */
  from?: number;
  /** grosor deseado en PANTALLA (px). Por defecto 14. */
  width?: number;
  seed?: number;
  /** cámara (por defecto la del contexto). */
  camera?: CameraState;
  /** fracción del ancho en el arranque (0..1). Por defecto 0.55. */
  startWidth?: number;
  /** fracción del ancho al final (0..1). Por defecto 0.35. */
  endWidth?: number;
};

type Streak = { d: string; offset: number; f: number };
type Polys = { outer: string; core: string; streaks: Streak[] };
const STREAK_F = [-0.24, 0.1, 0.3] as const;

const VIEW_W = 1080;
const VIEW_H = 1920;

/** Contornos (exterior granulado y núcleo) de la curva para esta cámara. Solo se genera lo visible. */
export const crayonPolys = (data: CrayonData, o: CrayonOptions = {}): Polys => {
  const cam = o.camera ?? { scale: 1, cx: VIEW_W / 2, cy: VIEW_H / 2 };
  const seed = o.seed ?? 7;
  const p = clamp01(o.progress ?? 1);
  const from = clamp01(o.from ?? 0);
  const L = data.length;
  const sTo = L * p;
  const sFrom = L * from;
  if (L < 1 || sTo - sFrom < 0.5) return { outer: "", core: "", streaks: [] };
  const scale = cam.scale;
  const w = ((o.width ?? 14) * 1.2) / scale;
  const startW = o.startWidth ?? 0.55;
  const endW = o.endWidth ?? 0.35;
  const lamEdge = Math.max(12, 5 / scale);
  const ds = clamp(3.5 / scale, 1.5, 40);

  // tramos visibles (en pantalla + margen) a lo largo del eje
  const pts = data.curve.pts;
  const cum = data.curve.cum;
  const margin = 220 + w * scale;
  const ranges: [number, number][] = [];
  let open = -1;
  for (let i = 0; i < pts.length; i++) {
    const sx = (pts[i][0] - cam.cx) * scale + VIEW_W / 2;
    const sy = (pts[i][1] - cam.cy) * scale + VIEW_H / 2;
    const vis = sx > -margin && sx < VIEW_W + margin && sy > -margin && sy < VIEW_H + margin;
    if (vis && open < 0) open = i;
    if ((!vis || i === pts.length - 1) && open >= 0) {
      const a = Math.max(0, cum[Math.max(0, open - 1)] - 30);
      const b = Math.min(L, cum[vis ? i : i - 1] + 30);
      ranges.push([a, b]);
      open = -1;
    }
  }

  const tS = w * 6;
  const tE = w * 7;
  let dOuter = "";
  let dCore = "";
  const streaks: Streak[] = [];
  for (const [ra, rb] of ranges) {
    const sa = Math.max(ra, sFrom);
    const sb = Math.min(rb, sTo);
    if (sb - sa < 0.5) continue;
    const N = Math.max(2, Math.min(2400, Math.ceil((sb - sa) / ds)));
    const outerL: Pt[] = [];
    const outerR: Pt[] = [];
    const coreL: Pt[] = [];
    const coreR: Pt[] = [];
    const cs: { c: Pt; t: Pt; ro: number; rc: number }[] = [];
    const sl: Pt[][] = STREAK_F.map(() => []);
    for (let i = 0; i <= N; i++) {
      const s = sa + ((sb - sa) * i) / N;
      const base = data.curve.pointAt(s);
      const a = data.curve.pointAt(Math.max(0, s - ds * 0.9));
      const b = data.curve.pointAt(Math.min(L, s + ds * 0.9));
      let tx = b[0] - a[0];
      let ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty;
      const ny = tx;
      const irr = 1 + 0.2 * noise1(seed + 1, s / 330) + 0.08 * noise1(seed + 2, s / 85);
      const ramp = lerp(startW, 1, smoothstep(0, tS, s)) * lerp(endW, 1, smoothstep(0, tE, L - s));
      const ww = w * irr * ramp;
      const off = w * 0.16 * noise1(seed + 6, s / 240);
      const hl = 0.5 * ww * (1 + 0.1 * noise1(seed + 3, s / lamEdge));
      const hr = 0.5 * ww * (1 + 0.1 * noise1(seed + 4, s / lamEdge));
      const cl = hl * (0.72 + 0.06 * noise1(seed + 8, s / (lamEdge * 2.3)));
      const cr = hr * (0.72 + 0.06 * noise1(seed + 9, s / (lamEdge * 2.3)));
      const cx = base[0] + nx * off;
      const cy = base[1] + ny * off;
      outerL.push([cx + nx * hl, cy + ny * hl]);
      outerR.push([cx - nx * hr, cy - ny * hr]);
      coreL.push([cx + nx * cl, cy + ny * cl]);
      coreR.push([cx - nx * cr, cy - ny * cr]);
      cs.push({ c: [cx, cy], t: [tx, ty], ro: (hl + hr) / 2, rc: (cl + cr) / 2 });
      STREAK_F.forEach((f, q) => sl[q].push([cx + nx * f * ww, cy + ny * f * ww]));
    }
    const build = (left: Pt[], right: Pt[], key: "ro" | "rc"): string => {
      const poly: Pt[] = [...left];
      const last = cs[cs.length - 1];
      const first = cs[0];
      const capN = 5;
      for (let j = 1; j < capN; j++) {
        const th = (j / capN) * Math.PI;
        const r = last[key] * (1 + 0.06 * noise1(seed + 12, j));
        poly.push([last.c[0] + (-last.t[1] * Math.cos(th) + last.t[0] * Math.sin(th)) * r, last.c[1] + (last.t[0] * Math.cos(th) + last.t[1] * Math.sin(th)) * r]);
      }
      for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
      for (let j = 1; j < capN; j++) {
        const th = (j / capN) * Math.PI;
        const r = first[key] * (1 + 0.06 * noise1(seed + 13, j));
        poly.push([first.c[0] - (-first.t[1] * Math.cos(th) + first.t[0] * Math.sin(th)) * r, first.c[1] - (first.t[0] * Math.cos(th) + first.t[1] * Math.sin(th)) * r]);
      }
      return smoothClosedPath(poly);
    };
    dOuter += build(outerL, outerR, "ro");
    dCore += build(coreL, coreR, "rc");
    STREAK_F.forEach((f, q) => {
      const pts2 = sl[q].slice(2, -2);
      if (pts2.length > 2) streaks.push({ d: polylinePath(pts2), offset: sa + ((N > 0 ? (sb - sa) / N : 0) * 2), f });
    });
  }
  return { outer: dOuter, core: dCore, streaks };
};

// ───────────────────────── Textura (diente del papel) ─────────────────────────

const TILE = 128;
const dotsPath = (seed: number, count: number, r0: number, r1: number, power: number): string => {
  const rnd = mulberry32(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const r = r0 + (r1 - r0) * Math.pow(rnd(), power);
    const x = r1 + rnd() * (TILE - 2 * r1);
    const y = r1 + rnd() * (TILE - 2 * r1);
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
  }
  return d;
};
// patrones fijos (se calculan una vez por módulo)
const EDGE_DOTS = dotsPath(101, 1500, 0.5, 1.7, 2.2);
const FLECK_DOTS = dotsPath(202, 260, 0.6, 1.9, 2);
const PIGMENT_DOTS = dotsPath(303, 220, 0.7, 2.2, 2);

type CrayonProps = CrayonSource &
  CrayonOptions & {
    /** color del crayón (por defecto el naranja de ADIP). */
    color?: string;
    /** color más oscuro para motas de pigmento. */
    shade?: string;
    /** 0..1: cantidad de textura (0 = plano). Por defecto 1. */
    texture?: number;
    opacity?: number;
  };

/**
 * Fragmento SVG de la curva (va dentro de un <svg> con overflow visible en el origen del mundo).
 * Normalmente usá <CrayonCurve> (que ya trae su <svg>).
 */
export const CrayonStroke: React.FC<CrayonProps> = ({ d, points, color = COLORS.orange, shade = "#E0610A", texture = 1, opacity = 1, ...o }) => {
  const cam = useCamera();
  const camera = o.camera ?? cam;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const data = makeCurve({ d, points });
  const { outer, core, streaks } = crayonPolys(data, { ...o, camera });
  if (!outer) return null;
  const k = 1 / camera.scale;
  // el grano queda fijo a la pantalla: origen del patrón = esquina superior izquierda de la pantalla
  const ox = camera.cx - VIEW_W / 2 / camera.scale;
  const oy = camera.cy - VIEW_H / 2 / camera.scale;
  const pt = `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(5)})`;
  return (
    <g opacity={opacity}>
      {texture > 0 ? (
        <defs>
          <pattern id={`e${id}`} width={TILE} height={TILE} patternUnits="userSpaceOnUse" patternTransform={pt}>
            <path d={EDGE_DOTS} fill={color} />
          </pattern>
          <pattern id={`f${id}`} width={TILE} height={TILE} patternUnits="userSpaceOnUse" patternTransform={pt}>
            <path d={FLECK_DOTS} fill={COLORS.cream} opacity={0.5 * texture} />
            <path d={PIGMENT_DOTS} fill={shade} opacity={0.4 * texture} />
          </pattern>
        </defs>
      ) : null}
      {texture > 0 ? <path d={outer} fill={`url(#e${id})`} /> : <path d={outer} fill={color} />}
      <path d={core} fill={color} opacity={0.97} />
      {texture > 0 ? <path d={core} fill={`url(#f${id})`} /> : null}
      {texture > 0
        ? streaks.map((st, i) => (
            <path
              key={i}
              d={st.d}
              fill="none"
              stroke={i === 1 ? shade : COLORS.cream}
              strokeOpacity={(i === 1 ? 0.3 : 0.4) * texture}
              strokeWidth={(i === 1 ? 1.4 : 1.1) / camera.scale}
              strokeLinecap="round"
              strokeDasharray={i === 0 ? "70 22 12 110 34 16" : i === 1 ? "46 30 130 18" : "90 40 20 70 12 50"}
              strokeDashoffset={st.offset}
            />
          ))
        : null}
    </g>
  );
};

/** Curva de crayón autónoma: <svg> 1×1 con overflow visible, en el origen del mundo (0,0). */
export const CrayonCurve: React.FC<CrayonProps & { style?: React.CSSProperties }> = ({ style, ...p }) => (
  <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
    <CrayonStroke {...p} />
  </svg>
);
