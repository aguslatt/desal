import { LOGO } from "../../config/brand.ts";
import { SAFE, THREAD, ZONES } from "../../config/layout.ts";
import { CLOSING_TIMING, OVERLAP, SCENES } from "../../config/timeline.ts";

/**
 * Escena 5 · El cierre — geometría y ritmo. Todo sale de layout.ts (zonas, carril del hilo),
 * timeline.ts (hitos) y brand.ts (logo); aquí solo se derivan medidas. Ningún texto del guion vive acá.
 *
 * Reparto vertical (px):
 *   mensaje  470–636   (dentro de ZONES.s5.message = 360–724)
 *   franja libre del hilo 724–836 (carril 780 ± THREAD.clearance): NADA se dibuja ahí
 *   logo     884–1177  (ancho 660, relación 734:326 intacta)
 *   fecha    1250–1490 (≥ 70 px bajo el logo; zona segura hasta 1580)
 */

/** Franja que esta escena deja libre para el hilo naranja (otra capa). */
export const THREAD_FREE_BAND = {
  y0: THREAD.lanes.s5 - THREAD.clearance,
  y1: THREAD.lanes.s5 + THREAD.clearance,
} as const;

/** Mensaje: dos cláusulas, una por línea (58 px; wrapNatural solo parte si una cláusula excediera maxWidth). */
export const MESSAGE = {
  fontSize: 58,
  weight: 600,
  lineHeight: 76,
  letterSpacing: -0.3,
  /** ancho máximo de renglón = zona segura: cada cláusula del guion queda en UNA línea (2 líneas en total, como en el brief) */
  maxWidth: 840,
  /** aire extra entre las dos cláusulas (px) */
  clauseGap: 14,
  top: 470,
} as const;

export const LOGO_BOX = {
  /** ancho por defecto (px); 620–680 según el brief */
  width: 660,
  top: 884,
} as const;

/** Alto del logo para un ancho dado, SIEMPRE con la relación original (nunca deformar). */
export const logoHeight = (width: number): number => width / LOGO.ratio;

export const DATE = {
  /** separación mínima entre el borde inferior del logo y la fecha (px) */
  gapBelowLogo: 73,
  dateLine: { fontSize: 64, weight: 700, lineHeight: 80, letterSpacing: -0.4 },
  campaign: { fontSize: 52, weight: 500, lineHeight: 66, letterSpacing: 0, maxWidth: SAFE.width },
  /** aire entre «10 de octubre» y la campaña (px) */
  betweenGap: 12,
} as const;

/** Borde superior del bloque de la fecha para un ancho de logo dado. */
export const dateTop = (logoWidth: number): number => LOGO_BOX.top + logoHeight(logoWidth) + DATE.gapBelowLogo;

/** Ritmo de entrada (fotogramas). Todo termina antes de CLOSING_TIMING.allVisible. */
export const MOTION = {
  /** fundido del fondo sobre la escena 4 (= solape) */
  bgFrom: SCENES.s5.from,
  bgTo: SCENES.s5.from + OVERLAP,
  /** mensaje: revelado por líneas */
  lineEnter: 26,
  lineEnterFade: 15,
  lineStagger: 5,
  /** retraso de la 2.ª cláusula respecto de la 1.ª */
  clauseDelay: 13,
  /** ascenso inicial (px) del texto */
  rise: 16,
  /** logo */
  logoFade: 20,
  logoScale: 28,
  logoScaleFrom: 0.96,
  /** fecha: la campaña entra unos fotogramas después; ambas terminan en allVisible */
  campaignDelay: 4,
  dateRise: 12,
} as const;

/** Verificación de diseño (se evalúa al importar): falla fuerte si alguien rompe el orden de los hitos. */
const lastMessageEnd = CLOSING_TIMING.messageIn + MOTION.clauseDelay + MOTION.lineStagger + MOTION.lineEnter;
if (lastMessageEnd > CLOSING_TIMING.logoIn) {
  throw new Error(`Escena 5: el mensaje termina en ${lastMessageEnd}, después de logoIn (${CLOSING_TIMING.logoIn})`);
}
if (CLOSING_TIMING.logoIn + MOTION.logoScale > CLOSING_TIMING.allVisible) {
  throw new Error("Escena 5: el logo debe asentar antes de allVisible");
}
if (CLOSING_TIMING.dateIn + MOTION.campaignDelay + 6 >= CLOSING_TIMING.allVisible) {
  throw new Error("Escena 5: la fecha necesita más fotogramas entre dateIn y allVisible");
}
