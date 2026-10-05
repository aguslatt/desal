/**
 * Identidad de marca — Equipo ADIP.
 * Fuente: Manual de Identidad Visual (paleta p.6, tipografía p.14–17, logo p.3).
 * Los colores crema y verde oscuro se muestrearon del PDF del manual
 * (fondo de "Perfil de marca" = #FFF6E7, texto = #074434) y REEMPLAZAN a la
 * paleta provisoria del brief (#F7F4EE / #24332B), por prioridad de las referencias de marca.
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

  // Neutros muestreados del manual
  cream: "#FFF6E7", // fondo claro cálido principal
  ink: "#074434", // texto oscuro principal (verde oscuro del manual)
  inkSoft: "#3E6B5C", // texto secundario sobre crema (contraste ≥ 5:1)

  // Derivados para la interfaz de chat (sobre crema)
  surface: "#FFFFFF",
  surfaceLine: "#E8DFCF", // bordes sutiles sobre crema
  logoGrey: "#58585A", // gris del isologotipo
  logoCoral: "#EE6C4D", // "ADIP" en el isologotipo
} as const;

export const FONT = {
  family: "Montserrat",
  /** Montserrat variable (100–900). Archivo local: public/fonts/Montserrat-VF.ttf (OFL). */
  file: "fonts/Montserrat-VF.ttf",
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

/** Logo oficial aportado (PNG transparente, recortado al contenido: 734×326). NO deformar. */
export const LOGO = {
  file: "brand/logo-equipo-adip.png",
  width: 734,
  height: 326,
  ratio: 734 / 326,
} as const;
