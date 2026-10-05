import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { FONT } from "../../config/brand.ts";
import "../../lib/fonts.ts";

/**
 * Los cálculos de posición del cursor usan measureText(): solo son válidos con Montserrat YA cargada
 * (si se mide antes, el navegador usa la fuente de reemplazo y el resultado queda en caché).
 * Este hook devuelve `true` cuando las tres variantes usadas en el chat están disponibles y retiene el
 * render (delayRender) hasta que el componente se volvió a pintar con la medición correcta.
 */
const PROBES = [
  `500 62px ${FONT.family}`, // mensajes
  `600 80px ${FONT.family}`, // gancho
  `700 80px ${FONT.family}`, // gancho (énfasis)
] as const;

const allLoaded = (): boolean => typeof document !== "undefined" && PROBES.every((p) => document.fonts.check(p));

export const useFontsReady = (): boolean => {
  const [ready, setReady] = useState<boolean>(allLoaded);
  const [handle] = useState<number | null>(() => (allLoaded() ? null : delayRender("Chat: esperando Montserrat")));

  useEffect(() => {
    if (ready) return;
    let alive = true;
    Promise.all(PROBES.map((p) => document.fonts.load(p)))
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((err) => cancelRender(err));
    return () => {
      alive = false;
    };
  }, [ready]);

  useEffect(() => {
    // Se libera DESPUÉS de que React confirmó el render con la fuente cargada.
    if (ready && handle !== null) continueRender(handle);
  }, [ready, handle]);

  return ready;
};
