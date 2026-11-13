import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {FPS, TOTAL} from './data';
import {Charla} from './charla/Charla';
import {Chacra, FPS as XFPS, TOTAL as XTOTAL} from './chacra/Chacra';
import {Cine, FPS as NFPS, TOTAL as NTOTAL} from './chacra/Cine';
import {Tierno, FPS as TFPS, TOTAL as TTOTAL} from './chacra/Tierno';
import {FPS as CFPS, TOTAL as CTOTAL} from './charla/data';

export const Root: React.FC = () => (
  <>
    <Composition id="ChacraTierno" component={Tierno} durationInFrames={Math.round(TTOTAL * TFPS)} fps={TFPS} width={1080} height={1920} />
    <Composition id="ChacraCine" component={Cine} durationInFrames={Math.round(NTOTAL * NFPS)} fps={NFPS} width={1080} height={1920} />
    <Composition id="Chacra" component={Chacra} durationInFrames={Math.round(XTOTAL * XFPS)} fps={XFPS} width={1080} height={1920} />
    <Composition id="Charla" component={Charla} durationInFrames={Math.round(CTOTAL * CFPS)} fps={CFPS} width={1080} height={1920} />
    <Composition id="Reel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
