/**
 * Geometría compartida (1080×1920). Zona segura: 120 px laterales, 220 arriba, 340 abajo
 * → texto/logo dentro de x 120–960, y 220–1580 (la UI del chat puede ocupar los márgenes).
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
 * Textos grandes ALINEADOS A LA IZQUIERDA (como los titulares del manual de ADIP), margen izquierdo = SAFE.x0.
 * Referencia de posición: el texto de la respuesta («Estoy acá. Te escucho.») es el punto de partida de la transición y las
 * frases del giro nacen en ese mismo lugar (TURN_ANCHOR).
 */
export const TEXT = {
  left: 120,
  maxWidth: 840,
  /** franja superior para S4–S6: S4 (3 líneas de `display`, hasta y 525), S5 (5 líneas de `title`, hasta y 628) y S6 (3 líneas de `title`) */
  top: { y0: 240, y1: 628 },
} as const;

/** Ancla del texto durante la transición S3: esquina superior izquierda del bloque de frases (y baseline de la 1.ª línea ≈ y0 + 0,85·size). */
export const TURN_ANCHOR = { x: 120, y0: 789 } as const;

/** Aire mínimo (px) entre lo ilustrado y los textos/logo. */
export const COMPOSITION = {
  /** S6: pie de la fecha y la campaña, ambas en `body` (el borde inferior ancla su posición) */
  s6: { date: { y0: 1380, y1: 1580 } },
  clearance: 40,
} as const;
