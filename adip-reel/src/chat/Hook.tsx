import React from "react";
import { HOOK } from "../config/script.ts";
import { TYPE } from "../config/brand.ts";
import { fontFamily } from "../lib/fonts.ts";
import { CHAT_COLORS, HOOK_BOX } from "./geometry.ts";

/**
 * PREGUNTA DE LA CAMPAÑA (HOOK, S1): TYPE.display (88/800), negro, alineada a la izquierda (x = 96), 3 líneas, debajo del mensaje
 * recibido. Es lo más grande del cuadro (jerarquía: pregunta > mensaje recibido > resto de la interfaz).
 * El corte de línea sale del propio texto: se parte tras «…» y la 1.ª parte se ajusta al ancho de HOOK_BOX.w.
 */
const cut = HOOK.indexOf("… ");
const HEAD = cut >= 0 ? HOOK.slice(0, cut + 1) : HOOK;
const TAIL = cut >= 0 ? HOOK.slice(cut + 2) : "";

export const Hook: React.FC<{ readonly dy: number; readonly opacity: number }> = ({ dy, opacity }) => (
  <div
    data-hook=""
    style={{
      position: "absolute",
      left: HOOK_BOX.x,
      top: HOOK_BOX.y,
      width: HOOK_BOX.w,
      translate: `0px ${dy}px`,
      opacity,
      color: CHAT_COLORS.text,
      fontFamily,
      fontSize: TYPE.display.size,
      fontWeight: TYPE.display.weight,
      lineHeight: `${HOOK_BOX.lineHeightPx}px`,
      letterSpacing: TYPE.display.letterSpacing,
      textAlign: "left",
    }}
  >
    {HEAD}
    {TAIL ? (
      <>
        <br />
        {TAIL}
      </>
    ) : null}
  </div>
);
