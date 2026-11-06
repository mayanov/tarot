import React, { useEffect, useRef, useState } from 'react';
import WatercolorSky, { NIGHT, PLUM, SUNRISE } from '../Layout/WatercolorSky';
import { touchScreen } from '../UI/scroll';

interface TarotIntroProps {
  isIndonesian?: boolean;
}


// The sky is a timelapse: three painted skies (night, dawn, sunrise) stacked and
// crossfaded by scroll, with the sun's glow rising from below
// — all opacity/transform, so it's compositor-cheap.
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const smoothstep = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
const fade = (p: number, a: number, b: number) => smoothstep((p - a) / (b - a));

/**
 * A scroll-pinned "presentation" band between About and Services. The section is a
 * tall track with a sticky panel over a painted sky; while pinned, the sky runs a
 * sunrise timelapse (night → dawn → sunrise) and the lines build in — and the whole stack drifts gently the whole
 * way, so scrolling always shows motion instead of feeling frozen. All scroll work is
 * imperative on refs (no per-frame re-render) and uses opacity/transform only, so it
 * stays smooth. Reduced-motion collapses it to a calm static section.
 */
const TarotIntro: React.FC<TarotIntroProps> = ({ isIndonesian = false }) => {
  // On a phone it's the calm, unpinned version too: the pinned panel was sized to the
  // screen with the address bar showing, so a black strip opened under it once the bar
  // hid, and three stacked skies redrawn by a scroll listener lagged behind the finger
  // (blank black frames while the phone caught up).
  const [reduce] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || touchScreen())
  );
  const sectionRef = useRef<HTMLElement>(null);
  const dawnRef = useRef<HTMLDivElement>(null);
  const sunriseRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const affirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const reveal = (el: HTMLElement | null, p: number, start: number, end: number, baseY: number) => {
      if (!el) return;
      const eased = smoothstep((p - start) / (end - start));
      el.style.opacity = String(eased);
      el.style.transform = `translateY(${((1 - eased) * baseY).toFixed(1)}px)`;
    };
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight; // pinned range
      const p = total > 0 ? clamp01(-el.getBoundingClientRect().top / total) : 0;
      // the timelapse: night gives way to dawn, dawn to sunrise, the sun climbs
      // (continuous motion, so it never feels frozen)
      if (dawnRef.current) dawnRef.current.style.opacity = fade(p, 0.05, 0.5).toFixed(3);
      if (sunriseRef.current) sunriseRef.current.style.opacity = fade(p, 0.45, 0.92).toFixed(3);
      if (sunRef.current) {
        const s = fade(p, 0.2, 1);
        sunRef.current.style.opacity = s.toFixed(3);
        sunRef.current.style.transform = `translate3d(0, ${((1 - s) * 40).toFixed(1)}%, 0)`;
      }
      // the whole stack drifts up gently across the pin (bloom stays put — moving a
      // 150px-blur layer each frame re-rasterizes the blur and causes scroll jank)
      if (stackRef.current) stackRef.current.style.transform = `translateY(${(18 - p * 44).toFixed(1)}px)`;
      // lines build in across the middle of the track
      reveal(paraRef.current, p, 0.1, 0.42, 26);
      reveal(affirmRef.current, p, 0.46, 0.78, 22);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const affirmations = isIndonesian
    ? ['Datang apa adanya', 'Tanpa tekanan', 'Tanpa dihakimi', 'Rahasia terjaga']
    : ['Come as you are', 'No pressure', 'No judgment', 'Kept between us'];

  const hidden = reduce ? undefined : { opacity: 0 };

  return (
    <section
      ref={sectionRef}
      id="tarot-intro"
      className="relative text-cream"
      style={{ height: reduce ? undefined : '200vh', background: '#05061a' }}
    >
      {/* (unpinned, the padding is inside the sky's box, so the sky fills the whole section: on the
          section itself it showed as dark bands above and below) */}
      <div className={`${reduce ? 'relative overflow-hidden py-24 md:py-32' : 'sticky top-0 h-screen h-[100svh] overflow-hidden'} flex items-center`}>
        {/* sky — night, with dawn and then sunrise painted over it, faded in by scroll */}
        {/* (standing still, only the dawn shows: the night under it and the sunrise
            over it, unseen, aren't painted at all) */}
        {!reduce && <WatercolorSky palette={NIGHT} className="absolute inset-0" />}
        <div ref={dawnRef} aria-hidden className="absolute inset-0 will-change-[opacity]" style={{ opacity: reduce ? 1 : 0 }}>
          <WatercolorSky palette={PLUM} className="absolute inset-0" />
        </div>
        {!reduce && (
          <div ref={sunriseRef} aria-hidden className="absolute inset-0 will-change-[opacity]" style={{ opacity: 0 }}>
            <WatercolorSky palette={SUNRISE} className="absolute inset-0" />
          </div>
        )}
        {/* the sun's glow, rising from below the bottom edge */}
        <div
          ref={sunRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] will-change-[opacity,transform]"
          style={{
            opacity: reduce ? 0.4 : 0,
            background: 'radial-gradient(55% 60% at 50% 100%, rgba(255,230,180,0.55) 0%, rgba(255,190,150,0.25) 38%, transparent 72%)',
          }}
        />
        {/* a soft shade behind the words, so cream text holds on the brightest sky */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 45% at 50% 48%, rgba(24,14,48,0.32), transparent 75%)' }} />



        <div ref={stackRef} className="mx-auto px-8 relative z-10 w-full max-w-3xl text-center will-change-transform">
          <h2
            className="letterpress-lg pb-[0.14em] -mb-[0.14em] font-elegant font-medium text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.06] tracking-[-0.02em]"
          >
            {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
          </h2>

          <p
            ref={paraRef}
            style={hidden}
            className="letterpress on-dark mt-9 md:mt-10 mx-auto max-w-[36rem] font-elegant text-cream text-lg md:text-[1.35rem] leading-[1.5] will-change-[opacity,transform]"
          >
            {isIndonesian
              ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
              : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
          </p>

          {/* the promises, pencilled by hand like the card hint above the pricelist (the
              pencil face is subset in index.html: add letters there if these change) */}
          <div
            ref={affirmRef}
            style={hidden}
            className="mt-10 md:mt-12 mx-auto grid w-fit grid-cols-[auto_auto] justify-items-center gap-x-6 gap-y-3.5 sm:inline-flex sm:flex-wrap sm:justify-center sm:items-center sm:gap-x-4 sm:gap-y-3 -rotate-1 font-['Reenie_Beanie',cursive] text-cream/90 text-[1.4rem] sm:text-[1.6rem] md:text-[1.8rem] leading-none [filter:url(#pencil-icon)] will-change-[opacity,transform]"
          >
            {affirmations.map((w, i) => (
              <span key={w} className="inline-flex items-center gap-4 whitespace-nowrap">
                {/* phones: a 2×2 block with no dots (a wrapped row of dotted words breaks
                    unevenly there); wider screens: one dotted line */}
                {i > 0 && <span aria-hidden className="hidden sm:inline font-elegant text-[1.05rem] text-cream/45">&middot;</span>}
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TarotIntro;
