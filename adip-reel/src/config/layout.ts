/**
 * Geometría compartida (1080×1920). Zona segura: 120 px laterales, 220 arriba, 340 abajo
 * → texto/logo dentro de x 120–960, y 220–1580 (la UI del chat y los dibujos pueden ocupar los márgenes).
 */
export const W = 1080;
export const H = 1920;

export const SAFE = {
  left: 120,
  right: 120,
  top: 220,
  bottom: 340,
  x0: 120,
  x1: 960,
  y0: 220,
  y1: 1580,
  width: 840,
} as const;

/**
 * Reparto vertical de la pantalla de TEXTO (overlay, siempre Montserrat, siempre estable):
 *  - gancho (S1) y frase del giro (S3): bloque grande arriba (3–4 líneas de ~80 px)
 *  - S4–S6: mensajes de 2 líneas (58–66 px) en la misma franja superior
 *  - logo + fecha: abajo (ver FINAL)
 */
export const TEXT_ZONES = {
  big: { y0: 230, y1: 650 },
  message: { y0: 240, y1: 470 },
} as const;

/**
 * Composición FINAL objetivo (escenas 5–6), en coordenadas de pantalla. Las curvas naranjas y las personas
 * pueden ocupar cualquier zona libre (como en la referencia), pero NUNCA cruzan texto ni logo.
 */
export const FINAL = {
  /** banda donde viven las personas (figuras pequeñas, mucho aire a su alrededor) */
  people: { y0: 500, y1: 1080 },
  /** logo oficial centrado (proporción 734:326, sin deformar) */
  logo: { cx: 540, top: 1120, width: 560 },
  /** trazo naranja que acompaña al logo por debajo (sin tocarlo) */
  logoLineY: 1405,
  /** fecha + campaña (S6) */
  date: { y0: 1450, y1: 1580 },
  /** aire mínimo entre curvas/figuras y texto/logo */
  clearance: 40,
} as const;
