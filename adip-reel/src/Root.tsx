import React from 'react';
import {Composition, Still} from 'remotion';
import {Reel} from './Reel';
import {FPS, TOTAL} from './data';
import {Charla} from './charla/Charla';
import {FPS as CFPS, TOTAL as CTOTAL} from './charla/data';
import {Estim} from './estim/Estim';
import {Portada} from './estim/Portada';
import {FPS as EFPS, TOTAL as ETOTAL} from './estim/data';

export const Root: React.FC = () => (
  <>
    <Still id="EstimPortada" component={Portada} width={1080} height={1920} />
    <Composition id="Estimulacion" component={Estim} durationInFrames={Math.round(ETOTAL * EFPS)} fps={EFPS} width={1080} height={1920} />
    <Composition id="Charla" component={Charla} durationInFrames={Math.round(CTOTAL * CFPS)} fps={CFPS} width={1080} height={1920} />
    <Composition id="Reel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
