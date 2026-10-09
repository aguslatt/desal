import { loadFont } from "@remotion/fonts";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { FONT, TYPE } from "../config/brand.ts";

/**
 * Montserrat (variable 100–900) desde archivo LOCAL (public/fonts). Bloquea el render hasta que la fuente REAL está cargada y
 * VERIFICA (brief v3 §6) que no se está usando una tipografía de reemplazo: carga cada peso de la jerarquía TYPE y comprueba que
 * (a) el ancho medido con Montserrat difiere del de la fuente de reemplazo y (b) el ancho crece con el peso (la variable responde).
 * Si algo falla, el render se CANCELA con un mensaje claro. Importar este módulo desde cada pieza.
 */
const SAMPLE = "Estoy acá. Te escucho. ¿Cómo estás? ñ…";
const WEIGHTS = Array.from(new Set<number>([400, 500, ...Object.values(TYPE).map((t) => t.weight)])).sort((a, b) => a - b);

const widthOf = (family: string, weight: number, size = 80): number => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("canvas 2d no disponible para verificar Montserrat");
  ctx.font = `${weight} ${size}px ${family}`;
  return ctx.measureText(SAMPLE).width;
};

const verifyMontserrat = (): void => {
  const widths = WEIGHTS.map((w) => widthOf(`"${FONT.family}", monospace`, w));
  const fallback = WEIGHTS.map((w) => widthOf("monospace", w));
  WEIGHTS.forEach((w, i) => {
    if (!document.fonts.check(`${w} 40px "${FONT.family}"`)) throw new Error(`Montserrat ${w} no está cargada`);
    if (Math.abs(widths[i] - fallback[i]) < 1) throw new Error(`Montserrat ${w} no se aplica (se está usando la fuente de reemplazo)`);
    if (i > 0 && !(widths[i] > widths[i - 1])) throw new Error(`La variable Montserrat no responde al peso ${w} (ancho ${widths[i]} ≤ ${widths[i - 1]})`);
  });
};

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender("Cargando Montserrat (local)");
  loadFont({
    family: FONT.family,
    url: staticFile(FONT.file),
    weight: "100 900",
    style: "normal",
    display: "block",
  })
    .then(() => Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 62px "${FONT.family}"`, SAMPLE))))
    .then(() => {
      verifyMontserrat();
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};
ensureFonts();

export const fontFamily = `${FONT.family}, system-ui, sans-serif`;
