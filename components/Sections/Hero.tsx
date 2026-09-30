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

  // The hero scrolls away at the same speed as the section below (it's pushed up
  // by it), so we don't move it here — we only softly blur it out of focus as it
  // goes, for a dreamy defocus rather than a plain scroll-off.
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
        const e = p * p * (3 - 2 * p);        // smoothstep
        const blur = Math.pow(e, 1.7) * 7;    // ramps in later, not instantly
        el.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : 'none';
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
      className="relative min-h-screen flex flex-col justify-between overflow-hidden isolate text-cream pt-24 md:pt-28 pb-8 md:pb-10"
      style={{ willChange: 'filter' }}
    >
      {/* TOP — editorial kicker */}
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12">
        <Rise delay={60}>
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.34em] text-cream/60">
            <span aria-hidden className="h-px w-8 sm:w-12 bg-moon/60" />
            <span>{isIndonesian ? 'Pembaca Tarot · Sejak 2009' : 'Tarot Reader · Since 2009'}</span>
          </div>
        </Rise>
      </div>

      {/* MIDDLE — the masthead: oversized wordmark, with the statement tucked as
          an offset caption to the right of it. */}
      <div className="relative w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 flex-1 flex flex-col justify-center py-4 md:py-6">
        <Rise delay={140} hero>
          <h1 className="font-serif font-bold uppercase leading-[0.84] tracking-[-0.03em] text-[clamp(2.7rem,min(11.5vw,14vh),10rem)] [text-shadow:0_8px_60px_rgba(6,4,14,0.5)]">
            <span className="block text-cream">Mayanov</span>
            <span className="block text-cream">Tarot</span>
          </h1>
        </Rise>

        {/* caption — offset to the right on desktop for an asymmetric, editorial feel */}
        <div className="mt-6 md:mt-8 lg:self-end w-full lg:max-w-[30rem]">
          <Rise delay={340}>
            <p className="font-elegant font-medium leading-[1.14] tracking-[-0.01em] text-[1.45rem] sm:text-[1.8rem] text-cream [text-shadow:0_4px_30px_rgba(6,4,14,0.5)]">
              {isIndonesian ? (
                <>Pandangan <span className="italic text-cream">jernih</span> untuk langkah berikutnya.</>
              ) : (
                <>A <span className="italic text-cream">clearer</span> view of what comes next.</>
              )}
            </p>
          </Rise>
          <Rise delay={460}>
            <p className="mt-4 text-[14px] md:text-[14.5px] font-light leading-relaxed text-cream/70 [text-shadow:0_1px_12px_rgba(6,4,14,0.7)]">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. An honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>
          <Rise delay={580}>
            <div className="mt-7">
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
      </div>

      {/* BOTTOM — metrics as a full-width data row: big number over a label, with
          a moonstone tick that grows and the number lifting to moon on hover. */}
      <Rise delay={680}>
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-y-5 md:gap-y-0 rounded-2xl ring-1 ring-white/20 backdrop-blur-lg px-6 py-5 md:px-4 md:py-5 shadow-[0_24px_70px_-44px_rgba(0,0,0,0.6)]"
            style={{ background: 'rgba(255,255,255,0.09)' }}
          >
            {metrics.map((m, i) => (
              <div
                key={i}
                className="group md:px-6 md:border-l md:border-white/20 md:first:border-l-0"
              >
                <div className="font-elegant font-medium tabular-nums leading-none text-cream text-[1.9rem] md:text-[2.4rem] transition-all duration-300 group-hover:text-moon group-hover:-translate-y-0.5">
                  <CountUp end={m.end} decimals={'decimals' in m ? (m as any).decimals : 0} suffix={'suffix' in m ? (m as any).suffix : ''} sep={sep} delay={i * 150} />
                </div>
                <div className="mt-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] leading-tight text-cream/60 transition-colors duration-300 group-hover:text-cream/90">
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
