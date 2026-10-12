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

// Two static sky gradients — a deep night and a lighter dusk. We crossfade with
// opacity (compositor-cheap) as the section passes through the viewport.
const GRAD_DARK = 'linear-gradient(180deg, rgb(26,15,51) 0%, rgb(17,11,40) 55%, rgb(7,5,18) 100%)';
const GRAD_LIGHT = 'linear-gradient(180deg, rgb(74,54,120) 0%, rgb(52,36,92) 55%, rgb(34,24,66) 100%)';

/**
 * A calm, starry "presentation" band between About and Services. It's a normal
 * section (no scroll pinning, so entering/leaving stays smooth): the copy fades up
 * once when it enters the viewport, and the sky brightens dark → dusk via a cheap
 * opacity crossfade as the section travels through the viewport. Reduced-motion is
 * a plain static section.
 */
const TarotIntro: React.FC<TarotIntroProps> = ({ isIndonesian = false }) => {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [shown, setShown] = useState(reduce);
  const sectionRef = useRef<HTMLElement>(null);
  const skyLightRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  // one-time fade-up when the section scrolls into view
  useEffect(() => {
    if (reduce) { setShown(true); return; }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  // sky crossfade (+ a touch of bloom drift) driven by the section's travel through
  // the viewport — opacity/transform only, no re-render, no pinning
  useEffect(() => {
    if (reduce) { if (skyLightRef.current) skyLightRef.current.style.opacity = '0.5'; return; }
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      if (skyLightRef.current) skyLightRef.current.style.opacity = p.toFixed(3);
      if (bloomRef.current) bloomRef.current.style.transform = `translateY(${(p * 50).toFixed(1)}px)`;
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

  const rise = (delay: number): React.CSSProperties =>
    reduce
      ? {}
      : {
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(20px)',
          transition: `opacity 0.9s ease ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          willChange: 'opacity, transform',
        };

  return (
    <section ref={sectionRef} id="tarot-intro" className="relative text-cream">
      <div className="relative flex items-center overflow-hidden min-h-[86vh] py-24 md:py-28">
        {/* sky — a static dark base with a lighter dusk crossfaded over it */}
        <div aria-hidden className="absolute inset-0" style={{ background: GRAD_DARK }} />
        <div
          ref={skyLightRef}
          aria-hidden
          className="absolute inset-0 will-change-[opacity]"
          style={{ background: GRAD_LIGHT, opacity: reduce ? 0.5 : 0 }}
        />

        {/* night-sky starfield — promoted to its own layer so the sky crossfade
            beneath it never forces the stars to re-rasterize */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_STATIC) }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_A), animation: reduce ? undefined : 'skyTwinkle 4.5s ease-in-out infinite' }} />
          <div className="absolute inset-0" style={{ backgroundImage: toStars(STARS_TWINKLE_B), animation: reduce ? undefined : 'skyTwinkle 6.5s ease-in-out 1.2s infinite' }} />
        </div>

        {/* soft violet bloom — depth, drifts a touch as the section passes by */}
        <div
          ref={bloomRef}
          aria-hidden
          className="pointer-events-none absolute -top-1/3 -right-1/4 w-[46rem] h-[46rem] rounded-full blur-[150px] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(122,88,190,0.34), transparent 70%)' }}
        />

        <div className="mx-auto px-8 relative z-10 w-full max-w-3xl text-center">
          <h2
            style={rise(0)}
            className="font-elegant font-medium text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.06] tracking-[-0.02em] [text-shadow:0_8px_50px_rgba(6,4,14,0.5)]"
          >
            {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
          </h2>

          <p
            style={rise(160)}
            className="mt-9 md:mt-10 mx-auto max-w-2xl text-white font-light text-lg md:text-xl leading-relaxed"
          >
            {isIndonesian
              ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
              : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
          </p>

          <div
            style={rise(300)}
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
