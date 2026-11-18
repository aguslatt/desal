import React from 'react';
import {Composition} from 'remotion';
import {Cover} from './Cover';
import {Main} from './Main';
import {FPS, TOTAL} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="Portada" component={Cover} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="PortadaVioleta" component={Cover} defaultProps={{variant: 'violeta' as const}} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition id="AdipResponde" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(TOTAL * FPS)} />
  </>
);
