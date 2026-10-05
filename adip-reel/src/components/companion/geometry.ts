import { Easing, interpolate } from "remotion";
import { SAFE, ZONES } from "../../config/layout.ts";
import { COMPANION_TIMING, OVERLAP, SCENES } from "../../config/timeline.ts";

/**
 * Escena 4 · El acompañamiento — geometría y ritmo (todo derivado de layout.ts / timeline.ts).
 *
 *  - Planos: ZONES.s4.media (y 260–1184), dentro de la zona segura horizontal (x 120–960).
 *    Mosaico de tres planos con 24 px de calle: uno ancho arriba + dos más chicos abajo
 *    (arco / hoja), "listos para reemplazar" por video o foto real (MediaSlot).
 *  - Subtítulos: ZONES.s4.subtitles (y 1296–1580). El hilo (ThreadLine, otra capa) vive en y = 1240:
 *    los planos terminan en y = 1184 y los subtítulos arrancan en y = 1296 (= carril ± THREAD.clearance).
 */
export const GUTTER = 24;

const MEDIA_ZONE = ZONES.s4.media;
const MEDIA_H = MEDIA_ZONE.y1 - MEDIA_ZONE.y0; // 924
const TOP_H = 430;
const BOTTOM_H = MEDIA_H - TOP_H - GUTTER; // 470
const HALF_W = (SAFE.width - GUTTER) / 2; // 408

export type PlaneRect = {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** border-radius CSS del plano (28–40 px en las esquinas "duras", mayores en los arcos/hojas). */
  readonly radius: string;
};

export const PLANES: readonly [PlaneRect, PlaneRect, PlaneRect] = [
  // 1 · plano ancho (equipo)
  { index: 0, x: SAFE.x0, y: MEDIA_ZONE.y0, w: SAFE.width, h: TOP_H, radius: "40px" },
  // 2 · ventana en arco (escucha)
  {
    index: 1,
    x: SAFE.x0,
    y: MEDIA_ZONE.y0 + TOP_H + GUTTER,
    w: HALF_W,
    h: BOTTOM_H,
    radius: `${HALF_W / 2}px ${HALF_W / 2}px 36px 36px`,
  },
  // 3 · hoja (acompañar, a tu ritmo)
  {
    index: 2,
    x: SAFE.x0 + HALF_W + GUTTER,
    y: MEDIA_ZONE.y0 + TOP_H + GUTTER,
    w: HALF_W,
    h: BOTTOM_H,
    radius: "168px 36px 168px 36px",
  },
];

/** Subtítulos: 56 px semibold, interlineado cómodo (≈ 1,36), centrados en la franja y 1296–1580. */
export const SUBTITLE = {
  fontSize: 56,
  lineHeight: 76,
  weight: 600,
  letterSpacing: -0.2,
  zone: ZONES.s4.subtitles,
  centerY: (ZONES.s4.subtitles.y0 + ZONES.s4.subtitles.y1) / 2,
} as const;

/** Ritmo (fotogramas). Los hitos de unidad salen de COMPANION_TIMING. */
export const MOTION = {
  /** el fondo entra por fundido sobre la escena 3 durante el solape (= OVERLAP) */
  bgFade: OVERLAP,
  /** entrada escalonada de los planos desde COMPANION_TIMING.mediaIn */
  planeStagger: 10,
  planeEnter: 28,
  planeEnterFade: 16,
  /** el trazo interior arranca cuando el plano ya asomó */
  drawDelay: 8,
  /** salida suave en el tail de la escena (los planos se retiran antes de que suba el hilo) */
  exitFrom: SCENES.s4.to - 22,
  exitStagger: 3,
  exitDuration: 16,
  /** subtítulos: fundido corto con leve ascenso; nada se superpone entre unidades */
  subFade: 4,
  subRise: 12,
  subSettle: 10,
  subLineStagger: 3,
  subExitLift: 6,
  /** marcador de énfasis: arranca poco después de que aparece la unidad y se dibuja de izq. a der. */
  markerDelay: 8,
  markerDraw: 20,
} as const;

export const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EXIT_EASE = Easing.bezier(0.4, 0, 0.6, 1);
export const SOFT_EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** Entrada escalonada del plano `i` (fotograma absoluto). */
export const planeInFrom = (i: number): number => COMPANION_TIMING.mediaIn + i * MOTION.planeStagger;
export const planeOutFrom = (i: number): number => MOTION.exitFrom + i * MOTION.exitStagger;

const RISE = [34, 44, 52] as const;

/** Opacidad / desplazamiento / escala de entrada y salida del plano `i`. */
export const planeMotion = (frame: number, i: number) => {
  const a = planeInFrom(i);
  const b = planeOutFrom(i);
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const opacity = interpolate(frame, [a, a + MOTION.planeEnterFade, b, b + MOTION.exitDuration - 2], [0, 1, 1, 0], {
    ...clamp,
    easing: [Easing.out(Easing.quad), Easing.linear, Easing.in(Easing.quad)],
  });
  const lift = interpolate(frame, [a, a + MOTION.planeEnter, b, b + MOTION.exitDuration], [RISE[i], 0, 0, -14], {
    ...clamp,
    easing: [ENTER_EASE, Easing.linear, EXIT_EASE],
  });
  const scale = interpolate(frame, [a, a + MOTION.planeEnter, b, b + MOTION.exitDuration], [0.95, 1, 1, 0.985], {
    ...clamp,
    easing: [ENTER_EASE, Easing.linear, EXIT_EASE],
  });
  return { opacity, lift, scale };
};

/** Progreso 0 → 1 de la deriva continua (desde que entra el primer plano hasta el final de la escena + solape). */
export const driftProgress = (frame: number): number =>
  interpolate(frame, [COMPANION_TIMING.mediaIn, SCENES.s4.to + OVERLAP], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
