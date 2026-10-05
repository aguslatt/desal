import { CLOSING_TIMING, COMPANION_TIMING, HOOK_TIMING, SIGNATURE_TIMING, TOTAL_FRAMES, TURN_TIMING } from "../../config/timeline.ts";

/**
 * Ventanas de cada pieza de texto (fotogramas del reel; el nodo JSX recibe `from` y `durationInFrames`) y duraciones de
 * animación de entrada/salida (fotogramas). Todos los hitos salen de src/config/timeline.ts.
 * Dentro de cada pieza, `useCurrentFrame()` es LOCAL (0 = su `from`) y la salida termina en `durationInFrames`.
 */

/** Duraciones de salida (la pieza queda completamente fuera al final de su ventana). */
export const EXIT = {
  /** S3: las dos oraciones salen juntas desde TURN_TIMING.exitFrom y completan en 16 f */
  turn: 16,
  /** S4: el texto sale desde COMPANION_TIMING.textExitFrom */
  companion: 12,
  /** S5: fundido corto entre unidades de sentido (sin superposición) */
  signature: 7,
} as const;

export const ENTER = {
  turn: 16,
  companion: 18,
  signature: 9,
  closingLine: 18,
  closingDate: 18,
} as const;

const turnEnd = TURN_TIMING.exitFrom + EXIT.turn;
const companionEnd = COMPANION_TIMING.textExitFrom + EXIT.companion;

export const SPANS = {
  hook: { from: 0, duration: HOOK_TIMING.exitTo },
  turnFirst: { from: TURN_TIMING.firstIn, duration: turnEnd - TURN_TIMING.firstIn },
  turnSecond: { from: TURN_TIMING.secondIn, duration: turnEnd - TURN_TIMING.secondIn },
  companion: { from: COMPANION_TIMING.textIn, duration: companionEnd - COMPANION_TIMING.textIn },
  signature: SIGNATURE_TIMING.units.map((u) => ({ from: u.from, duration: u.to - u.from })),
  closingMessage: { from: CLOSING_TIMING.messageIn, duration: TOTAL_FRAMES - CLOSING_TIMING.messageIn },
  closingDate: { from: CLOSING_TIMING.dateIn, duration: TOTAL_FRAMES - CLOSING_TIMING.dateIn },
  logo: { from: SIGNATURE_TIMING.logoIn, duration: TOTAL_FRAMES - SIGNATURE_TIMING.logoIn },
} as const;
