import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {FPS, TOTAL_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <Composition id="Video" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);
