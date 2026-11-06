// Paints the watercolour skies (components/Layout/WatercolorSky.tsx) once, in Chrome,
// and saves them as public/skies/<name>.webp, so a visitor's phone shows the finished
// picture instead of working the painting out itself. Run again after changing a sky:
//   node scripts/bake-skies.mjs
// Needs Google Chrome and Python with Pillow (for the WebP).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// only the hero's: the loader waits on it (the others are painted later, when the phone's
// idle, and as pictures they'd add ~1.5 MB to download at full quality)
const SKIES = ['TWILIGHT'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skies-'));
const entry = path.resolve('scripts/.sky-bundle.mjs'); // (in the project, so it finds React)
await build({
  entryPoints: ['components/Layout/WatercolorSky.tsx'], bundle: true, format: 'esm', platform: 'node',
  outfile: entry, external: ['react'], jsx: 'automatic', define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'error',
});
const sky = await import(pathToFileURL(entry).href);
fs.mkdirSync('public/skies', { recursive: true });
for (const name of SKIES) {
  const html = path.join(tmp, `${name}.html`);
  const png = path.join(tmp, `${name}.png`);
  // drawn at the size the page paints it (1600×640 at 1.5×), as the page does
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;background:#000"><img src="${sky.paintSvg(sky[name])}" width="1600" height="640" style="display:block"></body></html>`);
  execFileSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1.5', '--window-size=1600,640', '--virtual-time-budget=5000', `--screenshot=${png}`, pathToFileURL(html).href], { stdio: 'ignore' });
  const out = `public/skies/${name.toLowerCase()}.webp`;
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=90, method=6)', png, out]);
  console.log(out, Math.round(fs.statSync(out).size / 1024) + ' KB');
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(entry, { force: true });
