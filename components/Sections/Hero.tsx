import React, { useEffect, useRef, useState } from 'react';
import { smoothScrollToId } from '../UI/scroll';
import CelestialMark from '../UI/CelestialMark';
import { btnPrimaryDark } from '../UI/buttons';
import ButtonInk from '../UI/ButtonInk';
import Background from '../Layout/Background';
import { REVEAL_FLIGHT_MS } from '../Layout/Loader';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Soft fade-and-rise for each hero piece — opacity + transform only, so it's fully
// GPU-composited. `land` is opacity-only (no movement): used for the crescent, which
// must already sit at its final spot when the loader's moon measures it and flies in
// to become it. Defined OUTSIDE Hero so it isn't re-created (and remounted, which
// skipped the transition) on every render.
const Rise: React.FC<{ shown: boolean; children: React.ReactNode; delay?: number; className?: string; land?: boolean }> = ({ shown, children, delay = 0, className = '', land = false }) => (
  <div
    className={className}
    style={land ? {
      opacity: shown ? 1 : 0,
      transition: `opacity 420ms ease ${delay}ms`,
    } : {
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 1s ease ${delay}ms, transform 1.1s ${EASE} ${delay}ms`,
      willChange: 'opacity, transform',
    }}
  >
    {children}
  </div>
);

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  // Scroll choreography — as the hero scrolls away:
  //  • the starry sky stays almost pinned, so the About sheet (rounded top, sits
  //    above) slides up OVER it like a card laid on top, dimming the sky as it goes;
  //  • everything else — moon, title, subtitle, CTA — rises up and fades out, each
  //    piece a touch faster than the one below it so they lift off in a gentle cascade.
  // Transform/opacity only, so it stays on the compositor.
  useEffect(() => {
    const stage = skyRef.current;
    const el = contentRef.current;
    if (!stage || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const lift = (node: HTMLElement | null, y: number, speed: number, fadeBy: number) => {
      if (!node) return;
      node.style.transform = `translate3d(0, ${(-y * speed).toFixed(1)}px, 0)`;
      node.style.opacity = Math.max(0, 1 - y / fadeBy).toFixed(3);
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

        // the sky stays (nearly) put while the page slides over it
        stage.style.transform = `translate3d(0, ${(y * 0.92).toFixed(1)}px, 0)`;
        if (dimRef.current) dimRef.current.style.opacity = (e * 0.6).toFixed(3);

        // the masthead scrolls with the page and lifts a little extra, fading out
        lift(moonRef.current, y, 0.45, h * 0.35);
        lift(titleRef.current, y, 0.3, h * 0.5);
        lift(subRef.current, y, 0.22, h * 0.42);
        lift(ctaRef.current, y, 0.15, h * 0.38);
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
      <div ref={contentRef} className="relative z-10 w-full mx-auto px-8 flex flex-col items-center">
        <Rise shown={shown} delay={REVEAL_FLIGHT_MS - 180} land>
          <div ref={moonRef} data-hero-moon className="will-change-transform">
          <CelestialMark name="crescent" className="w-11 md:w-[3.4rem] text-cream/85 mb-7 md:mb-9 [filter:drop-shadow(0_6px_34px_rgba(6,4,14,0.55))]" />
          </div>
        </Rise>

        <div ref={titleRef} className="will-change-transform">
          {/* the loader's wordmark flies up and grows into exactly this spot; the real
              title takes over the moment it lands (same font, size and position) */}
          <h1
            data-hero-title
            className="font-serif font-medium uppercase whitespace-nowrap leading-[0.95] tracking-[-0.01em] text-[clamp(1.7rem,8.6vw,7.6rem)] [text-shadow:0_8px_60px_rgba(6,4,14,0.5)] text-cream"
            style={{ opacity: shown ? 1 : 0, transition: `opacity 220ms ease ${REVEAL_FLIGHT_MS + 20}ms` }}
          >
            Mayanov Tarot
          </h1>
        </div>

        <Rise shown={shown} delay={REVEAL_FLIGHT_MS - 100}>
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

        <Rise shown={shown} delay={REVEAL_FLIGHT_MS + 80}>
          <div ref={ctaRef} className="mt-8 md:mt-9 will-change-transform">
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
              className={`${btnPrimaryDark} inline-flex group gap-3 px-8 py-3.5 text-[1.05rem]`}
            >
              <ButtonInk kind="primary" tone="dark">
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              </ButtonInk>
            </a>
          </div>
        </Rise>
      </div>

      {/* dims the hero as the next section slides over it, so the overlap reads as depth */}
      <div ref={dimRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-[#07061a] opacity-0" />
    </section>
  );
};

export default Hero;
