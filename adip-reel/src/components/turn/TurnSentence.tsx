import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";
import { SCENES } from "../../config/timeline.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { useAbsFrame } from "../../lib/scene.ts";
import { MOTION, TYPE } from "./geometry.ts";

export type TurnSentenceProps = {
  /** Líneas de diseño de la oración (de script.ts). */
  readonly lines: readonly string[];
  /** Palabra a destacar (peso 700 + marcador). Debe estar contenida en alguna línea. */
  readonly emphasis: string;
  /** Borde superior del bloque (px). */
  readonly top: number;
  /** Fotograma ABSOLUTO en que entra la primera línea. */
  readonly inFrom: number;
  /** Fotograma ABSOLUTO en que empieza a salir la primera línea. */
  readonly outFrom: number;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly weight?: number;
  readonly emphasisWeight?: number;
  readonly letterSpacing?: number;
  readonly color?: string;
  /** Color del marcador (rgba). null = sin marcador, solo cambia el peso. */
  readonly markerColor?: string | null;
};

const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EXIT_EASE = Easing.bezier(0.4, 0, 0.6, 1);
const MARKER_EASE = Easing.bezier(0.5, 0, 0.1, 1);

/** Trazo de marcador irregular, de punta a punta (viewBox 100×24, se estira al ancho de la palabra). */
const MARKER_PATH =
  "M1.6 13.4 C1.1 7.2 5.8 4.2 14 4.7 C34 5.8 62 3.5 88 4.5 C95.6 4.8 99.1 7.6 98.6 12.5 C98.2 18.3 94 20.7 86 20.2 C60 18.9 32 21.3 12 20.5 C5 20.2 1.9 17.7 1.6 13.4 Z";

/** Divide una línea en [antes, palabra, después] según la palabra destacada (última aparición). */
const splitAt = (line: string, word: string): readonly [string, string, string] | null => {
  const i = line.lastIndexOf(word);
  if (i < 0) return null;
  return [line.slice(0, i), word, line.slice(i + word.length)];
};

/**
 * Una oración de la escena 3: bloque centrado, revelado línea por línea.
 * Entrada: barrido suave de máscara (izq → der) + fundido + ascenso de MOTION.rise px, sin rebote.
 * Salida: fundido + leve elevación. Todo en función del fotograma absoluto (useAbsFrame).
 */
export const TurnSentence: React.FC<TurnSentenceProps> = ({
  lines,
  emphasis,
  top,
  inFrom,
  outFrom,
  fontSize = TYPE.fontSize,
  lineHeight = TYPE.lineHeight,
  weight = TYPE.weight,
  emphasisWeight = TYPE.emphasisWeight,
  letterSpacing = TYPE.letterSpacing,
  color = COLORS.ink,
  markerColor = "rgba(254, 128, 28, 0.35)",
}) => {
  const frame = useAbsFrame(SCENES.s3.from);
  const bleedX = 60;
  const bleedY = 20;

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x0,
        width: SAFE.width,
        top,
        textAlign: "center",
        fontFamily,
        color,
        fontSize,
        lineHeight: `${lineHeight}px`,
        letterSpacing,
        whiteSpace: "nowrap",
        fontKerning: "normal",
        textRendering: "optimizeLegibility",
      }}
    >
      {lines.map((line, i) => {
        const start = inFrom + i * MOTION.lineStagger;
        const outStart = outFrom + i * MOTION.exitStagger;
        // p: progreso de entrada (0→1, ease-out expo suave); q: progreso de salida
        const p = interpolate(frame, [start, start + MOTION.enter], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ENTER_EASE,
        });
        const fade = interpolate(frame, [start, start + MOTION.enterFade], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });
        const q = interpolate(frame, [outStart, outStart + MOTION.exit], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EXIT_EASE,
        });
        // borde del barrido de máscara (% del ancho del renglón): -12 → 96, borde blando de 24 puntos
        const edge = -12 + p * 108;
        const mask = `linear-gradient(90deg, rgba(0,0,0,1) ${edge}%, rgba(0,0,0,0) ${edge + 24}%)`;
        const parts = splitAt(line, emphasis);
        const mStart = start + MOTION.markerDelay;
        const m = interpolate(frame, [mStart, mStart + MOTION.markerDraw], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: MARKER_EASE,
        });

        return (
          <div
            key={line}
            style={{
              // el relleno + margen negativo amplían el área de la máscara sin mover el texto
              boxSizing: "content-box",
              padding: `${bleedY}px ${bleedX}px`,
              margin: `${-bleedY}px ${-bleedX}px`,
              height: lineHeight,
              opacity: fade * (1 - q),
              translate: `0px ${(1 - p) * MOTION.rise - q * MOTION.exitLift}px`,
              maskImage: p < 1 ? mask : "none",
              WebkitMaskImage: p < 1 ? mask : "none",
              fontWeight: weight,
            }}
          >
            {parts === null ? (
              line
            ) : (
              <>
                {parts[0]}
                <span
                  style={{
                    position: "relative",
                    display: "inline-block",
                    isolation: "isolate",
                    fontWeight: emphasisWeight,
                  }}
                >
                  {markerColor === null ? null : (
                    <svg
                      viewBox="0 0 100 24"
                      preserveAspectRatio="none"
                      aria-hidden
                      style={{
                        position: "absolute",
                        zIndex: -1,
                        left: -Math.round(fontSize * 0.12),
                        width: `calc(100% + ${Math.round(fontSize * 0.24)}px)`,
                        bottom: 0,
                        height: Math.round(fontSize * 0.62),
                        overflow: "visible",
                        rotate: "-1.1deg",
                        clipPath: `inset(-20% ${(1 - m) * 100}% -20% 0)`,
                      }}
                    >
                      <path d={MARKER_PATH} fill={markerColor} />
                    </svg>
                  )}
                  {parts[1]}
                </span>
                {parts[2]}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
