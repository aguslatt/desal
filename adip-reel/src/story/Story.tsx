import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { fontFamily } from "../lib/fonts.ts";

// STUB — lo reemplaza el agente de montaje (escenas 1–6, transición, fondos, textos y logo).
type Props = { readonly style?: React.CSSProperties };
const Inner: React.FC<Props> = ({ style }) => (
  <AbsoluteFill style={{ backgroundColor: ROLE.paper, color: ROLE.text, fontFamily, fontSize: 60, justifyContent: "center", alignItems: "center", ...style }}>STUB historia</AbsoluteFill>
);
const schema = {} as const satisfies InteractivitySchema;
export const Story = Interactive.withSchema({ Component: Inner, componentName: "<Story>", schema, wrapInSequence: true });
