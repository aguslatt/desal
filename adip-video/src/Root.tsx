import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, TOTAL} from './timeline';

export const Root: React.FC = () => (
  <Composition id="AdipResponde" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(TOTAL * FPS)} />
);
