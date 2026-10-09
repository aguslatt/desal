import React from "react";
import { fontFamily } from "../lib/fonts.ts";
import { ArrowUp, Plus } from "./icons.tsx";
import { CHAT_COLORS, CURSOR, FIELD, FIELD_CY, MSG, mix } from "./geometry.ts";
import type { ChatState } from "./state.ts";

/** Fondo del campo de escritura: BLANCO, tamaño FIJO para 2 líneas (vacío mide lo mismo que lleno). */
export const FieldBack: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: FIELD.x,
      top: FIELD.y,
      width: FIELD.w,
      height: FIELD.h,
      borderRadius: FIELD.radius,
      background: CHAT_COLORS.field,
      boxShadow: `inset 0 0 0 ${FIELD.border}px ${CHAT_COLORS.fieldBorder}`,
    }}
  />
);

const lineBase: React.CSSProperties = {
  position: "absolute",
  left: FIELD.textLeft,
  height: MSG.lineH,
  display: "flex",
  alignItems: "center",
  fontFamily,
  fontSize: MSG.fontSize,
  fontWeight: MSG.weight,
  lineHeight: `${MSG.lineH}px`,
  letterSpacing: 0,
  fontKerning: "normal",
  color: CHAT_COLORS.black,
  whiteSpace: "pre",
};

/** Una línea del campo: el texto visible y, si corresponde, el cursor pegado a su último carácter. */
const FieldLine: React.FC<{ readonly index: 0 | 1; readonly text: string; readonly cursor: number | null }> = ({ index, text, cursor }) => (
  <div style={{ ...lineBase, top: FIELD.textTop + index * MSG.lineH }}>
    <span data-field-line={index}>{text}</span>
    {cursor !== null ? (
      <i
        data-chat-cursor=""
        style={{
          display: "block",
          flex: "none",
          width: CURSOR.w,
          height: CURSOR.h,
          marginLeft: CURSOR.gap,
          borderRadius: CURSOR.radius,
          background: CHAT_COLORS.cursor,
          opacity: cursor,
          position: "relative",
          top: CURSOR.dy,
        }}
      />
    ) : null}
  </div>
);

/** Botón de enviar: círculo gris inactivo → violeta activo con flecha blanca; se hunde y destella SOLO al pulsarse. */
const SendButton: React.FC<{ readonly armed: number; readonly press: number }> = ({ armed, press }) => {
  const d = FIELD.send.d;
  const base = mix(CHAT_COLORS.sendOff, CHAT_COLORS.sendOn, armed);
  const bg = mix(base, CHAT_COLORS.black, 0.22 * press);
  const icon = mix(CHAT_COLORS.sendOffIcon, CHAT_COLORS.white, armed);
  const ring = press * 16;
  // halo de la pulsación en tinte OPACO (violeta sobre el blanco del campo): mismo aspecto que un halo translúcido, sin translucidez
  const ringColor = mix(CHAT_COLORS.field, CHAT_COLORS.sendOn, 0.28 * press);
  return (
    <div
      data-send=""
      style={{
        position: "absolute",
        left: FIELD.send.cx - d / 2,
        top: FIELD_CY - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
        background: bg,
        scale: 1 - 0.12 * press,
        boxShadow: press > 0.01 ? `0 0 0 ${ring}px ${ringColor}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: icon,
      }}
    >
      <ArrowUp size={44} stroke={8} />
    </div>
  );
};

/** Texto del campo, ícono +, cursor y botón de enviar (la capa frontal del campo). */
export const FieldFront: React.FC<{ readonly s: ChatState }> = ({ s }) => {
  const cur = s.cursorShown ? s.cursorOpacity : null;
  return (
    <>
      <div style={{ position: "absolute", left: FIELD.plus.cx - FIELD.plus.size / 2, top: FIELD_CY - FIELD.plus.size / 2, color: CHAT_COLORS.fieldIcon }}>
        <Plus size={FIELD.plus.size} stroke={7} />
      </div>
      {s.lines[0] !== "" || (cur !== null && s.cursorLine === 0) ? <FieldLine index={0} text={s.lines[0]} cursor={s.cursorLine === 0 ? cur : null} /> : null}
      {s.lines[1] !== "" || (cur !== null && s.cursorLine === 1) ? <FieldLine index={1} text={s.lines[1]} cursor={s.cursorLine === 1 ? cur : null} /> : null}
      <SendButton armed={s.sendArmed} press={s.sendPress} />
    </>
  );
};
