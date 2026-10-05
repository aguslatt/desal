import { AbsoluteFill } from "remotion";
import { COLORS } from "./config/brand.ts";
import { fontFamily } from "./lib/fonts.ts";

// STUB — se reemplaza por la portada real.
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily, fontSize: 60, justifyContent: "center", alignItems: "center" }}>
    STUB portada
  </AbsoluteFill>
);
