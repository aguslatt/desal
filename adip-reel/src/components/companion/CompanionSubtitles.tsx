import React from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";
import { COMPANION_UNITS, type SubtitleUnit } from "../../config/script.ts";
import { COMPANION_TIMING, SCENES } from "../../config/timeline.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { useAbsFrame } from "../../lib/scene.ts";
import { ENTER_EASE, EXIT_EASE, MOTION, SUBTITLE } from "./geometry.ts";

/**
 * Subtítulos de la escena 4: «En Equipo ADIP estamos para escucharte y acompañarte, a tu ritmo.»
 * por unidades de sentido (COMPANION_UNITS, texto literal del guion), máx. 2 líneas simultáneas.
 *
 * NOTA (locución): los tiempos de COMPANION_TIMING.units son una estimación sobre la versión sin voz.
 * Cuando haya locución real, ajustarlos en src/config/timeline.ts al audio (from = inicio de la unidad,
 * to = fin); este componente no necesita cambios. Las unidades NUNCA se superponen: cada una entra con un
 * fundido de MOTION.subFade fotogramas desde `from` y sale con otro que termina exactamente en `to`.
 *
 * Énfasis moderado («escucharte», «acompañarte», «a tu ritmo»): marcador naranja suave DETRÁS del texto que se
 * dibuja de izquierda a derecha. El texto sigue en ink (nunca naranja) → contraste alto.
 */

/** Trazo de marcador irregular, de punta a punta (viewBox 100×24; se estira al ancho de la palabra). */
const MARKER_PATH =
  "M1.6 13.4 C1.1 7.2 5.8 4.2 14 4.7 C34 5.8 62 3.5 88 4.5 C95.6 4.8 99.1 7.6 98.6 12.5 C98.2 18.3 94 20.7 86 20.2 C60 18.9 32 21.3 12 20.5 C5 20.2 1.9 17.7 1.6 13.4 Z";

/** Naranja oficial al 40 % sobre crema → ≈ #FFC796 (ink sobre eso: ≥ 8:1). */
const MARKER_COLOR = "rgba(254, 128, 28, 0.40)";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MARKER_EASE = Easing.bezier(0.5, 0, 0.1, 1);

type Segment = { readonly text: string; readonly emphasized: boolean };

/** Parte una línea en tramos normales / destacados según las palabras de `emphasis` (texto del guion). */
const segmentLine = (line: string, emphasis: readonly string[]): readonly Segment[] => {
  const out: Segment[] = [];
  let rest = line;
  while (rest.length > 0) {
    let best = -1;
    let bestWord = "";
    for (const word of emphasis) {
      const i = rest.indexOf(word);
      if (i >= 0 && (best < 0 || i < best)) {
        best = i;
        bestWord = word;
      }
    }
    if (best < 0) {
      out.push({ text: rest, emphasized: false });
      break;
    }
    if (best > 0) out.push({ text: rest.slice(0, best), emphasized: false });
    out.push({ text: bestWord, emphasized: true });
    rest = rest.slice(best + bestWord.length);
  }
  return out;
};

const SubtitleLine: React.FC<{
  readonly line: string;
  readonly emphasis: readonly string[];
  readonly index: number;
  readonly from: number;
  readonly to: number;
  readonly frame: number;
}> = ({ line, emphasis, index, from, to, frame }) => {
  const a = from + index * MOTION.subLineStagger;
  const segments = segmentLine(line, emphasis);
  const markerStart = a + MOTION.markerDelay;
  const m = interpolate(frame, [markerStart, markerStart + MOTION.markerDraw], [0, 1], { ...CLAMP, easing: MARKER_EASE });

  return (
    <div
      style={{
        height: SUBTITLE.lineHeight,
        whiteSpace: "nowrap",
        opacity: interpolate(frame, [a, a + MOTION.subFade, to - MOTION.subFade, to], [0, 1, 1, 0], {
          ...CLAMP,
          easing: [Easing.out(Easing.quad), Easing.linear, Easing.in(Easing.quad)],
        }),
        translate: interpolate(
          frame,
          [a, a + MOTION.subSettle, to - MOTION.subFade, to],
          [`0px ${MOTION.subRise}px`, "0px 0px", "0px 0px", `0px ${-MOTION.subExitLift}px`],
          { ...CLAMP, easing: [ENTER_EASE, Easing.linear, EXIT_EASE] },
        ),
      }}
    >
      {segments.map((seg, k) =>
        seg.emphasized ? (
          <span key={k} style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
            <svg
              viewBox="0 0 100 24"
              preserveAspectRatio="none"
              aria-hidden
              style={{
                position: "absolute",
                zIndex: -1,
                left: -Math.round(SUBTITLE.fontSize * 0.1),
                width: `calc(100% + ${Math.round(SUBTITLE.fontSize * 0.2)}px)`,
                bottom: 3,
                height: Math.round(SUBTITLE.fontSize * 0.84),
                overflow: "visible",
                rotate: "-0.8deg",
                clipPath: `inset(-20% ${(1 - m) * 100}% -20% 0)`,
              }}
            >
              <path d={MARKER_PATH} fill={MARKER_COLOR} />
            </svg>
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={k}>{seg.text}</React.Fragment>
        ),
      )}
    </div>
  );
};

const SubtitleBlock: React.FC<{
  readonly unit: SubtitleUnit;
  readonly from: number;
  readonly to: number;
  readonly frame: number;
}> = ({ unit, from, to, frame }) => {
  // Solo existe dentro de [from, to): así dos unidades nunca conviven en pantalla.
  if (frame < from || frame >= to) return null;
  const blockH = unit.lines.length * SUBTITLE.lineHeight;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x0,
        width: SAFE.width,
        top: SUBTITLE.centerY - blockH / 2,
        height: blockH,
        textAlign: "center",
        fontFamily,
        fontSize: SUBTITLE.fontSize,
        fontWeight: SUBTITLE.weight,
        lineHeight: `${SUBTITLE.lineHeight}px`,
        letterSpacing: SUBTITLE.letterSpacing,
        color: COLORS.ink,
        fontKerning: "normal",
        textRendering: "optimizeLegibility",
      }}
    >
      {unit.lines.map((line, i) => (
        <SubtitleLine key={line} line={line} emphasis={unit.emphasis} index={i} from={from} to={to} frame={frame} />
      ))}
    </div>
  );
};

export const CompanionSubtitles: React.FC = () => {
  const frame = useAbsFrame(SCENES.s4.from);
  return (
    <>
      {COMPANION_UNITS.map((unit, u) => (
        <SubtitleBlock
          key={unit.lines.join("|")}
          unit={unit}
          from={COMPANION_TIMING.units[u].from}
          to={COMPANION_TIMING.units[u].to}
          frame={frame}
        />
      ))}
    </>
  );
};
