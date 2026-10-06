import { measureText } from "@remotion/layout-utils";
import React from "react";
import { COLORS, FONT } from "../config/brand.ts";
import { CrayonStroke } from "../illustration/index.ts";
import { fontFamily } from "../lib/fonts.ts";
import { CameraContext } from "../world/cameraContext.ts";
import { LINES, MEASURED_TITLE, TYPE, W, baselineIn, lineBox } from "./layout.ts";

const SCREEN = { scale: 1, cx: 540, cy: 960 } as const;

/** Ancho real de Montserrat (si la fuente todavía no cargó: `fallback`, medido con el motor de render). */
export const textWidth = (text: string, size: number, weight: number, tracking: number, fallback: number): number => {
  try {
    return measureText({ text, fontFamily: FONT.family, fontSize: size, fontWeight: weight, letterSpacing: `${tracking * size}px`, validateFontIsLoaded: true }).width;
  } catch {
    return fallback;
  }
};

const Line: React.FC<{ text: string; size: number; weight: number; baseline: number; tracking: number; color?: string; children?: React.ReactNode }> = ({ text, size, weight, baseline, tracking, color = COLORS.ink, children }) => {
  const box = lineBox(size);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: baseline - baselineIn(size, box),
        width: W,
        height: box,
        lineHeight: `${box}px`,
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        fontKerning: "normal",
        color,
        textAlign: "center",
        whiteSpace: "pre",
      }}
    >
      {children ?? text}
    </div>
  );
};

/** Subrayado de crayón naranja bajo una palabra del título (mismo trazo que el hilo; ≥ 14 px de las letras). */
const Underline: React.FC<{ x0: number; x1: number; baseline: number }> = ({ x0, x1, baseline }) => {
  const t = 15;
  const y = baseline + 26;
  const pts: [number, number][] = [
    [x0 + 6, y + 3],
    [x0 + (x1 - x0) * 0.3, y - 3],
    [x0 + (x1 - x0) * 0.66, y + 2],
    [x1 - 4, y - 3],
  ];
  return (
    <svg width={W} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <CameraContext.Provider value={SCREEN}>
        <CrayonStroke points={pts} progress={1} width={t} startWidth={0.8} endWidth={0.7} seed={41} camera={SCREEN} />
      </CameraContext.Provider>
    </svg>
  );
};

export const CoverText: React.FC = () => {
  const { size, weight, baselines, tracking } = TYPE.title;
  const [l1, l2] = LINES.title;
  // posición de «borraste» dentro de la 2.ª línea (centrada en x = 540)
  const f = size / MEASURED_TITLE.size;
  const full = textWidth(l2, size, weight, tracking, MEASURED_TITLE.line2 * f);
  const at = l2.indexOf(LINES.mark);
  const before = textWidth(l2.slice(0, at), size, weight, tracking, MEASURED_TITLE.before * f);
  const word = textWidth(LINES.mark, size, weight, tracking, MEASURED_TITLE.word * f);
  const left = 540 - full / 2 + before;
  return (
    <>
      <Line text={LINES.kicker} size={TYPE.kicker.size} weight={TYPE.kicker.weight} baseline={TYPE.kicker.baseline} tracking={TYPE.kicker.tracking} />
      <Underline x0={left} x1={left + word} baseline={baselines[1]} />
      <Line text={l1} size={size} weight={weight} baseline={baselines[0]} tracking={tracking} />
      <Line text={l2} size={size} weight={weight} baseline={baselines[1]} tracking={tracking} />
    </>
  );
};
