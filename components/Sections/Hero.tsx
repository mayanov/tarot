import React, { useEffect, useState } from 'react';
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
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ${EASE} ${delay}ms`,
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
      {/* Center — a cinematic title card over the sunrise sky */}
      <div className="flex-1 w-full max-w-[1000px] mx-auto px-6 flex flex-col items-center justify-center text-center pt-28 pb-10">
        <Rise delay={120}>
          <h1 className="font-serif font-bold uppercase leading-[0.86] tracking-[-0.02em] text-[3.6rem] sm:text-[5.2rem] lg:text-[7rem] [text-shadow:0_6px_40px_rgba(6,4,14,0.55)]">
            <span className="block text-coral">Mayanov</span>
            <span className="block text-cream">Tarot</span>
          </h1>
        </Rise>

        <Rise delay={260}>
          <p className="mt-7 font-elegant italic text-xl md:text-[1.9rem] leading-snug text-coral [text-shadow:0_2px_16px_rgba(6,4,14,0.6)]">
            {isIndonesian ? 'Ruang untuk berpikir jernih.' : 'A clearer view of what’s next.'}
          </p>
        </Rise>

        <Rise delay={340}>
          <p className="mt-5 text-sm md:text-[15px] leading-relaxed max-w-xl mx-auto text-cream/80 [text-shadow:0_1px_10px_rgba(6,4,14,0.7)]">
            {isIndonesian
              ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
              : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
          </p>
        </Rise>

        <Rise delay={420}>
          <a
            href="#services"
            onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-coral text-ink pl-7 pr-5 py-3.5 text-sm font-semibold hover:bg-coral-deep hover:text-cream hover:-translate-y-0.5 transition-all duration-300 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.6)]"
          >
            {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
            <span className="grid place-items-center w-7 h-7 rounded-full bg-ink/15 group-hover:bg-cream/25 transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </a>
        </Rise>
      </div>

      {/* Stats — a quiet row anchored to the bottom of the viewport, full width */}
      <Rise delay={520}>
        <div className="w-full max-w-[1000px] mx-auto px-6 pb-10 md:pb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-cream/15">
            {metrics.map((m, i) => (
              <div key={i} className="text-center">
                <div className="font-sans font-semibold text-xl md:text-2xl tabular-nums text-cream">
                  <CountUp end={m.end} decimals={'decimals' in m ? (m as any).decimals : 0} suffix={'suffix' in m ? (m as any).suffix : ''} sep={sep} delay={i * 150} />
                </div>
                <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-[0.14em] leading-tight text-cream/55">
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
