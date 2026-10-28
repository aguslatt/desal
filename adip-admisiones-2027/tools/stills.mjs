// uso: node tools/stills.mjs Comp t1 t2 ...  → out/st/<Comp>_<t>.png (un solo bundle, varios cuadros)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [comp, ...ts] = process.argv.slice(2);
const root = path.resolve(new URL('..', import.meta.url).pathname);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const c = await selectComposition({serveUrl, id: comp, browserExecutable});
fs.mkdirSync(path.join(root, 'out/st'), {recursive: true});
for (const t of ts) {
  const frame = Math.min(c.durationInFrames - 1, Math.round(parseFloat(t) * c.fps));
  const output = path.join(root, `out/st/${comp}_${t}.png`);
  await renderStill({composition: c, serveUrl, output, frame, browserExecutable, imageFormat: 'png'});
  console.log('ok', output);
}
