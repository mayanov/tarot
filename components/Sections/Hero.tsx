import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Plays the hero count-up only the first time it mounts, never again on re-render.
let heroStatsPlayed = false;

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Parallax: as the page scrolls up over the pinned hero, drift the hero content
  // up (and fade it) so it feels like it's being pushed up, not just covered.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = window.innerHeight || 1;
        const p = Math.min(Math.max(window.scrollY / h, 0), 1);
        const e = p * p * (3 - 2 * p); // smoothstep — holds, then eases away
        // drift up + gently recede (scale down) so it settles into the distance
        // as the section below rises over it, rather than just dimming.
        el.style.transform = `translate3d(0, ${(-e * 108).toFixed(1)}px, 0) scale(${(1 - e * 0.055).toFixed(3)})`;
        el.style.opacity = (1 - e * 0.95).toFixed(3);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Hold the entrance until the loader's aperture opens, so the hero animates
  // INTO the reveal instead of being already static behind it. Falls back to a
  // timer in case the reveal event is missed (e.g. no loader / hot reload).
  useEffect(() => {
    let done = false;
    const play = () => { if (!done) { done = true; setShown(true); } };
    window.addEventListener('mt:reveal', play, { once: true });
    const t = window.setTimeout(play, 5000);
    return () => { window.removeEventListener('mt:reveal', play); clearTimeout(t); };
  }, []);

  // Soft fade-and-rise for each piece — opacity + transform only, so it's fully
  // GPU-composited and stays smooth. `hero` gives the big title an extra scale
  // "settle" so it blooms up in sync with the loader dissolve.
  const Rise: React.FC<{ children: React.ReactNode; delay?: number; className?: string; hero?: boolean }> = ({ children, delay = 0, className = '', hero = false }) => (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0) scale(1)' : `translateY(${hero ? 16 : 22}px) scale(${hero ? 0.95 : 1})`,
        transition: `opacity ${hero ? 1.2 : 1}s ease ${delay}ms, transform ${hero ? 1.4 : 1.1}s ${EASE} ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );

  // Count-up: animates from 0 on first load, then holds the final value.
  const CountUp: React.FC<{ end: number; decimals?: number; suffix?: string; sep: string; delay?: number }> = ({ end, decimals = 0, suffix = '', sep, delay = 0 }) => {
    const [val, setVal] = useState(heroStatsPlayed ? end : 0);
    useEffect(() => {
      if (!shown || heroStatsPlayed) return;
      let raf = 0;
      const dur = 1600;
      const t0 = performance.now() + delay;
      const tick = (now: number) => {
        const t = Math.min(Math.max((now - t0) / dur, 0), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(end * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else heroStatsPlayed = true;
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [shown]);
    const text = decimals > 0
      ? val.toFixed(decimals)
      : Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return <>{text}{suffix}</>;
  };

  const sep = isIndonesian ? '.' : ',';
  const metrics = isIndonesian
    ? [
        { end: 1500, suffix: '+', label: 'Orang Terbantu' },
        { end: 3200, suffix: '+', label: 'Jam Sesi' },
        { end: 7700, suffix: '+', label: 'Total Sesi' },
        { end: 5, decimals: 1, label: 'Rating Google' },
      ]
    : [
        { end: 1500, suffix: '+', label: 'People Helped' },
        { end: 3200, suffix: '+', label: 'Hours Guided' },
        { end: 7700, suffix: '+', label: 'Sessions Done' },
        { end: 5, decimals: 1, label: 'Google Rating' },
      ];

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden isolate text-cream"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Brand-led hero — MAYANOV TAROT is the clear #1 (right, over the orbit);
          the statement is a smaller supporting subhead + CTA on the left. */}
      <div className="relative flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-32 pb-12">
        {/* LEFT — supporting subhead + copy + single CTA */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <Rise delay={320}>
            <p className="font-elegant font-medium leading-[1.12] tracking-[-0.01em] text-[1.6rem] sm:text-[1.95rem] lg:text-[2.1rem] text-cream [text-shadow:0_4px_30px_rgba(6,4,14,0.5)]">
              {isIndonesian ? (
                <>Pandangan <span className="italic text-moon">jernih</span> untuk langkah berikutnya.</>
              ) : (
                <>A <span className="italic text-moon">clearer</span> view of what comes next.</>
              )}
            </p>
          </Rise>

          <Rise delay={440}>
            <p className="mt-5 text-[14.5px] md:text-[15px] font-light leading-relaxed max-w-md text-cream/70 [text-shadow:0_1px_12px_rgba(6,4,14,0.7)]">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. An honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>

          <Rise delay={560}>
            <div className="mt-8">
              <a
                href="#services"
                onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                className="group inline-flex items-center gap-3 rounded-lg bg-cream text-ink px-7 py-3.5 text-sm font-semibold hover:bg-plum hover:text-cream transition-colors duration-300"
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </Rise>
        </div>

        {/* RIGHT — dominant brand title anchored over the orbit motif (the #1) */}
        <div className="relative lg:col-span-7 order-1 lg:order-2 flex items-center justify-center min-h-[42vh] lg:min-h-[66vh]">
          {/* moonstone glow that blooms in behind the title with the reveal */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          >
            <div
              style={{
                width: '82%',
                height: '82%',
                opacity: shown ? 1 : 0,
                transform: shown ? 'scale(1)' : 'scale(0.55)',
                transition: `opacity 1.6s ease 160ms, transform 1.8s ${EASE} 160ms`,
                background: 'radial-gradient(50% 50% at 50% 50%, rgba(198,178,228,0.24) 0%, rgba(198,178,228,0.08) 42%, transparent 70%)',
                filter: 'blur(6px)',
              }}
            />
          </div>
          <Rise delay={80} hero className="relative">
            <h1 className="font-serif font-bold uppercase leading-[0.9] tracking-[-0.01em] text-center text-[3.6rem] sm:text-[5rem] lg:text-[5.6rem] xl:text-[6.6rem] [text-shadow:0_6px_50px_rgba(6,4,14,0.55)]">
              <span className="block text-cream">Mayanov</span>
              <span className="block text-moon">Tarot</span>
            </h1>
          </Rise>
        </div>
      </div>

      {/* Stats — a quiet, left-aligned strip on a moonstone hairline */}
      <Rise delay={620}>
        <div className="relative w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 pb-11 md:pb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 pt-6 border-t border-moon/25 max-w-3xl">
            {metrics.map((m, i) => (
              <div key={i} className="text-left">
                <div className="font-elegant font-medium text-2xl md:text-[1.9rem] tabular-nums text-cream">
                  <CountUp end={m.end} decimals={'decimals' in m ? (m as any).decimals : 0} suffix={'suffix' in m ? (m as any).suffix : ''} sep={sep} delay={i * 150} />
                </div>
                <div className="mt-1.5 text-[9px] md:text-[10px] uppercase tracking-[0.2em] leading-tight text-cream/45">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Rise>
    </section>
  );
};

export default Hero;
