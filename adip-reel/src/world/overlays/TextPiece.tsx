import React from "react";
import { H, W } from "../../config/layout.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { WordMark, type MarkKind } from "./WordMark.tsx";
import { EASE_DRAW, EASE_IO, EASE_OUT, baselineIn, lineBoxHeight, measureWidth, prog } from "./typography.ts";

/** Énfasis de UNA palabra de la línea (marcador/subrayado de crayón). `from`/`to` = fotogramas LOCALES de la pieza. */
export type MarkSpec = {
  readonly word: string;
  readonly kind: MarkKind;
  readonly from: number;
  readonly to: number;
  readonly seed: number;
  readonly opacity?: number;
  readonly gap?: number;
};

export type LineSpec = {
  readonly text: string;
  /** línea base (y de pantalla) */
  readonly baseline: number;
  /** retraso de entrada (fotogramas) respecto del inicio de la pieza */
  readonly delay?: number;
  readonly mark?: MarkSpec | null;
  /** tamaño y peso propios de la línea (si difieren del bloque) */
  readonly size?: number;
  readonly weight?: number;
};

type Props = {
  readonly lines: readonly LineSpec[];
  readonly fontSize: number;
  readonly weight: number;
  readonly color: string;
  /** fotograma LOCAL de la pieza y su duración (la salida termina en `duration`) */
  readonly frame: number;
  readonly duration: number;
  /** entrada: duración y desplazamiento vertical inicial (px); `startOpacity` > 0 = nunca vacío (gancho) */
  readonly inLen?: number;
  readonly rise?: number;
  readonly startOpacity?: number;
  /** salida: duración (0 = sin salida) y desplazamiento hacia arriba (px) */
  readonly outLen: number;
  readonly outRise?: number;
  /** estilo del nodo raíz (Studio + premontaje) */
  readonly style?: React.CSSProperties;
};

/**
 * Bloque de texto de pantalla: un nodo raíz absoluto 1080×1920 con una caja por línea (centrada en x = 540, colocada
 * por línea base). Estable: solo anima entrada (fundido + leve subida), salida (fundido + leve subida) y los énfasis.
 */
export const TextPiece: React.FC<Props> = ({ lines, fontSize, weight, color, frame, duration, inLen = 14, rise = 14, startOpacity = 0, outLen, outRise = 10, style }) => {
  const out = outLen > 0 ? prog(frame, duration - outLen, duration, EASE_IO) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        fontFamily,
        fontWeight: weight,
        fontSize,
        color,
        fontKerning: "normal",
        pointerEvents: "none",
        ...style,
      }}
    >
      {lines.map((line, i) => {
        const d = line.delay ?? 0;
        const p = prog(frame, d, d + inLen, EASE_OUT);
        const opacity = (startOpacity + (1 - startOpacity) * p) * (1 - out);
        const dy = (1 - p) * rise - out * outRise;
        const fs = line.size ?? fontSize;
        const fw = line.weight ?? weight;
        const lh = lineBoxHeight(fs);
        const top = line.baseline - baselineIn(fs, lh);
        const mark = line.mark ?? null;
        const at = mark ? line.text.indexOf(mark.word) : -1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top,
              width: W,
              height: lh,
              lineHeight: `${lh}px`,
              fontSize: fs,
              fontWeight: fw,
              textAlign: "center",
              whiteSpace: "pre",
              isolation: "isolate",
              opacity,
              translate: `0px ${dy.toFixed(2)}px`,
            }}
          >
            {mark && at >= 0 ? (
              <>
                {line.text.slice(0, at)}
                <span style={{ position: "relative", display: "inline-block" }}>
                  {mark.word}
                  <WordMark
                    kind={mark.kind}
                    wordWidth={measureWidth(mark.word, fs, fw)}
                    fontSize={fs}
                    lineHeight={lh}
                    progress={prog(frame, mark.from, mark.to, EASE_DRAW)}
                    seed={mark.seed}
                    opacity={mark.opacity}
                    gap={mark.gap}
                  />
                </span>
                {line.text.slice(at + mark.word.length)}
              </>
            ) : (
              line.text
            )}
          </div>
        );
      })}
    </div>
  );
};
