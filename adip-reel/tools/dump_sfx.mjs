// Builds the sound-effect cue list (output seconds) from src/portal/plan.ts + edl.json
import {readFileSync, writeFileSync} from 'node:fs';
import {CURSOR, SFX_CUES, STEPS} from '../src/portal/plan.ts';
const edl = JSON.parse(readFileSync(new URL('../src/portal/edl.json', import.meta.url)));
const segs = edl.segments;
const T = (s) => { for (let i = 1; i < segs.length; i++) { const g = segs[i]; if (s < g.src[0]) return g.out; if (s <= g.src[1]) return g.out + s - g.src[0]; } return edl.total; };
const cues = [];
for (const c of SFX_CUES) cues.push({t: c.out ? c.t : T(c.t), n: c.n, g: c.g});
for (const k of CURSOR) if (k.click) cues.push({t: T(k.t), n: 'click', g: 0.7});
for (const s of STEPS) cues.push({t: T(s.t0), n: 'tick', g: 0.45});
cues.sort((a, b) => a.t - b.t);
writeFileSync(process.argv[2], JSON.stringify(cues, null, 1));
console.log(cues.length, 'cues');
