import { LOGO } from "../../config/brand.ts";
import { COMPOSER, SAFE, W } from "../../config/layout.ts";

/**
 * Portada · geometría y medidas (1080×1920). Ningún texto del guion vive acá: los textos salen de
 * src/config/script.ts (COVER, MESSAGES); acá solo se decide dónde cortar líneas y dónde va cada pieza.
 *
 * Contenido clave dentro del recorte central 4:5 (y 285–1635) que usan las grillas de perfil, y dentro de
 * la zona segura (x 120–960; y hasta 1580). Reparto vertical (px), de arriba hacia abajo:
 *
 *   título       2 líneas (96 px bold) + subrayado naranja bajo «borraste»
 *   campo        COMPOSER desplazado: tarjeta + mensaje + cursor naranja (y 658–1010), con dos "borradores" detrás
 *   secundario   2 líneas (54 px medium)
 *   logo         ancho 600, relación 734:326 intacta (termina ≈ y 1561)
 */

/** Título «El mensaje / que borraste». Se parte por palabras (el texto sale de COVER.title). */
export const TITLE = {
  fontSize: 96,
  fontWeight: 700,
  lineHeight: 104,
  letterSpacing: -1,
  top: 330,
  /** cantidad de palabras por línea (suma = palabras de COVER.title) */
  wordsPerLine: [2, 2],
} as const;

/** Campo de redacción: se dibuja en las coordenadas de COMPOSER y se traslada hacia arriba. */
const FIELD_TOP = 658;
export const FIELD = {
  top: FIELD_TOP,
  bottom: FIELD_TOP + COMPOSER.h,
  /** desplazamiento vertical aplicado a ComposerCard (px) */
  dy: FIELD_TOP - COMPOSER.y,
} as const;

/** Texto secundario «Día Mundial / de la Salud Mental». */
export const SUBTITLE = {
  fontSize: 64,
  fontWeight: 600,
  lineHeight: 72,
  letterSpacing: 0,
  /** palabras por línea (suma = palabras de COVER.subtitle) */
  wordsPerLine: [2, 4],
  top: FIELD.bottom + 94,
} as const;

/** Logo oficial: sin deformar (alto SIEMPRE derivado de la relación original 734:326). */
const LOGO_WIDTH = 600;
export const LOGO_BOX = {
  width: LOGO_WIDTH,
  left: (W - LOGO_WIDTH) / 2,
  top: SUBTITLE.top + SUBTITLE.lineHeight * 2 + 54,
} as const;

export const logoHeight = (width: number): number => width / LOGO.ratio;

/** Área segura horizontal (x 120–960), útil para centrar bloques de texto. */
export const TEXT_BOX = { left: SAFE.x0, width: SAFE.width } as const;
