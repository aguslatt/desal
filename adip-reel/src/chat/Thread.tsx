import React from "react";
import { CHAT } from "../config/script.ts";
import { fontFamily } from "../lib/fonts.ts";
import { AvatarPerson } from "./icons.tsx";
import { CHAT_COLORS, THREAD } from "./geometry.ts";

/**
 * Hilo de la conversación: SOLO el mensaje RECIBIDO (CHAT.received), a la izquierda, en burbuja blanca con la
 * esquina inferior izquierda recta. Nada más: no hay otros mensajes, horarios ni respuestas (jamás se recibe otra).
 */
const bubbleH = 72 + 2 * THREAD.bubble.padY;

export const Thread: React.FC = React.memo(() => {
  const { bubble, avatar } = THREAD;
  return (
    <>
      {/* avatar chico de «Amiga» junto al mensaje recibido */}
      <div
        style={{
          position: "absolute",
          left: avatar.cx - avatar.d / 2,
          top: bubble.top + bubbleH - avatar.d,
          width: avatar.d,
          height: avatar.d,
          borderRadius: avatar.d / 2,
          background: CHAT_COLORS.avatar,
          overflow: "hidden",
        }}
      >
        <AvatarPerson size={avatar.d} />
      </div>
      <div
        style={{
          position: "absolute",
          left: bubble.left,
          top: bubble.top,
          height: bubbleH,
          padding: `0 ${bubble.padX}px`,
          boxSizing: "border-box",
          borderRadius: `${bubble.radius}px ${bubble.radius}px ${bubble.radius}px ${bubble.tail}px`,
          background: CHAT_COLORS.surface,
          border: `2px solid ${CHAT_COLORS.line}`,
          boxShadow: "0 5px 14px rgba(7,68,52,0.07)",
          fontFamily,
          fontSize: bubble.fontSize,
          fontWeight: bubble.weight,
          lineHeight: `${bubbleH - 4}px`,
          color: CHAT_COLORS.ink,
          whiteSpace: "pre",
        }}
      >
        {CHAT.received}
      </div>
    </>
  );
});
