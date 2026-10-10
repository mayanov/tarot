import React, { useEffect, useRef, useState } from 'react';

interface TarotIntroProps {
  isIndonesian?: boolean;
}

/**
 * A dark "presentation" band between About and Services. The section is a tall
 * scroll track with a pinned (sticky) panel; as you scroll through it the lines
 * build in one by one — heading, explanation, the lilac emphasis, then the
 * affirmations — before it releases into Services. Replaces the old marquee.
 * Reduced-motion renders it as a calm static section.
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
        background: 'linear-gradient(160deg, #39234E 0%, #241539 58%, #14112B 100%)',
      }}
    >
      <div className={`${reduce ? '' : 'sticky top-0 h-screen overflow-hidden'} flex items-center`}>
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
            className="mt-9 md:mt-10 mx-auto max-w-2xl text-cream/90 font-light text-lg md:text-xl leading-relaxed"
          >
            {isIndonesian
              ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
              : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
          </p>

          <p
            style={line(0.38, 0.62)}
            className="mt-7 font-elegant italic text-[#C9B8E8] text-xl md:text-[1.7rem] leading-snug"
          >
            {isIndonesian ? 'Bukan meramal, tapi memahami — bareng-bareng.' : 'Less fortune-telling, more figuring it out — together.'}
          </p>

          <div
            style={line(0.66, 0.9)}
            className="mt-10 md:mt-12 inline-flex flex-wrap justify-center items-center gap-x-4 gap-y-3 font-elegant italic text-cream/70 text-[1.05rem]"
          >
            {affirmations.map((w, i) => (
              <span key={w} className="inline-flex items-center gap-4">
                {i > 0 && <span aria-hidden className="not-italic text-cream/25">&middot;</span>}
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
