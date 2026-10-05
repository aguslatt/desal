import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Cover } from "./Cover";
import { Reel } from "./Reel";
import { PhoneChat } from "./chat/PhoneChat";
import { H, W } from "./config/layout.ts";
import { FPS, SCENES, TOTAL_FRAMES } from "./config/timeline.ts";
import { Gallery } from "./illustration/Gallery";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Still id="Cover" component={Cover} width={W} height={H} />
      <Folder name="Piezas">
        {/* Chat de celular a pantalla completa (fotogramas absolutos del reel: 0 → fin de la escena 3) */}
        <Composition id="Chat" component={PhoneChat} width={W} height={H} fps={FPS} durationInFrames={SCENES.s3.from + 40} />
        {/* Galería de personajes y poses (referencia para editar) */}
        <Still id="Personajes" component={Gallery} width={W} height={H} />
      </Folder>
    </>
  );
};
