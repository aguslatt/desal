import React from "react";
import { CHAT } from "../config/script.ts";
import { MESSAGES } from "../config/script.ts";
import { fontFamily } from "../lib/fonts.ts";
import { Hook } from "./Hook.tsx";
import {
  BUBBLE,
  CHAT_COLORS,
  FIELD,
  INDICATOR,
  MSG,
  RECEIVED_BUBBLE,
  REPLY_BUBBLE,
  REPLY_TEXT,
  mix,
} from "./geometry.ts";
import { REPLY_LINES, type BoxStyle, type ChatState } from "./state.ts";

const radii = (r: readonly [number, number, number, number]) => `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`;

const messageText: React.CSSProperties = {
  fontFamily,
  fontSize: MSG.fontSize,
  fontWeight: MSG.weight,
  lineHeight: `${MSG.lineH}px`,
  letterSpacing: 0,
  fontKerning: "normal",
  whiteSpace: "pre",
};

/** Mensaje RECIBIDO «¿Cómo estás?»: burbuja naranja, texto negro, arriba a la izquierda del hilo. */
const ReceivedBubble: React.FC<{ readonly dx: number; readonly opacity: number }> = ({ dx, opacity }) => {
  const B = RECEIVED_BUBBLE;
  return (
    <div
      data-received=""
      style={{
        position: "absolute",
        left: B.x,
        top: B.y,
        width: B.w,
        height: B.h,
        borderRadius: `${B.radius}px ${B.radius}px ${B.radius}px ${B.tail}px`,
        background: CHAT_COLORS.received,
        color: CHAT_COLORS.black,
        translate: `${dx}px 0px`,
        opacity,
        ...messageText,
      }}
    >
      <div style={{ position: "absolute", left: BUBBLE.padX, top: BUBBLE.padY }}>{CHAT.received}</div>
    </div>
  );
};

/**
 * Mensaje ENVIADO (violeta, derecha del hilo, texto blanco 60/500). Nace como el rectángulo del campo con el texto de M3 y se
 * desplaza/encoge hasta su lugar (flyFrom → flyTo). El texto conserva su tamaño; solo cambian su color (negro → blanco) y su
 * posición dentro de la burbuja.
 */
const SentBubble: React.FC<{ readonly s: ChatState }> = ({ s }) => {
  const { box, fly } = s.send;
  const lines = MESSAGES[MESSAGES.length - 1].lines;
  const bgT = Math.max(0, Math.min(1, fly / 0.28));
  const bg = mix(CHAT_COLORS.field, CHAT_COLORS.sent, bgT);
  // el texto cambia de negro a blanco de golpe cuando el fondo cruza el punto de igual contraste (luminancia ≈ 0,18, mezcla ≈ 0,6):
  // así ningún fotograma del vuelo baja de ≈ 3,4:1 (un fundido gradual dejaba texto gris sobre violeta)
  const color = bgT < 0.6 ? CHAT_COLORS.black : CHAT_COLORS.sentText;
  const border = mix(CHAT_COLORS.fieldBorder, CHAT_COLORS.sent, bgT);
  const borderW = FIELD.border * (1 - bgT);
  return (
    <div
      data-sent=""
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: radii(box.r),
        background: bg,
        boxShadow: borderW > 0.05 ? `inset 0 0 0 ${borderW}px ${border}` : "none",
        color,
        translate: `${s.exit.sentDx}px 0px`,
        opacity: s.exit.bubbleOpacity,
        ...messageText,
      }}
    >
      {lines.map((ln, i) => (
        <div key={i} style={{ position: "absolute", left: box.textX, top: box.textY + i * MSG.lineH }}>
          {ln}
        </div>
      ))}
    </div>
  );
};

/** Tres puntos de «Amiga escribe» (cada fotograma, su propio rebote). */
const Dots: React.FC<{ readonly dots: readonly [number, number, number]; readonly opacity: number }> = ({ dots, opacity }) => (
  <>
    {dots.map((v, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: INDICATOR.w / 2 + (i - 1) * INDICATOR.spacing - INDICATOR.dot / 2,
          top: INDICATOR.h / 2 - INDICATOR.dot / 2 - 10 * v,
          width: INDICATOR.dot,
          height: INDICATOR.dot,
          borderRadius: "50%",
          background: CHAT_COLORS.black,
          opacity: opacity * (0.5 + 0.5 * v),
        }}
      />
    ))}
  </>
);

/** Texto de la respuesta (TYPE.title 68/700, negro, 2 líneas por oración), posicionado en REPLY_TEXT (pantalla). */
export const ReplyText: React.FC<{ readonly opacity?: number; readonly style?: React.CSSProperties }> = ({ opacity = 1, style }) => (
  <div
    data-reply-text=""
    style={{
      position: "absolute",
      left: REPLY_TEXT.x,
      top: REPLY_TEXT.y,
      color: REPLY_TEXT.color,
      fontFamily,
      fontSize: REPLY_TEXT.fontSize,
      fontWeight: REPLY_TEXT.fontWeight,
      lineHeight: `${REPLY_TEXT.lineHeightPx}px`,
      letterSpacing: REPLY_TEXT.letterSpacing,
      fontKerning: "normal",
      whiteSpace: "pre",
      opacity,
      ...style,
    }}
  >
    {REPLY_LINES.map((ln, i) => (
      <div key={i}>{ln}</div>
    ))}
  </div>
);

/** Burbuja naranja «Amiga»: primero tres puntos; en replyIn la burbuja crece y aparece «Estoy acá. Te escucho.». */
const Reply: React.FC<{ readonly s: ChatState; readonly replyText: boolean }> = ({ s, replyText }) => {
  const { indicator, reply } = s;
  if (!indicator.shown && !reply.shown) return null;
  const box: BoxStyle = reply.shown ? reply.box : { x: INDICATOR.x, y: INDICATOR.y, w: INDICATOR.w, h: INDICATOR.h, r: [INDICATOR.radius, INDICATOR.radius, INDICATOR.radius, INDICATOR.tail] };
  // «pop» del indicador: entra creciendo desde la esquina de la cola
  const pop = reply.shown ? 1 : indicator.pop;
  const popScale = 0.82 + 0.18 * pop;
  return (
    <div
      data-reply=""
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: radii(box.r),
        background: REPLY_BUBBLE.color,
        scale: reply.shown ? 1 : popScale,
        transformOrigin: "0% 100%",
        opacity: reply.shown ? 1 : pop,
        overflow: "hidden",
      }}
    >
      {reply.dotsOpacity > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: INDICATOR.w, height: INDICATOR.h }}>
          <Dots dots={indicator.dots} opacity={reply.shown ? reply.dotsOpacity : 1} />
        </div>
      ) : null}
      {reply.shown && replyText && reply.text > 0 ? (
        <div style={{ position: "absolute", left: -box.x, top: -box.y }}>
          <ReplyText opacity={reply.text} />
        </div>
      ) : null}
    </div>
  );
};

/** Hilo del chat: pregunta de la campaña (S1), mensaje recibido, burbuja enviada, indicador y respuesta. */
export const Thread: React.FC<{ readonly s: ChatState; readonly replyText: boolean }> = ({ s, replyText }) => (
  <>
    <ReceivedBubble dx={s.exit.receivedDx} opacity={s.exit.bubbleOpacity} />
    {s.hook.shown ? <Hook dy={s.hook.dy} opacity={s.hook.opacity} /> : null}
    <Reply s={s} replyText={replyText} />
  </>
);

export { SentBubble };
