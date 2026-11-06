// The loader is real loading: everything the visitor will see is made ready behind it,
// so nothing is still painting or popping in once they land.
//
//  1. First the hero's own things (its fonts, its sky, the paper, the page's code). The
//     loader waits for these, then announces 'mt:loaded'.
//  2. Then the rest of the page is finished (paintsMayStart): the watercolour washes and
//     skies further down are painted into pictures (heavy: on a phone each holds the
//     main thread for a moment, so they wait until the hero's own work is done), and
//     the remaining photos are fetched. Each is counted (trackPaint); the loader keeps
//     drawing until they're all in (paintsSettled) and only then hands over.
//  3. afterIntro: the hand-over itself is over and the page is free to scroll
//     ('mt:unlocked'). Pages without the loader let go of both after a while anyway.

let started = false;
const startWaiting: (() => void)[] = [];
const start = () => {
  if (started) return;
  started = true;
  startWaiting.splice(0).forEach((r) => r());
};

let done = false;
const waiting: (() => void)[] = [];
const release = () => {
  if (done) return;
  done = true;
  start();
  waiting.splice(0).forEach((r) => r());
};

if (typeof window !== 'undefined') {
  window.addEventListener('mt:loaded', start, { once: true });
  window.addEventListener('mt:unlocked', release, { once: true });
  window.setTimeout(release, 12000);
}

/** resolves once the hero's own things are ready: the rest of the page may be finished now */
export const paintsMayStart = (): Promise<void> =>
  started ? Promise.resolve() : new Promise((r) => { startWaiting.push(r); });

/** resolves once the intro (loader + hero entrance) is over */
export const afterIntro = (): Promise<void> =>
  done ? Promise.resolve() : new Promise((r) => { waiting.push(r); });

// ---- the rest of the page's paints, counted so the loader can wait for them ----
let pending = 0;
let total = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** counts a paint (or a photo) the loader should wait for */
export function trackPaint<T>(p: Promise<T>): Promise<T> {
  pending++; total++;
  notify();
  const settle = () => { pending--; notify(); };
  p.then(settle, settle);
  return p;
}

/** how far the rest of the page has got, 0–1 */
export const paintProgress = () => (total ? (total - pending) / total : 0);

/** resolves once every counted paint is done and nothing new has come in for a moment
    (sections register theirs as they mount), or after `maxMs` at the latest */
export const paintsSettled = (maxMs: number): Promise<void> => new Promise((resolve) => {
  let quiet = 0;
  const finish = () => { clearTimeout(quiet); clearTimeout(cap); listeners.delete(check); resolve(); };
  const check = () => {
    clearTimeout(quiet);
    if (pending === 0) quiet = window.setTimeout(finish, 500);
  };
  const cap = window.setTimeout(finish, maxMs);
  listeners.add(check);
  check();
});
