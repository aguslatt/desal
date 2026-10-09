import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { COMPANION_TIMING } from "../config/timeline.ts";
import { TEXT_EXTENTS } from "./layout.ts";
import { TEXT_FX } from "./style.ts";
import { TextBlock } from "./TextBlock.tsx";

/**
 * S4 — «No tenés que pasar por esto en soledad.»: title 68/700, negro sobre gris (18,3:1), a la izquierda en x = 120, franja
 * TEXT.top. Entra en COMPANION_TIMING.textIn, queda ESTABLE (sin movimiento) y sale desde textExitFrom.
 */
const Inner: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <TextBlock
    extent={TEXT_EXTENTS.companion}
    rise={TEXT_FX.riseTitle}
    exitAt={COMPANION_TIMING.textExitFrom - COMPANION_TIMING.textIn}
    color={ROLE.text}
    style={style}
  />
);

const schema = {} as const satisfies InteractivitySchema;

export const CompanionText = Interactive.withSchema({ Component: Inner, componentName: "<CompanionText>", schema, wrapInSequence: true });
