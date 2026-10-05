import React, { useMemo } from "react";
import { Interactive, useVideoConfig } from "remotion";
import { CLOSING } from "../../config/script.ts";
import { COLORS } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";
import { CLOSING_TIMING } from "../../config/timeline.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { MESSAGE, MOTION } from "./geometry.ts";
import { RevealLine } from "./RevealLine.tsx";
import { useClosingFonts } from "./useClosingFonts.ts";
import { wrapNatural } from "./wrapText.ts";

/**
 * «Si hoy te cuesta decirlo, / podés compartir este video.» (CLOSING.message).
 * Cada cláusula del guion es un bloque; a 76 px cada una se parte en 2 líneas naturales (4 renglones
 * en total, 360–720 = ZONES.s5.message). La 2.ª cláusula entra unos fotogramas después de la 1.ª.
 */
export const ClosingMessage: React.FC = () => {
  const { fps } = useVideoConfig();
  const ready = useClosingFonts();

  const clauses = useMemo(
    () =>
      ready
        ? CLOSING.message.map((clause) =>
            wrapNatural(clause, { fontSize: MESSAGE.fontSize, weight: MESSAGE.weight, letterSpacing: MESSAGE.letterSpacing }, MESSAGE.maxWidth),
          )
        : [],
    [ready],
  );

  return (
    <Interactive.Div
      name="Mensaje"
      premountFor={fps}
      style={{
        position: "absolute",
        left: SAFE.x0,
        width: SAFE.width,
        top: MESSAGE.top,
        textAlign: "center",
        color: COLORS.ink,
        fontFamily,
        fontSize: MESSAGE.fontSize,
        fontWeight: MESSAGE.weight,
        lineHeight: `${MESSAGE.lineHeight}px`,
        letterSpacing: MESSAGE.letterSpacing,
        fontKerning: "normal",
        textRendering: "optimizeLegibility",
      }}
    >
      {clauses.map((lines, ci) => (
        <div key={ci} style={{ marginTop: ci === 0 ? 0 : MESSAGE.clauseGap }}>
          {lines.map((line, li) => (
            <RevealLine
              key={li}
              text={line}
              start={CLOSING_TIMING.messageIn + ci * MOTION.clauseDelay + li * MOTION.lineStagger}
              enter={MOTION.lineEnter}
              enterFade={MOTION.lineEnterFade}
              rise={MOTION.rise}
              lineHeight={MESSAGE.lineHeight}
            />
          ))}
        </div>
      ))}
    </Interactive.Div>
  );
};
