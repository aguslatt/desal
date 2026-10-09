import React from "react";
import { COLORS } from "../config/brand.ts";
import { catmullRom, clipPoly, Curve, ellipsePoly, fwd, lerp, mix, norm, offsetLine, part, perp, rad, rotate, sub, sweepPoly, up, type Pt } from "./geom.ts";
import { Flat, handCirclePoints, InkStroke, INK_WIDTH } from "./ink.tsx";
import { BODY, type Skeleton } from "./rig.ts";

/**
 * FIGURA DE TRAZO LIVIANO — dibuja una persona sentada (de perfil) a partir de su `Skeleton`.
 *  · contornos de tinta negra FINA (≈ 1 % de la altura), con presión y temblor suaves; los contornos NO se cierran del todo;
 *  · cara en blanco (sin rasgos): la expresión va en la postura, la inclinación de la cabeza y las manos;
 *  · UNA prenda con relleno plano de la paleta (corrido unos px respecto de la línea, como un color impreso aparte);
 *  · pelo y zapatos en negro sólido; pantalón simple (solo contorno; el negro sólido queda como opción). Sin hachurado, sin rayas, sin texturas.
 *  · DIBUJO PROGRESIVO sin opacidad: cada parte se traza en su ventana (WIN) y su relleno la ACOMPAÑA recortado por un barrido
 *    (el color/papel avanza con la línea y nunca la pasa), así no hay transparencias fantasma ni cosas que aparezcan de golpe.
 * Marco local: la figura mira a +x (para mirar a −x se espeja el grupo contenedor).
 */
export type FigureStyle = {
  seed: number;
  /** color plano de la prenda (paleta oficial) */
  top: string;
  sleeves: "long" | "short";
  /** 1 = ajustada … 1,2 = holgada (oversize) */
  baggy: number;
  pants: "solid" | "outline";
  hair: "long" | "curls";
  /** color del papel (la piel y las caras quedan en blanco = papel) */
  paper: string;
  ink: string;
  /** grosor base de la tinta */
  width: number;
  /** dibuja el brazo lejano (queda detrás del torso) */
  farArm: boolean;
  /** dibuja la pierna lejana (queda detrás de la cercana) */
  farLeg: boolean;
  /** registro del color de la prenda respecto de la línea (px) */
  offset: [number, number];
};

export const defaultStyle = (o: Partial<FigureStyle> = {}): FigureStyle => ({
  seed: 1,
  top: COLORS.purple,
  sleeves: "long",
  baggy: 1.1,
  pants: "outline",
  hair: "long",
  paper: COLORS.grey,
  ink: COLORS.black,
  width: INK_WIDTH,
  farArm: true,
  farLeg: true,
  offset: [3, 2.5],
  ...o,
});

type Prog = (a: number, b: number) => number;
type Win = readonly [number, number];

/**
 * ORDEN DE DIBUJO (ventanas del progreso 0..1 de la figura; 1 f = 0,02 con drawFrames 50). En CADA fotograma tiene que leerse una persona
 * sentada que se va completando y TODO trazo nace anclado a algo ya dibujado (nunca una rayita en el aire):
 *   1. el banco (props.tsx: tablón → patas que cuelgan de un borde ya trazado → sombra);
 *   2. la SILUETA sentada: el torso sube desde el asiento (sus dos contornos nacen sobre el tablón y el color los sigue) y, apenas el violeta pasó
 *      la altura de la cadera, el muslo se desliza hacia adelante sobre él (el contorno del muslo nace DENTRO del torso ya pintado) y baja por la pierna;
 *   3. el cuello y la cabeza enseguida (el cuello nace en el cuello de la prenda y el círculo de la cabeza en la punta del cuello): el torso sin cabeza dura
 *      ≈ 4 f; el zapato crece desde el tobillo (cuña negra que se abre hacia la punta) cuando las líneas de la pierna ya llegaron, sin bloque que «brota»;
 *   4. DESPUÉS los detalles: pelo, brazos, manos y celular.
 * El celular (props.tsx) entra cuando la mano que lo sostiene ya está casi trazada y sube desde ella (lo maneja Listening con la ventana PHONE_WIN).
 */
export const WIN = {
  leg: [0.125, 0.27],
  shoe: [0.26, 0.36],
  hem: [0.08, 0.13],
  torso: [0.08, 0.17],
  neck: [0.18, 0.22],
  head: [0.215, 0.315],
  hair: [0.33, 0.47],
  farArm: [0.41, 0.62],
  farHand: [0.62, 0.78],
  arm: [0.44, 0.66],
  hand: [0.66, 0.84],
} as const satisfies Record<string, Win>;
/** El celular entra cuando la mano que lo sostiene ya está casi trazada: sube desde la mano (su pie queda tapado por los dedos), así que nace pegado a ella. */
export const PHONE_WIN: Win = [WIN.hand[1] - 0.03, 1];
/** El color acompaña al trazo: la misma ventana corrida apenas hacia adelante (el relleno nunca se adelanta a la línea; ≈ 0,5–0,8 f de retraso). */
const behind = (w: Win): Win => [w[0] + 0.015, w[1] + 0.015];

// ───────────────────────── manos ─────────────────────────

type Poly = readonly Pt[];
// Siluetas de la mano en unidades de largo de mano (x a lo largo de los dedos, y perpendicular; y negativo = lado del pulgar).
// Las tres tienen la misma topología (18 vértices) para poder mezclarlas de forma continua.
const HAND_OPEN: Poly = [
  [0, 0.16], [0.28, 0.2], [0.52, 0.2], [0.74, 0.17], [0.91, 0.12], [1.0, 0.06], [1.02, -0.01], [0.96, -0.07], [0.82, -0.1], [0.6, -0.12],
  [0.67, -0.26], [0.75, -0.38], [0.73, -0.46], [0.64, -0.45], [0.52, -0.33], [0.37, -0.23], [0.17, -0.17], [0, -0.15],
];
const HAND_RELAXED: Poly = [
  [0, 0.16], [0.28, 0.2], [0.52, 0.2], [0.72, 0.18], [0.86, 0.14], [0.94, 0.08], [0.95, 0.02], [0.9, -0.04], [0.78, -0.08], [0.6, -0.1],
  [0.64, -0.17], [0.7, -0.22], [0.69, -0.27], [0.61, -0.27], [0.5, -0.22], [0.36, -0.18], [0.17, -0.16], [0, -0.15],
];
/** Mano que sujeta (dedos recogidos): más corta y redondeada. */
const HAND_GRIP: Poly = HAND_RELAXED.map(([x, y]) => [x * 0.64, y * 1.05] as Pt);
/** Líneas de los dedos (de la punta hacia los nudillos), en el marco de la mano abierta; `fingerLine` las ajusta al largo real de la silueta. */
const FINGER_LINES: readonly (readonly [Pt, Pt])[] = [
  [[0.99, 0.06], [0.6, 0.075]],
  [[1.0, 0.0], [0.62, 0.0]],
  [[0.93, -0.06], [0.62, -0.05]],
];

/** Extensión (unidades de largo de mano) de la silueta hacia las puntas de los dedos según la apertura: las líneas de los dedos no la pasan. */
const handTip = (open: number): number => {
  let m = 0;
  for (let i = 0; i < HAND_RELAXED.length; i++) {
    const q = open < 0 ? mix(HAND_GRIP[i], HAND_RELAXED[i], 1 + open) : mix(HAND_RELAXED[i], HAND_OPEN[i], open);
    m = Math.max(m, q[0]);
  }
  return m;
};

/**
 * Silueta de la mano en la pantalla. `open`: −1 = sujeta (dedos recogidos), 0 = relajada, 1 = abierta con la palma hacia arriba
 * (dedos largos, pulgar separado), como al ofrecer la mano. La muñeca queda en `wrist`; `angleDeg` = dirección de los dedos.
 */
export const handPolygon = (wrist: Pt, angleDeg: number, open: number, len = BODY.hand): Pt[] => {
  const a = rad(angleDeg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return HAND_RELAXED.map((_, i) => {
    const q = open < 0 ? mix(HAND_GRIP[i], HAND_RELAXED[i], 1 + open) : mix(HAND_RELAXED[i], HAND_OPEN[i], open);
    return [wrist[0] + (c * q[0] - s * q[1]) * len, wrist[1] + (s * q[0] + c * q[1]) * len] as Pt;
  });
};

// ───────────────────────── miembros ─────────────────────────

/** Perfil de radios a lo largo de un miembro (t = 0..1 por longitud de arco): lista de [t, r] interpolada linealmente. */
const radiusAt = (prof: readonly (readonly [number, number])[], t: number): number => {
  if (t <= prof[0][0]) return prof[0][1];
  for (let i = 1; i < prof.length; i++) {
    if (t <= prof[i][0]) return lerp(prof[i - 1][1], prof[i][1], (t - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0] || 1));
  }
  return prof[prof.length - 1][1];
};

const ARM_PROFILE = [[0, 13.2], [0.3, 12.2], [0.55, 10.2], [0.75, 8.9], [1, 7]] as const;
const LEG_PROFILE = [[0, 20], [0.3, 19.2], [0.5, 14.8], [0.7, 14.2], [0.9, 10.4], [1, 8.6]] as const;

type Limb = { center: Pt[]; left: Pt[]; right: Pt[]; curve: Curve; r0: number };

const buildLimb = (pts: readonly Pt[], profile: readonly (readonly [number, number])[], k = 1): Limb => {
  const center = catmullRom(pts, 3);
  const curve = new Curve(center);
  const L = curve.length || 1;
  const radius = (i: number) => radiusAt(profile, curve.cum[i] / L) * k;
  const left = offsetLine(center, (i) => radius(i));
  const right = offsetLine(center, (i) => -radius(i));
  return { center, left, right, curve, r0: radius(0) };
};

/** Recorta una polilínea a la parte entre las fracciones t0..t1 (por índice, ya densa). */
const slice = (pts: readonly Pt[], t0: number, t1: number): Pt[] => {
  const n = pts.length;
  const a = Math.max(0, Math.round(t0 * (n - 1)));
  const b = Math.min(n - 1, Math.round(t1 * (n - 1)));
  return pts.slice(a, b + 1);
};

/** Polígono del miembro entre t0 y t1; con `cap` redondea el extremo proximal (cadera/hombro). */
const limbPoly = (l: Limb, t0 = 0, t1 = 1, cap = false): Pt[] => {
  const a = slice(l.left, t0, t1);
  const b = slice(l.right, t0, t1).reverse();
  const out = [...a, ...b];
  if (cap && a.length > 1) {
    const i0 = Math.max(0, Math.round(t0 * (l.center.length - 1)));
    const c = l.center[i0];
    const dir = norm(sub(l.center[Math.min(l.center.length - 1, i0 + 2)], c));
    const r = l.r0;
    const n = perp(dir);
    const arc: Pt[] = [];
    for (let k = 1; k < 6; k++) {
      const th = (k / 6) * Math.PI;
      const ca = Math.cos(th);
      const sa = Math.sin(th);
      // desde el lado derecho (−perp) hacia atrás hasta el izquierdo
      arc.push([c[0] - n[0] * r * ca - dir[0] * r * sa, c[1] - n[1] * r * ca - dir[1] * r * sa]);
    }
    return [...arc, ...out];
  }
  return out;
};

/** Arco redondeado del extremo proximal (cadera/hombro) de un miembro, de un costado al otro por atrás: cierra el contorno del muslo. */
const limbCapArc = (l: Limb): Pt[] => {
  const c = l.center[0];
  const dir = norm(sub(l.center[Math.min(l.center.length - 1, 2)], c));
  const n = perp(dir);
  const r = l.r0;
  const arc: Pt[] = [];
  for (let k = 0; k <= 6; k++) {
    const th = (k / 6) * Math.PI;
    arc.push([c[0] - n[0] * r * Math.cos(th) - dir[0] * r * Math.sin(th), c[1] - n[1] * r * Math.cos(th) - dir[1] * r * Math.sin(th)]);
  }
  return arc;
};

/** Parte del miembro que un trazo con progreso `p` ya recorrió (los trazos van de `from` a `to`): el relleno avanza con la línea. */
const limbReveal = (l: Limb, p: number, from: number, to: number): Pt[] => (p <= 0 ? [] : limbPoly(l, 0, lerp(from, to, Math.min(1, p)), true));

/** Zapato: sólido negro. `ankle` + ángulo del pie (° bajo la horizontal). */
const shoePoly = (ankle: Pt, angle: number): Pt[] => {
  const { back, front, drop } = BODY.foot;
  const local: Pt[] = [
    [-back, -10],
    [-back - 2, 6],
    [-back, drop - 3],
    [-back + 6, drop],
    [front - 14, drop],
    [front - 2, drop - 2],
    [front + 2, drop - 9],
    [front - 4, drop - 17],
    [front - 18, drop - 24],
    [10, -8],
    [0, -12],
  ];
  const r = rad(angle);
  return local.map((p) => {
    const q = rotate(p, r);
    return [ankle[0] + q[0], ankle[1] + q[1]] as Pt;
  });
};

type ArmProps = {
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  style: FigureStyle;
  prog: Prog;
  seedOff: number;
  win: Win;
};

/** Manga + antebrazo (relleno papel, prenda plana y dos líneas). Va ANTES del celular. El color avanza con la línea (sin retraso: sobre el torso un papel sin color se vería como un parche blanco). */
const ArmSleeve: React.FC<ArmProps> = ({ shoulder, elbow, wrist, style, prog, seedOff, win }) => {
  const long = style.sleeves === "long";
  const limb = buildLimb([shoulder, elbow, wrist], ARM_PROFILE, 1);
  const sl = buildLimb([shoulder, elbow, wrist], ARM_PROFILE, long ? style.baggy : 1.1);
  const w = style.width;
  const pArm = prog(win[0], win[1]);
  const t1 = long ? 0.95 : 0.37;
  const lineW = w * 0.9;
  const cuff: Pt[] = [sl.left[Math.round(t1 * (sl.left.length - 1))], sl.right[Math.round(t1 * (sl.right.length - 1))]];
  return (
    <g>
      <Flat poly={limbReveal(limb, pArm, 0.03, 0.995)} color={style.paper} />
      <Flat poly={limbReveal(sl, Math.min(1, pArm * 1.04 + (pArm > 0 ? 0.02 : 0)), 0, t1)} color={style.top} dx={style.offset[0] * 0.7} dy={style.offset[1] * 0.7} />
      <InkStroke points={slice(sl.left, 0.03, t1 + 0.02)} width={lineW} progress={pArm} seed={style.seed + seedOff} taperStart={10} taperEnd={long ? 12 : 4} color={style.ink} />
      <InkStroke points={slice(sl.right, 0.06, t1 + 0.02)} width={lineW} progress={pArm} seed={style.seed + seedOff + 1} taperStart={10} taperEnd={long ? 12 : 4} color={style.ink} />
      {!long ? (
        <>
          <InkStroke points={cuff} width={lineW * 0.9} progress={part(pArm, 0.3, 0.6)} seed={style.seed + seedOff + 2} taperStart={3} taperEnd={3} startWidth={0.8} endWidth={0.7} color={style.ink} />
          <InkStroke points={slice(limb.left, t1 + 0.02, 1)} width={lineW} progress={part(pArm, 0.4, 1)} seed={style.seed + seedOff + 3} taperStart={6} taperEnd={6} color={style.ink} />
          <InkStroke points={slice(limb.right, t1 + 0.02, 1)} width={lineW} progress={part(pArm, 0.4, 1)} seed={style.seed + seedOff + 4} taperStart={6} taperEnd={6} color={style.ink} />
        </>
      ) : null}
    </g>
  );
};

/** Mano: relleno papel + contorno abierto en la muñeca + líneas de los dedos (más marcadas al abrirse). */
const ArmHand: React.FC<{ wrist: Pt; angle: number; open: number; style: FigureStyle; prog: Prog; seedOff: number; win: Win }> = ({ wrist, angle, open, style, prog, seedOff, win }) => {
  const hp = handPolygon(wrist, angle, open);
  const pHand = prog(win[0], win[1]);
  const a = rad(angle);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const toW = (p: Pt): Pt => [wrist[0] + (c * p[0] - s * p[1]) * BODY.hand, wrist[1] + (s * p[0] + c * p[1]) * BODY.hand];
  const fingerAmt = Math.max(0, open + 0.15) / 1.15;
  // las líneas terminan un poco antes del borde de la silueta (si no, asomarían como «bigotes» con la mano relajada)
  const k = handTip(open) / 1.02;
  const fingerLine = ([p0, p1]: readonly [Pt, Pt]): Pt[] => [toW([p0[0] * k * 0.95, p0[1]]), toW([p1[0] * k, p1[1]])];
  return (
    <g>
      {/* el papel avanza hacia las puntas de los dedos (más rápido que la línea, que da toda la vuelta) */}
      <Flat poly={sweepPoly(hp, [c, s], Math.min(1, pHand * 1.7))} color={style.paper} />
      <InkStroke points={hp} width={style.width * 0.82} progress={pHand} seed={style.seed + seedOff + 4} taperStart={6} taperEnd={8} color={style.ink} />
      {open > -0.4
        ? FINGER_LINES.map(([p0, p1], i) => (
            <InkStroke key={i} points={fingerLine([p0, p1])} width={style.width * (0.2 + 0.2 * fingerAmt)} progress={part(pHand, 0.6, 1)} seed={style.seed + seedOff + 7 + i} taperStart={2} taperEnd={7} startWidth={0.7} endWidth={0.2} pressure={0.1} wobble={0.4} color={style.ink} />
          ))
        : null}
    </g>
  );
};

/**
 * Dirección (en el marco del pie: x hacia la punta, y hacia la suela) en que el negro del zapato «crece»: nace en la esquina de arriba-atrás, justo donde
 * terminan las líneas de la pierna (el tobillo), y se abre en diagonal hacia la suela y la punta. Parte de cero (no hay bloque que aparezca de golpe).
 */
const SHOE_SWEEP: Pt = [0.62, 0.78];

type LegProps = { hip: Pt; knee: Pt; ankle: Pt; footAngle: number; style: FigureStyle; prog: Prog; seedOff: number; far?: boolean };

const Leg: React.FC<LegProps> = ({ hip, knee, ankle, footAngle, style, prog, seedOff, far }) => {
  const limb = buildLimb([hip, knee, ankle], LEG_PROFILE, 1);
  const w = style.width;
  const pLeg = prog(...WIN.leg);
  const pShoe = prog(...WIN.shoe);
  // el papel del muslo sigue a las líneas (un disco blanco sin contorno sobre el violeta se vería como un parche): arranca con el 10 % del trazo y llega a 1 a la vez
  const pPaper = part(pLeg, 0.1, 1);
  const solid = style.pants === "solid";
  const fa = rad(footAngle);
  const shoe = shoePoly(ankle, footAngle);
  return (
    <g>
      {solid ? (
        // pantalón negro: el relleno recorre la pierna con la línea (con un filo de papel para separarlo del torso)
        <Flat poly={limbReveal(limb, pLeg, 0.03, 0.985)} color={far ? "#2a2a2a" : style.ink} stroke={far ? undefined : style.paper} strokeWidth={far ? undefined : 2.4} />
      ) : (
        <>
          {/* el papel (opaco) tapa lo que queda detrás y avanza con las líneas */}
          <Flat poly={limbReveal(limb, pPaper, 0.03, 0.985)} color={style.paper} />
          {/* el contorno de abajo arranca cuando el arco de la cadera ya llegó al tablón: sigue de ahí hacia adelante (si no, una rayita suelta dentro del tablón) */}
          <InkStroke points={slice(limb.left, 0.03, 0.985)} width={w} progress={part(pLeg, 0.18, 1)} seed={style.seed + seedOff} taperStart={10} taperEnd={6} color={style.ink} />
          <InkStroke points={slice(limb.right, 0.08, 0.985)} width={w} progress={pLeg} seed={style.seed + seedOff + 1} taperStart={10} taperEnd={6} color={style.ink} />
          {/* la cadera: el contorno del muslo se cierra con un arco por atrás (si no, el papel del muslo se vería como un parche sin borde sobre la prenda) */}
          <InkStroke points={limbCapArc(limb)} width={w * 0.9} progress={part(pLeg, 0, 0.2)} seed={style.seed + seedOff + 2} taperStart={4} taperEnd={4} color={style.ink} />
        </>
      )}
      {/* zapato: el negro crece desde el tobillo (donde terminan las líneas de la pierna) hacia la suela y la punta; sin «semilla» */}
      <Flat poly={sweepPoly(shoe, [Math.cos(fa) * SHOE_SWEEP[0] - Math.sin(fa) * SHOE_SWEEP[1], Math.sin(fa) * SHOE_SWEEP[0] + Math.cos(fa) * SHOE_SWEEP[1]], pShoe)} color={style.ink} />
    </g>
  );
};

// ───────────────────────── torso ─────────────────────────

const TORSO = { back: [29, 25, 28, 17], front: [25, 23, 29, 15] } as const;

const torsoPoints = (sk: Skeleton, k: number) => {
  const P: Pt[] = [sk.hip, sk.waist, sk.chest, sk.neckBase];
  const A = sk.spineAngles;
  const back: Pt[] = [];
  const front: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const f = fwd(A[i]);
    const kk = i === 3 ? 1 : k;
    back.push([P[i][0] - f[0] * TORSO.back[i] * kk, P[i][1] - f[1] * TORSO.back[i] * kk]);
    front.push([P[i][0] + f[0] * TORSO.front[i] * kk, P[i][1] + f[1] * TORSO.front[i] * kk]);
  }
  // dobladillo apenas por debajo de la cadera
  const dn = up(A[0]);
  const hemC: Pt = [sk.hip[0] - dn[0] * 13, sk.hip[1] - dn[1] * 13];
  const f0 = fwd(A[0]);
  const hemBack: Pt = [hemC[0] - f0[0] * (TORSO.back[0] * k + 2), hemC[1] - f0[1] * (TORSO.back[0] * k + 2)];
  const hemFront: Pt = [hemC[0] + f0[0] * (TORSO.front[0] * k + 3), hemC[1] + f0[1] * (TORSO.front[0] * k + 3)];
  return { back, front, hemBack, hemFront };
};

// ───────────────────────── cabeza y pelo ─────────────────────────

/** ángulo (° del óvalo) donde el trazo de la cabeza toca el cuello: el círculo nace ahí y sube por la nuca (no queda un arco suelto sobre el cuello) */
const HEAD_START = 106;

const HeadHair: React.FC<{ sk: Skeleton; style: FigureStyle; prog: Prog }> = ({ sk, style, prog }) => {
  const { rx, ry } = BODY.head;
  const c = sk.headC;
  const a = sk.headAngle;
  const r = rad(a);
  const toW = (p: Pt): Pt => {
    const q = rotate(p, r);
    return [c[0] + q[0], c[1] + q[1]];
  };
  const pHead = prog(...WIN.head);
  const pHair = prog(...WIN.hair);
  const circle = handCirclePoints(c[0], c[1], rx, ry, { rotate: a, seed: style.seed + 30, startAngle: HEAD_START });
  const skull: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    skull.push(toW([Math.cos(t) * rx, Math.sin(t) * ry]));
  }
  // el pelo se «pinta» de la frente hacia la nuca (eje local −x de la cabeza); la cola, de arriba hacia abajo
  const back: Pt = [-Math.cos(r), -Math.sin(r)];
  const front = toW([14, 0]);
  const sweepBack = (poly: readonly Pt[], t: number): Pt[] => (t >= 1 ? poly.slice() : t <= 0 ? [] : clipPoly(poly, front, back, 46 * t));
  let hair: React.ReactNode;
  if (style.hair === "long") {
    const capLocal: Pt[] = [
      [13, -21], [6, -30], [-6, -33], [-17, -28], [-25, -15], [-28, 2], [-27, 17], [-21, 28],
      [-13, 27], [-9, 12], [-8, -3], [-3, -13], [5, -17],
    ];
    // cola baja que cae por la gravedad (no gira con la cabeza): sale de la nuca y cuelga por detrás del cuello
    const root = toW([-22, 16]);
    const sway = 3.5 * Math.sin(r * 2);
    const tail: Pt[] = [
      toW([-20, 8]),
      [root[0] - 9 + sway * 0.4, root[1] + 12],
      [root[0] - 14 + sway, root[1] + 34],
      [root[0] - 11 + sway * 1.3, root[1] + 56],
      [root[0] - 2 + sway * 1.2, root[1] + 52],
      [root[0] + 6 + sway * 0.6, root[1] + 32],
      [root[0] + 3, root[1] + 12],
      toW([-12, 24]),
    ];
    hair = (
      <>
        <Flat poly={sweepPoly(tail, [0, 1], part(pHair, 0.55, 1))} color={style.ink} />
        <Flat poly={sweepBack(capLocal.map(toW), part(pHair, 0, 0.7))} color={style.ink} />
      </>
    );
  } else {
    const blobs: [number, number, number][] = [
      [8, -25, 9.5], [-3, -29, 11], [-14, -25, 12], [-21, -14, 11.5], [-24, -2, 11], [-23, 11, 10.5], [-17, 20, 9],
    ];
    hair = (
      <>
        {blobs.map(([x, y, rr], i) => {
          const p = toW([x, y]);
          return <Flat key={i} poly={sweepBack(ellipsePoly(p[0], p[1], rr, rr, 0, 16), pHair)} color={style.ink} />;
        })}
      </>
    );
  }
  return (
    <g>
      {/* la cara es papel: tapa el cuello recién cuando la línea de la cabeza ya pasó por abajo */}
      {pHead > 0.6 ? <Flat poly={skull} color={style.paper} /> : null}
      {hair}
      <InkStroke points={circle} width={style.width * 0.95} progress={pHead} seed={style.seed + 31} taperStart={8} taperEnd={12} color={style.ink} />
    </g>
  );
};

// ───────────────────────── figura completa ─────────────────────────

export type FigureProps = {
  sk: Skeleton;
  style: FigureStyle;
  /** 0..1 dibujo progresivo de toda la figura */
  progress?: number;
  /** apertura de las manos (cercana, lejana): −1 sujeta · 0 relajada · 1 abierta */
  open?: readonly [number, number];
  /** nodos que se dibujan sobre la manga cercana y BAJO la mano cercana (p. ej. el celular, o la rueda de la silla) */
  between?: React.ReactNode;
};

export const Figure: React.FC<FigureProps> = ({ sk, style, progress = 1, open = [0, 0], between }) => {
  const prog: Prog = (a, b) => part(progress, a, b);
  const w = style.width;
  const t = torsoPoints(sk, style.baggy);
  const pTorso = prog(...WIN.torso);
  const pTorsoFill = prog(...behind(WIN.torso));
  const collarBack = t.back[3];
  const collarFront = t.front[3];
  // cuello: dos líneas cortas entre el cuello de la prenda y la base de la cabeza
  const ndx = sk.headBase[0] - sk.neckBase[0];
  const ndy = sk.headBase[1] - sk.neckBase[1];
  const nl = Math.hypot(ndx, ndy) || 1;
  const nx = -ndy / nl;
  const ny = ndx / nl;
  const neckHalf = 7.5;
  const neckBackLine: Pt[] = [
    [sk.neckBase[0] - nx * neckHalf, sk.neckBase[1] - ny * neckHalf],
    [sk.headBase[0] - nx * (neckHalf - 0.5) + ndx * 0.15, sk.headBase[1] - ny * (neckHalf - 0.5) + ndy * 0.15],
  ];
  const neckFrontLine: Pt[] = [
    [sk.neckBase[0] + nx * neckHalf, sk.neckBase[1] + ny * neckHalf],
    [sk.headBase[0] + nx * (neckHalf - 1) + ndx * 0.1, sk.headBase[1] + ny * (neckHalf - 1) + ndy * 0.1],
  ];
  const hemMid = mix(t.hemBack, t.hemFront, 0.5);
  const torsoFill: Pt[] = [t.hemBack, ...t.back, [sk.neckBase[0], sk.neckBase[1] - 2], ...[...t.front].reverse(), t.hemFront];
  // el relleno sube del dobladillo al cuello, igual que las líneas
  const spineUp = norm(sub(sk.neckBase, sk.hip));
  const farShoulder: Pt = [sk.shoulder[0] - 3, sk.shoulder[1] - 1];
  return (
    <g>
      {/* brazo y pierna lejanos (quedan detrás del torso) */}
      {style.farArm ? (
        <>
          <ArmSleeve shoulder={farShoulder} elbow={sk.elbowF} wrist={sk.wristF} style={style} prog={prog} seedOff={60} win={WIN.farArm} />
          <ArmHand wrist={sk.wristF} angle={sk.handAngleF} open={open[1]} style={style} prog={prog} seedOff={60} win={WIN.farHand} />
        </>
      ) : null}
      {style.farLeg ? <Leg hip={[sk.hip[0] + 2, sk.hip[1] - 1]} knee={sk.kneeF} ankle={sk.ankleF} footAngle={sk.footAngleF} style={style} prog={prog} seedOff={80} far /> : null}
      {/* torso: papel (tapa lo de atrás) + prenda plana corrida + contornos; se dibuja de abajo hacia arriba */}
      <Flat poly={sweepPoly(torsoFill, spineUp, pTorso)} color={style.paper} />
      <Flat poly={sweepPoly(torsoFill, spineUp, pTorsoFill)} color={style.top} dx={style.offset[0]} dy={style.offset[1]} />
      <InkStroke points={[t.hemBack, ...t.back.slice(0, 3), collarBack]} width={w} progress={pTorso} seed={style.seed + 3} taperStart={9} taperEnd={10} color={style.ink} />
      <InkStroke points={[t.hemFront, ...t.front.slice(0, 3), collarFront]} width={w} progress={pTorso} seed={style.seed + 4} taperStart={9} taperEnd={10} color={style.ink} />
      <InkStroke points={[t.hemBack, [hemMid[0], hemMid[1] + 3], t.hemFront]} width={w * 0.9} progress={prog(...WIN.hem)} seed={style.seed + 5} taperStart={6} taperEnd={6} color={style.ink} />
      {/* pierna cercana */}
      <Leg hip={sk.hip} knee={sk.kneeN} ankle={sk.ankleN} footAngle={sk.footAngleN} style={style} prog={prog} seedOff={90} />
      {/* cuello y cabeza */}
      <InkStroke points={neckBackLine} width={w * 0.9} progress={prog(...WIN.neck)} seed={style.seed + 6} taperStart={4} taperEnd={4} startWidth={1} color={style.ink} />
      <InkStroke points={neckFrontLine} width={w * 0.9} progress={prog(...WIN.neck)} seed={style.seed + 7} taperStart={4} taperEnd={4} startWidth={1} color={style.ink} />
      <HeadHair sk={sk} style={style} prog={prog} />
      {/* brazo cercano: manga → (celular / rueda) → mano */}
      <ArmSleeve shoulder={sk.shoulder} elbow={sk.elbowN} wrist={sk.wristN} style={style} prog={prog} seedOff={40} win={WIN.arm} />
      {between}
      <ArmHand wrist={sk.wristN} angle={sk.handAngleN} open={open[0]} style={style} prog={prog} seedOff={40} win={WIN.hand} />
    </g>
  );
};
