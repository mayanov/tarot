import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ChevronDown, Star } from 'lucide-react';
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

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Cursor-reactive gradient: a warm light follows the cursor and the colour field drifts toward it.
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;   // -1..1
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        if (blobsRef.current) blobsRef.current.style.transform = `translate3d(${x * -46}px, ${y * -38}px, 0)`;
        if (glowRef.current) {
          glowRef.current.style.left = `${e.clientX}px`;
          glowRef.current.style.top = `${e.clientY}px`;
          glowRef.current.style.opacity = '1';
        }
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // Scroll-linked: the hero holds, then the content lifts + fades and the field scales as you leave.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      const p = Math.min(window.scrollY / window.innerHeight, 1); // 0..1 over first viewport
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${(p * 90).toFixed(1)}px, 0)`;
        contentRef.current.style.opacity = String(1 - p * 0.95);
      }
      if (bgRef.current) bgRef.current.style.transform = `scale(${(1 + p * 0.18).toFixed(3)})`;
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  // A single line that rises out from behind a mask.
  const MaskLine: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
    <span className="block overflow-hidden pb-[0.08em]">
      <span
        className="block will-change-transform"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(112%)',
          transition: `transform 1.05s ${EASE}`,
          transitionDelay: `${delay}ms`,
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
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.9s ease, transform 0.9s ${EASE}`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );

  return (
    <section
      id="hero"
      className="relative min-h-[80vh] flex flex-col justify-center pt-32 pb-16 md:pt-36 md:pb-20 text-center overflow-hidden isolate"
    >
      {/* ===== Living, cursor-reactive dusk-sky gradient ===== */}
      <div ref={bgRef} className="absolute inset-0 -z-20 overflow-hidden will-change-transform">
        <div className="absolute inset-0 bg-[#40314F]" />
        <div ref={blobsRef} className="absolute -inset-[10%] overflow-visible transition-transform duration-300 ease-out will-change-transform">
          <div className="absolute -top-[12%] right-[2%] w-[70%] h-[75%] rounded-full bg-coral/70 blur-[100px] mix-blend-screen animate-[blobA_13s_ease-in-out_infinite]" />
          <div className="absolute top-[8%] -left-[10%] w-[62%] h-[70%] rounded-full bg-blue/60 blur-[110px] mix-blend-screen animate-[blobB_16s_ease-in-out_infinite]" />
          <div className="absolute -bottom-[18%] left-[6%] w-[66%] h-[72%] rounded-full bg-blue/65 blur-[110px] mix-blend-screen animate-[blobC_15s_ease-in-out_infinite]" />
          <div className="absolute bottom-[2%] right-[8%] w-[52%] h-[56%] rounded-full bg-plum/80 blur-[110px] mix-blend-screen animate-[blobD_18s_ease-in-out_infinite]" />
        </div>
        {/* Warm light that follows the cursor */}
        <div
          ref={glowRef}
          className="absolute w-[42vw] h-[42vw] max-w-[600px] max-h-[600px] rounded-full bg-coral/45 blur-[80px] mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-500"
          style={{ left: '50%', top: '42%' }}
        />
        {/* Fold light */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(112deg, rgba(255,238,220,0.12) 0%, rgba(255,238,220,0) 42%)' }} />
        {/* Grounding vignette so text stays legible over the moving colour */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(80% 70% at 50% 52%, rgba(20,16,26,0.15) 30%, rgba(20,16,26,0.62) 100%)' }} />
      </div>
      {/* Grain */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '200px 200px' }} />

      <div ref={contentRef} className="max-w-3xl mx-auto px-6 relative z-10 will-change-transform">
        {/* Eyebrow */}
        <Rise delay={80}>
          <p className="mb-7 text-[0.7rem] md:text-xs font-semibold uppercase tracking-[0.34em] text-coral">
            {isIndonesian ? 'Tarot untuk Kejernihan · Sejak 2009' : 'Tarot for Clarity · Reading Since 2009'}
          </p>
        </Rise>

        {/* Headline — masked line reveal */}
        <h1 className="text-[2.9rem] leading-[1.03] md:text-[4.75rem] md:leading-[1] font-serif font-medium tracking-tight text-cream">
          {isIndonesian ? (
            <>
              <MaskLine delay={180}>Ruang untuk</MaskLine>
              <MaskLine delay={300}><span className="italic text-coral">berpikir jernih.</span></MaskLine>
            </>
          ) : (
            <>
              <MaskLine delay={180}>A clearer view</MaskLine>
              <MaskLine delay={300}>of <span className="italic text-coral">what's next.</span></MaskLine>
            </>
          )}
        </h1>

        {/* Subhead */}
        <Rise delay={520}>
          <p className="mt-7 text-lg md:text-xl text-cream/75 max-w-xl mx-auto leading-relaxed font-light">
            {isIndonesian
              ? 'Tarot sebagai ruang refleksi—analitis, hangat, dan membumi. Bukan ramalan, tapi percakapan jujur untuk melihat langkahmu lebih jelas.'
              : 'Tarot as a space for reflection — analytical, warm, and grounded. Not fortune-telling, just an honest conversation that helps you see your next step clearly.'}
          </p>
        </Rise>

        {/* CTAs */}
        <Rise delay={640}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('services', 80); }}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-coral text-cream text-base font-medium tracking-wide transition-all duration-200 hover:bg-coral-deep hover:-translate-y-0.5 shadow-[0_16px_40px_-16px_rgba(216,128,90,0.85)] focus:outline-none focus:ring-2 focus:ring-coral/50 focus:ring-offset-2 focus:ring-offset-[#372B45]"
            >
              {isIndonesian ? 'Pilih Paket & Pesan Sesi' : 'Book a Reading'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); smoothScrollToId('about', 80); }}
              className="inline-flex items-center gap-2 px-2 py-2 text-base font-medium text-cream/90 border-b border-cream/30 hover:border-cream/70 transition-colors"
            >
              {isIndonesian ? 'Kenalan dulu' : 'Meet the reader'}
            </a>
          </div>
        </Rise>

        {/* Trust line */}
        <Rise delay={760}>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-cream/70">
            <span className="inline-flex items-center gap-1 text-coral">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
              ))}
            </span>
            <span className="font-medium text-cream">5.0</span>
            <span className="w-1 h-1 rounded-full bg-cream/30" />
            <span>{isIndonesian ? '1.500+ orang terbantu' : '1,500+ people helped'}</span>
          </div>
        </Rise>
      </div>

      {/* Scroll Indicator */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => smoothScrollToId('about', 80)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') smoothScrollToId('about', 80); }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-cream/50 hover:text-coral transition-colors cursor-pointer hidden md:block animate-bounce-slow"
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-6 h-6" />
      </div>
    </section>
  );
};

export default Hero;
