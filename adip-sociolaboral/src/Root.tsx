import React from 'react';
import {Composition} from 'remotion';
import {Video as V} from './Video';
import {Fonts} from './parts';
import {Portada as P} from './Portada';
const Portada: React.FC = () => (<><Fonts /><P /></>);
const Video: React.FC = () => (<><Fonts /><V /></>);
import {FPS, TOTAL_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <>
  <Composition id="Video" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
  <Composition id="Portada" component={Portada} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
