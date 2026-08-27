import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.4'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")";

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const blobsRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardTiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Cursor-reactive: a warm light follows the cursor, the colour field drifts,
  // and the tarot card tilts in 3D toward the pointer.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;   // -0.5..0.5
        const ny = e.clientY / window.innerHeight - 0.5;
        if (blobsRef.current) blobsRef.current.style.transform = `translate3d(${nx * -92}px, ${ny * -76}px, 0)`;
        if (glowRef.current) {
          glowRef.current.style.left = `${e.clientX}px`;
          glowRef.current.style.top = `${e.clientY}px`;
          glowRef.current.style.opacity = '1';
        }
        if (cardTiltRef.current) {
          cardTiltRef.current.style.transform = `perspective(1100px) rotateX(${(-ny * 16).toFixed(2)}deg) rotateY(${(nx * 20).toFixed(2)}deg)`;
        }
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // Scroll-linked: content lifts + fades and the colour field scales as you leave.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${(p * 70).toFixed(1)}px, 0)`;
        contentRef.current.style.opacity = String(1 - p * 0.9);
      }
      if (bgRef.current) bgRef.current.style.transform = `scale(${(1 + p * 0.16).toFixed(3)})`;
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

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden isolate"
    >
      {/* ===== Main editorial grid ===== */}
      <div
        ref={contentRef}
        className="flex-1 w-full max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 flex flex-col justify-center pt-28 pb-16 md:pt-28 md:pb-20 will-change-transform"
      >
        <div className="grid lg:grid-cols-12 items-center gap-10 lg:gap-6">
          {/* Left — display type */}
          <div className="lg:col-span-7 text-left">
          {/* Headline — masked line reveal */}
          <h1 className="font-serif font-semibold tracking-[-0.03em] text-cream text-[2.7rem] leading-[0.96] sm:text-[3.5rem] md:text-[4.4rem] lg:text-[5.3rem] lg:leading-[0.94]">
            {isIndonesian ? (
              <>
                <MaskLine delay={180}>Ruang untuk</MaskLine>
                <MaskLine delay={310}><span className="text-coral">berpikir jernih.</span></MaskLine>
              </>
            ) : (
              <>
                <MaskLine delay={180}>A clearer view</MaskLine>
                <MaskLine delay={310}>of <span className="text-coral">what&rsquo;s next.</span></MaskLine>
              </>
            )}
          </h1>

          {/* Subhead */}
          <Rise delay={540}>
            <p className="mt-8 text-base md:text-xl text-white max-w-lg leading-relaxed font-light">
              {isIndonesian
                ? 'Tarot sebagai ruang refleksi—analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
                : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
            </p>
          </Rise>

          {/* CTA */}
          <Rise delay={660}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href="#services"
                onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
                className="group inline-flex items-center justify-center gap-2.5 pl-8 pr-6 py-4 rounded-full bg-ink text-cream text-base font-medium tracking-wide border border-cream/25 transition-all duration-200 hover:bg-charcoal-deep hover:border-cream/45 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cream/50 focus:ring-offset-2 focus:ring-offset-[#34274F]"
              >
                {isIndonesian ? 'Pilih Paket & Pesan Sesi' : 'Book a Reading'}
                <span className="grid place-items-center w-7 h-7 rounded-full bg-cream/15 group-hover:bg-cream/25 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            </div>
          </Rise>
        </div>

        {/* Right — soft aura orb */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <Rise delay={420} className="relative">
            {/* outer halo */}
            <div className="absolute inset-0 -m-16 rounded-full bg-coral/[0.13] blur-[120px] pointer-events-none" />
            <div className="animate-float-slow">
              <div
                ref={cardTiltRef}
                className="relative w-[16rem] sm:w-[19rem] md:w-[22rem] aspect-square transition-transform duration-300 ease-out will-change-transform"
              >
                {/* the orb */}
                <div className="absolute inset-0 rounded-full overflow-hidden isolate shadow-[0_60px_150px_-45px_rgba(10,7,16,0.7)]">
                  {/* aura gradient — a dusk moon */}
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 34% 28%, #EDBE93 0%, #D07C3F 28%, #7A4A66 56%, #2C1B40 88%)' }} />
                  {/* volume shading (opposite side) */}
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 74%, rgba(16,9,24,0.6) 0%, rgba(16,9,24,0) 52%)' }} />
                  {/* soft specular highlight */}
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 24%, rgba(255,243,229,0.42) 0%, rgba(255,243,229,0) 26%)' }} />
                  {/* grain */}
                  <div className="absolute inset-0 opacity-[0.5] mix-blend-overlay pointer-events-none" style={{ backgroundImage: GRAIN, backgroundSize: '150px 150px' }} />
                </div>
                {/* thin orbit ring */}
                <div className="absolute -inset-4 rounded-full border border-cream/10 pointer-events-none" />
                {/* tiny star accents */}
                <span className="absolute top-[5%] right-[18%] w-1.5 h-1.5 rounded-full bg-cream/70" />
                <span className="absolute bottom-[16%] -left-1.5 w-1 h-1 rounded-full bg-coral/80" />
              </div>
            </div>
          </Rise>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
