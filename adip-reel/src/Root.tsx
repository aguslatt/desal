import React from "react";
import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { Reel } from "./Reel";
import { H, W } from "./config/layout.ts";
import { FPS, TOTAL_FRAMES } from "./config/timeline.ts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Still id="Cover" component={Cover} width={W} height={H} />
    </>
  );
};
