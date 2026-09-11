import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Film grain — tactile texture that makes the whole hero feel "printed", not digital-default.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E\")";

// Plays the hero count-up only the first time it mounts, never again on re-render.
let heroStatsPlayed = false;

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll-linked: content lifts + fades as you leave the hero.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${(p * 60).toFixed(1)}px, 0)`;
        contentRef.current.style.opacity = String(1 - p * 0.9);
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  // A single line that rises out from behind a mask.
  const MaskLine: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
    <span className="block overflow-hidden pb-[0.09em]">
      <span
        className="block will-change-transform"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(115%)',
          transition: `transform 1.1s ${EASE} ${delay}ms`,
        }}
      >
        {children}
      </span>
    </span>
  );

  // Soft fade-and-rise for the surrounding bits.
  const Rise: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(26px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );

  // Magnetic wrapper — element drifts toward the cursor, springs back on leave.
  const Magnetic: React.FC<{ children: React.ReactNode; strength?: number; className?: string }> = ({ children, strength = 0.32, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const onMove = (e: React.MouseEvent) => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(y * strength).toFixed(1)}px)`;
    };
    const onLeave = () => { if (ref.current) ref.current.style.transform = 'translate(0, 0)'; };
    return (
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`inline-block transition-transform duration-300 ease-out will-change-transform ${className}`}>
        {children}
      </div>
    );
  };

  // Count-up: animates from 0 on the first load, then shows the final value forever after.
  const CountUp: React.FC<{ end: number; decimals?: number; suffix?: string; sep: string; delay?: number }> = ({ end, decimals = 0, suffix = '', sep, delay = 0 }) => {
    const [val, setVal] = useState(heroStatsPlayed ? end : 0);
    useEffect(() => {
      if (!shown || heroStatsPlayed) return;
      let raf = 0;
      const dur = 1700;
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
    return <>{text}{suffix && <span className="text-transparent [-webkit-text-stroke:1.5px_#ffffff]">{suffix}</span>}</>;
  };

  const sep = isIndonesian ? '.' : ',';
  const metrics = isIndonesian
    ? [
        { end: 1500, suffix: '+', label: 'Orang Terbantu' },
        { end: 3200, suffix: '+', label: 'Jam Sesi' },
        { end: 7700, suffix: '+', label: 'Total Sesi' },
        { end: 5, decimals: 1, label: 'Rating Google', rating: true },
      ]
    : [
        { end: 1500, suffix: '+', label: 'People Helped' },
        { end: 3200, suffix: '+', label: 'Hours of Guidance' },
        { end: 7700, suffix: '+', label: 'Sessions Done' },
        { end: 5, decimals: 1, label: 'Google Rating', rating: true },
      ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden isolate"
    >
      {/* ===== Editorial ground — deep plum, warm coral glow, film grain (no starfield) ===== */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1c1130] via-[#160e28] to-[#0f0a1c]" aria-hidden />
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(66% 52% at 82% 90%, rgba(218,134,54,0.20) 0%, rgba(218,134,54,0) 60%),' +
            'radial-gradient(58% 58% at 8% 6%, rgba(142,92,134,0.18) 0%, rgba(142,92,134,0) 62%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 pointer-events-none mix-blend-soft-light opacity-[0.55]"
        aria-hidden
        style={{ backgroundImage: GRAIN, backgroundSize: '170px 170px' }}
      />
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden
        style={{ background: 'radial-gradient(125% 115% at 50% 26%, transparent 52%, rgba(6,4,14,0.6) 100%)' }}
      />

      {/* ===== Editorial asymmetric brand hero ===== */}
      <div
        ref={contentRef}
        className="flex-1 w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 flex flex-col justify-center pt-32 pb-8 will-change-transform"
      >
        {/* editorial kicker — distributed labels */}
        <Rise delay={60}>
          <div className="mb-8 md:mb-12 flex items-center gap-4 sm:gap-6 max-w-3xl text-[0.58rem] md:text-[0.7rem] uppercase tracking-[0.34em] text-cream/55">
            <span>{isIndonesian ? 'Analitis' : 'Analytical'}</span>
            <span className="h-px flex-1 bg-cream/15" />
            <span>{isIndonesian ? 'Hangat' : 'Warm'}</span>
            <span className="h-px flex-1 bg-cream/15" />
            <span>{isIndonesian ? 'Membumi' : 'Grounded'}</span>
          </div>
        </Rise>

        {/* staggered wordmark */}
        <h1 className="font-serif font-bold uppercase text-coral leading-[0.8] tracking-[-0.02em] text-[3.6rem] sm:text-[5.6rem] md:text-[7.8rem] lg:text-[9.8rem] xl:text-[11.5rem] 2xl:text-[14rem] [text-shadow:0_6px_28px_rgba(6,4,14,0.65)]">
          <span className="block text-coral">
            <MaskLine delay={180}>Mayanov</MaskLine>
          </span>
          <span className="block text-right text-transparent [-webkit-text-stroke:1.5px_#FFFFFF] md:[-webkit-text-stroke:2.5px_#FFFFFF]">
            <MaskLine delay={300}>Tarot</MaskLine>
          </span>
        </h1>

        {/* asymmetric supporting row */}
        <div className="mt-10 md:mt-16 grid lg:grid-cols-12 gap-x-8 gap-y-8 items-center">
          <Rise delay={520} className="lg:col-span-6">
            <p className="font-serif text-2xl md:text-[2.1rem] xl:text-[2.5rem] 2xl:text-[2.9rem] leading-tight tracking-[-0.01em] text-cream/95 [text-shadow:0_2px_10px_rgba(6,4,12,0.8),0_3px_24px_rgba(6,4,12,0.7)]">
              {isIndonesian
                ? <>Ruang untuk <span className="text-coral">berpikir jernih.</span></>
                : <>A clearer view of <span className="text-coral">what&rsquo;s next.</span></>}
            </p>
            <p className="mt-4 text-base md:text-lg xl:text-xl 2xl:text-[1.35rem] text-white max-w-lg xl:max-w-2xl leading-relaxed font-normal [text-shadow:0_1px_8px_rgba(6,4,12,0.9),0_2px_18px_rgba(6,4,12,0.7)]">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi—analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>
          <Rise delay={640} className="lg:col-span-4 lg:col-start-9 lg:justify-self-end">
            <Magnetic strength={0.4}>
              <a
                href="#services"
                onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white text-ink text-base font-medium tracking-wide transition-colors duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#241733]"
              >
                {isIndonesian ? 'Pilih Paket & Pesan Sesi' : 'Book a Reading'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Magnetic>
          </Rise>
        </div>
      </div>

      {/* ===== Metrics — free-standing editorial stats (no container) ===== */}
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 pb-10 md:pb-14">
        <Rise delay={860}>
          <div className="pt-7 md:pt-9 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-y-9 gap-x-6">
            {metrics.map((m, i) => (
              <div key={i} className="group flex flex-col items-center text-center cursor-default">
                <span className="font-serif font-semibold text-[1.9rem] md:text-[2.5rem] xl:text-[3rem] leading-[0.85] text-cream tracking-[-0.02em] tabular-nums transition-colors duration-300 group-hover:text-coral">
                  <CountUp end={m.end} decimals={'decimals' in m ? m.decimals : 0} suffix={'suffix' in m ? m.suffix : ''} sep={sep} delay={i * 180} />
                </span>
                <div className="mt-3 text-[0.62rem] md:text-[0.7rem] uppercase tracking-[0.22em] text-white transition-colors duration-300">{m.label}</div>
              </div>
            ))}
          </div>
        </Rise>
      </div>
    </section>
  );
};

export default Hero;
