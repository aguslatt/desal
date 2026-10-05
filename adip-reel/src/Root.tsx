import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Cover } from "./Cover";
import { Reel } from "./Reel";
import { H, W } from "./config/layout.ts";
import { FPS, OVERLAP, SCENES, SFX_CUES, TOTAL_FRAMES } from "./config/timeline.ts";
import { ChatEnvironment } from "./scenes/ChatEnvironment";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Messages } from "./scenes/Scene2Messages";
import { Scene3Turn } from "./scenes/Scene3Turn";
import { Scene4Companion } from "./scenes/Scene4Companion";
import { Scene5Closing } from "./scenes/Scene5Closing";
import { ThreadLine } from "./scenes/ThreadLine";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Still id="Cover" component={Cover} width={W} height={H} />
      <Folder name="Escenas">
        <Composition id="Chat" component={ChatEnvironment} width={W} height={H} fps={FPS} durationInFrames={SCENES.s3.from + OVERLAP + 20} />
        <Composition id="Escena1-Inicio" component={Scene1Hook} width={W} height={H} fps={FPS} durationInFrames={SCENES.s1.to - SCENES.s1.from + OVERLAP} />
        <Composition id="Escena2-Mensajes" component={Scene2Messages} width={W} height={H} fps={FPS} durationInFrames={SCENES.s2.to - SCENES.s2.from + OVERLAP + 20} />
        <Composition id="Escena3-Giro" component={Scene3Turn} width={W} height={H} fps={FPS} durationInFrames={SCENES.s3.to - SCENES.s3.from + OVERLAP} />
        <Composition id="Escena4-Acompanamiento" component={Scene4Companion} width={W} height={H} fps={FPS} durationInFrames={SCENES.s4.to - SCENES.s4.from + OVERLAP} />
        <Composition id="Escena5-Cierre" component={Scene5Closing} width={W} height={H} fps={FPS} durationInFrames={SCENES.s5.to - SCENES.s5.from} />
        <Composition id="Hilo" component={ThreadLine} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES - (SFX_CUES.threadBorn - 6)} />
      </Folder>
    </>
  );
};
