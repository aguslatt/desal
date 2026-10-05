import type React from "react";
import { AbsoluteFill, Interactive, type InteractivitySchema } from "remotion";
import { COLORS } from "../config/brand.ts";
import { fontFamily } from "../lib/fonts.ts";

// STUB — se reemplaza por la implementación real.
type Props = { readonly style?: React.CSSProperties };

const Inner: React.FC<Props> = ({ style }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily, fontSize: 60, justifyContent: "center", alignItems: "center", ...style }}>
    STUB chat
  </AbsoluteFill>
);

const schema = {} as const satisfies InteractivitySchema;

export const PhoneChat = Interactive.withSchema({
  Component: Inner,
  componentName: "<PhoneChat>",
  schema,
  wrapInSequence: true,
});
