/**
 * Geometría compartida (1080×1920). Todas las escenas respetan estas zonas.
 * Zona segura: 120 px laterales, 220 px arriba, 340 px abajo → texto/logo dentro de x 120–960, y 220–1580.
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
 * Campo de redacción (composer) — posición FINAL, centrado en el encuadre (centro vertical = 960).
 * Se mantiene fijo durante toda la escena 2: el cursor del 3.er mensaje queda en CURSOR_ANCHOR.
 * Línea 1 centrada en y=880, línea 2 centrada en y=960 (lineHeight 80).
 */
export const COMPOSER = {
  x: 120,
  y: 784,
  w: 840,
  h: 352,
  radius: 56,
  /** Caja de texto interna */
  textX: 176,
  textY: 840,
  textW: 728,
  fontSize: 62,
  fontWeight: 500,
  lineHeight: 80,
  letterSpacing: 0,
} as const;

/** Cursor naranja (barra vertical). Tamaño compartido entre el campo de redacción y el hilo gráfico. */
export const CURSOR = {
  w: 8,
  h: 64,
  radius: 4,
  /** separación entre el último carácter y la barra */
  gap: 6,
} as const;

/**
 * Hilo gráfico: el cursor del 3.er mensaje se estira y se convierte en una línea naranja
 * sutil que acompaña las escenas 3 a 5 y llega al cierre. Siempre SEPARADA de las letras:
 * las escenas dejan libre una franja de ±THREAD.clearance px alrededor del carril (lane).
 */
export const THREAD = {
  thickness: 6,
  x0: 120,
  x1: 960,
  clearance: 56,
  lanes: {
    /** Escena 3: la línea separa las dos oraciones (arriba la 1.ª, abajo la 2.ª). */
    s3: 960,
    /** Escena 4: la línea baja y queda entre los planos (arriba) y los subtítulos (abajo). */
    s4: 1240,
    /** Escena 5: la línea sube y separa el mensaje (arriba) del logo y la fecha (abajo). */
    s5: 780,
  },
} as const;

/** Reparto vertical sugerido por escena (px). Respetar los carriles del hilo. */
export const ZONES = {
  hook: { y0: 300, y1: 700 }, // escena 1: pregunta (arriba del campo de redacción)
  s3: { aboveLane: { y0: 700, y1: 904 }, belowLane: { y0: 1016, y1: 1260 } },
  s4: { media: { y0: 260, y1: 1184 }, subtitles: { y0: 1296, y1: 1580 } },
  s5: { message: { y0: 360, y1: 724 }, logoDate: { y0: 836, y1: 1580 } },
} as const;
