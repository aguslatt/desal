/**
 * Identidad de marca — Equipo ADIP (v3).
 * Fuente: Manual de Identidad Visual (paleta p.6, tipografía p.14–17, logo p.3, diseños de las páginas de servicios p.7–13).
 * El manual usa FONDOS PLANOS SATURADOS de la paleta (naranja, verde, violeta, amarillo, rosa, gris) con titulares
 * grandes en Montserrat Bold/ExtraBold, y el logo sobre gris #EFEFEF (p.18). La v3 usa esa lógica: fondos y acentos de la
 * paleta oficial, texto NEGRO sobre fondos claros/naranja/amarillo/verde y BLANCO sobre violeta/rosa (contraste ≥ 4,5:1).
 * El crema #FFF6E7 y el verde oscuro #074434 (páginas de «Perfil de marca») dejaron de predominar: NO usar (ver scripts/check-palette.mjs).
 */
export const COLORS = {
  // Paleta oficial (manual p.6)
  black: "#000000",
  green: "#94C920",
  purple: "#8A00B7",
  pink: "#ED2995",
  orange: "#FE801C",
  grey: "#EFEFEF",
  yellow: "#FFCB01",
  /** Blanco neutro (burbujas, campo de escritura, teclas). */
  white: "#FFFFFF",

  // Colores del isologotipo medidos en el PNG (solo referencia; el logo no se recolorea)
  logoGrey: "#5B595C",
  logoCoral: "#E96A49",
} as const;

/** Roles de color (usar ESTOS nombres en las piezas). */
export const ROLE = {
  /** fondo claro principal (chat, ilustración, firma y cierre) — gris del manual */
  paper: COLORS.grey,
  /** texto principal sobre claros / naranja / amarillo / verde */
  text: COLORS.black,
  /** texto sobre violeta / rosa */
  textOnDark: COLORS.white,
  /** hilo conductor */
  thread: COLORS.orange,
  /** línea de las personas (tinta) */
  ink: COLORS.black,
} as const;

export const FONT = {
  family: "Montserrat",
  /** Montserrat variable (100–900). Archivo local: public/fonts/Montserrat-VF.ttf (OFL). */
  file: "fonts/Montserrat-VF.ttf",
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
} as const;

/**
 * Jerarquía tipográfica ÚNICA (px a 1080 de ancho; Montserrat). Todas las piezas (chat, textos, cierre) usan estos estilos.
 *  display  — titulares grandes: pregunta inicial, frases del giro y frase de la escena de escucha (ExtraBold)
 *  title    — la voz de ADIP: firma institucional, mensaje final y respuesta «Estoy acá. Te escucho.» (Bold)
 *  message  — texto del chat (Medium)
 *  body     — pie del cierre: fecha y campaña; nombre del contacto (SemiBold)
 *  caption  — UI pequeña (SemiBold)
 */
export const TYPE = {
  display: { size: 88, weight: 800, lineHeight: 1.08, letterSpacing: -0.5 },
  title: { size: 68, weight: 700, lineHeight: 1.14, letterSpacing: -0.3 },
  message: { size: 60, weight: 500, lineHeight: 1.28, letterSpacing: 0 },
  body: { size: 52, weight: 600, lineHeight: 1.2, letterSpacing: 0 },
  caption: { size: 40, weight: 600, lineHeight: 1.2, letterSpacing: 0 },
} as const;

/**
 * Logo oficial: PNG transparente aportado, recortado al contenido (734×326; es el archivo de mayor calidad disponible:
 * el manual solo trae rasters de 582×270 o menos). NO deformar ni recolorear; mostrar a ≤ 734 px de ancho (sin ampliar).
 */
export const LOGO = {
  file: "brand/logo-equipo-adip.png",
  width: 734,
  height: 326,
  ratio: 734 / 326,
} as const;
