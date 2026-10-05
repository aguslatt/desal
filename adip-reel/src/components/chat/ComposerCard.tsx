import { useMemo } from "react";
import type React from "react";
import { COMPOSER } from "../../config/layout.ts";
import { ComposerCursor } from "./ComposerCursor.tsx";
import { ComposerShell } from "./ComposerShell.tsx";
import { ComposerText } from "./ComposerText.tsx";
import { cursorBox } from "./typingLayout.ts";
import { useFontsReady } from "./useFontsReady.ts";

/**
 * Campo de redacción completo (presentacional): tarjeta + texto visible + cursor opcional.
 * Se dibuja SIEMPRE en las coordenadas de COMPOSER. Para moverlo/escalarlo (p. ej. en la portada)
 * pasar `style` con `translate` / `scale` (el origen de transformación es el centro de la tarjeta).
 *
 *  - `lines`: texto YA visible, una entrada por línea de diseño (p. ej. MESSAGES[2].lines).
 *    El cursor se ubica al final de la última entrada.
 *  - `showCursor` / `cursorOpacity`: barra naranja 8×64 (opacidad 0–1).
 *  - `elevation`: 0 reposo · 1 "escribiendo" (sombra apenas más marcada).
 */
export const ComposerCard: React.FC<{
  readonly lines: readonly string[];
  readonly showCursor?: boolean;
  readonly cursorOpacity?: number;
  readonly elevation?: number;
  readonly textOpacity?: number;
  readonly style?: React.CSSProperties;
}> = ({ lines, showCursor = false, cursorOpacity = 1, elevation = 1, textOpacity = 1, style }) => {
  const fontsReady = useFontsReady();
  const box = useMemo(() => (fontsReady && showCursor ? cursorBox(lines) : null), [fontsReady, showCursor, lines]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        transformOrigin: `${COMPOSER.x + COMPOSER.w / 2}px ${COMPOSER.y + COMPOSER.h / 2}px`,
        ...style,
      }}
    >
      <ComposerShell elevation={elevation} />
      <ComposerText lines={lines} opacity={textOpacity} />
      {box ? <ComposerCursor left={box.left} top={box.top} opacity={cursorOpacity} /> : null}
    </div>
  );
};
