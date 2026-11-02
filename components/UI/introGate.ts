// Heavy one-off paints (the watercolour skies further down the page, the baked
// washes) wait until the loader has handed over and the page is free to scroll
// ('mt:unlocked', Loader), so none of them lands on the loader's drawing or the hero's
// entrance: on a phone each one holds the main thread for a few hundred ms, which is
// what made the loading stutter. Pages without the loader let go after a while anyway.

let done = false;
const waiting: (() => void)[] = [];
const release = () => {
  if (done) return;
  done = true;
  waiting.splice(0).forEach((r) => r());
};

if (typeof window !== 'undefined') {
  window.addEventListener('mt:unlocked', release, { once: true });
  window.setTimeout(release, 12000);
}

/** resolves once the intro (loader + hero entrance) is over */
export const afterIntro = (): Promise<void> =>
  done ? Promise.resolve() : new Promise((r) => { waiting.push(r); });
