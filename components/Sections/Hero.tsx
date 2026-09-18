import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Plays the hero count-up only the first time it mounts, never again on re-render.
let heroStatsPlayed = false;

// A faint celestial instrument — concentric orbit rings with drifting moonstone
// nodes. The site's signature motif: astral line-work, not decoration. Offset to
// the right on desktop so the composition reads editorial (Co-Star), not centred.
const OrbitField: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translateY(${(window.scrollY * 0.08).toFixed(1)}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(135vw,820px)] aspect-square opacity-[0.4] lg:opacity-[0.6] lg:left-auto lg:right-[-10%] lg:translate-x-0"
      style={{
        maskImage: 'radial-gradient(closest-side, #000 58%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(closest-side, #000 58%, transparent 85%)',
      }}
    >
      <svg viewBox="0 0 600 600" className="w-full h-full" fill="none">
        <circle cx="300" cy="300" r="150" fill="url(#moonGlow)" />
        <g stroke="#C6B2E4" strokeWidth="0.6">
          <circle cx="300" cy="300" r="120" opacity="0.55" />
          <ellipse cx="300" cy="300" rx="188" ry="120" opacity="0.4" className="origin-center animate-[spin_38s_linear_infinite]" style={{ transformBox: 'fill-box' }} />
          <ellipse cx="300" cy="300" rx="120" ry="230" opacity="0.28" />
          <circle cx="300" cy="300" r="262" opacity="0.16" strokeDasharray="2 7" />
        </g>
        <g className="origin-center animate-[spin_46s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
          <circle cx="300" cy="180" r="3.4" fill="#DBCDF2" />
          <circle cx="300" cy="180" r="8" fill="#C6B2E4" opacity="0.28" />
        </g>
        <g className="origin-center animate-[spin-reverse_60s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
          <circle cx="488" cy="300" r="2.4" fill="#DBCDF2" opacity="0.9" />
        </g>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DBCDF2" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#C6B2E4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#C6B2E4" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Soft fade-and-rise for each piece.
  const Rise: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 1s ease ${delay}ms, transform 1.1s ${EASE} ${delay}ms`,
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
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden isolate text-cream"
    >
      <OrbitField />

      {/* Left-aligned editorial composition (Othership / Co-Star), not centred */}
      <div className="relative flex-1 w-full max-w-[1240px] mx-auto px-6 sm:px-10 grid lg:grid-cols-12 gap-8 items-center pt-32 pb-12">
        <div className="lg:col-span-7 xl:col-span-6">
          {/* brand wordmark as a tracked kicker */}
          <Rise delay={80}>
            <div className="flex items-center gap-4">
              <span className="h-px w-8 bg-moon/60" />
              <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.42em] text-moon font-semibold">
                Mayanov Tarot
              </span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.32em] text-cream/45">
              {isIndonesian ? 'Tarot Analitis · Sejak 2009' : 'Analytical Tarot · Since 2009'}
            </p>
          </Rise>

          {/* the statement headline — serif, mixed case, one lilac accent */}
          <Rise delay={220}>
            <h1 className="mt-8 font-elegant font-medium leading-[1.02] tracking-[-0.02em] text-[2.9rem] sm:text-[4rem] lg:text-[4.7rem] [text-shadow:0_6px_44px_rgba(6,4,14,0.5)]">
              {isIndonesian ? (
                <>Pandangan <span className="italic text-moon">jernih</span><br />untuk langkah berikutnya.</>
              ) : (
                <>A <span className="italic text-moon">clearer</span> view<br />of what comes next.</>
              )}
            </h1>
          </Rise>

          <Rise delay={360}>
            <p className="mt-7 text-[15px] md:text-base font-light leading-relaxed max-w-xl text-cream/75 [text-shadow:0_1px_12px_rgba(6,4,14,0.7)]">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>

          <Rise delay={480}>
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href="#services"
                onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                className="group inline-flex items-center gap-2.5 rounded-full bg-moon text-plum-deep pl-7 pr-5 py-3.5 text-sm font-semibold hover:bg-moon-bright hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_0_1px_rgba(219,205,242,0.35),0_20px_50px_-18px_rgba(198,178,228,0.7)]"
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                <span className="grid place-items-center w-7 h-7 rounded-full bg-plum-deep/15 group-hover:bg-plum-deep/25 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
              <a
                href="#about"
                onClick={(e) => { e.preventDefault(); smoothScrollToId('about', 80); }}
                className="text-sm font-medium text-cream/70 hover:text-cream underline-offset-[6px] hover:underline decoration-moon/60 transition-colors"
              >
                {isIndonesian ? 'Kenali Mayanov' : 'Meet Mayanov'}
              </a>
            </div>
          </Rise>
        </div>
      </div>

      {/* Stats — a quiet, left-aligned strip on a moonstone hairline */}
      <Rise delay={620}>
        <div className="relative w-full max-w-[1240px] mx-auto px-6 sm:px-10 pb-11 md:pb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 pt-6 border-t border-moon/20 max-w-3xl">
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
