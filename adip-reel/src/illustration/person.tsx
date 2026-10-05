import React, { useId } from "react";
import { COLORS } from "../config/brand.ts";
import { clamp01, deg, dist, ellipsePoly, lerp, mix, norm, rotate, smoothClosedPath, sub, type Pt } from "./geom.ts";
import { mulberry32 } from "../lib/rng.ts";
import { InkEllipse, InkStroke, handEllipsePoints } from "./ink.tsx";
import { ACCENTS, HAIR_COLORS, SKIN_TONES, resolveColor } from "./palette.ts";
import { DEFAULT_POSE, applyIdle, blinkAt, bodyDims, resolvePose, type BodyDims, type BodyKind, type Build, type Joints, type PoseParams, type Side } from "./rig.ts";
import { Blob, ScribbleFill } from "./scribble.tsx";
import { GrainDefs } from "./texture.tsx";

/**
 * PERSON — figura humana mínima al estilo de la referencia: trazo negro fino con temblor, cabeza de óvalo
 * sin rostro (si suma, dos puntos), cuerpo de contorno simple, relleno de garabato en pelo y ropa.
 * Se describe con `PersonSpec` (aspecto) + `PoseParams` (pose, ver rig.ts) y se coloca en el MUNDO con x, y.
 */
export type HairStyle = "short" | "long" | "bob" | "bun" | "curly" | "ponytail" | "bald";
export type GarmentType = "top" | "jacket" | "coat" | "dress";
export type AccessoryType = "backpack" | "cane" | "bag" | "scarf" | "glasses";

export type PersonSpec = {
  kind?: BodyKind;
  build?: Build;
  /** altura de pie en u de mundo a escala 1 (adulto 1050, niño 650, mayor 990 por defecto) */
  height?: number;
  /** clave de SKIN_TONES o color CSS */
  skin?: string;
  hair?: { style: HairStyle; color?: string };
  top?: {
    type?: GarmentType;
    /** clave de ACCENTS o color CSS */
    color?: string;
    /** "hatch" (lápiz de color suelto, por defecto), "solid" (relleno de marcador) o "outline" (solo contorno) */
    fill?: "hatch" | "solid" | "outline";
    /** mangas rellenas ("filled") o solo línea ("line"; por defecto "line" en top/dress, "filled" en abrigo/saco) */
    sleeves?: "line" | "filled";
  };
  legs?: {
    /** "lines" (una línea por pierna) o "trousers" (pantalón relleno) */
    type?: "lines" | "trousers";
    color?: string;
    /** "solid" (por defecto) | "hatch" */
    fill?: "solid" | "hatch";
  };
  /** "ink" (negro), un color, o "none" */
  shoes?: string;
  accessories?: readonly { type: AccessoryType; color?: string; hand?: Side }[];
  /** "dots" = dos puntos sutiles; "none" = sin rostro */
  face?: "none" | "dots";
  /** multiplicador del grosor de tinta (1) */
  ink?: number;
  /** semilla de variación manual */
  seed?: number;
};

const DEFAULT_HEIGHT: Record<BodyKind, number> = { adult: 1050, child: 650, elder: 990 };
/** Grosor de tinta base (RU): 1,25 % de la altura (≈ 13 u en una persona de 1050 u). */
export const INK_WIDTH = 12.5;

export const heightOf = (spec: PersonSpec): number => spec.height ?? DEFAULT_HEIGHT[spec.kind ?? "adult"];

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
  const cap = (bumps = false): Pt[] => {
    const outer: Pt[] = [];
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = deg(194 + (152 * i) / n);
      const bump = bumps ? 1 + 0.08 * Math.sin(i * 2.6) : 1;
      outer.push([Math.cos(a) * 1.09 * bump, Math.sin(a) * 1.1 * bump]);
    }
    const inner: Pt[] = [
      [0.96, -0.1],
      [0.74, -0.4],
      [0.3, -0.6],
      [-0.2, -0.58],
      [-0.68, -0.38],
      [-0.97, -0.08],
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

/** Polígono de un miembro: a ambos lados de la polilínea `pts`, con semiancho `half[i]`. */
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

/** Punto medio desplazado lateralmente (curvatura sutil de miembros). */
const bow = (a: Pt, b: Pt, amount: number): Pt => {
  const m = mix(a, b, 0.5);
  const t = norm(sub(b, a));
  return [m[0] - t[1] * amount, m[1] + t[0] * amount];
};

const part = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a));
const angleDeg = (a: Pt, b: Pt): number => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// ───────────────────────── construcción de la figura ─────────────────────────

export type PersonLayers = {
  /** pelo trasero, brazo/pierna lejanos y accesorios detrás (mochila) */
  behind: React.ReactNode;
  /** cabeza, torso, ropa, piernas, brazos (en ese orden) */
  body: React.ReactNode;
  /** manos y objetos en mano (bastón, bolso); se dibuja por encima de todo (y por encima del celular) */
  hands: React.ReactNode;
  joints: Joints;
  dims: BodyDims;
};

export type BuildOptions = {
  /** 0..1 dibujo progresivo de toda la figura */
  progress?: number;
  seed?: number;
  /** no dibuja las manos (el llamador las dibuja, p. ej. sosteniendo un celular) */
  hideHands?: boolean;
  /** 0 = ojos abiertos … 1 = parpadeo (cierra los dos puntos del rostro) */
  blink?: number;
  /** id de un <GrainDefs> presente en el mismo <svg>: agrega textura de papel a los rellenos planos */
  grainId?: string;
};

/** Resuelve y dibuja la figura en RU (unidades del rig). `Person` la escala y coloca. */
export const buildPerson = (spec: PersonSpec, pose: PoseParams, o: BuildOptions = {}): PersonLayers => {
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
  const sleeves = topSpec.sleeves ?? (topType === "coat" || topType === "jacket" ? "filled" : "line");
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

  // ── torso: marco y contornos ──
  const hipC = j.hip;
  const neckC = j.neck;
  const up = j.up;
  const perpT: Pt = [-up[1], up[0]]; // hacia la derecha de pantalla
  const centerAt = (u: number): Pt => {
    // u: 0 cadera … 1 cuello (Bézier cuadrática por la columna); u<0 cuelga en vertical
    if (u >= 0) return mix(mix(hipC, j.spine, u), mix(j.spine, neckC, u), u);
    return [hipC[0], hipC[1] - u * dims.torso];
  };
  const turn = j.turn;
  const sb = spec.build === "slim" ? 0.9 : spec.build === "broad" ? 1.14 : 1;
  const sh = dims.shoulderHalf;
  const wArmpit = lerp(24, sh * 0.74, turn);
  const wWaist = lerp(26, sh * 0.5 * sb, turn);
  const wHip = lerp(28, dims.hipHalf + 10, turn);
  const flare = topType === "dress" ? 60 : topType === "coat" ? 34 : topType === "jacket" ? 8 : 0;
  const hemDrop = topType === "dress" ? 340 : topType === "coat" ? 300 : topType === "jacket" ? 64 : 40;
  const hemHalf = lerp(34, dims.hipHalf + 16, turn) + flare * (0.4 + 0.6 * turn);
  const uHem = -hemDrop / dims.torso;
  const widthAt = (u: number): number => {
    if (u >= 0.82) return wArmpit;
    if (u >= 0.4) return lerp(wWaist, wArmpit, (u - 0.4) / 0.42);
    if (u >= 0) return lerp(wHip, wWaist, u / 0.4);
    return lerp(wHip, hemHalf, Math.min(1, u / uHem));
  };
  const sideAt = (s: -1 | 1, u: number): Pt => {
    const w = widthAt(u);
    if (u >= 0) {
      const c = centerAt(u);
      return [c[0] + perpT[0] * w * s, c[1] + perpT[1] * w * s];
    }
    return [hipC[0] + s * w, hipC[1] - u * dims.torso];
  };
  const tipL: Pt = [j.shoulderL[0] - 5, j.shoulderL[1] + 2];
  const tipR: Pt = [j.shoulderR[0] + 5, j.shoulderR[1] + 2];
  const us = [0.82, 0.6, 0.4, 0.2, 0, uHem * 0.5, uHem];
  const sideLeft: Pt[] = [tipL, ...us.map((u) => sideAt(-1, u))];
  const sideRight: Pt[] = [tipR, ...us.map((u) => sideAt(1, u))];
  if (turn < 0.6) {
    // perfil: el pecho avanza y la espalda se curva
    const f = (1 - turn) * 16;
    sideRight[2] = [sideRight[2][0] + f, sideRight[2][1]];
    sideRight[3] = [sideRight[3][0] + f * 0.7, sideRight[3][1]];
    sideLeft[3] = [sideLeft[3][0] - f * 0.5, sideLeft[3][1]];
  }
  // sentada con prenda larga: el dobladillo cae sobre los muslos hasta las rodillas
  const longGarment = topType === "coat" || topType === "dress";
  if (longGarment && hipC[1] > -430) {
    const kl = j.kneeL;
    const kr = j.kneeR;
    const mL = mix(sideLeft[sideLeft.length - 3], [kl[0] - 30, kl[1] + 10], 0.5);
    const mR = mix(sideRight[sideRight.length - 3], [kr[0] + 30, kr[1] + 10], 0.5);
    sideLeft.length -= 2;
    sideRight.length -= 2;
    sideLeft.push(mL, [kl[0] - 32, kl[1] + 34]);
    sideRight.push(mR, [kr[0] + 32, kr[1] + 36]);
  }
  const hemL = sideLeft[sideLeft.length - 1];
  const hemR = sideRight[sideRight.length - 1];
  const hemY = (hemL[1] + hemR[1]) / 2;
  const neckHalf = lerp(15, 25, turn);
  const neckL: Pt = [neckC[0] - perpT[0] * neckHalf, neckC[1] - perpT[1] * neckHalf - 2];
  const neckR: Pt = [neckC[0] + perpT[0] * neckHalf, neckC[1] + perpT[1] * neckHalf - 2];

  const parts: React.ReactNode[] = [];
  const behind: React.ReactNode[] = [];
  const hands: React.ReactNode[] = [];

  // ── miembros (con curvatura sutil) ──
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

  const drawLeg = (side: Side): React.ReactNode => {
    const pts = side === "L" ? legL : legR;
    const pp = part(p, 0.5, 0.78);
    const out: React.ReactNode[] = [];
    if (legsType === "trousers" && !longGarment) {
      const half = pts.map((_, i) => lerp(37, 23, i / (pts.length - 1)));
      const lp = limbPoly(pts, half);
      const ang = angleDeg(pts[0], pts[pts.length - 1]);
      if (legFill === "solid") {
        out.push(<Blob key="f" polygon={lp.poly} color={legColor} seed={ls(3)} rough={2.2} grain={o.grainId} reveal={part(p, 0.5, 0.82)} />);
        if (legColor !== COLORS.black) {
          out.push(<InkStroke key="o1" points={lp.left} width={thin} progress={pp} seed={ls(5)} />);
          out.push(<InkStroke key="o2" points={lp.right} width={thin} progress={pp} seed={ls(6)} />);
        }
      } else {
        out.push(
          <ScribbleFill key="f" polygon={lp.poly} color={legColor} progress={part(p, 0.62, 0.95)} weight={6.5} density={0.7} angle={ang + (side === "L" ? 52 : -52)} seed={ls(side === "L" ? 3 : 4)} jitter={0.5} />,
        );
        out.push(<InkStroke key="o1" points={lp.left} width={thin} progress={pp} seed={ls(5)} />);
        out.push(<InkStroke key="o2" points={lp.right} width={thin} progress={pp} seed={ls(6)} />);
      }
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
    // bota/zapato: polígono en el marco del pie (x a lo largo del pie, y hacia abajo)
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
        {o.grainId ? <path d={smoothClosedPath(poly)} fill={`url(#${o.grainId})`} /> : null}
      </g>
    );
  };

  const sleeveHalf = (n: number) => Array.from({ length: n }, (_, i) => lerp(24, 15, i / (n - 1)));
  const drawArm = (side: Side): React.ReactNode => {
    const pts = side === "L" ? armL : armR;
    const pp = part(p, 0.44, 0.66);
    if (sleeves === "filled" && topFill !== "outline") {
      const lp = limbPoly(pts, sleeveHalf(pts.length));
      return (
        <g key={`arm${side}`}>
          <path d={smoothClosedPath(lp.poly)} fill={COLORS.cream} opacity={clamp01(pp * 3)} />
          <ScribbleFill
            polygon={lp.poly}
            color={topColor}
            progress={part(p, 0.55, 0.9)}
            weight={topFill === "solid" ? 10 : 5.2}
            density={topFill === "solid" ? 1.1 : 0.5}
            angle={56}
            seed={ls(side === "L" ? 11 : 12)}
            jitter={0.3}
          />
          <InkStroke points={lp.left} width={thin} progress={pp} seed={ls(side === "L" ? 13 : 14)} endWidth={0.5} />
          <InkStroke points={lp.right} width={thin} progress={pp} seed={ls(side === "L" ? 15 : 16)} endWidth={0.5} />
        </g>
      );
    }
    return <InkStroke key={`arm${side}`} points={pts} width={W * 0.95} progress={pp} seed={ls(side === "L" ? 7 : 8)} taperEnd={W * 1.5} endWidth={0.55} />;
  };

  const drawHand = (side: Side): React.ReactNode => {
    const wr = side === "L" ? j.wristL : j.wristR;
    const el = side === "L" ? j.elbowL : j.elbowR;
    const d = norm(sub(wr, el));
    const n: Pt = [-d[1], d[0]];
    const hl = dims.hand;
    const at = (a: number, b: number): Pt => [wr[0] + d[0] * hl * a + n[0] * b, wr[1] + d[1] * hl * a + n[1] * b];
    const ps: Pt[] = [at(0, 13), at(0.45, 18), at(0.95, 9), at(1.08, -2), at(0.5, -16), at(0, -12)];
    const pp = part(p, 0.62, 0.78);
    if (pp <= 0) return null;
    return (
      <g key={`hand${side}`}>
        <Blob polygon={ps} color={skin} opacity={0.94 * clamp01(pp * 2.5)} seed={ls(9)} rough={1.5} grain={o.grainId} />
        <InkStroke points={[...ps, ps[0]]} width={thin * 0.8} progress={pp} seed={ls(10)} taperStart={8} taperEnd={10} startWidth={0.6} endWidth={0.5} />
      </g>
    );
  };

  // ── cabeza ──
  const hc = j.headC;
  const ha = j.headAngle;
  const rx = j.headRx;
  const ry = j.headRy;
  const toHead = (u: number, v: number): Pt => rotate([hc[0] + u * rx, hc[1] + v * ry], deg(ha), hc);
  const hair = hairShape(hairSpec.style, 1 - turn);
  const hairPoly = (q: Pt[]): Pt[] => q.map((c) => toHead(c[0], c[1]));
  const hairP = part(p, 0.55, 0.9);
  const hairFlat = (poly: Pt[], key: string, sd: number) => <Blob key={key} polygon={hairPoly(poly)} color={hairColor} opacity={clamp01(hairP * 4)} seed={sd} rough={1.4} grain={o.grainId} />;
  const hairBack = hair.back.map((poly, i) => hairFlat(poly, `hb${i}`, seed + 20 + i));
  const hairFront = hair.front.map((poly, i) => hairFlat(poly, `hf${i}`, seed + 30 + i));
  // trazos de textura del pelo (rizos / mechones): claros sobre pelo oscuro, oscuros sobre pelo claro
  const hairDetail: React.ReactNode[] = [];
  if (hairSpec.style !== "bald" && hairP > 0.5) {
    const rnd = mulberry32(seed + 90);
    const n = hairSpec.style === "curly" ? 9 : hairSpec.style === "long" || hairSpec.style === "bob" ? 4 : 3;
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
  const faceC = rotate(j.face, deg(ha), hc);
  const look = Math.abs(pose.head.look);
  const dotGap = rx * (0.34 - 0.15 * look);
  const dotsOp = clamp01(part(p, 0.7, 0.9) * 2) * 0.8;
  // mirada baja → los puntos se vuelven párpados (rayitas); al levantar la mirada vuelven a ser puntos
  const lid = clamp01((pose.head.nod - 0.3) / 0.45);
  const eyeRx = lerp(4.2, 8.4, lid);
  const eyeRy = Math.max(0.8, lerp(4.8, 2.9, lid) * (1 - 0.85 * (o.blink ?? 0)));
  const headNodes = (
    <g key="head">
      <Blob polygon={skinPoly} color={skin} opacity={0.94 * clamp01(part(p, 0.04, 0.2) * 3)} seed={seed + 50} rough={2} grain={o.grainId} />
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

  // cuello: nace en el contorno inferior de la cabeza (sin entrar en la cara) y baja a la base del cuello
  const neckHalfChin = lerp(11, 16, turn);
  const neckHalfBase = lerp(14, 21, turn);
  const neckStroke = (s: -1 | 1, k: number) => {
    const hx = s * neckHalfChin;
    const hy = ry * Math.sqrt(Math.max(0.05, 1 - (hx / rx) * (hx / rx)));
    const top = rotate([hc[0] + hx, hc[1] + hy - 2], deg(ha), hc);
    const bot: Pt = [j.neck[0] + s * perpT[0] * neckHalfBase, j.neck[1] + s * perpT[1] * neckHalfBase + 2];
    return (
      <InkStroke key={`n${s}`} points={[top, mix(top, bot, 0.5), bot]} width={thin} progress={part(p, 0.14 + k, 0.26 + k)} seed={seed + 60 + k * 10} taperStart={4} taperEnd={6} startWidth={0.6} endWidth={0.6} />
    );
  };
  const neckNodes = (
    <g key="neck">
      {neckStroke(-1, 0)}
      {turn > 0.35 ? neckStroke(1, 0.02) : null}
    </g>
  );

  // ── prenda ──
  const garmentPoly: Pt[] = [neckL, tipL, ...sideLeft.slice(1), ...sideRight.slice(1).reverse(), tipR, neckR];
  const garmentFillNode =
    topFill === "outline" ? null : (
      <ScribbleFill
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
  const neckline: Pt[] = [neckL, [neckC[0], neckC[1] + (turn > 0.5 ? 20 : 8)], neckR];
  const centerOpen: Pt[] = [neckC, mix(neckC, hipC, 0.4), mix(hipC, [hipC[0], hemY], 0.4 + (topType === "jacket" ? 0.5 : 0.1)), [hipC[0], hemY - 4]];
  const garmentLines = (
    <g key="gl">
      <InkStroke points={sideLeft} width={W} progress={part(p, 0.2, 0.44)} seed={seed + 71} taperEnd={W * 3} endWidth={0.5} startWidth={0.7} />
      <InkStroke points={sideRight} width={W} progress={part(p, 0.24, 0.48)} seed={seed + 72} taperEnd={W * 3} endWidth={0.5} startWidth={0.7} />
      <InkStroke points={[hemL, bow(hemL, hemR, 7), hemR]} width={W * 0.9} progress={part(p, 0.42, 0.54)} seed={seed + 73} />
      <InkStroke points={[neckL, tipL]} width={thin} progress={part(p, 0.2, 0.34)} seed={seed + 74} taperStart={6} taperEnd={10} />
      <InkStroke points={[neckR, tipR]} width={thin} progress={part(p, 0.22, 0.36)} seed={seed + 75} taperStart={6} taperEnd={10} />
      {topType === "coat" || topType === "jacket" ? (
        turn > 0.5 ? <InkStroke points={centerOpen} width={thin * 0.9} progress={part(p, 0.4, 0.6)} seed={seed + 76} /> : null
      ) : (
        <InkStroke points={neckline} width={thin * 0.85} progress={part(p, 0.22, 0.36)} seed={seed + 76} taperStart={6} taperEnd={6} />
      )}
    </g>
  );
  // base opaca (tapa lo que queda detrás de la prenda: pelo, miembro lejano…)
  const garmentBase = <path key="gb" d={smoothClosedPath(garmentPoly)} fill={COLORS.cream} opacity={clamp01(part(p, 0.2, 0.34) * 3)} />;

  // ── accesorios ──
  const acc = spec.accessories ?? [];
  const accBehind: React.ReactNode[] = [];
  const accBody: React.ReactNode[] = [];
  const accHands: React.ReactNode[] = [];
  acc.forEach((a, i) => {
    const col = resolveColor(a.color ?? "ink", ACCENTS);
    if (a.type === "backpack") {
      const bc = mix(hipC, neckC, 0.6);
      const off = lerp(-72, -2, turn);
      const w = lerp(88, 150, turn);
      const poly: Pt[] = [
        [bc[0] + off - w / 2, bc[1] - 66],
        [bc[0] + off + w / 2, bc[1] - 72],
        [bc[0] + off + w / 2 + 6, bc[1] + 104],
        [bc[0] + off - w / 2 - 4, bc[1] + 112],
      ];
      accBehind.push(
        <g key={`bp${i}`}>
          <path d={smoothClosedPath(poly)} fill={COLORS.cream} />
          <ScribbleFill polygon={poly} color={col} weight={7} density={0.8} angle={62} seed={seed + 80 + i} progress={part(p, 0.5, 0.95)} jitter={0.35} />
          <InkStroke points={[...poly, poly[0]]} width={W * 0.85} progress={part(p, 0.4, 0.8)} seed={seed + 81 + i} />
        </g>,
      );
      accBody.push(<InkStroke key={`bps${i}`} points={[mix(j.shoulderL, neckC, 0.3), mix(j.shoulderL, hipC, 0.6)]} width={thin} progress={part(p, 0.5, 0.8)} seed={seed + 82 + i} />);
      if (turn > 0.5) accBody.push(<InkStroke key={`bps2${i}`} points={[mix(j.shoulderR, neckC, 0.3), mix(j.shoulderR, hipC, 0.6)]} width={thin} progress={part(p, 0.5, 0.8)} seed={seed + 83 + i} />);
    } else if (a.type === "bag") {
      const hs = j.shoulderR;
      const bagC: Pt = [hipC[0] - lerp(-34, 80, turn), hipC[1] + 46];
      accHands.push(
        <g key={`bag${i}`}>
          <InkStroke points={[hs, mix(hs, bagC, 0.5), [bagC[0], bagC[1] - 32]]} width={thin} progress={part(p, 0.55, 0.85)} seed={seed + 84 + i} />
          <path d={smoothClosedPath(ellipsePoly(bagC[0], bagC[1], 40, 34, 0, 10))} fill={COLORS.cream} opacity={clamp01(part(p, 0.6, 0.7) * 3)} />
          <ScribbleFill polygon={ellipsePoly(bagC[0], bagC[1], 40, 34, 0, 10)} color={col} weight={7} density={0.85} progress={part(p, 0.6, 1)} seed={seed + 85 + i} />
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
          <ScribbleFill polygon={poly} color={col} weight={7} density={0.95} progress={part(p, 0.5, 0.95)} seed={seed + 88 + i} jitter={0.3} />
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
      const hand = (a.hand ?? "R") === "R" ? j.wristR : j.wristL;
      const hx = hand[0] + 8;
      const hy = hand[1] + 14;
      const tip: Pt = [hx + 14, 0];
      accHands.push(
        <InkStroke
          key={`cane${i}`}
          points={[
            [hx - 22, hy - 16],
            [hx - 12, hy - 34],
            [hx + 8, hy - 32],
            [hx + 12, hy - 12],
            [hx + 8, hy + 12],
            mix([hx + 8, hy + 12], tip, 0.5),
            tip,
          ]}
          width={W * 0.9}
          progress={part(p, 0.7, 0.95)}
          seed={seed + 92 + i}
          taperStart={6}
          endWidth={0.8}
          taperEnd={10}
        />,
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
  parts.push(garmentBase, garmentFillNode, garmentLines);
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

// ───────────────────────── componente ─────────────────────────

export type PersonProps = {
  spec: PersonSpec;
  /** pose (por defecto de pie, de frente) */
  pose?: PoseParams;
  /** posición del ancla en el mundo */
  x: number;
  y: number;
  /** multiplicador de escala (1 = altura de `spec`) */
  scale?: number;
  /** 1 = mira hacia +x; −1 = espejada (mira a −x) */
  facing?: 1 | -1;
  /** "ground": (x, y) = punto del suelo entre los pies; "hip": (x, y) = cadera */
  anchor?: "ground" | "hip";
  /** fotograma absoluto para respiración/reposo (con `idle` > 0) */
  frame?: number;
  /** 0..1 intensidad del movimiento de reposo (0 = quieta) */
  idle?: number;
  /** 0..1 dibujo progresivo */
  drawProgress?: number;
  seed?: number;
  style?: React.CSSProperties;
};

/** Escala RU → mundo de una figura. */
export const personScale = (spec: PersonSpec, scale = 1): number => (heightOf(spec) / 1000) * scale;

/** Figura autónoma: <svg> 1×1 con overflow visible posicionado en (x, y) del mundo. */
export const Person: React.FC<PersonProps> = ({ spec, pose = DEFAULT_POSE, x, y, scale = 1, facing = 1, anchor = "ground", frame = 0, idle = 1, drawProgress = 1, seed = 0, style }) => {
  const k = personScale(spec, scale);
  const posed = idle > 0 ? applyIdle(pose, frame, (spec.seed ?? 1) + seed, idle) : pose;
  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const layers = buildPerson(spec, posed, { progress: drawProgress, seed, blink: idle > 0 ? blinkAt(frame, (spec.seed ?? 1) + seed) : 0, grainId: gid });
  const ox = anchor === "hip" ? -posed.hip[0] : 0;
  const oy = anchor === "hip" ? -posed.hip[1] : 0;
  return (
    <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: x, top: y, overflow: "visible", pointerEvents: "none", ...style }}>
      <GrainDefs id={gid} />
      <g transform={`scale(${(k * facing).toFixed(5)} ${k.toFixed(5)}) translate(${ox.toFixed(2)} ${oy.toFixed(2)})`}>
        {layers.behind}
        {layers.body}
        {layers.hands}
      </g>
    </svg>
  );
};

// ───────────────────────── conversión mundo ↔ rig ─────────────────────────

export type Placement = {
  spec: PersonSpec;
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  anchor?: "ground" | "hip";
  /** necesaria si anchor = "hip" (la cadera de la pose es el origen) */
  pose?: PoseParams;
};

/** Punto del rig (RU, origen = suelo bajo la figura) → mundo. Ej.: dónde cae la mano en el mundo. */
export const rigToWorld = (p: Pt, pl: Placement): Pt => {
  const k = personScale(pl.spec, pl.scale);
  const f = pl.facing ?? 1;
  const ox = pl.anchor === "hip" && pl.pose ? pl.pose.hip[0] : 0;
  const oy = pl.anchor === "hip" && pl.pose ? pl.pose.hip[1] : 0;
  return [pl.x + f * k * (p[0] - ox), pl.y + k * (p[1] - oy)];
};

/** Punto del MUNDO → rig (RU). Ej.: objetivo IK de una mano que debe llegar a un punto del mundo. */
export const worldToRig = (w: Pt, pl: Placement): Pt => {
  const k = personScale(pl.spec, pl.scale);
  const f = pl.facing ?? 1;
  const ox = pl.anchor === "hip" && pl.pose ? pl.pose.hip[0] : 0;
  const oy = pl.anchor === "hip" && pl.pose ? pl.pose.hip[1] : 0;
  return [(w[0] - pl.x) / (f * k) + ox, (w[1] - pl.y) / k + oy];
};

/** Posición en el MUNDO de una articulación de la pose (cabeza, manos, pies, hombros…). */
export const jointWorld = (pl: Placement & { pose: PoseParams }, name: "hip" | "neck" | "headC" | "face" | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "wristL" | "wristR" | "kneeL" | "kneeR" | "ankleL" | "ankleR"): Pt => {
  const j = resolvePose(pl.pose, bodyDims(pl.spec.kind, pl.spec.build));
  return rigToWorld(j[name], pl);
};
