import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {FPS, TOTAL} from './data';
import {Charla} from './charla/Charla';
import {Taller} from './taller/Taller';
import {Taller2} from './taller2/Taller2';
import {Taller3} from './taller3/Taller3';
import {Taller4} from './taller4/Taller4';
import {Taller5} from './taller5/Taller5';
import {FPS as TFPS, TOTAL as TTOTAL} from './taller/data';
import {FPS as CFPS, TOTAL as CTOTAL} from './charla/data';

export const Root: React.FC = () => (
  <>
    <Composition id="Taller5" component={Taller5} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="Taller4" component={Taller4} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="Taller3" component={Taller3} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="Taller2" component={Taller2} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="Taller" component={Taller} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="Charla" component={Charla} durationInFrames={Math.round(CTOTAL * CFPS)} fps={CFPS} width={1080} height={1920} />
    <Composition id="Reel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
