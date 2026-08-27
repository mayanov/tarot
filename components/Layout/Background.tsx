import React, { useEffect, useRef } from 'react';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")";

// Fixed sky behind the whole page that plays a SUNRISE as you scroll: deep,
// cool pre-dawn at the top, and a warm dawn layer fades in while the sun rises
// the further down you read. Kept to a warm medium dawn (not a pale morning) so
// the light section text stays readable throughout.
const Background: React.FC = () => {
  const dawnRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      if (dawnRef.current) dawnRef.current.style.opacity = (p * 0.8).toFixed(3);
      if (sunRef.current) {
        sunRef.current.style.transform = `translate3d(0, ${((1 - p) * 32).toFixed(1)}%, 0)`;
        sunRef.current.style.opacity = (0.2 + p * 0.8).toFixed(3);
      }
      if (fieldRef.current) fieldRef.current.style.transform = `translateY(${(p * -3).toFixed(1)}%)`;
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* deep pre-dawn base (darkest — top of page) */}
      <div
        ref={fieldRef}
        className="absolute -inset-y-[6%] inset-x-0 will-change-transform"
        style={{ background: 'linear-gradient(178deg, #141A38 0%, #1E1B3C 28%, #2E2140 58%, #3A2637 100%)' }}
      />
      {/* dawn layer — fades in as you scroll (the sky warms & lightens) */}
      <div
        ref={dawnRef}
        className="absolute inset-0 opacity-0 will-change-[opacity]"
        style={{ background: 'linear-gradient(178deg, #45548C 0%, #7C5E86 33%, #B2726A 61%, #D68C55 100%)' }}
      />
      {/* cool cast up top */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(82% 52% at 18% 2%, rgba(41,58,110,0.30) 0%, rgba(41,58,110,0) 60%)' }} />
      {/* rising sun — climbs and brightens on scroll */}
      <div
        ref={sunRef}
        className="absolute inset-0 will-change-transform"
        style={{ background: 'radial-gradient(46% 40% at 74% 80%, rgba(255,198,124,0.55) 0%, rgba(246,152,72,0.26) 40%, rgba(230,120,40,0) 70%)' }}
      />
      {/* slow living colour drift */}
      <div className="absolute -top-[10%] -right-[8%] w-[52%] h-[46%] rounded-full bg-coral/[0.10] blur-[150px] mix-blend-screen animate-[blobA_34s_ease-in-out_infinite]" />
      <div className="absolute top-[36%] -left-[10%] w-[46%] h-[44%] rounded-full bg-blue/[0.14] blur-[150px] mix-blend-screen animate-[blobB_40s_ease-in-out_infinite]" />
      <div className="absolute -bottom-[8%] right-[12%] w-[48%] h-[44%] rounded-full bg-mauve/[0.12] blur-[150px] mix-blend-screen animate-[blobC_46s_ease-in-out_infinite]" />
      {/* film grain */}
      <div className="absolute inset-0 opacity-70 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
      <div className="absolute inset-0 opacity-[0.12] mix-blend-screen" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
    </div>
  );
};

export default Background;
