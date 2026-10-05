import { COLORS } from "../config/brand.ts";

/**
 * Colores de la ilustración. Todo sale de la paleta oficial (src/config/brand.ts) salvo los tonos de piel y de
 * pelo (naturales, desaturados para que convivan con el crema). El NARANJA queda reservado para el hilo
 * (CrayonCurve): no se usa en ropa ni pelo.
 */
export const INK = COLORS.black;
export const PAPER = COLORS.cream;

/** Gama de tonos de piel (lavado suave bajo el trazo; se leen sobre crema). */
export const SKIN_TONES = {
  porcelain: "#F3D2BB",
  light: "#EDBF9E",
  olive: "#D9A279",
  tan: "#C58A5E",
  brown: "#A4643F",
  deep: "#7B4829",
  dark: "#5B3522",
} as const;
export type SkinTone = keyof typeof SKIN_TONES;

/** Colores de pelo (relleno de garabato). */
export const HAIR_COLORS = {
  black: COLORS.black,
  darkBrown: "#2E1D14",
  brown: "#5A3A26",
  auburn: "#7A3B22",
  grey: "#A9A6A0",
  silver: "#C9C6C0",
  blonde: "#C9A25A",
  violet: COLORS.purple,
} as const;
export type HairColor = keyof typeof HAIR_COLORS;

/** Acentos de ropa permitidos (paleta oficial, sin el naranja del hilo). */
export const ACCENTS = {
  ink: COLORS.black,
  violet: COLORS.purple,
  pink: COLORS.pink,
  green: COLORS.green,
  yellow: COLORS.yellow,
  grey: "#BDB8AE",
  inkGreen: COLORS.ink, // verde oscuro del manual (#074434)
} as const;
export type Accent = keyof typeof ACCENTS;

/** Resuelve un nombre de paleta o un color CSS literal. */
export const resolveColor = (c: string, table: Record<string, string> = ACCENTS): string => table[c] ?? c;
