import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { COLORS, ROLE } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { THREAD_TIMING } from "../config/timeline.ts";
import { OpenCurve } from "../illustration/index.ts";
import { THREAD_GAP_PROGRESS, THREAD_POINTS } from "./geometry.ts";

/**
 * EL HILO NARANJA — una sola curva abierta de crayón (14 px) que NACE en el borde derecho, donde se va el último naranja
 * (THREAD_TIMING.connectFrom), baja por fuera del logo, pasa sobre la cabeza de B y llega al hueco entre las dos personas
 * (THREAD_TIMING.connectTo): ahí conecta a A y B. En S5 (THREAD_TIMING.logoFrom → logoTo) completa el descenso entre las dos manos.
 * Nunca toca a nadie ni cruza el logo/los textos (≥ 40 px, verificado con curveClearance en dev/asm). El tiempo local arranca en
 * connectFrom. La curva va dentro del grupo que sube en S6, así que se mueve con la pareja y el logo.
 */
/** el hilo arranca unos fotogramas antes de connectFrom: el último naranja sale por el borde y el trazo ya está ahí (relevo sin hueco) */
const LEAD = 6;
export const THREAD_NODE_FROM = THREAD_TIMING.connectFrom - LEAD;
const T0 = THREAD_NODE_FROM;
const CONNECT_END = THREAD_TIMING.connectTo - T0;
const LOGO_FROM = THREAD_TIMING.logoFrom - T0;
const LOGO_TO = THREAD_TIMING.logoTo - T0;
export const THREAD_FRAMES = LOGO_TO + 1;

const DRAW = Easing.bezier(0.2, 0.1, 0.3, 1);

type Props = { readonly color?: string; readonly width?: number; readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ color = ROLE.thread, width = 14, style }) => {
  const frame = useCurrentFrame();
  const p1 = interpolate(frame, [0, CONNECT_END], [0, THREAD_GAP_PROGRESS], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: DRAW });
  const p2 = interpolate(frame, [LOGO_FROM, LOGO_TO], [THREAD_GAP_PROGRESS, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: DRAW });
  const progress = frame < LOGO_FROM ? p1 : p2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
      <OpenCurve points={THREAD_POINTS} progress={progress} width={width} color={color} seed={7} />
    </svg>
  );
};

const schema = {
  color: { type: "color", default: COLORS.orange, description: "Color del hilo (naranja de la paleta)" },
  width: { type: "number", default: 14, min: 4, max: 30, step: 1, hiddenFromList: false, description: "Grosor (px)" },
} as const satisfies InteractivitySchema;

export const Thread = Interactive.withSchema({ Component: Inner, componentName: "<Thread>", schema, wrapInSequence: true });
