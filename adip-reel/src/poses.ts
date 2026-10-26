import {writeFileSync} from 'fs';
import {windowAt} from './pose';
import {BASE_FRAMES, FPS} from './data';

const out: number[][] = [];
for (let f = 0; f < BASE_FRAMES; f++) {
  const w = windowAt(f / FPS);
  out.push([w.left, w.top, w.W, w.H, w.b]);
}
writeFileSync(process.argv[2], JSON.stringify(out));
console.log('frames', out.length);
