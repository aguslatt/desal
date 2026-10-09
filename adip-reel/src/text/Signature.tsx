import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { SIGNATURE_BLOCKS } from "../config/script.ts";
import { SIGNATURE_TIMING } from "../config/timeline.ts";
import { TEXT_EXTENTS } from "./layout.ts";
import { ACCENT, TEXT_FX } from "./style.ts";
import { TextBlock } from "./TextBlock.tsx";

/**
 * S5 — FIRMA COMPLETA en dos bloques (title 68/700, negro sobre gris). El bloque 1 («En Equipo ADIP / estamos para / escucharte»)
 * entra en block1In; el bloque 2 («y acompañarte, / a tu ritmo.») entra DEBAJO en block2In con el 1.º SIGUIENDO visible: la frase
 * completa queda como una composición de 5 líneas (ninguna supera 840 px). Salen juntos desde SIGNATURE_TIMING.exitFrom.
 * Énfasis moderado: marcador amarillo a mano DETRÁS de «escucharte», «acompañarte» y «a tu ritmo» (el texto sigue negro).
 */
type Props = { readonly accent?: string; readonly style?: React.CSSProperties };

const Block1: React.FC<Props> = ({ accent = ACCENT.onGrey, style }) => (
  <TextBlock
    extent={TEXT_EXTENTS.signature1}
    rise={TEXT_FX.riseTitle}
    emphasis={SIGNATURE_BLOCKS[0].emphasis}
    variant="marker"
    accent={accent}
    exitAt={SIGNATURE_TIMING.exitFrom - SIGNATURE_TIMING.block1In}
    seed={21}
    color={ROLE.text}
    style={style}
  />
);

const Block2: React.FC<Props> = ({ accent = ACCENT.onGrey, style }) => (
  <TextBlock
    extent={TEXT_EXTENTS.signature2}
    rise={TEXT_FX.riseTitle}
    emphasis={SIGNATURE_BLOCKS[1].emphasis}
    variant="marker"
    accent={accent}
    exitAt={SIGNATURE_TIMING.exitFrom - SIGNATURE_TIMING.block2In}
    seed={34}
    color={ROLE.text}
    style={style}
  />
);

const schema = {
  accent: { type: "color", default: ACCENT.onGrey, description: "Color del marcador" },
} as const satisfies InteractivitySchema;

export const SignatureBlock1 = Interactive.withSchema({ Component: Block1, componentName: "<SignatureBlock1>", schema, wrapInSequence: true });
export const SignatureBlock2 = Interactive.withSchema({ Component: Block2, componentName: "<SignatureBlock2>", schema, wrapInSequence: true });
