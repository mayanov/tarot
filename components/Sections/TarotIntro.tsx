import React, { useEffect, useRef, useState } from 'react';

interface TarotIntroProps {
  isIndonesian?: boolean;
}

// Deterministic starfield for this section's night sky (own seed, so it's a
// different star pattern from the hero background and the footer's photo sky).
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

// Scroll-driven sky: interpolate from deep night (progress 0) to a lighter dusk
// (progress 1), so the panel brightens as you scroll through it.
const SKY_LIGHT = [[74, 54, 120], [52, 36, 92], [34, 24, 66]];  // top, mid, bottom
const SKY_DARK = [[26, 15, 51], [17, 11, 40], [7, 5, 18]];
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
const skyGradient = (p: number) =>
  `linear-gradient(180deg, ${mix(SKY_DARK[0], SKY_LIGHT[0], p)} 0%, ${mix(SKY_DARK[1], SKY_LIGHT[1], p)} 55%, ${mix(SKY_DARK[2], SKY_LIGHT[2], p)} 100%)`;

/**
 * A dark "presentation" band between About and Services. The section is a tall
 * scroll track with a pinned (sticky) panel over a starry night sky; as you
 * scroll through it the lines build in one by one. Reduced-motion renders it as a
 * calm static section.
 */
const TarotIntro: React.FC<TarotIntroProps> = ({ isIndonesian = false }) => {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const sectionRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(reduce ? 1 : 0); // scroll progress through the track, 0..1

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh; // pinned range
      const scrolled = -el.getBoundingClientRect().top;
      setP(total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0);
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

  // reveal a line over a slice of the scroll progress (opacity + a gentle rise)
  const line = (start: number, end: number): React.CSSProperties => {
    if (reduce) return { opacity: 1 };
    const t = Math.min(Math.max((p - start) / (end - start), 0), 1);
    const eased = t * t * (3 - 2 * t); // smoothstep
    return {
      opacity: eased,
      transform: `translateY(${((1 - eased) * 26).toFixed(1)}px)`,
      willChange: 'opacity, transform',
    };
  };

  const affirmations = isIndonesian
    ? ['Datang apa adanya', 'Tanpa tekanan', 'Tanpa dihakimi', 'Rahasia terjaga']
    : ['Come as you are', 'No pressure', 'No judgment', 'Kept between us'];

  return (
    <section
      ref={sectionRef}
      id="tarot-intro"
      className={`relative text-cream ${reduce ? 'py-24 md:py-32' : ''}`}
      style={{
        height: reduce ? undefined : '240vh',
        background: 'rgb(7,5,18)',
      }}
    >
      <div
        className={`${reduce ? 'relative' : 'sticky top-0 h-screen overflow-hidden'} flex items-center`}
        style={{ background: reduce ? skyGradient(0.5) : skyGradient(p) }}
      >
        {/* night-sky starfield — a different pattern from the hero/footer skies */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_STATIC) }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_A), animation: reduce ? undefined : 'skyTwinkle 4.5s ease-in-out infinite' }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_B), animation: reduce ? undefined : 'skyTwinkle 6.5s ease-in-out 1.2s infinite' }} />
        </div>

        {/* soft violet bloom — depth, drifts a touch with progress */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/3 -right-1/4 w-[46rem] h-[46rem] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(122,88,190,0.34), transparent 70%)',
            transform: reduce ? undefined : `translateY(${(p * 60).toFixed(1)}px)`,
          }}
        />

        <div className="mx-auto px-8 relative z-10 w-full max-w-3xl text-center">
          <h2
            className="font-elegant font-medium text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.06] tracking-[-0.02em] [text-shadow:0_8px_50px_rgba(6,4,14,0.5)]"
          >
            {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
          </h2>

          <p
            style={line(0.06, 0.34)}
            className="mt-9 md:mt-10 mx-auto max-w-2xl text-white font-light text-lg md:text-xl leading-relaxed"
          >
            {isIndonesian
              ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
              : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
          </p>

          <div
            style={line(0.4, 0.72)}
            className="mt-10 md:mt-12 inline-flex flex-wrap justify-center items-center gap-x-4 gap-y-3 font-elegant italic text-[#C9B8E8] text-[1.05rem]"
          >
            {affirmations.map((w, i) => (
              <span key={w} className="inline-flex items-center gap-4">
                {i > 0 && <span aria-hidden className="not-italic text-[#C9B8E8]/40">&middot;</span>}
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
