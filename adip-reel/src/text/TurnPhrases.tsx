import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { TURN } from "../config/script.ts";
import { TURN_TIMING } from "../config/timeline.ts";
import { TEXT_EXTENTS } from "./layout.ts";
import { ACCENT, TEXT_FX } from "./style.ts";
import { TextBlock } from "./TextBlock.tsx";

/**
 * S3 — FRASES DEL GIRO sobre NARANJA (el fondo lo pone el montaje): display 88/800, negro (8,3:1), a la izquierda en x = 120 desde
 * TURN_ANCHOR. «Podés empezar / por ahí.» entra en TURN_TIMING.firstIn; «Por no saber / cómo empezar.» entra DEBAJO en secondIn con la
 * 1.ª SIEMPRE VISIBLE; salen juntas desde TURN_TIMING.exitFrom. Énfasis sutil: subrayado a mano violeta (3,01:1 sobre el naranja)
 * bajo «ahí» y bajo «empezar» (última palabra de cada frase).
 */
const lastWord = (s: string): string => s.replace(/[.,…]+$/, "").split(" ").pop() ?? s;

type Props = { readonly accent?: string; readonly style?: React.CSSProperties };

const FirstInner: React.FC<Props> = ({ accent = ACCENT.onOrange, style }) => (
  <TextBlock
    extent={TEXT_EXTENTS.turnFirst}
    rise={TEXT_FX.riseDisplay}
    emphasis={[lastWord(TURN.first)]}
    variant="underline"
    accent={accent}
    exitAt={TURN_TIMING.exitFrom - TURN_TIMING.firstIn}
    seed={5}
    color={ROLE.text}
    style={style}
  />
);

const SecondInner: React.FC<Props> = ({ accent = ACCENT.onOrange, style }) => (
  <TextBlock
    extent={TEXT_EXTENTS.turnSecond}
    rise={TEXT_FX.riseDisplay}
    emphasis={[lastWord(TURN.second)]}
    variant="underline"
    accent={accent}
    exitAt={TURN_TIMING.exitFrom - TURN_TIMING.secondIn}
    seed={9}
    color={ROLE.text}
    style={style}
  />
);

const schema = {
  accent: { type: "color", default: ACCENT.onOrange, description: "Color del subrayado" },
} as const satisfies InteractivitySchema;

export const TurnFirst = Interactive.withSchema({ Component: FirstInner, componentName: "<TurnFirst>", schema, wrapInSequence: true });
export const TurnSecond = Interactive.withSchema({ Component: SecondInner, componentName: "<TurnSecond>", schema, wrapInSequence: true });
