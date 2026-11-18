// usage: node scripts/stills.mjs 0.5 3.9 7.2 ...   -> out/st/s_<t>.jpg (bundles once)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'fs';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)[0];
const serveUrl = await bundle({entryPoint: 'src/index.ts'});
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: 'AdipResponde', puppeteerInstance: browser});
fs.mkdirSync('out/st', {recursive: true});
for (const t of process.argv.slice(2)) {
  await renderStill({composition, serveUrl, puppeteerInstance: browser, frame: Math.round(Number(t) * 30), output: `out/st/s_${t}.jpg`, imageFormat: 'jpeg', jpegQuality: 85});
}
await browser.close({silent: true});
process.exit(0);
