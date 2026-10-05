import { loadFont } from "@remotion/fonts";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { FONT } from "../config/brand.ts";

/**
 * Montserrat (variable 100–900) desde archivo LOCAL (public/fonts). Bloquea el render hasta que
 * la fuente real está cargada. Importar este módulo desde cada escena (independencia de la escena).
 */
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
    .then(() => document.fonts.load(`500 62px ${FONT.family}`))
    .then(() => document.fonts.load(`600 62px ${FONT.family}`))
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};
ensureFonts();

export const fontFamily = `${FONT.family}, system-ui, sans-serif`;
