import React from "react";
import { fontFamily } from "../lib/fonts.ts";
import { Plus, SendPlane } from "./icons.tsx";
import { CHAT_COLORS, CURSOR, FIELD_ICON_CY, PILL, lineCenterY, mix } from "./geometry.ts";
import type { ChatState, Ghost } from "./state.ts";

/** Una línea del campo: texto, cursor naranja pegado al último carácter y caracteres recién borrados (fantasmas). */
const Line: React.FC<{
  readonly y: number;
  readonly text: string;
  readonly cursorOpacity: number | null;
  readonly ghosts: readonly Ghost[];
}> = ({ y, text, cursorOpacity, ghosts }) => (
  <div
    style={{
      position: "absolute",
      left: PILL.textLeft - PILL.x0 - PILL.border,
      top: y - PILL.lineH / 2,
      height: PILL.lineH,
      lineHeight: `${PILL.lineH}px`,
      whiteSpace: "pre",
      fontFamily,
      fontSize: PILL.fontSize,
      fontWeight: PILL.weight,
      fontKerning: "normal",
      color: CHAT_COLORS.ink,
    }}
  >
    <span>{text}</span>
    {cursorOpacity !== null ? (
      <span style={{ display: "inline-block", position: "relative", width: 0, height: PILL.lineH, verticalAlign: "top" }}>
        <span
          data-chat-cursor=""
          style={{
            position: "absolute",
            left: CURSOR.gap,
            top: (PILL.lineH - CURSOR.h) / 2 + CURSOR.dy,
            width: CURSOR.w,
            height: CURSOR.h,
            borderRadius: CURSOR.w / 2,
            background: CHAT_COLORS.orange,
            opacity: cursorOpacity,
          }}
        />
      </span>
    ) : null}
    {ghosts.length > 0 ? (
      <span style={{ marginLeft: cursorOpacity !== null ? CURSOR.gap * 2 + CURSOR.w : 0, color: CHAT_COLORS.orange }}>
        {ghosts.map((g, i) => (
          <span key={i} style={{ opacity: g.opacity }}>
            {g.char}
          </span>
        ))}
      </span>
    ) : null}
  </div>
);

/**
 * Campo de escritura: píldora blanca con borde firme sobre el teclado, «+» a la izquierda, el texto en curso
 * (todavía NO enviado), y el botón de enviar a la derecha (gris con el campo vacío, se «arma» con texto; nunca se presiona).
 * Crece hacia arriba para la 2.ª línea.
 */
export const InputBar: React.FC<{ readonly s: ChatState }> = ({ s }) => {
  const a = s.twoLines;
  const h = PILL.h1 + (PILL.h2 - PILL.h1) * a;
  const top = PILL.bottom - h;
  const y0 = lineCenterY(0, a);
  const y1 = lineCenterY(1, a);
  const armed = s.sendArmed;
  const cursorOp = s.cursorVisible ? s.cursorOpacity : null;

  return (
    <>
      {/* campo */}
      <div
        style={{
          position: "absolute",
          left: PILL.x0,
          top,
          width: PILL.x1 - PILL.x0,
          height: h,
          borderRadius: PILL.radius,
          background: CHAT_COLORS.surface,
          border: `${PILL.border}px solid ${CHAT_COLORS.fieldBorder}`,
          boxSizing: "border-box",
          boxShadow: "0 8px 22px rgba(7,68,52,0.10)",
        }}
      />
      {/* + */}
      <div
        style={{
          position: "absolute",
          left: PILL.plus.cx - PILL.plus.d / 2,
          top: FIELD_ICON_CY - PILL.plus.d / 2,
          width: PILL.plus.d,
          height: PILL.plus.d,
          borderRadius: PILL.plus.d / 2,
          background: CHAT_COLORS.sendOff,
          color: CHAT_COLORS.inkSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={36} stroke={7} />
      </div>
      {/* texto: recortado por el campo (mientras crece/se encoge, la línea nueva entra/sale por el borde) */}
      <div
        style={{
          position: "absolute",
          left: PILL.x0 + PILL.border,
          top: top + PILL.border,
          width: PILL.x1 - PILL.x0 - 2 * PILL.border,
          height: h - 2 * PILL.border,
          overflow: "hidden",
          borderRadius: PILL.radius - PILL.border,
        }}
      >
        <Line y={y0 - top - PILL.border} text={s.lines[0]} cursorOpacity={s.cursorLine === 0 ? cursorOp : null} ghosts={s.ghosts[0]} />
        <Line y={y1 - top - PILL.border} text={s.lines[1]} cursorOpacity={s.cursorLine === 1 ? cursorOp : null} ghosts={s.ghosts[1]} />
      </div>
      {/* enviar: apagado (gris) → armado (verde oscuro de marca) */}
      <div
        style={{
          position: "absolute",
          left: PILL.send.cx - PILL.send.d / 2,
          top: FIELD_ICON_CY - PILL.send.d / 2,
          width: PILL.send.d,
          height: PILL.send.d,
          borderRadius: PILL.send.d / 2,
          background: mix(CHAT_COLORS.sendOff, CHAT_COLORS.sendOn, armed),
          color: mix(CHAT_COLORS.sendOffIcon, CHAT_COLORS.surface, armed),
          boxShadow: armed > 0.01 ? `0 6px 14px rgba(7,68,52,${0.22 * armed})` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SendPlane size={50} style={{ marginLeft: 4 }} />
      </div>
    </>
  );
};
