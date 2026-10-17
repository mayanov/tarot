import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';
import CelestialMark from '../UI/CelestialMark';
import { btnPrimaryDark } from '../UI/buttons';
import Background from '../Layout/Background';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // As the hero scrolls away we softly blur the MASTHEAD out of focus — only the
  // text/CTA, never the starfield behind it (blurring 900 star gradients every
  // frame tanked scroll perf). The sky just scrolls off, sharp and cheap.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let lastBlur = -1;
    let lastOp = -1;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = window.innerHeight || 1;
        const p = Math.min(Math.max(window.scrollY / h, 0), 1);
        const e = p * p * (3 - 2 * p);        // smoothstep
        // Quantize the blur to 0.5px steps. Each distinct value re-rasterizes the
        // whole masthead on the GPU, so writing a fresh float every frame was the
        // top-section scroll jank; this caps it to a handful of re-rasters. Opacity
        // is compositor-cheap but we still skip redundant writes.
        const blur = Math.round(Math.pow(e, 1.7) * 7 * 2) / 2;
        if (blur !== lastBlur) {
          lastBlur = blur;
          el.style.filter = blur > 0.02 ? `blur(${blur}px)` : 'none';
        }
        const op = Math.round((1 - e * 0.55) * 100) / 100;
        if (op !== lastOp) {
          lastOp = op;
          el.style.opacity = String(op);
        }
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
    >
      {/* the night-sky backdrop, scoped to the hero (so a pinned footer behind the
          page can't show through a transparent hero) */}
      <Background />

      {/* MASTHEAD — a calm, centered stack under a quiet crescent moon. */}
      <div ref={contentRef} className="relative z-10 w-full mx-auto px-8 flex flex-col items-center will-change-[filter,opacity]">
        <Rise delay={100}>
          <CelestialMark name="crescent" className="w-11 md:w-[3.4rem] text-cream/85 mb-7 md:mb-9 [filter:drop-shadow(0_6px_34px_rgba(6,4,14,0.55))]" />
        </Rise>

        <Rise delay={160} hero>
          <h1 className="font-serif font-medium uppercase whitespace-nowrap leading-[0.95] tracking-[-0.01em] text-[clamp(1.7rem,8.6vw,7.6rem)] [text-shadow:0_8px_60px_rgba(6,4,14,0.5)]">
            <span className="text-cream">Mayanov Tarot</span>
          </h1>
        </Rise>

        <Rise delay={340}>
          <p className="mt-7 md:mt-9 font-elegant font-medium leading-[1.2] md:leading-[1.14] tracking-[-0.01em] text-[1.3rem] sm:text-[1.6rem] md:text-[1.95rem] lg:text-[2.2rem] xl:text-[2.45rem] text-cream max-w-[20ch] md:max-w-none md:whitespace-nowrap [text-shadow:0_4px_30px_rgba(6,4,14,0.5)]">
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
              className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-sm`}
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
