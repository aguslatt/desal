import React from "react";
import { clamp01, easeInOut, type Pt } from "../../geom.ts";
import { rigToWorld } from "../../person.tsx";
import { buildFigure, heightOf, type FigureSpec } from "./figure.tsx";
import { applyIdle, bodyDims, blinkAt, resolvePose, type Joints, type PoseParams } from "../../rig.ts";
import { GrainDefs } from "../../texture.tsx";

/**
 * Infraestructura común del reparto: colocación de un grupo en el mundo, dibujo progresivo (`appearFrom`),
 * armado de cada miembro (figura del kit + capas extra: bastón, mochila, etc.) y cálculo de anclas.
 *
 * COORDENADAS: cada grupo se dibuja en UN <svg> 1×1 (overflow visible) ubicado en (x, y) del MUNDO.
 * Dentro del grupo todo se expresa en «u locales»: unidades de mundo a escala 1, origen = punto del suelo del
 * grupo en su posición de REPOSO (donde termina), x hacia donde miran, y hacia abajo (y negativo = arriba).
 * El grupo se escala por `scale` y se espeja con `facing: -1` (la figura pasa a mirar a −x).
 */
export type CastPlacement = {
  /** punto del suelo (mundo) donde la figura queda en reposo */
  x: number;
  y: number;
  /** multiplicador de tamaño del grupo (1 = tamaños de este módulo) */
  scale?: number;
  /** 1 = mira/camina hacia +x; −1 = espejado */
  facing?: 1 | -1;
};

export type CastTiming = {
  /** fotograma ABSOLUTO del reel en que empieza a dibujarse */
  appearFrom: number;
  /** fotogramas que tarda en dibujarse (30–40 recomendado) */
  drawFrames?: number;
};

export type CastBaseProps = CastPlacement &
  CastTiming & {
    /** fotograma ABSOLUTO del reel */
    frame: number;
    /** intensidad del movimiento de reposo (respiración, cambios de peso): 0..1 */
    idle?: number;
    /** variación de la «mano» (temblor del trazo); cambia el dibujo, no la pose */
    seed?: number;
    style?: React.CSSProperties;
  };

export const DEFAULT_DRAW_FRAMES = 36;

/** Progreso de dibujo 0..1 con easing suave (la mano acelera y frena). */
export const drawAt = (frame: number, from: number, dur = DEFAULT_DRAW_FRAMES): number => easeInOut(clamp01((frame - from) / dur));

/** Punto local del grupo → mundo. */
export const localToWorld = (pl: CastPlacement, p: Pt): Pt => {
  const s = pl.scale ?? 1;
  return [pl.x + (pl.facing ?? 1) * s * p[0], pl.y + s * p[1]];
};

/** Anclas útiles para que el hilo pase cerca sin tocar (mundo, en el instante pedido). */
export type CastAnchors = {
  /** centro de la cabeza (de la figura principal del grupo) */
  head: Pt;
  /** centro del pecho */
  chest: Pt;
  /** manos (muñecas) relevantes del grupo */
  hands: Pt[];
  /** punto del suelo bajo el grupo (centro) */
  feet: Pt;
  /** rectángulo envolvente del grupo en el mundo (x0, y0, x1, y1), con la silla/bastón/banco incluidos */
  bounds: { x0: number; y0: number; x1: number; y1: number };
};

/** Rectángulo local (u, escala 1, relativo al punto de reposo) que contiene al grupo en cualquier fotograma. */
export type CastBox = { x0: number; y0: number; x1: number; y1: number };

export const boxToWorld = (pl: CastPlacement, b: CastBox): CastAnchors["bounds"] => {
  const a = localToWorld(pl, [b.x0, b.y0]);
  const c = localToWorld(pl, [b.x1, b.y1]);
  return { x0: Math.min(a[0], c[0]), y0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), y1: Math.max(a[1], c[1]) };
};

export const boxSize = (b: CastBox): { w: number; h: number } => ({ w: b.x1 - b.x0, h: b.y1 - b.y0 });

// ───────────────────────── miembros ─────────────────────────

export type MemberExtras = {
  /** detrás del cuerpo (mochila, bastón lejano) — coordenadas RU de la figura */
  behind?: React.ReactNode;
  /** delante del cuerpo, detrás de las manos */
  front?: React.ReactNode;
  /** por encima de las manos */
  hands?: React.ReactNode;
};

export type Member = {
  spec: FigureSpec;
  pose: PoseParams;
  /** suelo de la figura, en u locales del grupo */
  x: number;
  y?: number;
  /** dirección de la figura dentro del grupo (por defecto +1) */
  facing?: 1 | -1;
  /** 0..1 dibujo progresivo */
  progress: number;
  frame: number;
  seed?: number;
  /** capas adicionales a partir de las articulaciones (RU) */
  extras?: (j: Joints, ctx: { progress: number; k: number }) => MemberExtras;
};

export type BuiltMember = {
  behind: React.ReactNode;
  body: React.ReactNode;
  hands: React.ReactNode;
  joints: Joints;
  /** escala RU → u de la figura */
  k: number;
};

export const buildMember = (m: Member, gid: string, key: string): BuiltMember => {
  const k = heightOf(m.spec) / 1000;
  const f = m.facing ?? 1;
  const layers = buildFigure(m.spec, m.pose, {
    progress: m.progress,
    seed: m.seed ?? 0,
    blink: blinkAt(m.frame, (m.spec.seed ?? 1) + (m.seed ?? 0)),
    grainId: gid,
  });
  const ex = m.progress > 0 ? (m.extras?.(layers.joints, { progress: m.progress, k }) ?? {}) : {};
  const tf = `translate(${m.x.toFixed(2)} ${(m.y ?? 0).toFixed(2)}) scale(${(k * f).toFixed(5)} ${k.toFixed(5)})`;
  return {
    behind: (
      <g key={`${key}-b`} transform={tf}>
        {layers.behind}
        {ex.behind}
      </g>
    ),
    body: (
      <g key={`${key}-m`} transform={tf}>
        {layers.body}
        {ex.front}
      </g>
    ),
    hands: (
      <g key={`${key}-h`} transform={tf}>
        {layers.hands}
        {ex.hands}
      </g>
    ),
    joints: layers.joints,
    k,
  };
};

/** Punto de la figura (RU) → u locales del grupo. */
export const memberPoint = (m: Pick<Member, "x" | "y" | "facing" | "spec">, p: Pt): Pt => {
  const k = heightOf(m.spec) / 1000;
  return [m.x + (m.facing ?? 1) * k * p[0], (m.y ?? 0) + k * p[1]];
};

/** Punto local del grupo → RU de la figura (objetivo IK de una mano, etc.). */
export const localToRig = (m: Pick<Member, "x" | "y" | "facing" | "spec">, p: Pt): Pt => {
  const k = heightOf(m.spec) / 1000;
  return [(p[0] - m.x) / ((m.facing ?? 1) * k), (p[1] - (m.y ?? 0)) / k];
};

/** Articulaciones de una pose (RU). */
export const jointsOf = (spec: FigureSpec, pose: PoseParams): Joints => resolvePose(pose, bodyDims(spec.kind, spec.build));

/**
 * Fija el codo a `off` (RU) desde el hombro (anula la IK: el brazo queda «escorzado», con el antebrazo más corto o largo
 * según la vista). Sirve para brazos que cuelgan en vertical con el antebrazo hacia adelante.
 */
export const withElbow = (spec: FigureSpec, pose: PoseParams, side: "L" | "R", off: Pt): PoseParams => {
  const j = jointsOf(spec, pose);
  const sh = side === "R" ? j.shoulderR : j.shoulderL;
  const e: Pt = [sh[0] + off[0], sh[1] + off[1]];
  return side === "R" ? { ...pose, elbowR: e } : { ...pose, elbowL: e };
};

/** Articulación de un miembro en u locales del grupo. */
export const memberJoint = (m: Member, name: "headC" | "neck" | "hip" | "wristL" | "wristR" | "ankleL" | "ankleR" | "shoulderL" | "shoulderR"): Pt => memberPoint(m, jointsOf(m.spec, m.pose)[name]);

export { applyIdle, rigToWorld };

// ───────────────────────── lienzo del grupo ─────────────────────────

export const GroupSvg: React.FC<{ placement: CastPlacement; gid: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ placement, gid, style, children }) => {
  const s = placement.scale ?? 1;
  const f = placement.facing ?? 1;
  return (
    <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: placement.x, top: placement.y, overflow: "visible", pointerEvents: "none", ...style }}>
      <GrainDefs id={gid} />
      <g transform={`scale(${(s * f).toFixed(5)} ${s.toFixed(5)})`}>{children}</g>
    </svg>
  );
};

/** id estable y válido para <pattern> a partir de useId. */
export const useGid = (): string => {
  const raw = React.useId();
  return `c${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
};
