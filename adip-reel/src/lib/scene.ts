import { useCurrentFrame } from "remotion";

/**
 * Las escenas se escriben con fotogramas ABSOLUTOS del reel (src/config/timeline.ts).
 * Dentro de una escena (con `from` en el reel), useCurrentFrame() es local; esto lo convierte.
 * Al abrir la escena sola en el Studio, la composición arranca en 0 y `from` se suma igual.
 */
export const useAbsFrame = (sceneFrom: number): number => useCurrentFrame() + sceneFrom;
