import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { ROLE, TYPE } from "../config/brand.ts";
import { SEND_TIMING, TRANSITION_TIMING, TURN_TIMING } from "../config/timeline.ts";
import { REPLY_TEXT, THREAD_FX } from "../chat/geometry.ts";
import { REPLY_LINES } from "../chat/state.ts";
import { fontFamily } from "../lib/fonts.ts";
import { TEXT_EXTENTS, TEXT_FX, type TextExtent } from "../text";
import { TURN_DY, shiftExtent } from "./geometry.ts";

/**
 * S2→S3 — EL TEXTO CONSERVA SU POSICIÓN. «Estoy acá. / Te escucho.» (TYPE.title 68/700, x 120, y 789) se queda donde está mientras la
 * burbuja naranja se hincha hasta ser la página; luego crece SIN SALTOS al tamaño de las frases del giro (TYPE.display 88/800: tamaño,
 * peso e interlineado interpolados con la fuente variable) y, ya con el estilo final, cede el lugar a «Podés empezar / por ahí.» con un
 * relevo corto línea por línea. Las frases del giro arrancan exactamente en la misma esquina (REPLY_TEXT.x/y = TURN_ANCHOR si el
 * contrato lo iguala; si no, se desplazan TURN_DY): no hay ningún fotograma sin texto legible.
 */

// ───────────────────────── relevo por «rodillo»
/**
 * El bloque de 2 líneas vive dentro de una ventana recortada (overflow: hidden) de su alto: el bloque que sale sube y el que entra llega
 * desde abajo, pegados como una tira continua. En ningún píxel hay dos textos superpuestos (sin «fantasmas») y cada texto se ve siempre
 * al 100 % de opacidad: se lee en todos los fotogramas. Pasado el relevo la ventana ya no recorta. Sin subrayados ni marcas (v3):
 * las frases del giro son titular puro, como las páginas de color del manual.
 */
const ROLL_FRAMES = 18;
/** aire de la ventana arriba y abajo del bloque (px) */
const WINDOW_PAD = 14;
const ROLL_EASING = Easing.bezier(0.5, 0, 0.25, 1);
const EXIT_EASING = Easing.bezier(0.45, 0, 0.55, 1);

const rollDistance = (blockH: number) => blockH + 2 * WINDOW_PAD;

// ───────────────────────── texto de la respuesta → estilo de las frases del giro
const REPLY_FROM = SEND_TIMING.replyIn;
/** el texto empieza a crecer cuando la página naranja ya lo envuelve y termina de crecer justo antes del relevo */
const SWELL_FROM = TRANSITION_TIMING.wipeFrom + 6;
const SWELL_TO = TURN_TIMING.firstIn - 2;
export const REPLY_NODE_END = TURN_TIMING.firstIn + ROLL_FRAMES + 1;

const SWELL_EASING = Easing.bezier(0.45, 0, 0.25, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const ReplyInner: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame();
  const abs = frame + REPLY_FROM;
  const appear = interpolate(abs, [REPLY_FROM + THREAD_FX.replyTextFrom, REPLY_FROM + THREAD_FX.replyTextTo], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const k = interpolate(abs, [SWELL_FROM, SWELL_TO], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SWELL_EASING });
  const size = lerp(REPLY_TEXT.fontSize, TYPE.display.size, k);
  const weight = lerp(REPLY_TEXT.fontWeight, TYPE.display.weight, k);
  const lh = lerp(REPLY_TEXT.lineHeightPx, TYPE.display.size * TYPE.display.lineHeight, k);
  const ls = lerp(REPLY_TEXT.letterSpacing, TYPE.display.letterSpacing, k);
  const blockH = REPLY_LINES.length * lh;
  const roll = interpolate(abs, [TURN_TIMING.firstIn, TURN_TIMING.firstIn + ROLL_FRAMES], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ROLL_EASING });
  return (
    <div
      style={{
        position: "absolute",
        left: REPLY_TEXT.x - 20,
        top: REPLY_TEXT.y - WINDOW_PAD,
        width: 940,
        height: blockH + 2 * WINDOW_PAD,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 20,
          top: WINDOW_PAD,
          whiteSpace: "nowrap",
          color: ROLE.text,
          fontFamily,
          fontSize: size,
          fontWeight: weight,
          lineHeight: `${lh}px`,
          letterSpacing: `${ls}px`,
          fontKerning: "normal",
          opacity: appear,
          translate: `0px ${-roll * rollDistance(blockH)}px`,
        }}
      >
        {REPLY_LINES.map((line) => (
          <div key={line} style={{ height: lh }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

const noSchema = {} as const satisfies InteractivitySchema;
export const ReplyToTurn = Interactive.withSchema({ Component: ReplyInner, componentName: "<ReplyToTurn>", schema: noSchema, wrapInSequence: true });

// ───────────────────────── frases del giro (misma esquina que la respuesta)
const FIRST = shiftExtent(TEXT_EXTENTS.turnFirst, TURN_DY);
const SECOND = shiftExtent(TEXT_EXTENTS.turnSecond, TURN_DY);

type RollProps = {
  readonly extent: TextExtent;
  /** fotograma local en que empieza la salida (fundido + leve ascenso, como el resto de los textos) */
  readonly exitAt: number;
  readonly style?: React.CSSProperties;
};

/** Frase del giro: el bloque rueda hacia adentro (desde abajo), se queda quieto y sale con fundido + leve ascenso. */
const RollBlock: React.FC<RollProps> = ({ extent, exitAt, style }) => {
  const frame = useCurrentFrame();
  const D = rollDistance(extent.h);
  const roll = interpolate(frame, [0, ROLL_FRAMES], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ROLL_EASING });
  const out = interpolate(frame, [exitAt, exitAt + TEXT_FX.exit], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXIT_EASING });
  return (
    <div
      style={{
        position: "absolute",
        left: extent.x - 20,
        top: extent.y - WINDOW_PAD,
        width: 940,
        height: extent.h + 2 * WINDOW_PAD,
        overflow: frame <= ROLL_FRAMES ? "hidden" : "visible",
        opacity: 1 - out,
        translate: `0px ${-out * TEXT_FX.exitRise}px`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", left: 20, top: WINDOW_PAD, width: 900, height: extent.h, translate: `0px ${roll * D}px` }}>
        {extent.lines.map((l) => (
          <div
            key={l.text}
            style={{
              position: "absolute",
              left: 0,
              top: l.y - extent.y,
              height: l.h,
              whiteSpace: "nowrap",
              color: ROLE.text,
              fontFamily,
              fontSize: l.size,
              fontWeight: l.weight,
              lineHeight: `${l.lineHeightPx}px`,
              letterSpacing: `${l.letterSpacing}px`,
              fontKerning: "normal",
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
};

type PhraseProps = { readonly style?: React.CSSProperties };

const FirstInner: React.FC<PhraseProps> = ({ style }) => <RollBlock extent={FIRST} exitAt={TURN_TIMING.exitFrom - TURN_TIMING.firstIn} style={style} />;

const SecondInner: React.FC<PhraseProps> = ({ style }) => <RollBlock extent={SECOND} exitAt={TURN_TIMING.exitFrom - TURN_TIMING.secondIn} style={style} />;

export const TurnPhraseFirst = Interactive.withSchema({ Component: FirstInner, componentName: "<TurnPhraseFirst>", schema: noSchema, wrapInSequence: true });
export const TurnPhraseSecond = Interactive.withSchema({ Component: SecondInner, componentName: "<TurnPhraseSecond>", schema: noSchema, wrapInSequence: true });

/** Ventanas de fotogramas (absolutas) de los nodos de este módulo. */
export const TURN_WINDOWS = {
  reply: { from: REPLY_FROM, to: REPLY_NODE_END },
  first: { from: TEXT_EXTENTS.turnFirst.from, to: TEXT_EXTENTS.turnFirst.to },
  second: { from: TEXT_EXTENTS.turnSecond.from, to: TEXT_EXTENTS.turnSecond.to },
} as const;
