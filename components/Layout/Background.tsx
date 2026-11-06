import React, { useEffect, useRef, useState } from 'react';
import WatercolorSky, { TWILIGHT, useTallScreen } from './WatercolorSky';
import { sunsetImg, duskImg } from './Loader';

// The night sky behind the hero (and the loader, which hands off to it): the
// watercolour twilight, with no stars painted over it.
const Background: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  // (the page is still loading: index.html sets html.booting until the loader hands over)
  const tall = useTallScreen();
  const [timelapse] = useState(() => document.documentElement.classList.contains('booting') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
      <WatercolorSky palette={TWILIGHT} eager className="absolute inset-0" />
      {/* the loader's timelapse: a sunset and a dusk over the twilight (the same clouds,
          other light), which the loader thins away in turn as the page loads (data-sky);
          under the shading below, so only the sky changes; placed as WatercolorSky places
          the twilight's painting, so the clouds line up. Shown only while loading. */}
      {timelapse && (['dusk', 'sunset'] as const).map((sky) => (
        <img
          key={sky} data-sky={sky} src={sky === 'dusk' ? duskImg(tall) : sunsetImg(tall)} alt="" draggable={false}
          className="absolute -inset-[6%] w-[112%] h-[112%] max-w-none object-cover select-none"
        />
      ))}
      {/* a thin lavender veil over it, lifting the whole sky a touch (a plain overlay:
          blend modes are unreliable on iPhones) */}
      <div className="absolute inset-0" style={{ background: 'rgba(196,178,236,0.07)' }} />

      {/* legibility: a soft central pool + bottom scrim so the cream wordmark/CTA
          stay readable over the glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(68% 54% at 50% 44%, rgba(9,7,22,0.32) 0%, transparent 74%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(9,7,22,0.38) 100%)' }}
      />
    </div>
  );
};

export default Background;
