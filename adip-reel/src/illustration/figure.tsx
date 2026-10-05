import React from "react";
import { COLORS } from "../config/brand.ts";
import { mulberry32 } from "../lib/rng.ts";
import { catmullRom, clamp, clamp01, deg, dist, ellipsePoly, lerp, mix, norm, rotate, smoothClosedPath, sub, type Pt } from "./geom.ts";
import { InkEllipse, InkStroke, handEllipsePoints } from "./ink.tsx";
import { ACCENTS, HAIR_COLORS, SKIN_TONES, resolveColor } from "./palette.ts";
import type { PersonLayers } from "./person.tsx"; // solo tipo (sin ciclo en tiempo de ejecución)
import { bodyDims, resolvePose, type BodyKind, type Build, type PoseParams, type Side } from "./rig.ts";
import { FriendHand } from "./hand.tsx";
import { Blob, ScribbleFill } from "./scribble.tsx";

/**
 * FIGURA DEL REPARTO — mismo lenguaje que el kit (tinta fina con temblor, garabato, manchas planas, puntos por ojos,
 * mismo rig/IK), pero con el cuerpo dibujado con proporciones más naturales de PERFIL y ¾: el torso tiene espalda y
 * pecho distintos (omóplato, pecho, cintura, cadera), las prendas caen con vuelo y siguen el movimiento de las
 * piernas, las mangas y los pantalones se afinan, y hay brazos y piernas «de piel» (no solo líneas).
 * Se arma con `buildFigure(spec, pose, opts)` → { behind, body, hands } en RU (1000 RU = adulto de pie).
 */
export type HairStyle = "short" | "long" | "bob" | "bun" | "curly" | "ponytail" | "bald" | "cropped" | "waves";
export type GarmentType = "top" | "jacket" | "coat" | "dress" | "cardigan";
export type AccessoryType = "backpack" | "bag" | "scarf" | "glasses" | "beanie" | "satchel" | "cane";

export type FigureSpec = {
  kind?: BodyKind;
  build?: Build;
  /** altura de pie en u de mundo a escala 1 */
  height?: number;
  skin?: string;
  hair?: { style: HairStyle; color?: string };
  top?: {
    type?: GarmentType;
    color?: string;
    /** "hatch" lápiz de color, "solid" marcador, "outline" solo contorno */
    fill?: "hatch" | "solid" | "outline";
    /** "skin" brazo desnudo con piel, "line" trazo, "filled" manga rellena hasta la muñeca, "short" manga corta */
    sleeves?: "skin" | "line" | "filled" | "short";
    /** solcapa/solapas en abrigos y sacos (por defecto sí) */
    collar?: boolean;
    /** cinturón / cinta en la cintura (color) */
    belt?: string;
  };
  legs?: {
    /** "bare" piernas de piel, "lines" una línea por pierna, "trousers" pantalón */
    type?: "bare" | "lines" | "trousers";
    color?: string;
    fill?: "solid" | "hatch";
  };
  shoes?: string;
  accessories?: readonly { type: AccessoryType; color?: string; hand?: Side }[];
  face?: "none" | "dots";
  /** multiplicador del tamaño de la cabeza (1,1 por defecto) */
  headScale?: number;
  /** RU que baja la cabeza hacia el torso (cuello más corto; 10 por defecto) */
  neckDrop?: number;
  ink?: number;
  seed?: number;
};

const DEFAULT_HEIGHT: Record<BodyKind, number> = { adult: 930, child: 620, elder: 870 };
export const INK_WIDTH = 12.5;
export const heightOf = (spec: FigureSpec): number => spec.height ?? DEFAULT_HEIGHT[spec.kind ?? "adult"];

// ───────────────────────── pelo ─────────────────────────

type HairShape = { back: Pt[][]; front: Pt[][] };

const arcPts = (a0: number, a1: number, rx: number, n = 14, cx = 0, cy = 0, ry = rx): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = deg(a0 + ((a1 - a0) * i) / n);
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};

/** Formas normalizadas (unidades de rx, ry; origen en el centro de la cabeza). */
const hairShape = (style: HairStyle, back: number): HairShape => {
  const cap = (bumps = false, low = 0): Pt[] => {
    const outer: Pt[] = [];
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = deg(194 + (152 * i) / n);
      const bump = bumps ? 1 + 0.08 * Math.sin(i * 2.6) : 1;
      outer.push([Math.cos(a) * 1.09 * bump, Math.sin(a) * 1.1 * bump]);
    }
    const inner: Pt[] = [
      [0.96, -0.1 + low],
      [0.74, -0.4 + low],
      [0.3, -0.6 + low],
      [-0.2, -0.58 + low],
      [-0.68, -0.38 + low],
      [-0.97, -0.08 + low],
    ];
    return [...outer, ...inner];
  };
  const shift = (pts: Pt[], dx: number, dy = 0): Pt[] => pts.map((p) => [p[0] + dx, p[1] + dy] as Pt);
  const bk = -0.14 * back;
  switch (style) {
    case "bald":
      return { back: [], front: [] };
    case "short":
      return { back: [], front: [shift(cap(), bk)] };
    case "cropped":
      return { back: [], front: [shift(cap(false, -0.16), bk)] };
    case "bob":
      return {
        back: [
          shift(
            [
              [-1.04, -0.3],
              [-1.24, 0.3],
              [-1.2, 0.95],
              [-0.92, 1.2],
              [-0.5, 1.1],
              [0, 0.95],
              [0.5, 1.1],
              [0.92, 1.2],
              [1.2, 0.95],
              [1.24, 0.3],
              [1.04, -0.3],
            ],
            bk,
          ),
        ],
        front: [shift(cap(), bk)],
      };
    case "long":
      return {
        back: [
          shift(
            [
              [-1.04, -0.3],
              [-1.22, 0.5],
              [-1.26, 1.4],
              [-1.12, 2.05],
              [-0.7, 2.15],
              [-0.2, 1.8],
              [0.2, 1.8],
              [0.7, 2.15],
              [1.12, 2.05],
              [1.26, 1.4],
              [1.22, 0.5],
              [1.04, -0.3],
            ],
            bk * 1.4,
          ),
        ],
        front: [shift(cap(), bk)],
      };
    case "bun":
      return { back: [arcPts(0, 360, 0.4, 14, -0.42 + bk * 2, -1.12, 0.4)], front: [shift(cap(), bk)] };
    case "ponytail":
      return {
        back: [
          shift(
            [
              [-0.9, -0.55],
              [-1.3, -0.35],
              [-1.75, 0.3],
              [-1.95, 1.3],
              [-1.7, 1.55],
              [-1.45, 0.9],
              [-1.15, 0.2],
              [-0.8, -0.1],
            ],
            bk,
          ),
        ],
        front: [shift(cap(), bk)],
      };
    case "waves":
      return {
        back: [
          shift(
            [
              [-1.04, -0.3],
              [-1.26, 0.35],
              [-1.3, 0.9],
              [-1.1, 1.3],
              [-0.8, 1.05],
              [-0.5, 0.8],
              [0.5, 0.8],
              [0.8, 1.05],
              [1.1, 1.3],
              [1.3, 0.9],
              [1.26, 0.35],
              [1.04, -0.3],
            ],
            bk * 1.2,
          ),
        ],
        front: [shift(cap(true), bk)],
      };
    case "curly": {
      const cloud: Pt[] = [];
      const n = 40;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = 1.32 + 0.1 * Math.sin(a * 12 + 0.6) + 0.07 * Math.sin(a * 5 + 1.3);
        cloud.push([Math.cos(a) * r * 1.04 + bk, -0.16 + Math.sin(a) * r * 0.98]);
      }
      return { back: [cloud], front: [shift(cap(true), bk, -0.04)] };
    }
  }
};

// ───────────────────────── geometría auxiliar ─────────────────────────

const limbPoly = (pts: readonly Pt[], half: readonly number[]): { poly: Pt[]; left: Pt[]; right: Pt[] } => {
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const t = norm(sub(b, a));
    const n: Pt = [-t[1], t[0]];
    L.push([pts[i][0] + n[0] * half[i], pts[i][1] + n[1] * half[i]]);
    R.push([pts[i][0] - n[0] * half[i], pts[i][1] - n[1] * half[i]]);
  }
  return { poly: [...L, ...R.slice().reverse()], left: L, right: R };
};

/** Miembro suavizado: Catmull-Rom por las articulaciones (el codo/rodilla se redondea) y semiancho `w(t)` con t 0..1. */
const smoothLimb = (pts: readonly Pt[], w: (t: number) => number): { poly: Pt[]; left: Pt[]; right: Pt[]; center: Pt[] } => {
  const c = catmullRom(pts, 34);
  const n = c.length;
  const lp = limbPoly(c, c.map((_, i) => w(n <= 1 ? 0 : i / (n - 1))));
  return { ...lp, center: c };
};

/**
 * Miembro con hombro redondeado: como `smoothLimb`, pero el extremo inicial lleva una tapa semicircular (deltoides / cabeza del muslo) y `cap`
 * devuelve el arco para trazar la costura de la manga.
 */
const smoothLimbCap = (pts: readonly Pt[], w: (t: number) => number): { poly: Pt[]; left: Pt[]; right: Pt[]; center: Pt[]; cap: Pt[] } => {
  const c = catmullRom(pts, 26);
  const n = c.length;
  const lp = limbPoly(c, c.map((_, i) => w(n <= 1 ? 0 : i / (n - 1))));
  const p0 = c[0];
  const d = norm(sub(c[Math.min(2, n - 1)], c[0]));
  const nn: Pt = [-d[1], d[0]];
  const h = w(0);
  const cap: Pt[] = [];
  for (let i = 1; i <= 8; i++) {
    const a = (Math.PI * i) / 9;
    cap.push([p0[0] + h * (-Math.cos(a) * nn[0] - 0.55 * Math.sin(a) * d[0]), p0[1] + h * (-Math.cos(a) * nn[1] - 0.55 * Math.sin(a) * d[1])]);
  }
  return { poly: [...lp.left, ...lp.right.slice().reverse(), ...cap], left: lp.left, right: lp.right, center: c, cap: [lp.right[0], ...cap, lp.left[0]] };
};

/** Interpola una tabla [t, valor] con suavidad coseno. */
const profile = (tab: readonly (readonly [number, number])[], t: number): number => {
  if (t <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) {
    if (t <= tab[i + 1][0]) {
      const k = (t - tab[i][0]) / (tab[i + 1][0] - tab[i][0] || 1);
      return lerp(tab[i][1], tab[i + 1][1], 0.5 - 0.5 * Math.cos(Math.PI * k));
    }
  }
  return tab[tab.length - 1][1];
};
/** Semiancho de una manga (RU) a lo largo del brazo: deltoides, afinado hacia el codo, antebrazo apenas más lleno, puño. */
const SLEEVE_PROFILE = [[0, 21], [0.1, 24], [0.3, 21], [0.5, 18.2], [0.62, 18.8], [0.86, 14.8], [1, 14.2]] as const;
const SKIN_ARM_PROFILE = [[0, 17], [0.1, 18], [0.3, 15], [0.5, 12.5], [0.62, 13], [0.86, 10.8], [1, 10.2]] as const;

const bow = (a: Pt, b: Pt, amount: number): Pt => {
  const m = mix(a, b, 0.5);
  const t = norm(sub(b, a));
  return [m[0] - t[1] * amount, m[1] + t[0] * amount];
};

const part = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a));
const angleDeg = (a: Pt, b: Pt): number => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

/** Interpolación lineal en una tabla [u, valor] ordenada de mayor a menor u. */
const tab = (t: readonly (readonly [number, number])[], u: number): number => {
  if (u >= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) {
    if (u <= t[i][0] && u >= t[i + 1][0]) {
      const k = (u - t[i + 1][0]) / (t[i][0] - t[i + 1][0] || 1);
      return lerp(t[i + 1][1], t[i][1], k);
    }
  }
  return t[t.length - 1][1];
};

/** Semianchos del torso (RU) desde el eje (cadera → cuello), u: 0 cadera … 1 base del cuello. */
const PROF_BACK = [[1, 25], [0.975, 31], [0.945, 38], [0.9, 45], [0.84, 50], [0.68, 49], [0.5, 39], [0.32, 42], [0.14, 54], [0, 58]] as const;
const PROF_FRONT = [[1, 21], [0.975, 27], [0.945, 33], [0.9, 40], [0.84, 45], [0.68, 52], [0.5, 46], [0.32, 44], [0.14, 46], [0, 47]] as const;

/** Pose de una mano dibujada (ver hand.tsx): `open` 0 = relajada … 1 = abierta, palma arriba; `angle` = dirección de los dedos en grados del rig (por defecto la del antebrazo). */
export type HandSpec = { open?: number; angle?: number; flip?: boolean };

export type BuildOptions = {
  /** poses de las manos (por defecto relajadas siguiendo el antebrazo) */
  hands?: Partial<Record<Side, HandSpec>>;
  progress?: number;
  seed?: number;
  hideHands?: boolean;
  blink?: number;
  grainId?: string;
};

export type FigureLayers = PersonLayers;

export const buildFigure = (spec: FigureSpec, pose: PoseParams, o: BuildOptions = {}): FigureLayers => {
  const dims = bodyDims(spec.kind, spec.build);
  const j = resolvePose(pose, dims);
  const p = o.progress ?? 1;
  const seed = (spec.seed ?? 1) * 101 + (o.seed ?? 0);
  const W = INK_WIDTH * (spec.ink ?? 1);
  const thin = W * 0.74;
  const skin = resolveColor(spec.skin ?? "light", SKIN_TONES);
  const topSpec = spec.top ?? {};
  const topType: GarmentType = topSpec.type ?? "top";
  const topColor = resolveColor(topSpec.color ?? "ink", ACCENTS);
  const topFill = topSpec.fill ?? "hatch";
  const longGarment = topType === "coat" || topType === "dress";
  const sleeves = topSpec.sleeves ?? (topType === "coat" || topType === "jacket" || topType === "cardigan" ? "filled" : "line");
  const legsType = spec.legs?.type ?? "lines";
  const legColor = resolveColor(spec.legs?.color ?? "ink", ACCENTS);
  const legFill = spec.legs?.fill ?? "solid";
  const hairSpec = spec.hair ?? { style: "short" };
  const hairColor = resolveColor(hairSpec.color ?? "black", HAIR_COLORS);
  const hairIsDark = hairColor === COLORS.black || hairColor === HAIR_COLORS.darkBrown;
  const shoes = spec.shoes ?? "ink";
  const face = spec.face ?? "dots";
  const farSide = j.far;

  if (p <= 0) return { behind: null, body: null, hands: null, joints: j, dims };

  // ── torso: eje y secciones ──
  const hipC = j.hip;
  const neckC = j.neck;
  const up = j.up;
  const perpT: Pt = [-up[1], up[0]]; // hacia la derecha de pantalla (el frente de la figura cuando mira a +x)
  const turn = j.turn;
  const centerAt = (u: number): Pt => {
    if (u >= 0) return mix(mix(hipC, j.spine, u), mix(j.spine, neckC, u), u);
    return [hipC[0], hipC[1] - u * dims.torso];
  };
  const sb = spec.build === "slim" ? 0.9 : spec.build === "broad" ? 1.14 : 1;
  const sh = dims.shoulderHalf;
  const FRONTAL = [[1, 22], [0.975, sh * 0.5], [0.945, sh * 0.88], [0.92, sh * 1.0], [0.89, sh * 0.93], [0.84, sh * 0.72], [0.68, sh * 0.64 * sb], [0.5, 44 * sb], [0.32, 46 * sb], [0.14, dims.hipHalf + 6], [0, dims.hipHalf + 8]] as const;
  // semiancho hacia atrás (izquierda de pantalla) y hacia el frente (derecha)
  const ease = topType === "coat" ? 11 : topType === "cardigan" ? 9 : topType === "jacket" ? 8 : topType === "dress" ? 1.5 : 3.5;
  const tw = Math.pow(turn, 0.85);
  const backAt = (u: number): number => lerp(tab(PROF_BACK, u) * (0.94 + 0.06 * sb), tab(FRONTAL, u), tw) * lerp(1, sb, 0.5) + ease;
  const frontAt = (u: number): number => lerp(tab(PROF_FRONT, u) * (0.94 + 0.06 * sb), tab(FRONTAL, u), tw) * lerp(1, sb, 0.5) + ease;

  const flare = topType === "dress" ? 78 : topType === "coat" ? 40 : topType === "cardigan" ? 14 : topType === "jacket" ? 8 : 0;
  const hemDrop = topType === "dress" ? 285 : topType === "coat" ? 320 : topType === "cardigan" ? 150 : topType === "jacket" ? 70 : 48;
  const seatedNow = hipC[1] > -430;
  const hemDropEff = !longGarment && seatedNow ? Math.min(hemDrop, 16) : hemDrop;
  const uHem = -hemDropEff / dims.torso;
  // vuelo de la prenda: sigue el avance de las rodillas
  const kneeMid = (j.kneeL[0] + j.kneeR[0]) / 2 - hipC[0];
  const sway = clamp(kneeMid * 0.3, -46, 46) * (longGarment ? 1 : 0.35);

  type Sd = -1 | 1;
  const edge = (s: Sd, u: number): Pt => {
    if (u >= 0) {
      const c = centerAt(u);
      const w = s < 0 ? backAt(u) : frontAt(u);
      return [c[0] + perpT[0] * w * s, c[1] + perpT[1] * w * s];
    }
    // bajo la cadera: la prenda cuelga en vertical y se abre (vuelo)
    const f = Math.min(1, u / uHem);
    const w0 = s < 0 ? backAt(0) : frontAt(0);
    const fl = flare * Math.pow(f, 1.25) * (s < 0 ? 0.92 : 1);
    return [hipC[0] + s * (w0 + fl) + sway * Math.pow(f, 1.4), hipC[1] - u * dims.torso];
  };
  const us = [0.975, 0.945, 0.9, 0.84, 0.68, 0.5, 0.32, 0.14, 0];
  const lowU = uHem === 0 ? [] : [uHem * 0.45, uHem];
  let sideB: Pt[] = [...us, ...lowU].map((u) => edge(-1, u));
  let sideF: Pt[] = [...us, ...lowU].map((u) => edge(1, u));
  // sentada con prenda larga: el dobladillo cae sobre los muslos hasta las rodillas
  if (longGarment && hipC[1] > -430) {
    const kl = j.kneeL;
    const kr = j.kneeR;
    const nB = us.length;
    const mB = mix(sideB[nB - 1], [Math.min(kl[0], kr[0]) - 36, Math.min(kl[1], kr[1]) + 10], 0.5);
    const mF = mix(sideF[nB - 1], [Math.max(kl[0], kr[0]) + 34, Math.max(kl[1], kr[1]) + 10], 0.5);
    sideB = [...sideB.slice(0, nB), mB, [Math.min(kl[0], kr[0]) - 38, Math.min(kl[1], kr[1]) + 34]];
    sideF = [...sideF.slice(0, nB), mF, [Math.max(kl[0], kr[0]) + 36, Math.max(kl[1], kr[1]) + 36]];
  }
  const hemB = sideB[sideB.length - 1];
  const hemF = sideF[sideF.length - 1];
  const hemY = (hemB[1] + hemF[1]) / 2;
  const neckHalf = lerp(14, 24, turn);
  const neckB: Pt = [neckC[0] - perpT[0] * neckHalf, neckC[1] - perpT[1] * neckHalf - 2];
  const neckF: Pt = [neckC[0] + perpT[0] * neckHalf, neckC[1] + perpT[1] * neckHalf - 2];

  const parts: React.ReactNode[] = [];
  const behind: React.ReactNode[] = [];
  const hands: React.ReactNode[] = [];

  // ── miembros ──
  const armPts = (shd: Pt, el: Pt, wr: Pt, sd: number): Pt[] => [shd, bow(shd, el, sd * 4), el, bow(el, wr, -sd * 3), wr];
  const legPts = (hp: Pt, kn: Pt, an: Pt, sd: number): Pt[] => [hp, bow(hp, kn, sd * 5), kn, bow(kn, an, sd * 4), an];
  const armL = armPts(j.shoulderL, j.elbowL, j.wristL, -1);
  const armR = armPts(j.shoulderR, j.elbowR, j.wristR, 1);
  let legL = legPts(j.hipL, j.kneeL, j.ankleL, -1);
  let legR = legPts(j.hipR, j.kneeR, j.ankleR, 1);
  const cutAbove = (pts: Pt[], y: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      if (pts[i][1] >= y) {
        if (out.length === 0 && i > 0) {
          const a = pts[i - 1];
          const b = pts[i];
          out.push(mix(a, b, clamp01((y - a[1]) / (b[1] - a[1] || 1))));
        }
        out.push(pts[i]);
      }
    }
    return out.length >= 2 ? out : pts.slice(-2);
  };
  if (longGarment) {
    legL = cutAbove(legL, hemY - 6);
    legR = cutAbove(legR, hemY - 6);
  }
  const ls = (n: number) => seed + n * 17;
  const grain = o.grainId;

  const drawLeg = (side: Side): React.ReactNode => {
    const pts = side === "L" ? legL : legR;
    const pp = part(p, 0.5, 0.78);
    const out: React.ReactNode[] = [];
    const n = pts.length;
    if (legsType === "trousers") {
      const top = longGarment ? 30 : 39;
      const lp = smoothLimb(pts, (t) => lerp(top, 21.5, Math.pow(t, 0.8)));
      const ang = angleDeg(pts[0], pts[n - 1]);
      if (legFill === "solid") {
        out.push(<Blob key="f" polygon={lp.poly} color={legColor} seed={ls(3)} rough={2.2} grain={grain} reveal={part(p, 0.5, 0.82)} />);
        if (legColor !== COLORS.black) {
          out.push(<InkStroke key="o1" points={lp.left} width={thin} progress={pp} seed={ls(5)} />);
          out.push(<InkStroke key="o2" points={lp.right} width={thin} progress={pp} seed={ls(6)} />);
        }
      } else {
        out.push(<ScribbleFill grain={grain} key="f" polygon={lp.poly} color={legColor} progress={part(p, 0.62, 0.95)} weight={6.5} density={0.7} angle={ang + (side === "L" ? 52 : -52)} seed={ls(side === "L" ? 3 : 4)} jitter={0.5} />);
        out.push(<InkStroke key="o1" points={lp.left} width={thin} progress={pp} seed={ls(5)} />);
        out.push(<InkStroke key="o2" points={lp.right} width={thin} progress={pp} seed={ls(6)} />);
      }
    } else if (legsType === "bare") {
      const lp = smoothLimb(pts, (t) => lerp(21, 11.5, Math.pow(t, 0.7)));
      out.push(<Blob key="f" polygon={lp.poly} color={skin} seed={ls(3)} rough={1.2} grain={grain} reveal={part(p, 0.5, 0.82)} />);
      out.push(<InkStroke key="o1" points={lp.left} width={thin * 0.8} progress={pp} seed={ls(5)} taperEnd={W * 2} endWidth={0.6} />);
      out.push(<InkStroke key="o2" points={lp.right} width={thin * 0.8} progress={pp} seed={ls(6)} taperEnd={W * 2} endWidth={0.6} />);
    } else {
      out.push(<InkStroke key="l" points={pts} width={W} progress={pp} seed={ls(side === "L" ? 1 : 2)} taperEnd={W * 2} endWidth={0.6} />);
    }
    return <g key={`leg${side}`}>{out}</g>;
  };

  const drawShoe = (side: Side): React.ReactNode => {
    if (shoes === "none") return null;
    const an = side === "L" ? j.ankleL : j.ankleR;
    const toe = side === "L" ? j.toeL : j.toeR;
    const ang = angleDeg(an, toe);
    const len = dist(an, toe);
    const color = shoes === "ink" ? COLORS.black : resolveColor(shoes, ACCENTS);
    const k = len / 86;
    const shape: Pt[] = [
      [-14, -6],
      [12, -12],
      [42, -2],
      [70, 8],
      [78, 18],
      [60, 24],
      [-6, 24],
      [-18, 12],
    ];
    const poly = shape.map((q) => rotate([an[0] + q[0] * k, an[1] + 6 + q[1] * k], deg(ang * 0.55), an));
    const pp = part(p, 0.72, 0.86);
    if (pp <= 0) return null;
    return (
      <g key={`shoe${side}`} opacity={clamp01(pp * 3)}>
        <path d={smoothClosedPath(poly)} fill={color} />
        {grain ? <path d={smoothClosedPath(poly)} fill={`url(#${grain})`} /> : null}
      </g>
    );
  };

  /** pliegues de la tela en el hueco del codo cuando el brazo se dobla: dos arcos concéntricos (la tela se junta en el pliegue) */
  const elbowFold = (side: Side, pp: number): React.ReactNode => {
    const sh = side === "L" ? j.shoulderL : j.shoulderR;
    const el = side === "L" ? j.elbowL : j.elbowR;
    const wr = side === "L" ? j.wristL : j.wristR;
    const va = norm(sub(sh, el));
    const vb = norm(sub(wr, el));
    const ang = (Math.acos(clamp(va[0] * vb[0] + va[1] * vb[1], -1, 1)) * 180) / Math.PI;
    if (ang > 135 || pp < 0.6) return null;
    const k = clamp01((135 - ang) / 55);
    const inward = Math.atan2(va[1] + vb[1], va[0] + vb[0]);
    const arc = (r: number, span: number, i: number): React.ReactNode => {
      const pts: Pt[] = [];
      for (let q = 0; q <= 4; q++) {
        const a = inward + deg(span) * (q / 2 - 1);
        pts.push([el[0] + Math.cos(a) * r, el[1] + Math.sin(a) * r]);
      }
      return <InkStroke key={`ef${side}${i}`} points={pts} width={thin * 0.5} progress={pp} seed={ls(30 + i + (side === "L" ? 3 : 0))} taperStart={5} taperEnd={7} startWidth={0.3} endWidth={0.3} pressure={0.15} opacity={0.5 + 0.4 * k} />;
    };
    return (
      <g key={`fold${side}`}>
        {arc(8, 40 + 14 * k, 0)}
        {k > 0.35 ? arc(15, 34 + 14 * k, 1) : null}
      </g>
    );
  };

  const drawArm = (side: Side): React.ReactNode => {
    const pts = side === "L" ? armL : armR;
    const pp = part(p, 0.44, 0.66);
    const sd = side === "L" ? 1 : 0;
    if ((sleeves === "filled" || sleeves === "short") && topFill !== "outline") {
      const sleeveAngle = (topFill === "solid" ? 66 : 56) + 58;
      const fillW = topFill === "solid" ? 10 : 5.2;
      const fillD = topFill === "solid" ? 1.1 : 0.5;
      if (sleeves === "short") {
        // manga corta: tela hasta mitad del antebrazo y piel debajo
        const lp = smoothLimbCap(pts.slice(0, 3), (t) => lerp(25, 18, t));
        const lpSkin = smoothLimb(pts.slice(2), (t) => lerp(14.5, 10.2, t));
        return (
          <g key={`arm${side}`}>
            <Blob polygon={lpSkin.poly} color={skin} seed={ls(20 + sd)} rough={1} grain={grain} reveal={part(p, 0.5, 0.8)} />
            <InkStroke points={lpSkin.left} width={thin * 0.8} progress={pp} seed={ls(21 + sd)} endWidth={0.5} />
            <InkStroke points={lpSkin.right} width={thin * 0.8} progress={pp} seed={ls(23 + sd)} endWidth={0.5} />
            <path d={smoothClosedPath(lp.poly)} fill={COLORS.cream} opacity={clamp01(pp * 3)} />
            <ScribbleFill grain={grain} polygon={lp.poly} color={topColor} progress={part(p, 0.55, 0.9)} weight={fillW} density={fillD} angle={sleeveAngle} seed={ls(11 + sd)} jitter={0.3} />
            <InkStroke points={[...lp.right.slice().reverse(), ...lp.cap, ...lp.left]} width={thin} progress={pp} seed={ls(13 + sd)} endWidth={0.8} />
            <InkStroke points={[lp.left[lp.left.length - 1], lp.right[lp.right.length - 1]]} width={thin * 0.9} progress={pp} seed={ls(17 + sd)} taperStart={3} taperEnd={3} />
          </g>
        );
      }
      const lp = smoothLimbCap(pts, (t) => profile(SLEEVE_PROFILE, t));
      return (
        <g key={`arm${side}`}>
          <path d={smoothClosedPath(lp.poly)} fill={COLORS.cream} opacity={clamp01(pp * 3)} />
          <ScribbleFill grain={grain} polygon={lp.poly} color={topColor} progress={part(p, 0.55, 0.9)} weight={fillW} density={fillD} angle={sleeveAngle} seed={ls(11 + sd)} jitter={0.3} />
          <InkStroke points={[...lp.right.slice().reverse(), ...lp.cap, ...lp.left]} width={thin} progress={pp} seed={ls(13 + sd)} endWidth={0.6} taperStart={6} taperEnd={6} />
          <InkStroke points={[lp.left[lp.left.length - 1], lp.right[lp.right.length - 1]]} width={thin * 0.9} progress={pp} seed={ls(17 + sd)} taperStart={3} taperEnd={3} />
          {elbowFold(side, pp)}
        </g>
      );
    }
    if (sleeves === "skin") {
      const lp = smoothLimb(pts, (t) => profile(SKIN_ARM_PROFILE, t));
      return (
        <g key={`arm${side}`}>
          <Blob polygon={lp.poly} color={skin} seed={ls(20 + sd)} rough={1} grain={grain} reveal={part(p, 0.46, 0.7)} />
          <InkStroke points={lp.left} width={thin * 0.8} progress={pp} seed={ls(21 + sd)} endWidth={0.5} />
          <InkStroke points={lp.right} width={thin * 0.8} progress={pp} seed={ls(23 + sd)} endWidth={0.5} />
        </g>
      );
    }
    return <InkStroke key={`arm${side}`} points={pts} width={W * 0.95} progress={pp} seed={ls(side === "L" ? 7 : 8)} taperEnd={W * 1.5} endWidth={0.55} />;
  };

  const drawHand = (side: Side): React.ReactNode => {
    const wr = side === "L" ? j.wristL : j.wristR;
    const el = side === "L" ? j.elbowL : j.elbowR;
    const h = o.hands?.[side] ?? {};
    const pp = part(p, 0.62, 0.78);
    if (pp <= 0) return null;
    // de frente los pulgares miran hacia el cuerpo; de perfil, hacia adelante
    const flip = h.flip ?? (turn > 0.6 && side === "R");
    return <FriendHand key={`hand${side}`} wrist={wr} angle={h.angle ?? angleDeg(el, wr)} open={h.open ?? 0.08} len={dims.hand * 1.16} skin={skin} ink={W} seed={ls(side === "L" ? 9 : 10)} progress={pp} grainId={grain} flip={flip} />;
  };

  // ── cabeza ──
  const hs = spec.headScale ?? 1.1;
  const ha = j.headAngle;
  const rx = j.headRx * hs;
  const ry = j.headRy * hs;
  // la barbilla queda donde estaba: la cabeza crece hacia arriba a lo largo de su eje
  const hup: Pt = [Math.sin(deg(ha)), -Math.cos(deg(ha))];
  // cuello más corto: la cabeza baja un poco hacia el torso (menos «palito»); la barbilla queda donde estaba al crecer
  const drop = spec.neckDrop ?? 10;
  const hc: Pt = [j.headC[0] + hup[0] * (j.headRy * (hs - 1) - drop), j.headC[1] + hup[1] * (j.headRy * (hs - 1) - drop)];
  const faceOff: Pt = [j.face[0] - j.headC[0], j.face[1] - j.headC[1]];
  const toHead = (u: number, v: number): Pt => rotate([hc[0] + u * rx, hc[1] + v * ry], deg(ha), hc);
  const hair = hairShape(hairSpec.style, 1 - turn);
  const hairPoly = (q: Pt[]): Pt[] => q.map((c) => toHead(c[0], c[1]));
  const hairP = part(p, 0.55, 0.9);
  const hairFlat = (poly: Pt[], key: string, sd: number) => <Blob key={key} polygon={hairPoly(poly)} color={hairColor} opacity={clamp01(hairP * 4)} seed={sd} rough={1.4} grain={grain} />;
  const hairBack = hair.back.map((poly, i) => hairFlat(poly, `hb${i}`, seed + 20 + i));
  const hairFront = hair.front.map((poly, i) => hairFlat(poly, `hf${i}`, seed + 30 + i));
  const hairDetail: React.ReactNode[] = [];
  if (hairSpec.style !== "bald" && hairP > 0.5) {
    const rnd = mulberry32(seed + 90);
    const n = hairSpec.style === "curly" ? 9 : hairSpec.style === "long" || hairSpec.style === "bob" || hairSpec.style === "waves" ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const ang = deg(206 + rnd() * 128);
      const rr = hairSpec.style === "curly" ? 0.78 + rnd() * 0.42 : 0.78 + rnd() * 0.2;
      const c: Pt = [Math.cos(ang) * rr, Math.sin(ang) * rr * 1.05 - (hairSpec.style === "curly" ? 0.12 : 0)];
      const dir = ang + Math.PI / 2 + (rnd() - 0.5) * 0.6;
      const len = hairSpec.style === "curly" ? 0.26 : 0.34;
      const p0 = toHead(c[0] - Math.cos(dir) * len, c[1] - Math.sin(dir) * len);
      const p1 = toHead(c[0] + Math.sin(dir) * 0.1, c[1] - Math.cos(dir) * 0.1);
      const p2 = toHead(c[0] + Math.cos(dir) * len, c[1] + Math.sin(dir) * len);
      hairDetail.push(
        <InkStroke key={`hd${i}`} points={[p0, p1, p2]} width={W * 0.36} seed={seed + 95 + i} color={hairIsDark ? COLORS.cream : COLORS.black} opacity={hairIsDark ? 0.5 : 0.35} taperStart={5} taperEnd={6} startWidth={0.4} endWidth={0.3} pressure={0.1} />,
      );
    }
  }
  const hairOutline =
    !hairIsDark && hairSpec.style !== "bald" && hair.front[0] ? (
      <InkStroke key="hairline" points={hair.front[0].slice(0, 19).map((c) => toHead(c[0], c[1]))} width={thin * 0.8} progress={hairP} seed={seed + 44} />
    ) : null;
  const skinPoly = ellipsePoly(hc[0] + 3, hc[1] + 4, rx * 0.94, ry * 0.95, ha, 22);
  const faceC = rotate([hc[0] + faceOff[0], hc[1] + faceOff[1]], deg(ha), hc);
  const look = Math.abs(pose.head.look);
  const dotGap = rx * (0.34 - 0.15 * look);
  const dotsOp = clamp01(part(p, 0.7, 0.9) * 2) * 0.8;
  const lid = clamp01((pose.head.nod - 0.3) / 0.45);
  const eyeRx = lerp(4.2, 8.4, lid);
  const eyeRy = Math.max(0.8, lerp(4.8, 2.9, lid) * (1 - 0.85 * (o.blink ?? 0)));
  const headNodes = (
    <g key="head">
      <Blob polygon={skinPoly} color={skin} opacity={0.94 * clamp01(part(p, 0.04, 0.2) * 3)} seed={seed + 50} rough={2} grain={grain} />
      <InkEllipse cx={hc[0]} cy={hc[1]} rx={rx} ry={ry} rotate={ha} width={W} progress={part(p, 0, 0.2)} seed={seed + 51} />
      {hairFront}
      {hairDetail}
      {hairOutline}
      {face === "dots" && dotsOp > 0 ? (
        <g opacity={dotsOp} fill={COLORS.black}>
          <ellipse cx={faceC[0] - dotGap * (look > 0.7 ? 0 : 1)} cy={faceC[1]} rx={eyeRx} ry={eyeRy} />
          <ellipse cx={faceC[0] + dotGap + (look > 0.7 ? dotGap * 0.2 : 0)} cy={faceC[1] + pose.head.look * 1.5} rx={eyeRx} ry={eyeRy} />
        </g>
      ) : null}
    </g>
  );

  const neckline: Pt[] = [neckB, [neckC[0] + perpT[0] * 5, neckC[1] + (turn > 0.5 ? 22 : 12)], neckF];
  const neckHalfChin = lerp(11, 16, turn);
  const neckHalfBase = lerp(14, 21, turn);
  const neckTop = (s: -1 | 1): Pt => {
    const hx = s * neckHalfChin;
    const hy = ry * Math.sqrt(Math.max(0.05, 1 - (hx / rx) * (hx / rx)));
    return rotate([hc[0] + hx, hc[1] + hy - 2], deg(ha), hc);
  };
  const neckBot = (s: -1 | 1): Pt => [j.neck[0] + s * perpT[0] * neckHalfBase, j.neck[1] + s * perpT[1] * neckHalfBase + 2];
  const neckStroke = (s: -1 | 1, k: number) => {
    const top = neckTop(s);
    const bot = neckBot(s);
    return <InkStroke key={`n${s}`} points={[top, mix(top, bot, 0.5), bot]} width={thin} progress={part(p, 0.14 + k, 0.26 + k)} seed={seed + 60 + k * 10} taperStart={4} taperEnd={6} startWidth={0.6} endWidth={0.6} />;
  };
  // cuello con relleno de piel (se ensancha hacia los hombros) + el escote por encima: ya no se ve el fondo a través del cuello
  const neckDip: Pt = [neckC[0] + perpT[0] * 5, neckC[1] + (turn > 0.5 ? 20 : 10)];
  const neckFill = [neckTop(-1), neckTop(1), neckBot(1), neckDip, neckBot(-1)];
  const roundNeck = !(topType === "coat" || topType === "jacket" || topType === "cardigan");
  const neckNodes = (
    <g key="neck">
      <Blob polygon={neckFill} color={skin} opacity={clamp01(part(p, 0.12, 0.28) * 3)} seed={seed + 58} rough={0.8} grain={grain} />
      {neckStroke(-1, 0)}
      {neckStroke(1, 0.02)}
      {roundNeck ? <InkStroke points={neckline} width={thin * 0.85} progress={part(p, 0.22, 0.36)} seed={seed + 76} taperStart={6} taperEnd={6} /> : null}
    </g>
  );

  // ── prenda ──
  const garmentPoly: Pt[] = [neckB, ...sideB, ...sideF.slice().reverse(), neckF];
  const garmentFillNode =
    topFill === "outline" ? null : (
      <ScribbleFill
        grain={grain}
        key="gf"
        polygon={garmentPoly}
        color={topColor}
        progress={part(p, 0.4, 0.9)}
        weight={topFill === "solid" ? 11 : 5.4}
        density={topFill === "solid" ? 1.1 : 0.52}
        angle={topFill === "solid" ? (longGarment ? 82 : 66) : 56}
        seed={seed + 70}
        jitter={topFill === "solid" ? 0.3 : 0.45}
      />
    );
  const centerOpen: Pt[] = [neckC, mix(neckC, hipC, 0.4), mix(hipC, [hipC[0] + sway * 0.6, hemY], 0.45 + (topType === "jacket" ? 0.4 : 0.1)), [hipC[0] + sway * 0.7, hemY - 4]];
  const hemLine: Pt[] = [hemB, bow(hemB, hemF, 6), hemF];
  // pliegues de la tela en la cintura al estar sentada (la prenda se junta en el vientre): dos trazos cortos y suaves desde el borde delantero
  const creases: React.ReactNode =
    seatedNow && topType !== "dress" && topType !== "coat" && part(p, 0.4, 0.6) > 0.9
      ? [0.3, 0.2].map((u, i) => {
          const f0 = edge(1, u);
          const a: Pt = [f0[0] - perpT[0] * (5 + 3 * i), f0[1] - perpT[1] * (5 + 3 * i)];
          const b: Pt = [a[0] - perpT[0] * (14 - 2 * i), a[1] - perpT[1] * (14 - 2 * i) + 5];
          const c: Pt = [b[0] - perpT[0] * (14 - 2 * i), b[1] - perpT[1] * (14 - 2 * i) + 1];
          return <InkStroke key={`cr${i}`} points={[a, b, c]} width={thin * 0.5} progress={part(p, 0.5, 0.7)} seed={seed + 140 + i} taperStart={4} taperEnd={9} startWidth={0.5} endWidth={0.2} pressure={0.1} opacity={0.5 + 0.25 * turn} />;
        })
      : null;
  const garmentLines = (
    <g key="gl">
      <InkStroke points={[neckB, ...sideB]} width={W} progress={part(p, 0.2, 0.44)} seed={seed + 71} taperStart={W * 1.2} taperEnd={W * 3} endWidth={0.5} startWidth={0.6} />
      <InkStroke points={[neckF, ...sideF]} width={W} progress={part(p, 0.24, 0.48)} seed={seed + 72} taperStart={W * 1.2} taperEnd={W * 3} endWidth={0.5} startWidth={0.6} />
      <InkStroke points={hemLine} width={W * 0.9} progress={part(p, 0.42, 0.54)} seed={seed + 73} />
      {creases}
      {topType === "coat" || topType === "jacket" || topType === "cardigan" ? (
        turn > 0.35 ? <InkStroke points={centerOpen} width={thin * 0.9} progress={part(p, 0.4, 0.6)} seed={seed + 76} /> : null
      ) : null}
    </g>
  );
  const beltU = 0.47;
  const beltNode = topSpec.belt ? (
    <InkStroke key="belt" points={[edge(-1, beltU), bow(edge(-1, beltU), edge(1, beltU), 5), edge(1, beltU)]} width={W * 1.45} color={resolveColor(topSpec.belt, ACCENTS)} progress={part(p, 0.4, 0.55)} seed={seed + 77} taperStart={4} taperEnd={4} startWidth={0.9} endWidth={0.9} pressure={0.12} />
  ) : null;
  const lapelNode =
    (topType === "coat" || topType === "jacket" || topType === "cardigan") && topSpec.collar !== false && turn > 0.3 ? (
      <g key="lapel">
        <InkStroke points={[neckB, mix(neckC, hipC, 0.12)]} width={thin * 0.8} progress={part(p, 0.3, 0.5)} seed={seed + 78} taperStart={4} taperEnd={6} startWidth={0.7} endWidth={0.5} />
        <InkStroke points={[neckF, mix(neckC, hipC, 0.12)]} width={thin * 0.8} progress={part(p, 0.3, 0.5)} seed={seed + 79} taperStart={4} taperEnd={6} startWidth={0.7} endWidth={0.5} />
      </g>
    ) : null;
  const garmentBase = <path key="gb" d={smoothClosedPath(garmentPoly)} fill={COLORS.cream} opacity={clamp01(part(p, 0.2, 0.34) * 3)} />;

  // ── accesorios ──
  const acc = spec.accessories ?? [];
  const accBehind: React.ReactNode[] = [];
  const accBody: React.ReactNode[] = [];
  const accHands: React.ReactNode[] = [];
  acc.forEach((a, i) => {
    const col = resolveColor(a.color ?? "ink", ACCENTS);
    if (a.type === "backpack") {
      const bc = mix(hipC, neckC, 0.62);
      const off = lerp(-76, -4, turn);
      const w = lerp(92, 150, turn);
      const poly: Pt[] = [
        [bc[0] + off - w / 2, bc[1] - 62],
        [bc[0] + off + w / 2, bc[1] - 68],
        [bc[0] + off + w / 2 + 6, bc[1] + 100],
        [bc[0] + off - w / 2 - 4, bc[1] + 108],
      ];
      accBehind.push(
        <g key={`bp${i}`}>
          <path d={smoothClosedPath(poly)} fill={COLORS.cream} />
          <ScribbleFill grain={grain} polygon={poly} color={col} weight={7} density={0.8} angle={62} seed={seed + 80 + i} progress={part(p, 0.5, 0.95)} jitter={0.35} />
          <InkStroke points={[...poly, poly[0]]} width={W * 0.85} progress={part(p, 0.4, 0.8)} seed={seed + 81 + i} />
          <InkStroke points={[[poly[0][0] + 8, poly[0][1] + 60], [poly[1][0] - 8, poly[1][1] + 56]]} width={thin * 0.6} progress={part(p, 0.5, 0.85)} seed={seed + 83 + i} />
        </g>,
      );
      accBody.push(<InkStroke key={`bps${i}`} points={[mix(j.shoulderL, neckC, 0.3), bow(mix(j.shoulderL, neckC, 0.3), mix(j.shoulderL, hipC, 0.6), 6), mix(j.shoulderL, hipC, 0.6)]} width={thin} progress={part(p, 0.5, 0.8)} seed={seed + 82 + i} />);
      if (turn > 0.5) accBody.push(<InkStroke key={`bps2${i}`} points={[mix(j.shoulderR, neckC, 0.3), mix(j.shoulderR, hipC, 0.6)]} width={thin} progress={part(p, 0.5, 0.8)} seed={seed + 83 + i} />);
    } else if (a.type === "bag" || a.type === "satchel") {
      const hs = j.shoulderR;
      const bagC: Pt = [hipC[0] - lerp(-34, 80, turn) + (a.type === "satchel" ? 20 : 0), hipC[1] + 46];
      accHands.push(
        <g key={`bag${i}`}>
          <InkStroke points={[hs, mix(hs, bagC, 0.5), [bagC[0], bagC[1] - 32]]} width={thin} progress={part(p, 0.55, 0.85)} seed={seed + 84 + i} />
          <path d={smoothClosedPath(ellipsePoly(bagC[0], bagC[1], 40, 34, 0, 10))} fill={COLORS.cream} opacity={clamp01(part(p, 0.6, 0.7) * 3)} />
          <ScribbleFill grain={grain} polygon={ellipsePoly(bagC[0], bagC[1], 40, 34, 0, 10)} color={col} weight={7} density={0.85} progress={part(p, 0.6, 1)} seed={seed + 85 + i} />
          <InkStroke points={handEllipsePoints(bagC[0], bagC[1], 40, 34, { seed: seed + 86 + i, overlap: 12 })} width={W * 0.8} progress={part(p, 0.6, 0.95)} seed={seed + 87 + i} />
        </g>,
      );
    } else if (a.type === "scarf") {
      const nc = j.neck;
      const poly: Pt[] = [
        [nc[0] - 38, nc[1] - 14],
        [nc[0] - 6, nc[1] - 22],
        [nc[0] + 38, nc[1] - 14],
        [nc[0] + 44, nc[1] + 14],
        [nc[0] + 10, nc[1] + 26],
        [nc[0] - 26, nc[1] + 70],
        [nc[0] - 42, nc[1] + 60],
        [nc[0] - 44, nc[1] + 12],
      ];
      accBody.push(
        <g key={`sc${i}`}>
          <path d={smoothClosedPath(poly)} fill={COLORS.cream} />
          <ScribbleFill grain={grain} polygon={poly} color={col} weight={7} density={0.95} progress={part(p, 0.5, 0.95)} seed={seed + 88 + i} jitter={0.3} />
          <InkStroke points={poly.slice(0, 5)} width={thin} progress={part(p, 0.5, 0.9)} seed={seed + 89 + i} />
        </g>,
      );
    } else if (a.type === "glasses") {
      if (face === "dots") {
        accBody.push(
          <g key={`gl${i}`}>
            <InkEllipse cx={faceC[0] - dotGap} cy={faceC[1]} rx={17} ry={14} width={thin * 0.7} seed={seed + 90 + i} progress={part(p, 0.75, 0.95)} />
            <InkEllipse cx={faceC[0] + dotGap + 2} cy={faceC[1]} rx={17} ry={14} width={thin * 0.7} seed={seed + 91 + i} progress={part(p, 0.75, 0.95)} />
          </g>,
        );
      }
    } else if (a.type === "cane") {
      // bastón que sale de la mano (el del reparto lo dibuja cast-others con su propia punta móvil)
      const hand = (a.hand ?? "R") === "R" ? j.wristR : j.wristL;
      const hx = hand[0] + 8;
      const hy = hand[1] + 14;
      const tip: Pt = [hx + 14, 0];
      accHands.push(
        <InkStroke
          key={`cane${i}`}
          points={[[hx - 22, hy - 16], [hx - 12, hy - 34], [hx + 8, hy - 32], [hx + 12, hy - 12], [hx + 8, hy + 12], mix([hx + 8, hy + 12], tip, 0.5), tip]}
          width={W * 0.9}
          progress={part(p, 0.7, 0.95)}
          seed={seed + 92 + i}
          taperStart={6}
          endWidth={0.8}
          taperEnd={10}
        />,
      );
    } else if (a.type === "beanie") {
      const cap: Pt[] = [];
      for (let q = 0; q <= 16; q++) {
        const ang = deg(188 + (164 * q) / 16);
        cap.push(toHead(Math.cos(ang) * 1.14, Math.sin(ang) * 1.18 - 0.02));
      }
      const brim: Pt[] = [toHead(0.98, -0.28), toHead(0.1, -0.4), toHead(-1.04, -0.26)];
      const poly = [...cap, ...brim.slice().reverse()];
      accBody.push(
        <g key={`bn${i}`}>
          <path d={smoothClosedPath(poly)} fill={COLORS.cream} />
          <ScribbleFill grain={grain} polygon={poly} color={col} weight={7} density={0.95} progress={part(p, 0.6, 0.95)} seed={seed + 93 + i} jitter={0.3} />
          <InkStroke points={cap} width={thin} progress={part(p, 0.6, 0.9)} seed={seed + 94 + i} />
          <InkStroke points={brim} width={thin} progress={part(p, 0.6, 0.9)} seed={seed + 95 + i} />
        </g>,
      );
    }
  });

  // ── composición por capas ──
  const mk = (side: Side) => [drawLeg(side), drawShoe(side)];
  const legsFar = farSide ? mk(farSide) : [];
  const legsNear = farSide ? mk(farSide === "L" ? "R" : "L") : [...mk("L"), ...mk("R")];
  const armFar = farSide ? [drawArm(farSide)] : [];
  const armNear = farSide ? [drawArm(farSide === "L" ? "R" : "L")] : [drawArm("L"), drawArm("R")];
  const handFar = o.hideHands ? [] : farSide ? [drawHand(farSide)] : [];
  const handNear = o.hideHands ? [] : farSide ? [drawHand(farSide === "L" ? "R" : "L")] : [drawHand("L"), drawHand("R")];

  behind.push(...hairBack, ...accBehind, ...legsFar, ...armFar, ...handFar);
  parts.push(...legsNear);
  parts.push(garmentBase, garmentFillNode, garmentLines, beltNode, lapelNode);
  parts.push(headNodes, neckNodes);
  parts.push(...armNear, ...accBody);
  hands.push(...handNear, ...accHands);

  return {
    behind: <g key="behind">{behind}</g>,
    body: <g key="body">{parts}</g>,
    hands: <g key="hands">{hands}</g>,
    joints: j,
    dims,
  };
};
