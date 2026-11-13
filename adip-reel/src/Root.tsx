import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {FPS, TOTAL} from './data';
import {Charla} from './charla/Charla';
import {Chacra, FPS as XFPS, TOTAL as XTOTAL} from './chacra/Chacra';
import {FPS as CFPS, TOTAL as CTOTAL} from './charla/data';

export const Root: React.FC = () => (
  <>
    <Composition id="Chacra" component={Chacra} durationInFrames={Math.round(XTOTAL * XFPS)} fps={XFPS} width={1080} height={1920} />
    <Composition id="Charla" component={Charla} durationInFrames={Math.round(CTOTAL * CFPS)} fps={CFPS} width={1080} height={1920} />
    <Composition id="Reel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
