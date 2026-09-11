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
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-28 md:pt-32 pb-12">
        {/* LEFT — editorial text */}
        <div className="order-2 lg:order-1">
          <Rise delay={120}>
            <h1 className="font-serif font-bold uppercase leading-[0.88] tracking-[-0.02em] text-[3.2rem] sm:text-[4.4rem] lg:text-[5.6rem] [text-shadow:0_4px_28px_rgba(6,4,14,0.5)]">
              <span className="block text-coral">Mayanov</span>
              <span className="block text-cream">Tarot</span>
            </h1>
          </Rise>

          <Rise delay={260}>
            <p className="mt-6 font-elegant italic text-xl md:text-[1.7rem] leading-snug text-coral [text-shadow:0_2px_16px_rgba(6,4,14,0.6)]">
              {isIndonesian ? 'Ruang untuk berpikir jernih.' : 'A clearer view of what’s next.'}
            </p>
          </Rise>

          <Rise delay={340}>
            <p className="mt-4 text-sm md:text-[15px] leading-relaxed max-w-md text-cream/80 [text-shadow:0_1px_10px_rgba(6,4,14,0.7)]">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>

          <Rise delay={420}>
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
              className="group mt-9 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium pb-1.5 text-coral transition-colors"
              style={{ borderBottom: '1px solid rgba(241,159,88,0.5)' }}
            >
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Rise>

          <Rise delay={500}>
            <div className="mt-12 grid grid-cols-4 gap-4 max-w-lg pt-6 border-t border-cream/15">
              {metrics.map((m, i) => (
                <div key={i}>
                  <div className="font-sans font-semibold text-lg md:text-xl tabular-nums text-cream">
                    <CountUp end={m.end} decimals={'decimals' in m ? (m as any).decimals : 0} suffix={'suffix' in m ? (m as any).suffix : ''} sep={sep} delay={i * 150} />
                  </div>
                  <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-[0.14em] leading-tight text-cream/55">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </Rise>
        </div>

        {/* RIGHT — a single, quiet photograph */}
        <Rise delay={220} className="order-1 lg:order-2">
          <div className="relative w-full overflow-hidden rounded-xl aspect-[4/5] lg:aspect-auto lg:h-[76vh] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)]">
            <img
              src="/event-3.jpeg"
              alt={isIndonesian ? 'Sesi tarot bersama Mayanov' : 'A tarot session with Mayanov'}
              className="w-full h-full object-cover"
            />
          </div>
        </Rise>
      </div>
    </section>
  );
};

export default Hero;
