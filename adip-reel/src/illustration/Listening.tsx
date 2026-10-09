import React from "react";
import { Interactive, useCurrentFrame, type InteractivitySchema } from "remotion";
import { COLORS, ROLE } from "../config/brand.ts";
import { W } from "../config/layout.ts";
import { clamp, part, rad, type Pt } from "./geom.ts";
import { Figure, PHONE_WIN, defaultStyle, type FigureStyle } from "./figure.tsx";
import { COMPANION_TIMING } from "../config/timeline.ts";
import { A_HIP_X, B_AXLE_FINAL, DEFAULT_ENTER_DX, LISTENING_TIMING, sceneAt, type SceneState } from "./motion.ts";
import { Bench, BENCH, Phone, WheelchairFrame, WheelchairWheel } from "./props.tsx";
import { BODY } from "./rig.ts";

/**
 * Tamaño y suelo de la escena a escala de pantalla (1080×1920).
 *  · A `scale = 1` la PAREJA SENTADA mide ≈ 440 px de alto (de la silla de B —la más alta— al suelo) y ≈ 820 px de ancho (x 126–946); el suelo está en
 *    FLOOR_Y = 1560 y la banda que ocupa es BAND (y 1120–1560). La tinta mide INK_SCREEN ≈ 4,4 px (≈ 1 % de esa altura).
 *  · Internamente la escena se dibuja en «unidades de escena» (un adulto de pie = 440 u) y se amplía SCENE_K = 1,25 veces.
 */
export const SCENE_K = 1.25;
export const FIGURE_HEIGHT = 440;
export const FLOOR_Y = 1560;
export const BAND = { y0: 1120, y1: 1560 } as const;
export const INK_SCREEN = 4.4;

export type ListeningPlacement = {
  /** x de pantalla del centro de la pareja (origen de la escena). Por defecto 540. */
  x?: number;
  /** y de pantalla del SUELO. Por defecto FLOOR_Y (1560). */
  y?: number;
  /** escala uniforme (1 = la pareja sentada mide 440 px de alto). Es un movimiento de cámara: nunca cambia proporciones. */
  scale?: number;
  /**
   * distancia (px de escena) que recorre la silla desde fuera de cuadro. Por defecto DEFAULT_ENTER_DX = 640 (constante: la trayectoria NO
   * depende de la cámara, así x/scale pueden animarse). Para colocaciones extremas usá `autoEnterDx(place)` UNA vez y pasá el valor fijo.
   */
  enterFromDx?: number;
};

export type ListeningProps = ListeningPlacement & {
  /** fotograma ABSOLUTO del reel (usa COMPANION_TIMING de timeline.ts) */
  frame: number;
  /** 0..1: dibujo progresivo de entrada del banco y la protagonista. Por defecto se deduce del fotograma (drawFrom → +drawFrames f). */
  drawProgress?: number;
  /** color del papel: la piel y las caras quedan «en blanco» y el relleno tapa lo que queda detrás. */
  paper?: string;
  /** prenda de la protagonista (A) y de la amiga (B) — colores de la paleta oficial */
  topA?: string;
  topB?: string;
  style?: React.CSSProperties;
};

const DEFAULT_PLACE = { x: 540, y: FLOOR_Y, scale: 1 } as const;

/** Distancia de entrada para que la silla arranque fuera de cuadro (a la derecha) con esta colocación. */
export const autoEnterDx = (p: ListeningPlacement = {}): number => {
  const x = p.x ?? DEFAULT_PLACE.x;
  const s = (p.scale ?? DEFAULT_PLACE.scale) * SCENE_K;
  // la punta del apoyapiés (axis − 204) debe quedar a la derecha del borde de pantalla + margen
  const axleReq = (W + 60 - x) / s + 204;
  return Math.max(420, axleReq - B_AXLE_FINAL);
};

const STYLE_A = (paper: string, top: string): FigureStyle =>
  defaultStyle({ seed: 3, top, sleeves: "long", baggy: 1.1, pants: "outline", hair: "long", paper, farArm: true, farLeg: false });
const STYLE_B = (paper: string, top: string): FigureStyle =>
  defaultStyle({ seed: 17, top, sleeves: "short", baggy: 1.0, pants: "outline", hair: "curls", paper, farArm: false, farLeg: false });

/** Progreso de dibujo de A y del banco, y de B (que se dibuja antes de entrar, ya fuera de cuadro). */
const drawProgressOf = (frame: number, given?: number): number => (given !== undefined ? clamp(given, 0, 1) : part(frame, LISTENING_TIMING.drawFrom, LISTENING_TIMING.drawFrom + LISTENING_TIMING.drawFrames));

/**
 * ESCENA DE ESCUCHA ENTRE DOS PERSONAS (trazo liviano).
 *  A — la protagonista, sentada en un banco, encorvada con el celular (a tamaño real), mira a la derecha.
 *  B — la amiga, en silla de ruedas: entra rodando desde la derecha (friendEnterFrom → friendArriveAt), se detiene, gira el torso y la
 *      cabeza hacia A y le ofrece la mano abierta (gestureAt); A levanta la mirada y se afloja (baja el celular al regazo).
 * Todo con la misma escala: `scale` mueve la «cámara» de forma uniforme. Anclas en pantalla: `listeningAnchors`.
 */
export const Listening: React.FC<ListeningProps> = ({ frame, x = DEFAULT_PLACE.x, y = DEFAULT_PLACE.y, scale = DEFAULT_PLACE.scale, enterFromDx, drawProgress, paper = ROLE.paper, topA = COLORS.purple, topB = COLORS.green, style }) => {
  const st = sceneAt(frame, { enterFromDx: enterFromDx ?? DEFAULT_ENTER_DX });
  const k = scale * SCENE_K;
  const ink = INK_SCREEN / SCENE_K; // grosor base en unidades de escena (→ 4,4 px de pantalla a scale 1)
  const p = drawProgressOf(frame, drawProgress);
  const pB = clamp(p * 4, 0, 1);
  const styleA = { ...STYLE_A(paper, topA), width: ink };
  const styleB = { ...STYLE_B(paper, topB), width: ink };
  return (
    <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
      <g transform={`translate(${x} ${y}) scale(${k})`}>
        {/* A: banco + protagonista */}
        <g transform={`translate(${A_HIP_X} 0)`}>
          <Bench hipX={0} progress={p} ink={styleA.ink} paper={paper} width={styleA.width} />
          <Figure sk={st.A.sk} style={styleA} progress={p} open={st.A.open} between={<Phone c={st.A.phone.c} angle={st.A.phone.angle} progress={part(p, PHONE_WIN[0], PHONE_WIN[1])} width={ink} />} />
        </g>
        {/* B: silla de ruedas, de frente a A (se espeja el marco local) */}
        <g transform={`translate(${st.B.axleX} 0) scale(-1 1)`}>
          <WheelchairFrame progress={pB} paper={paper} casterRoll={st.B.casterRoll} width={styleB.width} />
          <Figure sk={st.B.sk} style={styleB} progress={pB} open={st.B.open} between={<WheelchairWheel progress={pB} roll={st.B.roll} width={styleB.width} paper={paper} />} />
        </g>
      </g>
    </svg>
  );
};

// ───────────────────────── anclas en coordenadas de pantalla ─────────────────────────

export type ListeningAnchors = {
  /** centro de la cabeza de A / B */
  headA: Pt;
  headB: Pt;
  /** punta de los dedos de la mano ofrecida de B y su muñeca */
  handB: Pt;
  wristB: Pt;
  /** centro del celular */
  phone: Pt;
  /** cadera de A y de B */
  hipA: Pt;
  hipB: Pt;
  /** punto sugerido donde nace la curva (cerca de B: sobre su mano abierta) */
  curveBirth: Pt;
  /** punto en el espacio entre las dos cabezas */
  gap: Pt;
  /** caja de la pareja (pantalla) cuando B ya se detuvo: lo que ocupan las figuras + banco + silla */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** eje de la rueda de B, escena→pantalla del giro */
  axleB: Pt;
  floorY: number;
  /** factor total escena→pantalla (= scale × SCENE_K): las distancias en px de escena se multiplican por esto */
  scale: number;
  /** convierte un punto de la escena (px, origen en el suelo entre la pareja) a pantalla */
  toScreen: (p: Pt) => Pt;
};

/** Anclas (pantalla) de la escena en el fotograma `frame`. Pura: no depende de React. */
export const listeningAnchors = (frame: number, place: ListeningPlacement = {}): ListeningAnchors => {
  const x = place.x ?? DEFAULT_PLACE.x;
  const y = place.y ?? DEFAULT_PLACE.y;
  const s = (place.scale ?? DEFAULT_PLACE.scale) * SCENE_K;
  const st: SceneState = sceneAt(frame, { enterFromDx: place.enterFromDx ?? DEFAULT_ENTER_DX });
  const toScreen = (p: Pt): Pt => [x + s * p[0], y + s * p[1]];
  const fromA = (p: Pt): Pt => toScreen([A_HIP_X + p[0], p[1]]);
  const fromB = (p: Pt): Pt => toScreen([st.B.axleX - p[0], p[1]]);
  const hA = st.A.sk;
  const hB = st.B.sk;
  const ang = rad(hB.handAngleN);
  const tipLocal: Pt = [hB.wristN[0] + Math.cos(ang) * BODY.hand, hB.wristN[1] + Math.sin(ang) * BODY.hand];
  const handB = fromB(tipLocal);
  const wristB = fromB(hB.wristN);
  const headA = fromA(hA.headC);
  const headB = fromB(hB.headC);
  const fin = sceneAt(1e6);
  const b = fin.B.axleX;
  const box = {
    x0: toScreen([A_HIP_X + BENCH.x0 - 6, 0])[0],
    x1: toScreen([b + 90, 0])[0],
    y0: y - 358 * s,
    y1: y + 8 * s,
  };
  return {
    headA,
    headB,
    handB,
    wristB,
    phone: fromA(st.A.phone.c),
    hipA: fromA(hA.hip),
    hipB: fromB(hB.hip),
    curveBirth: [handB[0] + 8 * s, handB[1] - 28 * s],
    gap: [(headA[0] + headB[0]) / 2, Math.min(headA[1], headB[1]) - 30 * s],
    box,
    axleB: toScreen([st.B.axleX, -79]),
    floorY: y,
    scale: s,
    toScreen,
  };
};

/** Anclas con la escena ya asentada (B detenida con la mano ofrecida): sirven para armar curvas estáticas. */
export const settledAnchors = (place: ListeningPlacement = {}): ListeningAnchors => listeningAnchors(COMPANION_TIMING.gestureAt + LISTENING_TIMING.gestureFrames + 30, place);

// ───────────────────────── pieza con timeline propio (Studio) ─────────────────────────

type ListeningSceneProps = ListeningPlacement & {
  /** fotograma ABSOLUTO del reel en que arranca esta secuencia (el mismo `from`): el fotograma de la escena = useCurrentFrame() + sceneFrom */
  readonly sceneFrom: number;
  readonly topA: string;
  readonly topB: string;
  readonly style?: React.CSSProperties;
};

const ListeningSceneInner: React.FC<ListeningSceneProps> = ({ sceneFrom, x, y, scale, enterFromDx, topA, topB, style }) => {
  const frame = useCurrentFrame() + sceneFrom;
  return <Listening frame={frame} x={x} y={y} scale={scale} enterFromDx={enterFromDx} topA={topA} topB={topB} style={style} />;
};

const listeningSchema = {
  sceneFrom: { type: "number", default: 0, integer: true, hiddenFromList: false, description: "Fotograma absoluto del reel al empezar (= from)" },
  x: { type: "number", default: 540, step: 1, hiddenFromList: false, description: "x de pantalla del centro de la pareja" },
  y: { type: "number", default: FLOOR_Y, step: 1, hiddenFromList: false, description: "y de pantalla del suelo" },
  scale: { type: "number", default: 1, min: 0.3, max: 3, step: 0.01, hiddenFromList: false, description: "Escala uniforme (1 = figuras de 440 px)" },
  topA: { type: "color", default: COLORS.purple, description: "Prenda de la protagonista" },
  topB: { type: "color", default: COLORS.green, description: "Prenda de la amiga" },
} as const satisfies InteractivitySchema;

/** `Listening` como pieza con timeline propio: <ListeningScene from={1080} sceneFrom={1080} durationInFrames={510} … /> */
export const ListeningScene = Interactive.withSchema({
  Component: ListeningSceneInner,
  componentName: "<ListeningScene>",
  schema: listeningSchema,
  wrapInSequence: true,
});
