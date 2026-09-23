import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  /** true once the app has resolved (geo check done). */
  ready?: boolean;
  isIndonesian?: boolean;
}

// A cosmic-wellness page loader: an orbit instrument draws itself in, a moonstone
// node circles the wordmark, a progress arc completes, then the whole overlay
// fades up to reveal the page. Shown until the page is ready + a graceful minimum.
const Loader: React.FC<LoaderProps> = ({ ready = false, isIndonesian = false }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 400 : 1700;              // quick but lets the line finish
  const mounted = useRef(Date.now());
  const [leaving, setLeaving] = useState(false); // start fade-out
  const [gone, setGone] = useState(false);       // unmount

  // Lock scroll while the loader is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Dismiss once ready + window fully loaded + minimum time elapsed.
  useEffect(() => {
    if (!ready) return;
    let t: number | undefined;
    const begin = () => {
      const wait = Math.max(0, MIN - (Date.now() - mounted.current));
      t = window.setTimeout(() => setLeaving(true), wait);
    };
    if (document.readyState === 'complete') begin();
    else {
      const onLoad = () => begin();
      window.addEventListener('load', onLoad, { once: true });
      // Safety net if 'load' already passed or is slow.
      t = window.setTimeout(begin, 1200);
      return () => { window.removeEventListener('load', onLoad); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [ready, MIN]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => leaving && setGone(true)}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(-2%)' : 'translateY(0)',
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ animation: reduce ? undefined : 'ldRise 0.8s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* small brand mark — the one touch of colour */}
        <span
          aria-hidden
          className="text-plum text-lg leading-none mb-6"
          style={{ animation: reduce ? undefined : 'ldGlow 2.6s ease-in-out infinite' }}
        >
          ✦
        </span>

        {/* wordmark */}
        <div className="flex items-center gap-3 text-[1.05rem] sm:text-xl font-semibold uppercase tracking-[0.34em] text-ink">
          <span>Mayanov</span>
          <span className="text-ink/40">Tarot</span>
        </div>

        {/* thin progress line */}
        <div className="mt-7 h-px w-36 overflow-hidden bg-ink/10">
          <div
            className="h-full w-full bg-ink origin-left"
            style={{ animation: `ldBar ${reduce ? '0.5s' : '1.7s'} cubic-bezier(0.4,0,0.2,1) forwards` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Loader;
