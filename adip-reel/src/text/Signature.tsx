import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { SIGNATURE_TIMING } from "../config/timeline.ts";
import { TEXT_EXTENTS } from "./layout.ts";
import { TEXT_FX } from "./style.ts";
import { TextBlock } from "./TextBlock.tsx";

/**
 * S5 — FIRMA COMPLETA en dos bloques (title 68/700, negro sobre gris). El bloque 1 («En Equipo ADIP / estamos para / escucharte»)
 * entra en block1In; el bloque 2 («y acompañarte, / a tu ritmo.») entra DEBAJO en block2In con el 1.º SIGUIENDO visible: la frase
 * completa queda como una composición de 5 líneas, con el mismo interlineado de arriba abajo (ninguna supera 840 px). Salen juntos
 * desde SIGNATURE_TIMING.exitFrom. Sin marcador ni subrayados (v3): el logo es lo único con color en la firma.
 */
type Props = { readonly style?: React.CSSProperties };

const Block1: React.FC<Props> = ({ style }) => (
  <TextBlock extent={TEXT_EXTENTS.signature1} rise={TEXT_FX.riseTitle} exitAt={SIGNATURE_TIMING.exitFrom - SIGNATURE_TIMING.block1In} color={ROLE.text} style={style} />
);

const Block2: React.FC<Props> = ({ style }) => (
  <TextBlock extent={TEXT_EXTENTS.signature2} rise={TEXT_FX.riseTitle} exitAt={SIGNATURE_TIMING.exitFrom - SIGNATURE_TIMING.block2In} color={ROLE.text} style={style} />
);

const schema = {} as const satisfies InteractivitySchema;

export const SignatureBlock1 = Interactive.withSchema({ Component: Block1, componentName: "<SignatureBlock1>", schema, wrapInSequence: true });
export const SignatureBlock2 = Interactive.withSchema({ Component: Block2, componentName: "<SignatureBlock2>", schema, wrapInSequence: true });
