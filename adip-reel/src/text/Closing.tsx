import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { ROLE } from "../config/brand.ts";
import { TEXT_EXTENTS } from "./layout.ts";
import { TEXT_FX } from "./style.ts";
import { TextBlock } from "./TextBlock.tsx";

/**
 * S6 — CIERRE sobre gris: «Si hoy te cuesta decirlo, / podés compartir / este video.» (title 68/700, a la izquierda; «podés compartir
 * este video.» mide 984 px, se parte en 2 líneas) entra en CLOSING_TIMING.messageIn; después «10 de octubre» (title 68/700) y «Día
 * Mundial de la Salud Mental» (body 52/600) en la zona inferior desde CLOSING_TIMING.dateIn. Todo ESTÁTICO desde allVisible hasta
 * el último fotograma: sin salida ni fundidos finales (las piezas duran hasta el final del reel).
 */
const MessageInner: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <TextBlock extent={TEXT_EXTENTS.closingMessage} rise={TEXT_FX.riseTitle} color={ROLE.text} style={style} />
);

const DateInner: React.FC<{ readonly style?: React.CSSProperties }> = ({ style }) => (
  <TextBlock extent={TEXT_EXTENTS.closingDate} rise={TEXT_FX.riseTitle} color={ROLE.text} style={style} />
);

const schema = {} as const satisfies InteractivitySchema;

export const ClosingMessage = Interactive.withSchema({ Component: MessageInner, componentName: "<ClosingMessage>", schema, wrapInSequence: true });
export const ClosingDate = Interactive.withSchema({ Component: DateInner, componentName: "<ClosingDate>", schema, wrapInSequence: true });
