import React, { useEffect, useRef, useState } from 'react';
import WatercolorSky, { NIGHT, PLUM, SUNRISE } from '../Layout/WatercolorSky';

interface TarotIntroProps {
  isIndonesian?: boolean;
}

// Deterministic starfield for this section's night sky (own seed, so it's a
// different star pattern from the hero background and the painted skies elsewhere).
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const starField = (rng: () => number, count: number, rMin: number, rMax: number, oMin: number, oMax: number) =>
  Array.from({ length: count }, () => [
    +(rng() * 100).toFixed(2), +(rng() * 100).toFixed(2),
    +(rMin + rng() * (rMax - rMin)).toFixed(2), +(oMin + rng() * (oMax - oMin)).toFixed(2),
  ] as const);
const toStars = (dots: readonly (readonly [number, number, number, number])[]) =>
  dots.map(([x, y, r, o]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`).join(',');
const srng = mulberry32(20161005);
const STARS_STATIC = starField(srng, 300, 0.4, 1.1, 0.3, 0.72);
const STARS_TWINKLE_A = starField(srng, 90, 0.8, 1.5, 0.55, 0.95);
const STARS_TWINKLE_B = starField(srng, 70, 0.6, 1.1, 0.4, 0.82);

// The sky is a timelapse: three painted skies (night, dawn, sunrise) stacked and
// crossfaded by scroll, with the sun's glow rising from below and the stars going
// out — all opacity/transform, so it's compositor-cheap.
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
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const sectionRef = useRef<HTMLElement>(null);
  const dawnRef = useRef<HTMLDivElement>(null);
  const sunriseRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
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
      // the timelapse: night gives way to dawn, dawn to sunrise, the sun climbs and the
      // stars go out (continuous motion, so it never feels frozen)
      if (dawnRef.current) dawnRef.current.style.opacity = fade(p, 0.05, 0.5).toFixed(3);
      if (sunriseRef.current) sunriseRef.current.style.opacity = fade(p, 0.45, 0.92).toFixed(3);
      if (starsRef.current) starsRef.current.style.opacity = (1 - fade(p, 0.3, 0.8)).toFixed(3);
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
      className={`relative text-cream ${reduce ? 'py-24 md:py-32' : ''}`}
      style={{ height: reduce ? undefined : '200vh', background: '#05061a' }}
    >
      <div className={`${reduce ? 'relative' : 'sticky top-0 h-screen overflow-hidden'} flex items-center`}>
        {/* sky — night, with dawn and then sunrise painted over it, faded in by scroll */}
        <WatercolorSky palette={NIGHT} stars={false} className="absolute inset-0" />
        <div ref={dawnRef} aria-hidden className="absolute inset-0 will-change-[opacity]" style={{ opacity: reduce ? 1 : 0 }}>
          <WatercolorSky palette={PLUM} stars={false} className="absolute inset-0" />
        </div>
        <div ref={sunriseRef} aria-hidden className="absolute inset-0 will-change-[opacity]" style={{ opacity: 0 }}>
          <WatercolorSky palette={SUNRISE} stars={false} className="absolute inset-0" />
        </div>
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

        {/* starfield — each layer promoted to its own compositor layer so the sky
            crossfade never re-rasterizes them and twinkle stays composite-only */}
        <div ref={starsRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden will-change-[opacity]" style={{ opacity: reduce ? 0.5 : 1 }}>
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_STATIC), transform: 'translateZ(0)' }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_A), transform: 'translateZ(0)', animation: reduce ? undefined : 'skyTwinkle 4.5s ease-in-out infinite' }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_B), transform: 'translateZ(0)', animation: reduce ? undefined : 'skyTwinkle 6.5s ease-in-out 1.2s infinite' }} />
        </div>


        <div ref={stackRef} className="mx-auto px-8 relative z-10 w-full max-w-3xl text-center will-change-transform">
          <h2
            className="font-elegant font-medium text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.06] tracking-[-0.02em] [text-shadow:0_8px_50px_rgba(6,4,14,0.5)]"
          >
            {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
          </h2>

          <p
            ref={paraRef}
            style={hidden}
            className="mt-9 md:mt-10 mx-auto max-w-2xl text-cream font-light text-[0.95rem] leading-relaxed will-change-[opacity,transform]"
          >
            {isIndonesian
              ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
              : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
          </p>

          <div
            ref={affirmRef}
            style={hidden}
            className="mt-10 md:mt-12 inline-flex flex-wrap justify-center items-center gap-x-4 gap-y-3 font-hand text-cream/95 text-[1.6rem] leading-none [text-shadow:0_2px_18px_rgba(40,20,60,0.45)] will-change-[opacity,transform]"
          >
            {affirmations.map((w, i) => (
              <span key={w} className="inline-flex items-center gap-4">
                {i > 0 && <span aria-hidden className="font-elegant text-[1.05rem] text-cream/45">&middot;</span>}
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
