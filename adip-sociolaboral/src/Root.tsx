import React from 'react';
import {Composition} from 'remotion';
import {Video as V} from './Video';
import {Fonts} from './parts';
const Video: React.FC = () => (<><Fonts /><V /></>);
import {FPS, TOTAL_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <Composition id="Video" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);
