import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { FONT } from "../../config/brand.ts";
import { COMPOSER } from "../../config/layout.ts";
import "../../lib/fonts.ts";

/**
 * El punto de arranque del hilo (getFinalCursorAnchor) usa measureText(): solo es válido con Montserrat YA
 * cargada (si se mide antes, el navegador usa la fuente de reemplazo y el resultado queda en caché).
 *
 * OJO: `document.fonts.check()` devuelve true mientras la fuente todavía no fue registrada
 * (@remotion/fonts hace `document.fonts.add()` recién después de descargarla): no sirve como señal.
 * Se consulta el FontFace real (status "loaded") y se retiene el render (delayRender) hasta que el
 * componente se repintó con la medición correcta.
 */
const PROBE = `${COMPOSER.fontWeight} ${COMPOSER.fontSize}px ${FONT.family}`;

const faceLoaded = (): boolean => {
  if (typeof document === "undefined") return false;
  let found = false;
  document.fonts.forEach((face) => {
    if (face.family.replace(/["']/g, "") === FONT.family && face.status === "loaded") found = true;
  });
  return found;
};

const allReady = (): boolean => faceLoaded() && document.fonts.check(PROBE);

export const useThreadFonts = (): boolean => {
  const [ready, setReady] = useState<boolean>(allReady);
  const [handle] = useState<number | null>(() => (allReady() ? null : delayRender("Hilo: esperando Montserrat")));

  useEffect(() => {
    if (ready) return;
    let alive = true;
    let timer = 0;
    const poll = () => {
      if (!alive) return;
      if (!faceLoaded()) {
        timer = window.setTimeout(poll, 25);
        return;
      }
      document.fonts
        .load(PROBE)
        .then(() => {
          if (alive) setReady(true);
        })
        .catch((err) => cancelRender(err));
    };
    timer = window.setTimeout(poll, 0);
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
