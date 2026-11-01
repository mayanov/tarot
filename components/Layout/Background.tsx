import React, { useEffect, useRef } from 'react';
import WatercolorSky, { TWILIGHT } from './WatercolorSky';

// The night sky behind the hero (and the loader, which hands off to it): the
// watercolour twilight, with no stars painted over it.
const Background: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  // Freeze the sky's slow drift once it leaves the viewport — it's only visible at
  // the hero, so animating it while scrolled past is pure, continuous GPU cost.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => root.classList.toggle('sky-paused', !e.isIntersecting),
      { rootMargin: '120px' }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* the sky itself, painted in watercolour (blue up the left, a violet heart, a
          rose bloom upper-right, teal lower-right), drifting very slowly */}
      <WatercolorSky palette={TWILIGHT} stars={false} className="absolute inset-0" />

      {/* legibility: a soft central pool + bottom scrim so the cream wordmark/CTA
          stay readable over the glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(68% 54% at 50% 44%, rgba(9,7,22,0.44) 0%, transparent 74%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(9,7,22,0.5) 100%)' }}
      />
    </div>
  );
};

export default Background;
