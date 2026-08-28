import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

interface HeroProps {
  isIndonesian?: boolean;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const Hero: React.FC<HeroProps> = ({ isIndonesian = false }) => {
  const [shown, setShown] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // A scattered starfield (generated once) — makes the sky feel alive.
  const stars = useMemo(
    () => Array.from({ length: 185 }, () => {
      const r = Math.random();
      const size = r < 0.72 ? 1 : r < 0.92 ? 1.5 : r < 0.98 ? 2 : 2.5;
      return {
        top: Math.random() * 100,
        left: Math.random() * 100,
        size,
        opacity: 0.35 + Math.random() * 0.55,
        dur: 2.2 + Math.random() * 4.5,
        delay: Math.random() * 6,
        coral: Math.random() < 0.12,
      };
    }),
    []
  );

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

  const metrics = isIndonesian
    ? [
        { value: '1.500+', label: 'Orang Terbantu' },
        { value: '3.200+', label: 'Jam Sesi' },
        { value: '7.700+', label: 'Total Sesi' },
        { value: '5.0', label: 'Rating Google', rating: true },
      ]
    : [
        { value: '1,500+', label: 'People Helped' },
        { value: '3,200+', label: 'Hours of Guidance' },
        { value: '7,700+', label: 'Sessions Done' },
        { value: '5.0', label: 'Google Rating', rating: true },
      ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden isolate"
    >
      {/* living sky — soft nebula auras + a scattered twinkling starfield */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] right-[2%] w-[44%] h-[48%] rounded-full bg-[#6E5A9E]/[0.10] blur-[150px] animate-[blobB_34s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] left-[6%] w-[42%] h-[46%] rounded-full bg-coral/[0.06] blur-[150px] animate-[blobA_30s_ease-in-out_infinite]" />
        {stars.map((s, i) => (
          <span
            key={i}
            className={`absolute rounded-full ${s.coral ? 'bg-coral' : 'bg-white'}`}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              boxShadow: s.size >= 2 ? '0 0 6px rgba(255,246,230,0.7)' : 'none',
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              ['--tw-o' as string]: String(s.opacity),
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ===== Editorial asymmetric brand hero ===== */}
      <div
        ref={contentRef}
        className="flex-1 w-full max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 flex flex-col justify-center pt-32 pb-8 will-change-transform"
      >
        {/* staggered wordmark */}
        <h1 className="font-serif font-bold uppercase text-coral leading-[0.82] tracking-[-0.015em] text-[3.4rem] sm:text-[5.2rem] md:text-[7.2rem] lg:text-[9rem] [text-shadow:0_6px_28px_rgba(6,4,14,0.65)]">
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
            <p className="font-serif text-2xl md:text-[2.1rem] leading-tight tracking-[-0.01em] text-cream/95 [text-shadow:0_2px_10px_rgba(6,4,12,0.8),0_3px_24px_rgba(6,4,12,0.7)]">
              {isIndonesian
                ? <>Ruang untuk <span className="text-coral">berpikir jernih.</span></>
                : <>A clearer view of <span className="text-coral">what&rsquo;s next.</span></>}
            </p>
            <p className="mt-4 text-base md:text-lg text-white max-w-lg leading-relaxed font-normal [text-shadow:0_1px_8px_rgba(6,4,12,0.9),0_2px_18px_rgba(6,4,12,0.7)]">
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

      {/* ===== Stats bar pinned to the bottom ===== */}
      <div className="w-full max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 pb-9 md:pb-12">
        <Rise delay={860}>
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md shadow-[0_20px_60px_-34px_rgba(0,0,0,0.6)] px-4 py-5 md:px-8 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-6">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col items-center text-center md:border-l md:border-white/12 md:first:border-l-0 px-2">
                <div className="font-serif font-semibold text-[1.7rem] md:text-[2.1rem] leading-none text-cream tracking-tight">{m.value}</div>
                {'rating' in m && m.rating && (
                  <div className="flex gap-0.5 text-coral mt-2">
                    {[0, 1, 2, 3, 4].map((s) => (<Star key={s} className="w-3.5 h-3.5 fill-current" strokeWidth={0} />))}
                  </div>
                )}
                <div className="mt-2.5 text-[0.58rem] md:text-[0.66rem] uppercase tracking-[0.18em] text-white/70">{m.label}</div>
              </div>
            ))}
          </div>
        </Rise>
      </div>
    </section>
  );
};

export default Hero;
