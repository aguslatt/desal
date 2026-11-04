import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';

export const FPS = 30;
export const DURATION = 30 * FPS;

export const Root: React.FC = () => (
  <>
    <Composition id="Noticiero16x9" component={Main} width={1920} height={1080} fps={FPS} durationInFrames={DURATION} />
    <Composition id="Noticiero9x16" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={DURATION} />
  </>
);
