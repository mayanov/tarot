import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';
import CelestialMark from '../UI/CelestialMark';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden isolate text-cream pt-28 md:pt-32 pb-16 md:pb-20"
      style={{ willChange: 'filter' }}
    >
      {/* MASTHEAD — a calm, centered stack under a quiet crescent moon. */}
      <div className="relative w-full mx-auto px-8 flex flex-col items-center">
        <Rise delay={100}>
          <CelestialMark name="crescent" className="w-11 md:w-[3.4rem] text-cream/85 mb-7 md:mb-9 [filter:drop-shadow(0_6px_34px_rgba(6,4,14,0.55))]" />
        </Rise>

        <Rise delay={160} hero>
          <h1 className="font-serif font-medium uppercase leading-[0.9] tracking-[-0.005em] text-[clamp(2.7rem,min(10.5vw,13vh),8.5rem)] [text-shadow:0_8px_60px_rgba(6,4,14,0.5)]">
            <span className="block text-cream">Mayanov</span>
            <span className="block text-cream">Tarot</span>
          </h1>
        </Rise>

        <Rise delay={340}>
          <p className="mt-7 md:mt-9 font-elegant font-medium leading-[1.16] tracking-[-0.01em] text-[1.4rem] sm:text-[1.75rem] text-cream max-w-[20ch] [text-shadow:0_4px_30px_rgba(6,4,14,0.5)]">
            {isIndonesian ? (
              <>Pandangan <span className="italic">jernih</span> untuk langkah berikutnya.</>
            ) : (
              <>A <span className="italic">clearer</span> view of what comes next.</>
            )}
          </p>
        </Rise>

        <Rise delay={520}>
          <div className="mt-8 md:mt-9">
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
              className="group inline-flex items-center gap-3 rounded-full bg-cream text-ink px-8 py-3.5 text-sm font-medium hover:bg-plum hover:text-cream transition-colors duration-500"
            >
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </Rise>
      </div>
    </section>
  );
};

export default Hero;
