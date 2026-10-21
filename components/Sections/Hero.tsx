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
  const skyRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // Scroll choreography — as the hero scrolls away it plays like a curtain:
  //  • the whole stage (sky + masthead) lags at ~half speed, so the About sheet
  //    (which already has a rounded top and sits above) slides up OVER it;
  //  • the masthead recedes into the sky — the moon rises off first, the subtitle
  //    and CTA fade early, and the title shrinks back and softly blurs out last;
  //  • the scroll cue disappears on the first bit of scroll.
  // Transform/opacity only (compositor-cheap); blur is quantized so it rasterizes rarely.
  useEffect(() => {
    const stage = skyRef.current;
    const el = contentRef.current;
    if (!stage || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let lastBlur = -1;
    const set = (node: HTMLElement | null, transform: string, opacity: number) => {
      if (!node) return;
      node.style.transform = transform;
      node.style.opacity = String(Math.max(0, Math.min(1, opacity)).toFixed(3));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = window.innerHeight || 1;
        const y = window.scrollY;
        if (y > h * 1.3) return; // hero is long gone — nothing to update
        const p = Math.min(Math.max(y / h, 0), 1);
        const e = p * p * (3 - 2 * p); // smoothstep

        // curtain: the stage lags behind the page
        const lag = `translate3d(0, ${(y * 0.45).toFixed(1)}px, 0)`;
        stage.style.transform = lag;
        el.style.transform = lag;

        // depth inside the masthead
        set(moonRef.current, `translate3d(0, ${(-y * 0.32).toFixed(1)}px, 0) rotate(${(-e * 18).toFixed(2)}deg)`, 1 - e * 1.6);
        set(titleRef.current, `scale(${(1 - e * 0.1).toFixed(4)})`, 1 - e * 0.85);
        set(subRef.current, `translate3d(0, ${(-y * 0.1).toFixed(1)}px, 0)`, 1 - e * 1.9);
        set(ctaRef.current, `translate3d(0, ${(-y * 0.16).toFixed(1)}px, 0)`, 1 - e * 2.4);
        if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - y / 120).toFixed(2));

        const blur = Math.round(Math.pow(e, 1.7) * 6 * 2) / 2;
        if (blur !== lastBlur) {
          lastBlur = blur;
          el.style.filter = blur > 0.02 ? `blur(${blur}px)` : 'none';
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
      <div ref={skyRef} className="absolute inset-0 -z-10 will-change-transform">
        <Background />
      </div>

      {/* MASTHEAD — a calm, centered stack under a quiet crescent moon. */}
      <div ref={contentRef} className="relative z-10 w-full mx-auto px-8 flex flex-col items-center will-change-[transform,filter]">
        <Rise delay={100}>
          <div ref={moonRef} className="will-change-transform">
          <CelestialMark name="crescent" className="w-11 md:w-[3.4rem] text-cream/85 mb-7 md:mb-9 [filter:drop-shadow(0_6px_34px_rgba(6,4,14,0.55))]" />
          </div>
        </Rise>

        <Rise delay={160} hero>
          <div ref={titleRef} className="will-change-transform">
          <h1 className="font-serif font-medium uppercase whitespace-nowrap leading-[0.95] tracking-[-0.01em] text-[clamp(1.7rem,8.6vw,7.6rem)] [text-shadow:0_8px_60px_rgba(6,4,14,0.5)]">
            <span className="text-cream">Mayanov Tarot</span>
          </h1>
          </div>
        </Rise>

        <Rise delay={340}>
          <div ref={subRef} className="will-change-transform">
          <p className="mt-7 md:mt-9 font-elegant font-medium leading-[1.2] md:leading-[1.14] tracking-[-0.01em] text-[1.3rem] sm:text-[1.6rem] md:text-[1.95rem] lg:text-[2.2rem] xl:text-[2.45rem] text-cream max-w-[20ch] md:max-w-none md:whitespace-nowrap [text-shadow:0_4px_30px_rgba(6,4,14,0.5)]">
            {isIndonesian ? (
              <>Pandangan <span className="italic">jernih</span> untuk langkah berikutnya.</>
            ) : (
              <>A <span className="italic">clearer</span> view of what comes next.</>
            )}
          </p>
          </div>
        </Rise>

        <Rise delay={520}>
          <div ref={ctaRef} className="mt-8 md:mt-9 will-change-transform">
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

      {/* scroll cue — a thin line with a light drop travelling down it; fades on first scroll */}
      <Rise delay={900} className="absolute bottom-16 lg:bottom-24 left-1/2 -translate-x-1/2 z-10">
        <div ref={cueRef} aria-hidden className="flex flex-col items-center gap-2.5 text-cream/55">
          <span className="text-[10px] tracking-[0.32em] uppercase">{isIndonesian ? 'Gulir' : 'Scroll'}</span>
          <span className="relative block w-px h-10 md:h-12 overflow-hidden bg-cream/15">
            <span className="absolute left-0 top-0 w-px h-1/2 bg-gradient-to-b from-transparent via-cream/90 to-transparent motion-safe:animate-[scrollCue_2.2s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
          </span>
        </div>
      </Rise>
    </section>
  );
};

export default Hero;
