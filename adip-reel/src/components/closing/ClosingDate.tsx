import React, { useMemo } from "react";
import { Interactive, useVideoConfig } from "remotion";
import { CLOSING } from "../../config/script.ts";
import { COLORS } from "../../config/brand.ts";
import { SAFE } from "../../config/layout.ts";
import { CLOSING_TIMING } from "../../config/timeline.ts";
import { fontFamily } from "../../lib/fonts.ts";
import { DATE, LOGO_BOX, MOTION, dateTop } from "./geometry.ts";
import { RevealLine } from "./RevealLine.tsx";
import { useClosingFonts } from "./useClosingFonts.ts";
import { wrapNatural } from "./wrapText.ts";

export type ClosingDateProps = {
  /** Ancho del logo (px): la fecha se ubica DATE.gapBelowLogo px debajo. */
  readonly logoWidth?: number;
};

/**
 * «10 de octubre» (bold) y «Día Mundial de la Salud Mental» (medium, 2 líneas naturales si no entra en
 * una sola dentro de la zona segura). Entran en CLOSING_TIMING.dateIn y quedan asentadas en
 * CLOSING_TIMING.allVisible: la duración de cada revelado se deriva de ese hito.
 */
export const ClosingDate: React.FC<ClosingDateProps> = ({ logoWidth = LOGO_BOX.width }) => {
  const { fps } = useVideoConfig();
  const ready = useClosingFonts();

  const campaignLines = useMemo(
    () =>
      ready
        ? wrapNatural(
            CLOSING.campaign,
            { fontSize: DATE.campaign.fontSize, weight: DATE.campaign.weight, letterSpacing: DATE.campaign.letterSpacing },
            DATE.campaign.maxWidth,
          )
        : [],
    [ready],
  );

  const dateStart = CLOSING_TIMING.dateIn;
  const campaignStart = CLOSING_TIMING.dateIn + MOTION.campaignDelay;
  const end = CLOSING_TIMING.allVisible;

  return (
    <Interactive.Div
      name="Fecha y campaña"
      premountFor={fps}
      style={{
        position: "absolute",
        left: SAFE.x0,
        width: SAFE.width,
        top: dateTop(logoWidth),
        textAlign: "center",
        color: COLORS.ink,
        fontFamily,
        fontKerning: "normal",
        textRendering: "optimizeLegibility",
      }}
    >
      <div
        style={{
          fontSize: DATE.dateLine.fontSize,
          fontWeight: DATE.dateLine.weight,
          lineHeight: `${DATE.dateLine.lineHeight}px`,
          letterSpacing: DATE.dateLine.letterSpacing,
        }}
      >
        <RevealLine
          text={CLOSING.dateLine}
          start={dateStart}
          enter={end - dateStart}
          enterFade={Math.round((end - dateStart) * 0.6)}
          rise={MOTION.dateRise}
          lineHeight={DATE.dateLine.lineHeight}
        />
      </div>
      <div
        style={{
          marginTop: DATE.betweenGap,
          fontSize: DATE.campaign.fontSize,
          fontWeight: DATE.campaign.weight,
          lineHeight: `${DATE.campaign.lineHeight}px`,
          letterSpacing: DATE.campaign.letterSpacing,
        }}
      >
        {campaignLines.map((line, i) => (
          <RevealLine
            key={i}
            text={line}
            start={campaignStart + i * 3}
            enter={end - (campaignStart + i * 3)}
            enterFade={Math.round((end - (campaignStart + i * 3)) * 0.6)}
            rise={MOTION.dateRise}
            lineHeight={DATE.campaign.lineHeight}
          />
        ))}
      </div>
    </Interactive.Div>
  );
};
