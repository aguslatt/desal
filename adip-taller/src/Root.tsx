import React from 'react';
import {Composition} from 'remotion';
import {Taller} from './Taller';
import {Cover} from './Cover';
import {FPS, TOTAL} from './ui';

export const Root: React.FC = () => (
  <>
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  <Composition id="Taller" component={Taller} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
