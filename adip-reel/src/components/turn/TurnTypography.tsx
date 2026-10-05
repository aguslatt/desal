import React from "react";
import { COLORS } from "../../config/brand.ts";
import { TURN } from "../../config/script.ts";
import { TURN_TIMING } from "../../config/timeline.ts";
import { FIRST_TOP, MOTION, SECOND_TOP, lastWord } from "./geometry.ts";
import { TurnSentence } from "./TurnSentence.tsx";

/**
 * Versión alternativa (sin grabación): las dos oraciones en tipografía animada.
 * 1.ª sobre el carril del hilo, 2.ª bajo el carril; la línea naranja (capa ThreadLine) las separa.
 * `ink` solo se cambia para mediciones (p. ej. "transparent" para medir el fondo real bajo el texto).
 */
export const TurnTypography: React.FC<{ readonly ink?: string }> = ({ ink = COLORS.ink }) => (
  <>
    <TurnSentence
      lines={TURN.firstLines}
      emphasis={lastWord(TURN.first)}
      top={FIRST_TOP}
      inFrom={TURN_TIMING.firstIn}
      outFrom={TURN_TIMING.exitFrom + MOTION.exitFirstDelay}
      color={ink}
    />
    <TurnSentence
      lines={TURN.secondLines}
      emphasis={lastWord(TURN.second)}
      top={SECOND_TOP}
      inFrom={TURN_TIMING.secondIn}
      outFrom={TURN_TIMING.exitFrom}
      color={ink}
    />
  </>
);
