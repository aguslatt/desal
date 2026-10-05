import React from "react";
import { fontFamily } from "../lib/fonts.ts";
import { BackspaceIcon, EnterIcon, ShiftIcon, SmileIcon } from "./icons.tsx";
import { CHAT_COLORS, KEYBOARD, KEYS, KEY_FX, mix, type KeyBox } from "./geometry.ts";
import type { ChatState } from "./state.ts";

/**
 * Teclado de celular (QWERTY español con Ñ): teclas blancas / grises sobre gris cálido, con borde inferior suave.
 * Cada tecla recibe su resalte `v` (0–1) de chatStateAt: hundimiento de 1–2 px + tinte naranja tenue. La tecla ⌫ se
 * «mantiene» (más intensa) con un pulso por carácter borrado.
 */
const Cap: React.FC<{ readonly k: KeyBox; readonly v: number }> = React.memo(({ k, v }) => {
  const isBack = k.kind === "back";
  const fn = k.kind === "shift" || k.kind === "back" || k.kind === "sym" || k.kind === "enter";
  const baseBg = fn ? CHAT_COLORS.keyFn : CHAT_COLORS.key;
  const edge = fn ? CHAT_COLORS.keyFnEdge : CHAT_COLORS.keyEdge;
  const tint = v * (isBack ? KEY_FX.backTint : KEY_FX.tint);
  const depth = v * (isBack ? KEY_FX.backDepth : KEY_FX.depth);
  const bg = mix(baseBg, CHAT_COLORS.orange, tint);
  const edgeColor = mix(edge, CHAT_COLORS.orange, tint * 0.8);
  const ring = isBack ? 7 * v : 0;

  const content = (() => {
    switch (k.kind) {
      case "shift":
        return <ShiftIcon size={50} fill={v} />;
      case "back":
        return <BackspaceIcon size={76} />;
      case "emoji":
        return <SmileIcon size={52} />;
      case "enter":
        return <EnterIcon size={54} />;
      case "sym":
        return <span style={{ fontSize: 40, fontWeight: 600 }}>{k.label}</span>;
      case "comma":
      case "dot":
        return <span style={{ fontSize: 56, fontWeight: 500, marginTop: -14 }}>{k.label}</span>;
      case "space":
        return null;
      default:
        return <span style={{ fontSize: KEYBOARD.letterSize, fontWeight: 500 }}>{k.label}</span>;
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        left: k.x,
        top: k.y + depth,
        width: k.w,
        height: k.h,
        borderRadius: KEYBOARD.radius,
        background: bg,
        boxShadow: `0 ${Math.max(1, 5 - depth)}px 0 ${edgeColor}${ring > 0.2 ? `, 0 0 0 ${ring}px rgba(254,128,28,${0.34 * v})` : ""}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: CHAT_COLORS.ink,
        fontFamily,
      }}
    >
      {content}
    </div>
  );
});

export const Keyboard: React.FC<{ readonly s: ChatState }> = ({ s }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: KEYBOARD.top,
        width: 1080,
        height: KEYBOARD.bottom - KEYBOARD.top,
        background: CHAT_COLORS.keyboard,
        borderTop: `2px solid ${CHAT_COLORS.keyboardEdge}`,
        boxSizing: "border-box",
      }}
    />
    {KEYS.map((k) => (
      <Cap key={k.id} k={k} v={s.keys[k.id] ?? 0} />
    ))}
    {/* indicador de inicio (gesto) */}
    <div
      style={{
        position: "absolute",
        left: 540 - KEYBOARD.homeBar.w / 2,
        top: KEYBOARD.homeBar.cy - KEYBOARD.homeBar.h / 2,
        width: KEYBOARD.homeBar.w,
        height: KEYBOARD.homeBar.h,
        borderRadius: KEYBOARD.homeBar.h / 2,
        background: CHAT_COLORS.ink,
        opacity: 0.35,
      }}
    />
  </>
);
