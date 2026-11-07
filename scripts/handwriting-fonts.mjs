// The two handwriting faces, served from the site (public/fonts) instead of from Google:
// no extra connections to Google on a slow phone. Each is cut down to just the letters
// the site writes in it, so it stays a few KB.
//
// Run it after adding letters below (a new reviewer's name, a changed pencil note):
//   node scripts/handwriting-fonts.mjs
// It fetches the cut-down faces from Google Fonts, saves them under a name that changes
// with their content (so a year-long cache never serves an old one) and points
// index.css's @font-face rules and index.html's preloads at them.
import fs from 'node:fs';
import crypto from 'node:crypto';

const FACES = [
  {
    // the signature under the About quote and the reviewers' names
    family: 'Mrs Saint Delafield',
    slug: 'mrs-saint-delafield',
    letters: ' .ABCDEFGHKLMNOPRSTVYacdeghiklmnorstuvyz',
  },
  {
    // pencil notes in the margin ("tap a card to draw it"), the interlude's pencilled
    // topics and numbers, the promises under "Ruang tenang"
    family: 'Reenie Beanie',
    slug: 'reenie-beanie',
    letters: ' &CDKNRTabcdefghijklmnoprstuvwxy',
  },
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
let css = fs.readFileSync('index.css', 'utf8');
let html = fs.readFileSync('index.html', 'utf8');

for (const f of FACES) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family).replace(/%20/g, '+')}&text=${encodeURIComponent(f.letters)}&display=swap`;
  const sheet = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const src = sheet.match(/url\((https:[^)]+)\)/)?.[1];
  const range = sheet.match(/unicode-range:\s*([^;]+);/)?.[1];
  if (!src || !range) throw new Error(`no font in Google's answer for ${f.family}`);
  const font = Buffer.from(await (await fetch(src)).arrayBuffer());
  const hash = crypto.createHash('sha1').update(font).digest('hex').slice(0, 8);
  const file = `${f.slug}-${hash}.woff2`;
  for (const old of fs.readdirSync('public/fonts')) if (old.startsWith(`${f.slug}-`) && old !== file) fs.unlinkSync(`public/fonts/${old}`);
  fs.writeFileSync(`public/fonts/${file}`, font);

  const rule = `@font-face { font-family: '${f.family}'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/${file}') format('woff2'); unicode-range: ${range}; }`;
  const ruleRe = new RegExp(`@font-face \\{ font-family: '${f.family}';[^\\n]*\\}`);
  if (!ruleRe.test(css)) throw new Error(`index.css has no @font-face line for ${f.family}`);
  css = css.replace(ruleRe, rule);
  const preRe = new RegExp(`href="/fonts/${f.slug}-[0-9a-f]+\\.woff2"`);
  if (!preRe.test(html)) throw new Error(`index.html has no preload for ${f.family}`);
  html = html.replace(preRe, `href="/fonts/${file}"`);
  console.log(`${f.family}: public/fonts/${file} (${font.length} bytes)`);
}
fs.writeFileSync('index.css', css);
fs.writeFileSync('index.html', html);
