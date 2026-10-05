import React, { useId } from "react";
import { COLORS } from "../config/brand.ts";
import { useCamera } from "../world/cameraContext.ts";
import { clamp01, dist, f1, polylinePath, smoothClosedPath, type Pt } from "./geom.ts";
import { noise1 } from "./noise.ts";
import { mulberry32 } from "../lib/rng.ts";

/**
 * RELLENO DE GARABATO — zonas oscuras o de color (pelo, pantalón, abrigo, piel) rellenadas con un
 * zigzag continuo de marcador, de borde irregular (se pasa y se queda corto, como a mano).
 * Es UN solo `<path>` con trazo nativo (muy liviano): sin filtros.
 */
export type ScribbleOptions = {
  /** grosor de la línea del marcador (u). Por defecto 9. */
  weight?: number;
  /** 0.3 (hachurado suelto) … 1 (sólido, apenas se ve el zigzag) … 1.3 (sobre-relleno). Por defecto 1. */
  density?: number;
  /** ángulo del hachurado en grados (0 = líneas horizontales; por defecto 62 = casi vertical, inclinado). */
  angle?: number;
  seed?: number;
  /** irregularidad del borde en múltiplos de `weight` (por defecto 0,5). */
  jitter?: number;
  /** curvatura de cada pasada (por defecto 0,3). */
  bow?: number;
  /** desplazamiento del relleno respecto del contorno (efecto de registro de impresión). */
  offset?: Pt;
  /** agrega una última pasada pegada al borde inferior si la separación dejó una franja sin cubrir (relleno suelto de separación grande) */
  edge?: boolean;
};

/** Corridas (polilíneas) del zigzag que cubre `polygon`. */
export const scribbleRuns = (polygon: readonly Pt[], o: ScribbleOptions = {}): Pt[][] => {
  const weight = o.weight ?? 9;
  const density = o.density ?? 1;
  const seed = o.seed ?? 3;
  const jitter = o.jitter ?? 0.5;
  const bow = o.bow ?? 0.3;
  const ang = ((o.angle ?? 62) * Math.PI) / 180;
  const rnd = mulberry32(seed * 977 + 5);
  if (polygon.length < 3) return [];
  const ox = o.offset?.[0] ?? 0;
  const oy = o.offset?.[1] ?? 0;

  // centro para rotar
  let cxs = 0;
  let cys = 0;
  for (const p of polygon) {
    cxs += p[0];
    cys += p[1];
  }
  cxs /= polygon.length;
  cys /= polygon.length;
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const toLocal = (p: Pt): Pt => [(p[0] - cxs) * c - (p[1] - cys) * s, (p[0] - cxs) * s + (p[1] - cys) * c];
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const toWorld = (p: Pt): Pt => [cxs + ox + p[0] * ca - p[1] * sa, cys + oy + p[0] * sa + p[1] * ca];

  const poly = polygon.map(toLocal);
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of poly) {
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  const gap = (weight * 0.82) / Math.max(0.2, density);
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  let dir = 1;
  let y = y0 + gap * 0.35;
  let k = 0;
  let lastY = -Infinity;
  let closing = false;
  for (;;) {
    if (y > y1 + gap * 0.2) {
      if (o.edge && !closing && lastY < y1 - weight * 0.35) {
        y = y1 - weight * 0.3;
        closing = true;
      } else break;
    }
    lastY = y;
    // intersecciones con el polígono
    const xs: number[] = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[j];
      const b = poly[i];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    const segs: [number, number][] = [];
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > weight * 0.4) segs.push([xs[i], xs[i + 1]]);
    if (segs.length === 0) {
      if (run.length) runs.push(run);
      run = [];
    } else {
      if (segs.length > 1 && run.length) {
        runs.push(run);
        run = [];
      }
      const ordered = dir > 0 ? segs : segs.slice().reverse();
      for (const [xa0, xb0] of ordered) {
        // se pasa o se queda corto en cada extremo
        const ja = (rnd() * 1.5 - 0.6) * weight * jitter;
        const jb = (rnd() * 1.5 - 0.6) * weight * jitter;
        const xa = xa0 - ja;
        const xb = xb0 + jb;
        const from = dir > 0 ? xa : xb;
        const to = dir > 0 ? xb : xa;
        const pts: Pt[] = [];
        const m = Math.max(2, Math.ceil(Math.abs(to - from) / (weight * 4)));
        for (let q = 0; q <= m; q++) {
          const t = q / m;
          const yy = y + bow * weight * noise1(seed + 17, k * 0.9 + t * 1.4) + (rnd() - 0.5) * weight * 0.12;
          pts.push(toWorld([from + (to - from) * t, yy]));
        }
        if (segs.length > 1) {
          runs.push(pts);
        } else {
          run.push(...pts);
        }
      }
      dir = -dir;
    }
    y += gap * (0.9 + rnd() * 0.22);
    k++;
  }
  if (run.length) runs.push(run);
  return runs;
};

/** Corta las corridas a la fracción `p` de su longitud total. */
const cutRuns = (runs: Pt[][], p: number): Pt[][] => {
  if (p >= 1) return runs;
  if (p <= 0) return [];
  let total = 0;
  for (const r of runs) for (let i = 1; i < r.length; i++) total += dist(r[i - 1], r[i]);
  let remain = total * p;
  const out: Pt[][] = [];
  for (const r of runs) {
    const cut: Pt[] = [r[0]];
    for (let i = 1; i < r.length; i++) {
      const d = dist(r[i - 1], r[i]);
      if (remain >= d) {
        cut.push(r[i]);
        remain -= d;
      } else {
        const t = d > 0 ? remain / d : 0;
        cut.push([r[i - 1][0] + (r[i][0] - r[i - 1][0]) * t, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * t]);
        remain = 0;
        break;
      }
    }
    out.push(cut);
    if (remain <= 0) break;
  }
  return out;
};

/** `d` de SVG del garabato (para usar con stroke = color, strokeWidth = weight). */
export const scribblePath = (polygon: readonly Pt[], o: ScribbleOptions & { progress?: number } = {}): string => {
  const runs = cutRuns(scribbleRuns(polygon, o), o.progress ?? 1);
  return runs.map((r) => polylinePath(r)).join("");
};

type ScribbleFillProps = ScribbleOptions & {
  /** región a rellenar (polígono cerrado, mundo). */
  polygon: readonly Pt[];
  color?: string;
  opacity?: number;
  /** 0..1: el garabato va rellenando en el orden del zigzag. */
  progress?: number;
  /** id de un <GrainDefs> del mismo <svg>: el relleno liso de baja escala lleva grano de papel. */
  grain?: string;
  /** false = sin nivel de detalle adaptativo (siempre el hachurado fino tal como se dibujó). */
  lod?: boolean;
  /** escala de cámara a usar en lugar de la del contexto (pruebas). */
  scale?: number;
};

/**
 * NIVEL DE DETALLE del hachurado (anti-moiré). Un hachurado fino (líneas de ≈ 5 u cada ≈ 8,5 u) se ve a escala de cámara 0,3–0,45
 * como líneas de 1,5 px con huecos de 1 px: eso batalla con la grilla de píxeles y CENTELLEA cuando la cámara se mueve.
 * Se dibuja como un «mipmap» de pasadas de marcador: el nivel n separa las líneas 2^n veces más y las engrosa un poco, y se agrega un
 * lavado liso del color (con el grano del papel) para que el color medio —la cobertura— sea el mismo que el del hachurado fino.
 *   · `period` = separación de las líneas finas EN PANTALLA (px) = (separación en u) · escala real (cámara × escala del dibujo);
 *   · L = log2(PERIOD_TARGET / period): 0 con escala ≥ ≈ 0,6 (hachurado tal cual), ≈ 1 a 0,3, ≈ 2 a 0,15…;
 *   · se dibujan los dos niveles vecinos de L con opacidad cruzada (continuo; las pasadas quedan FIJAS al mundo: solo cambian las
 *     opacidades, nada «se desliza» al mover la cámara): en cada nivel el período en pantalla queda entre ≈ 4 y 8 px (estable).
 * Solo afecta a rellenos sueltos (densidad < 0,9): los rellenos sólidos de marcador no tienen huecos y no centellean.
 */
export const PERIOD_TARGET = 5.2;
/** Interruptor global del nivel de detalle (solo para pruebas A/B en dev/; en producción queda en true). */
export const HATCH_LOD = { enabled: true };

/** Nivel continuo L ≥ 0 (0 = hachurado fino) para un relleno (`weight`, `density`) a la escala real en pantalla `scale`. */
export const hatchLevel = (scale: number, weight = 9, density = 1): number => {
  if (density >= 0.9) return 0;
  const period = ((weight * 0.82) / Math.max(0.2, density)) * scale;
  return Math.max(0, Math.log2(PERIOD_TARGET / Math.max(0.05, period)));
};

/** opacidad del nivel n cuando el nivel continuo es L (1 a ±0,3; 0 a ±0,75). Los dos niveles vecinos suman >1 a propósito: dos capas al 50 % dejarían la cobertura en ≈ 0,5 en vez de ≈ 0,6. */
const levelOpacity = (n: number, L: number): number => Math.min(1, 1.25 * clamp01(1.5 - 2 * Math.abs(L - n)));

/**
 * Escala acumulada «unidades del dibujo → unidades de mundo» del contenedor actual (por defecto 1). Los dibujos que escalan su contenido
 * (una persona en RU escalada por su altura, un grupo del reparto con `scale` 0,75…) la proveen con <ScaleBy>, para que el nivel de
 * detalle del hachurado use la escala REAL en pantalla (cámara × escala del dibujo).
 */
export const UnitScale = React.createContext<number>(1);
export const ScaleBy: React.FC<{ k: number; children?: React.ReactNode }> = ({ k, children }) => {
  const parent = React.useContext(UnitScale);
  return <UnitScale.Provider value={parent * Math.abs(k)}>{children}</UnitScale.Provider>;
};

/** Relleno de garabato (fragmento SVG). */
export const ScribbleFill: React.FC<ScribbleFillProps> = ({ polygon, color = COLORS.black, opacity, progress = 1, grain, lod = true, scale, ...o }) => {
  const cam = useCamera();
  const unit = React.useContext(UnitScale);
  const sc = (scale ?? cam.scale) * unit;
  const weight = o.weight ?? 9;
  const density = o.density ?? 1;
  const L = lod && HATCH_LOD.enabled ? hatchLevel(sc, weight, density) : 0;
  if (L <= 0) {
    const d = scribblePath(polygon, { ...o, progress });
    if (!d) return null;
    return <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
  }
  // el lavado aparece a medida que el hachurado se completa (si no, asoma como una mancha pálida antes que las líneas)
  const reveal = Math.pow(clamp01(progress), 4);
  const wash = smoothClosedPath(polygon);
  /** cobertura del hachurado fino (≈ ancho / separación) */
  const cov0 = Math.min(1, density / 0.82);
  const levels: React.ReactNode[] = [];
  for (let n = Math.max(0, Math.floor(L - 0.75)); n <= Math.ceil(L + 0.75); n++) {
    const op = levelOpacity(n, L);
    if (op <= 0.01) continue;
    // nivel n: separación × 2^n, línea × (1 + 0,5 n); lavado para conservar la cobertura del hachurado fino
    const wn = n === 0 ? weight : weight * (1 + 0.5 * n);
    const dn = n === 0 ? density : (density * (1 + 0.5 * n)) / Math.pow(2, n);
    const cov = Math.min(1, dn / 0.82);
    const washOp = n === 0 ? 0 : Math.max(0, (cov0 - cov) / (1 - cov));
    const d = scribblePath(polygon, { ...o, weight: wn, density: dn, seed: (o.seed ?? 3) + 101 * n, progress, edge: n > 0 });
    levels.push(
      <g key={n} opacity={op}>
        {washOp > 0 && wash ? <path d={wash} fill={color} opacity={washOp * reveal} /> : null}
        {d ? <path d={d} fill="none" stroke={color} strokeWidth={wn} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </g>,
    );
  }
  return (
    <g opacity={opacity}>
      {levels}
      {wash && grain ? <path d={wash} fill={`url(#${grain})`} opacity={reveal * clamp01(L)} /> : null}
    </g>
  );
};

/** Mancha plana de borde irregular (para manos, piel…): polígono con ruido radial, suavizado. */
export const blobPoly = (poly: readonly Pt[], seed = 1, rough = 2.5): Pt[] => {
  let cx = 0;
  let cy = 0;
  for (const p of poly) {
    cx += p[0];
    cy += p[1];
  }
  cx /= poly.length;
  cy /= poly.length;
  return poly.map((p, i) => {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const l = Math.hypot(dx, dy) || 1;
    const n = noise1(seed + 4, i * 0.8) * rough;
    return [p[0] + (dx / l) * n, p[1] + (dy / l) * n] as Pt;
  });
};

export const Blob: React.FC<{
  polygon: readonly Pt[];
  color: string;
  opacity?: number;
  seed?: number;
  rough?: number;
  grain?: string;
  /** 0..1: se revela de arriba hacia abajo (dibujo progresivo del relleno). Por defecto 1. */
  reveal?: number;
}> = ({ polygon, color, opacity, seed, rough, grain, reveal = 1 }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (reveal <= 0) return null;
  const d = smoothClosedPath(blobPoly(polygon, seed, rough));
  let clip: React.ReactNode = null;
  if (reveal < 1) {
    let y0 = Infinity;
    let y1 = -Infinity;
    let x0 = Infinity;
    let x1 = -Infinity;
    for (const p of polygon) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
    }
    clip = (
      <clipPath id={`rv${id}`}>
        <rect x={x0 - 20} y={y0 - 20} width={x1 - x0 + 40} height={(y1 - y0 + 40) * reveal} />
      </clipPath>
    );
  }
  return (
    <g opacity={opacity}>
      {clip}
      <g clipPath={reveal < 1 ? `url(#rv${id})` : undefined}>
        <path d={d} fill={color} />
        {grain ? <path d={d} fill={`url(#${grain})`} /> : null}
      </g>
    </g>
  );
};

export { f1 };
