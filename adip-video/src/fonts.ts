import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
let promise: Promise<void> | null = null;
const load = () => {
  if (!promise) {
    promise = Promise.all(
      WEIGHTS.map(async (w) => {
        const f = new FontFace('Montserrat', `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}) format('woff2')`, {weight: String(w)});
        await f.load();
        (document.fonts as any).add(f);
      }),
    ).then(() => undefined);
  }
  return promise;
};
/** Layout is measured with canvas, so nothing renders until Montserrat is in. */
export const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    load().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};
