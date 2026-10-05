import { Easing, interpolate } from "remotion";
import { CHAT_FADE } from "../../config/timeline.ts";

/**
 * Opacidad (1 → 0) de la tarjeta, el encabezado y el texto del 3.er mensaje al pasar a la escena 3.
 * `frame` es ABSOLUTO. El cursor no usa esta curva (lo toma el hilo).
 */
export const chatFadeOut = (frame: number): number =>
  interpolate(frame, [CHAT_FADE.from, CHAT_FADE.to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
