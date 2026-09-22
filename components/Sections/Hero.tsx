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
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(120vw,660px)] aspect-square opacity-[0.5] lg:opacity-[0.7]"
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
                className="group inline-flex items-center gap-2.5 rounded-full bg-moon text-plum-deep pl-7 pr-5 py-3.5 text-sm font-semibold hover:bg-moon-bright hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_0_1px_rgba(219,205,242,0.35),0_20px_50px_-18px_rgba(198,178,228,0.7)]"
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                <span className="grid place-items-center w-7 h-7 rounded-full bg-plum-deep/15 group-hover:bg-plum-deep/25 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            </div>
          </Rise>
        </div>

        {/* RIGHT — dominant brand title anchored over the orbit motif (the #1) */}
        <div className="relative lg:col-span-7 order-1 lg:order-2 flex items-center justify-center min-h-[42vh] lg:min-h-[66vh]">
          <OrbitField />
          <Rise delay={80} className="relative">
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
