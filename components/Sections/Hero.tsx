import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const INK = '#302620';      // warm espresso text
const BONE = '#F6F2EB';     // warm off-white ground

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
      className="relative min-h-screen flex flex-col overflow-hidden isolate"
      style={{ backgroundColor: BONE, color: INK }}
    >
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-28 md:pt-32 pb-12">
        {/* LEFT — editorial text */}
        <div className="order-2 lg:order-1">
          <Rise delay={60}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-[11px] uppercase tracking-[0.24em]" style={{ color: 'rgba(48,38,32,0.6)' }}>
              <span>{isIndonesian ? 'Tarot Analitis' : 'Analytical Tarot'}</span>
              <span>·</span>
              <span>{isIndonesian ? 'Sejak 2009' : 'Since 2009'}</span>
              <span>·</span>
              <span>Jakarta Selatan</span>
            </div>
          </Rise>

          <Rise delay={150}>
            <div className="mt-6 text-[12px] uppercase tracking-[0.28em] font-medium" style={{ color: 'rgba(48,38,32,0.9)' }}>
              Mayanov Tarot
            </div>
          </Rise>

          <Rise delay={230}>
            <h1 className="mt-4 font-sans font-medium tracking-[-0.01em] leading-[1.08] text-[2.1rem] sm:text-[2.6rem] lg:text-[3.3rem] max-w-xl">
              {isIndonesian
                ? <>Ruang untuk <span className="font-elegant italic font-normal">berpikir jernih.</span></>
                : <>A clearer view of <span className="font-elegant italic font-normal">what&rsquo;s next.</span></>}
            </h1>
          </Rise>

          <Rise delay={320}>
            <p className="mt-6 text-sm md:text-[15px] leading-relaxed max-w-md" style={{ color: 'rgba(48,38,32,0.7)' }}>
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi — analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>

          <Rise delay={400}>
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
              className="group mt-9 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium pb-1.5 transition-colors"
              style={{ color: INK, borderBottom: '1px solid rgba(48,38,32,0.4)' }}
            >
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Rise>

          <Rise delay={480}>
            <div className="mt-12 grid grid-cols-4 gap-4 max-w-lg pt-6" style={{ borderTop: '1px solid rgba(48,38,32,0.15)' }}>
              {metrics.map((m, i) => (
                <div key={i}>
                  <div className="font-sans font-semibold text-lg md:text-xl tabular-nums" style={{ color: INK }}>
                    <CountUp end={m.end} decimals={'decimals' in m ? (m as any).decimals : 0} suffix={'suffix' in m ? (m as any).suffix : ''} sep={sep} delay={i * 150} />
                  </div>
                  <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-[0.14em] leading-tight" style={{ color: 'rgba(48,38,32,0.55)' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </Rise>
        </div>

        {/* RIGHT — a single, quiet photograph */}
        <Rise delay={220} className="order-1 lg:order-2">
          <div className="relative w-full overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[76vh]">
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
