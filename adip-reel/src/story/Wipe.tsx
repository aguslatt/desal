import type React from "react";
import { Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { COLORS, ROLE } from "../config/brand.ts";
import { H, W } from "../config/layout.ts";
import { REVEAL_TIMING, THREAD_TIMING, TRANSITION_TIMING } from "../config/timeline.ts";
import {
  EDGE_SPECKS,
  GROW_EASING,
  RETREAT_EASING,
  TONGUE,
  edgeX,
  growRect,
  roundedRectPath,
} from "./geometry.ts";

/**
 * EL NARANJA DE LA TRANSICIÓN (S3). Una sola capa SVG plana (#FE801C), sin filtros:
 *  1) CRECE desde la burbuja de respuesta (REPLY_BUBBLE: mismo rectángulo, mismos radios) hasta cubrir la pantalla
 *     (TRANSITION_TIMING.wipeFrom → wipeTo): la burbuja se hincha y se vuelve la página;
 *  2) se SOSTIENE mientras se leen las frases del giro;
 *  3) SE RETIRA con un barrido limpio hacia el borde DERECHO (REVEAL_TIMING.wipeOutFrom → …): el borde es orgánico (ondulado y con
 *     el grano del crayón) y deja ver el gris; el último naranja sale por el borde derecho en forma de lengüeta, justo donde NACE
 *     el hilo (THREAD_TIMING.connectFrom).
 * El tiempo local arranca en TRANSITION_TIMING.wipeFrom (el `from` del nodo).
 */
const T0 = TRANSITION_TIMING.wipeFrom;
const GROW_END = TRANSITION_TIMING.wipeTo - T0;
const RET_START = REVEAL_TIMING.wipeOutFrom - T0;
const RET_END = THREAD_TIMING.connectFrom - T0 + 4;
/** extensión total del borde principal: parte fuera a la izquierda y termina con la lengüeta fuera por la derecha */
const E_FROM = -110;
const E_TO = W + TONGUE.depth + 40;

export const WIPE_FRAMES = RET_END + 1;

type Props = { readonly color?: string; readonly paper?: string; readonly style?: React.CSSProperties };

const polygonPath = (e: number, tongue: number): string => {
  const step = 14;
  const xr = W + 260;
  let d = `M${xr} -60`;
  for (let y = -60; y <= H + 60; y += step) {
    const x = Math.min(xr, edgeX(y, e, tongue));
    d += `L${Math.round(x * 10) / 10} ${y}`;
  }
  return `${d}L${xr} ${H + 60}Z`;
};

const Inner: React.FC<Props> = ({ color = COLORS.orange, paper = ROLE.paper, style }) => {
  const frame = useCurrentFrame();

  let body: React.ReactNode = null;
  let grains: React.ReactNode = null;
  if (frame <= GROW_END) {
    const p = interpolate(frame, [0, GROW_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: GROW_EASING });
    body = <path d={roundedRectPath(growRect(p))} fill={color} />;
  } else if (frame < RET_START) {
    body = <rect x={-10} y={-10} width={W + 20} height={H + 20} fill={color} />;
  } else {
    const u = interpolate(frame, [RET_START, RET_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: RETREAT_EASING });
    const e = E_FROM + (E_TO - E_FROM) * u;
    const tongue = Math.min(1, u * 5);
    body = <path d={polygonPath(e, tongue)} fill={color} />;
    // grano de crayón sobre el borde: motas de naranja del lado del gris y huecos de papel del lado del naranja
    const orange: string[] = [];
    const gaps: string[] = [];
    for (const s of EDGE_SPECKS) {
      const x = edgeX(s.y, e, tongue) + s.dx;
      if (x < -10 || x > W + 10) continue;
      const f = (v: number) => Math.round(v * 10) / 10;
      const c = `M${f(x - s.r)} ${f(s.y)}a${f(s.r)} ${f(s.r)} 0 1 0 ${f(2 * s.r)} 0a${f(s.r)} ${f(s.r)} 0 1 0 ${f(-2 * s.r)} 0Z`;
      if (s.dx < 0) orange.push(c);
      else gaps.push(c);
    }
    grains = (
      <>
        <path d={orange.join("")} fill={color} opacity={0.9} />
        <path d={gaps.join("")} fill={paper} opacity={0.75} />
      </>
    );
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
      {body}
      {grains}
    </svg>
  );
};

const schema = {
  color: { type: "color", default: COLORS.orange, description: "Color del naranja (paleta)" },
  paper: { type: "color", default: ROLE.paper, description: "Papel que asoma por el grano del borde" },
} as const satisfies InteractivitySchema;

export const OrangeWipe = Interactive.withSchema({ Component: Inner, componentName: "<OrangeWipe>", schema, wrapInSequence: true });
