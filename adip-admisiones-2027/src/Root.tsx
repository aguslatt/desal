import React from 'react';
import {Composition} from 'remotion';
import {Ad} from './Ad';
import {FPS, H, W} from './tokens';
import main from './timelines/main.json';
import hookB from './timelines/hookB.json';
import hookC from './timelines/hookC.json';
import cut15 from './timelines/cut15.json';
import type {Timeline} from './types';

const defs: [string, Timeline][] = [
  ['Principal', main as Timeline],
  ['GanchoB', hookB as Timeline],
  ['GanchoC', hookC as Timeline],
  ['Corto15', cut15 as Timeline],
];

export const Root: React.FC = () => (
  <>
    {defs.map(([id, tl]) => (
      <Composition key={id} id={id} component={Ad} durationInFrames={tl.totalFrames} fps={FPS} width={W} height={H} defaultProps={{tl}} />
    ))}
  </>
);
