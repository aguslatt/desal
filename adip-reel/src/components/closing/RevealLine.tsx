import React from "react";
import { Easing, interpolate } from "remotion";
import { SCENES } from "../../config/timeline.ts";
import { useAbsFrame } from "../../lib/scene.ts";

export type RevealLineProps = {
  /** Texto de la línea (siempre derivado de script.ts). */
  readonly text: string;
  /** Fotograma ABSOLUTO en que empieza a entrar. */
  readonly start: number;
  /** Duración del barrido de máscara + ascenso (fotogramas). */
  readonly enter: number;
  /** Duración del fundido de opacidad (más corto que el ascenso: la línea se lee pronto). */
  readonly enterFade: number;
  /** Ascenso inicial (px). */
  readonly rise: number;
  /** Alto de renglón (px). */
  readonly lineHeight: number;
};

const BLEED_X = 60;
const BLEED_Y = 16;
/** ascenso: salida rápida y asentamiento largo (sin rebote) */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** barrido de máscara: arranque suave para que el borde se perciba antes de asentar */
const SWEEP_EASE = Easing.bezier(0.33, 0, 0.2, 1);

/**
 * Una línea de texto con revelado suave: barrido de máscara (izquierda → derecha, borde blando)
 * + fundido + ascenso leve, sin rebote. Pasado `start + enter` la línea queda exacta y estática
 * (sin máscara, sin transformaciones): idéntica en cada fotograma posterior.
 */
export const RevealLine: React.FC<RevealLineProps> = ({ text, start, enter, enterFade, rise, lineHeight }) => {
  const frame = useAbsFrame(SCENES.s5.from);
  const settled = frame >= start + enter;
  // borde del barrido (% del ancho del renglón): -14 → 100, borde blando de 24 puntos
  const edge = interpolate(frame, [start, start + enter], [-14, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SWEEP_EASE,
  });
  const mask = `linear-gradient(90deg, rgba(0,0,0,1) ${edge}%, rgba(0,0,0,0) ${edge + 24}%)`;

  return (
    <div style={{ height: lineHeight, whiteSpace: "nowrap" }}>
      <div
        style={{
          display: "inline-block",
          // el margen negativo compensa el relleno: el texto no se mueve, la máscara no recorta el trazo
          padding: `${BLEED_Y}px ${BLEED_X}px`,
          margin: `${-BLEED_Y}px ${-BLEED_X}px`,
          opacity: interpolate(frame, [start, start + enterFade], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          }),
          translate: interpolate(frame, [start, start + enter], [`0px ${rise}px`, "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          }),
          maskImage: settled ? "none" : mask,
          WebkitMaskImage: settled ? "none" : mask,
        }}
      >
        {text}
      </div>
    </div>
  );
};
