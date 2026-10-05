import React, { useId } from "react";
import { buildFigure } from "./figure.tsx";
import type { Pt } from "./geom.ts";
import { DEFAULT_POSE, applyIdle, blinkAt, bodyDims, resolvePose, type BodyDims, type BodyKind, type Build, type Joints, type PoseParams, type Side } from "./rig.ts";
import { ScaleBy } from "./scribble.tsx";
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
  /** poses de las manos (por defecto relajadas siguiendo el antebrazo; ver hand.tsx) */
  hands?: Partial<Record<Side, { open?: number; angle?: number; flip?: boolean }>>;
};

/**
 * Resuelve y dibuja la figura en RU (unidades del rig). `Person` la escala y coloca. Es el renderizador natural de figuras
 * (figure.tsx: torso con espalda y pecho, mangas con hombro, codo y puño, manos con dedos, cuello con relleno de piel): el mismo que usan
 * la protagonista, la amiga y el reparto.
 */
export const buildPerson = (spec: PersonSpec, pose: PoseParams, o: BuildOptions = {}): PersonLayers => buildFigure(spec, pose, o);

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
        <ScaleBy k={k}>
          {layers.behind}
          {layers.body}
          {layers.hands}
        </ScaleBy>
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
