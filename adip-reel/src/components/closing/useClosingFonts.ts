import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { FONT } from "../../config/brand.ts";
import { DATE, MESSAGE } from "./geometry.ts";
import "../../lib/fonts.ts";

/**
 * El partido de líneas usa measureText(): solo es válido con Montserrat YA cargada.
 *
 * OJO: `document.fonts.check()` devuelve true mientras la fuente todavía no fue registrada
 * (@remotion/fonts hace `document.fonts.add()` recién después de descargarla): no sirve como señal.
 * Se consulta el FontFace real (status "loaded") y se verifican las tres variantes que usa la escena.
 * Mientras tanto retiene el render (delayRender) hasta que el componente se repintó con la medición correcta.
 */
const PROBES = [
  `${MESSAGE.weight} ${MESSAGE.fontSize}px ${FONT.family}`,
  `${DATE.dateLine.weight} ${DATE.dateLine.fontSize}px ${FONT.family}`,
  `${DATE.campaign.weight} ${DATE.campaign.fontSize}px ${FONT.family}`,
] as const;

const faceLoaded = (): boolean => {
  if (typeof document === "undefined") return false;
  let found = false;
  document.fonts.forEach((face) => {
    if (face.family.replace(/["']/g, "") === FONT.family && face.status === "loaded") found = true;
  });
  return found;
};

const allReady = (): boolean => faceLoaded() && PROBES.every((p) => document.fonts.check(p));

export const useClosingFonts = (): boolean => {
  const [ready, setReady] = useState<boolean>(allReady);
  const [handle] = useState<number | null>(() => (allReady() ? null : delayRender("Cierre: esperando Montserrat")));

  useEffect(() => {
    if (ready) return;
    let alive = true;
    const poll = () => {
      if (!alive) return;
      if (!faceLoaded()) {
        timer = window.setTimeout(poll, 25);
        return;
      }
      Promise.all(PROBES.map((p) => document.fonts.load(p)))
        .then(() => {
          if (alive) setReady(true);
        })
        .catch((err) => cancelRender(err));
    };
    let timer = window.setTimeout(poll, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [ready]);

  useEffect(() => {
    // Se libera DESPUÉS de que React confirmó el render con la fuente cargada.
    if (ready && handle !== null) continueRender(handle);
  }, [ready, handle]);

  return ready;
};
