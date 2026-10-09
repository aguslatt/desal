import type React from "react";
import { Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, type InteractivitySchema } from "remotion";
import { LOGO } from "../config/brand.ts";
import { LOGO_MAX_WIDTH, LOGO_MOVE_EASING, LOGO_PLACEMENT, lerpPlacement, type LogoPlacement } from "./layout.ts";
import { TEXT_FX } from "./style.ts";

/**
 * LOGO OFICIAL de Equipo ADIP (public/brand/logo-equipo-adip.png, 734×326): proporción 734:326 intacta, SIN recolorear ni efectos
 * ni halos, a ≤ 734 px de ancho (nunca se amplía el PNG). Revelado limpio al empezar su pieza (fundido + escala 0,97 → 1, sin
 * rebote: SIGNATURE_TIMING.logoIn en el reel) y ESTÁTICO después. Opcionalmente se desplaza suavemente de `left/top/width` a `moveTo`
 * (en el reel: de S5 a S6) entre los fotogramas locales `moveFrom` y `moveFrom + moveDuration`; el ancho cambia de verdad (el PNG
 * se vuelve a muestrear en cada fotograma: nítido, sin escalar un bitmap).
 * Sobre el gris #EFEFEF del manual el logo se ve limpio (el PNG es transparente).
 */
type Props = {
  readonly left?: number;
  readonly top?: number;
  /** ancho (≤ 734: se limita) */
  readonly width?: number;
  /** destino del desplazamiento (opcional) */
  readonly moveTo?: LogoPlacement;
  readonly moveFrom?: number;
  readonly moveDuration?: number;
  /** false = sin revelado (estático desde el primer fotograma) */
  readonly reveal?: boolean;
  readonly style?: React.CSSProperties;
};

const LogoInner: React.FC<Props> = ({
  left = LOGO_PLACEMENT.s5.left,
  top = LOGO_PLACEMENT.s5.top,
  width = LOGO_PLACEMENT.s5.width,
  moveTo,
  moveFrom = 0,
  moveDuration = 1,
  reveal = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = moveTo
    ? interpolate(frame, [moveFrom, moveFrom + moveDuration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: LOGO_MOVE_EASING })
    : 0;
  const p = moveTo ? lerpPlacement({ left, top, width }, moveTo, t) : { left, top, width };
  const w = Math.min(p.width, LOGO_MAX_WIDTH);
  const enter = reveal
    ? interpolate(frame, [0, TEXT_FX.logoIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })
    : 1;
  const fade = reveal
    ? interpolate(frame, [0, TEXT_FX.logoIn * 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 1, 0.68, 1) })
    : 1;

  return (
    <Img
      src={staticFile(LOGO.file)}
      alt="Equipo ADIP"
      draggable={false}
      style={{
        position: "absolute",
        left: p.left,
        top: p.top,
        width: w,
        height: w / LOGO.ratio,
        opacity: fade,
        scale: TEXT_FX.logoScaleFrom + (1 - TEXT_FX.logoScaleFrom) * enter,
        ...style,
      }}
    />
  );
};

const schema = {
  left: { type: "number", default: LOGO_PLACEMENT.s5.left, step: 1, hiddenFromList: false, description: "Izquierda (px)" },
  top: { type: "number", default: LOGO_PLACEMENT.s5.top, step: 1, hiddenFromList: false, description: "Arriba (px)" },
  width: { type: "number", default: LOGO_PLACEMENT.s5.width, min: 40, max: LOGO.width, step: 1, hiddenFromList: false, description: "Ancho (≤ 734: sin ampliar)" },
} as const satisfies InteractivitySchema;

export const Logo = Interactive.withSchema({ Component: LogoInner, componentName: "<Logo>", schema, wrapInSequence: true });
