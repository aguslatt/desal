import React from "react";
import { COMPANION_TIMING } from "../../config/timeline.ts";
import type { CameraState } from "../../world/cameraContext.ts";
import { ELDER_BOX, ELDER_SPEC, ElderWithCane, elderAnchors, elderTravel, type ElderWithCaneProps } from "./cast-others/ElderWithCane.tsx";
import { PARENT_CHILD_BOX, PARENT_SPEC, CHILD_SPEC, WalkingParentChild, parentChildTravel, walkingParentChildAnchors, type WalkingParentChildProps } from "./cast-others/WalkingParentChild.tsx";
import {
  SEATED_SPEC,
  SEATED_STANDING_BOX,
  STANDING_SPEC,
  SeatedAndStanding,
  seatedAndStandingAnchors,
  type SeatedAndStandingProps,
} from "./cast-others/SeatedAndStanding.tsx";
import { WALKER_BOX, WALKER_SPEC, Walker, walkerAnchors, walkerTravel, type WalkerProps } from "./cast-others/Walker.tsx";
import {
  DEFAULT_PUSHES,
  WHEELCHAIR_BOX,
  WHEELCHAIR_USER_SPEC,
  WheelchairUser,
  wheelchairTravel,
  wheelchairUserAnchors,
  type PushSpec,
  type WheelchairUserProps,
} from "./cast-others/WheelchairUser.tsx";
import { boxSize, type CastAnchors, type CastBaseProps, type CastBox, type CastPlacement, type CastTiming } from "./cast-others/common.tsx";

/**
 * REPARTO — las otras personas del reel («El mensaje que borraste»). Cinco figuras de ilustración editorial,
 * pequeñas, de trazo manual, con poses cotidianas; la diversidad aparece sin etiquetas. Cada una se DIBUJA
 * (appearFrom → +36 f), se mueve con sutileza (caminatas lentas y cortas, impulsos de silla, bastón) y después queda
 * en reposo respirando. Todas son funciones puras del fotograma ABSOLUTO del reel.
 *
 *   <WalkingParentChild frame x y scale facing appearFrom />   adulta caminando de la mano con un niño
 *   <WheelchairUser     … />                                   persona en silla de ruedas (ruedas que giran, impulso lento)
 *   <ElderWithCane      … />                                   persona mayor con bastón, pelo canoso, andar pausado
 *   <Walker             … />                                   persona de perfil con mochila y abrigo (ciclo normal)
 *   <SeatedAndStanding  … />                                   una sentada en un banquito, otra de pie con la mano en su espalda
 *   <CastOthers frame layout />                                los cinco, escalonados por COMPANION_TIMING
 *
 * COLOCACIÓN: (x, y) = punto del SUELO donde la figura queda en REPOSO (mundo). Las que caminan o ruedan SALEN de
 * `travel` u antes, en sentido contrario a `facing` (facing −1 espeja todo el grupo: camina hacia −x). Medidas a
 * escala 1: adulto de pie ≈ 930 u (a cámara 0,3 ≈ 280 px), niño 620 u, mayor 870 u; trazo ≈ 12 u.
 * Todo texto/tiempo viene de config; no hay texto ni Math.random/Date. Sin filtros SVG (≈ 0,2 s por fotograma los cinco).
 */
export {
  WalkingParentChild,
  WheelchairUser,
  ElderWithCane,
  Walker,
  SeatedAndStanding,
  walkingParentChildAnchors,
  wheelchairUserAnchors,
  elderAnchors,
  walkerAnchors,
  seatedAndStandingAnchors,
  parentChildTravel,
  wheelchairTravel,
  elderTravel,
  walkerTravel,
  PARENT_SPEC,
  CHILD_SPEC,
  WHEELCHAIR_USER_SPEC,
  ELDER_SPEC,
  WALKER_SPEC,
  SEATED_SPEC,
  STANDING_SPEC,
  DEFAULT_PUSHES,
  PARENT_CHILD_BOX,
  WHEELCHAIR_BOX,
  ELDER_BOX,
  WALKER_BOX,
  SEATED_STANDING_BOX,
};
export type {
  CastAnchors,
  CastBaseProps,
  CastBox,
  CastPlacement,
  CastTiming,
  ElderWithCaneProps,
  PushSpec,
  SeatedAndStandingProps,
  WalkerProps,
  WalkingParentChildProps,
  WheelchairUserProps,
};

// ───────────────────────── tamaños y recorridos ─────────────────────────

export type CastId = "parentChild" | "wheelchair" | "elder" | "walker" | "pair";
export const CAST_IDS: readonly CastId[] = ["parentChild", "wheelchair", "elder", "walker", "pair"];

/** Rectángulo local (u, escala 1, relativo al punto de REPOSO) que contiene a cada grupo, con silla/bastón/banco incluidos. */
export const CAST_BOXES: Record<CastId, CastBox> = {
  parentChild: PARENT_CHILD_BOX,
  wheelchair: WHEELCHAIR_BOX,
  elder: ELDER_BOX,
  walker: WALKER_BOX,
  pair: SEATED_STANDING_BOX,
};

/** Ancho × alto (u a escala 1) de cada grupo en reposo. A cámara 0,3 multiplicá por 0,3 para obtener píxeles. */
export const CAST_SIZES: Record<CastId, { w: number; h: number }> = {
  parentChild: boxSize(PARENT_CHILD_BOX),
  wheelchair: boxSize(WHEELCHAIR_BOX),
  elder: boxSize(ELDER_BOX),
  walker: boxSize(WALKER_BOX),
  pair: boxSize(SEATED_STANDING_BOX),
};

/** Recorrido (u a escala 1) desde la posición de salida hasta el reposo con los parámetros por defecto. */
export const CAST_TRAVEL: Record<CastId, number> = {
  parentChild: parentChildTravel(),
  wheelchair: wheelchairTravel(),
  elder: elderTravel(),
  walker: walkerTravel(),
  pair: 0,
};

// ───────────────────────── los cinco juntos ─────────────────────────

/** Colocación (mundo) de cada grupo; `scale`/`facing` opcionales. */
export type CastLayout = Record<CastId, CastPlacement>;

/**
 * Disposición por defecto para el encuadre FINAL (referencia de la lámina): dos filas escalonadas con mucho aire.
 * Se expresa en PANTALLA (píxeles) con la cámara dada y se convierte al mundo: así sirve para cualquier cámara
 * final. Fila de atrás (suelo ≈ y 800): sale de la zona de texto con aire; fila de adelante (suelo ≈ y 1060): junto al banco.
 */
export const DEFAULT_CAST_SCREEN: Record<CastId, { sx: number; sy: number; facing: 1 | -1 }> = {
  parentChild: { sx: 250, sy: 820, facing: 1 },
  walker: { sx: 800, sy: 770, facing: -1 },
  wheelchair: { sx: 880, sy: 1040, facing: -1 },
  elder: { sx: 120, sy: 1050, facing: 1 },
  pair: { sx: 360, sy: 1060, facing: 1 },
};

/** Pantalla → mundo con una cámara (scale, cx, cy). */
export const screenToWorld = (sx: number, sy: number, cam: CameraState): [number, number] => [cam.cx + (sx - 540) / cam.scale, cam.cy + (sy - 960) / cam.scale];

/** Disposición por defecto convertida al mundo con la cámara del encuadre final. */
export const defaultCastLayout = (cam: CameraState): CastLayout => {
  const out = {} as CastLayout;
  for (const id of CAST_IDS) {
    const d = DEFAULT_CAST_SCREEN[id];
    const [x, y] = screenToWorld(d.sx, d.sy, cam);
    out[id] = { x, y, scale: 1, facing: d.facing };
  }
  return out;
};

export type CastOthersProps = {
  /** fotograma ABSOLUTO del reel */
  frame: number;
  /** colocación de cada grupo (mundo); por defecto `defaultCastLayout(FINAL_CAMERA)` */
  layout?: Partial<CastLayout>;
  /** cámara del encuadre final para la disposición por defecto (scale 0,3 · centro 710, 1190) */
  camera?: CameraState;
  /** fotograma de inicio del primero (por defecto COMPANION_TIMING.othersFrom) */
  from?: number;
  /** fotogramas entre una aparición y la siguiente (por defecto COMPANION_TIMING.othersStagger) */
  stagger?: number;
  idle?: number;
};

const FINAL_CAMERA: CameraState = { scale: 0.3, cx: 710, cy: 1190 };
/** orden de aparición: primero las que están más cerca del centro del relato */
export const CAST_ORDER: readonly CastId[] = ["parentChild", "wheelchair", "elder", "walker", "pair"];

/** Los cinco grupos, escalonados (`appearFrom` = from + i · stagger). Montar DENTRO del contenedor con la cámara. */
export const CastOthers: React.FC<CastOthersProps> = ({ frame, layout, camera = FINAL_CAMERA, from = COMPANION_TIMING.othersFrom, stagger = COMPANION_TIMING.othersStagger, idle = 1 }) => {
  const base = defaultCastLayout(camera);
  const at = (id: CastId): CastPlacement => ({ ...base[id], ...(layout?.[id] ?? {}) });
  const t = (id: CastId): number => from + CAST_ORDER.indexOf(id) * stagger;
  return (
    <>
      <WalkingParentChild frame={frame} {...at("parentChild")} appearFrom={t("parentChild")} idle={idle} />
      <WheelchairUser frame={frame} {...at("wheelchair")} appearFrom={t("wheelchair")} idle={idle} />
      <ElderWithCane frame={frame} {...at("elder")} appearFrom={t("elder")} idle={idle} />
      <Walker frame={frame} {...at("walker")} appearFrom={t("walker")} idle={idle} />
      <SeatedAndStanding frame={frame} {...at("pair")} appearFrom={t("pair")} idle={idle} />
    </>
  );
};

/** Anclas (mundo) de un grupo en un fotograma: cabeza, pecho, manos, pies y rectángulo envolvente. */
export const castAnchors = (id: CastId, p: CastBaseProps, frame: number = p.frame): CastAnchors => {
  switch (id) {
    case "parentChild":
      return walkingParentChildAnchors(p, frame);
    case "wheelchair":
      return wheelchairUserAnchors(p, frame);
    case "elder":
      return elderAnchors(p, frame);
    case "walker":
      return walkerAnchors(p, frame);
    case "pair":
      return seatedAndStandingAnchors(p, frame);
  }
};

/**
 * Anclas en COORDENADAS LOCALES (u a escala 1, origen = punto del suelo en reposo, facing 1) con la figura ya asentada:
 * cabeza, pecho, manos, pies y rectángulo envolvente. Para colocar el hilo cerca sin tocar: pasalas por localToWorld
 * (x + facing·scale·lx, y + scale·ly) o usá `castAnchors(id, placement)` para el mundo y un fotograma concreto.
 */
export const castRestAnchors = (id: CastId): CastAnchors => castAnchors(id, { frame: 100000, x: 0, y: 0, scale: 1, facing: 1, appearFrom: 0 });
