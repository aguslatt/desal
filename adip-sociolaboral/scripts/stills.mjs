import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const times = process.argv[3].split(',').map(Number);
const outDir = process.argv[2];
fs.mkdirSync(outDir, {recursive: true});
const entry = path.resolve('src/index.ts');
const bundled = await bundle({entryPoint: entry, publicDir: path.resolve('public')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({serveUrl: bundled, id: 'Video', browserExecutable});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(t * 30));
  await renderStill({composition: comp, serveUrl: bundled, frame, output: path.join(outDir, `t${String(t).padStart(5, '0')}.png`), browserExecutable, imageFormat: 'png', scale: 0.5});
}
console.log('done');
