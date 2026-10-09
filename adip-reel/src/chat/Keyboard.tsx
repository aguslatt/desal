import React from "react";
import { fontFamily } from "../lib/fonts.ts";
import { BackspaceIcon, EnterIcon, ShiftIcon, SmileIcon } from "./icons.tsx";
import { CHAT_COLORS, KEYBOARD, KEYS, KEY_FX, mix, type KeyBox } from "./geometry.ts";
import type { ChatState } from "./state.ts";

/**
 * Teclado de celular (QWERTY español con Ñ; ⇧ · ⌫ grande a la derecha de la fila 3 · ?123 , carita espacio . ↵): teclas blancas /
 * grises sobre gris neutro con borde inferior suave, sin marcas de terceros. Cada tecla recibe su resalte `v` (0–1) de chatStateAt:
 * hundimiento de 1–2 px + tinte naranja tenue (≤ 25 %). La tecla ⌫ se «mantiene» (más intensa) durante la ráfaga de borrado.
 */
const Cap: React.FC<{ readonly k: KeyBox; readonly v: number }> = React.memo(({ k, v }) => {
  const isBack = k.kind === "back";
  const fn = k.kind === "shift" || k.kind === "back" || k.kind === "sym" || k.kind === "enter";
  // las teclas de función (más oscuras) se aclaran al pulsarse, como en un teclado real; luego el tinte naranja tenue
  const baseBg = fn ? mix(CHAT_COLORS.keyFn, CHAT_COLORS.key, 0.6 * v) : CHAT_COLORS.key;
  const edge = fn ? CHAT_COLORS.keyFnEdge : CHAT_COLORS.keyEdge;
  // la barra espaciadora es muy ancha: su tinte es más tenue para que no «mancha» el teclado
  const tint = v * (isBack ? KEY_FX.backTint : k.kind === "space" ? KEY_FX.tint * 0.55 : KEY_FX.tint);
  const depth = v * (isBack ? KEY_FX.backDepth : KEY_FX.depth);
  const bg = mix(baseBg, CHAT_COLORS.orange, tint);
  const edgeColor = mix(edge, CHAT_COLORS.orange, tint * 0.8);

  const content = (() => {
    switch (k.kind) {
      case "shift":
        return <ShiftIcon size={48} fill={v} />;
      case "back":
        return <BackspaceIcon size={74} />;
      case "emoji":
        return <SmileIcon size={50} />;
      case "enter":
        return <EnterIcon size={52} />;
      case "sym":
        return <span style={{ fontSize: 40, fontWeight: 600 }}>{k.label}</span>;
      case "comma":
      case "dot":
        return <span style={{ fontSize: 54, fontWeight: 500, marginTop: -14 }}>{k.label}</span>;
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
        boxShadow: `0 ${Math.max(1, 4 - depth)}px 0 ${edgeColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: CHAT_COLORS.black,
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
        background: CHAT_COLORS.black,
        opacity: 0.35,
      }}
    />
  </>
);
