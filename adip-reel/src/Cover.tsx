import { AbsoluteFill } from "remotion";
import { ROLE } from "./config/brand.ts";
import { fontFamily } from "./lib/fonts.ts";

// STUB — se reemplaza por la portada v3.
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: ROLE.paper, color: ROLE.text, fontFamily, fontSize: 60, justifyContent: "center", alignItems: "center" }}>STUB portada</AbsoluteFill>
);
