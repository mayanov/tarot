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
      {/* deep sky — a smooth atmospheric grade from night-blue zenith down through
          indigo, purple and magenta to a warm rose horizon (many stops = no banding) */}
      <div
        ref={fieldRef}
        className="absolute -inset-y-[6%] inset-x-0 will-change-transform"
        style={{
          background:
            'linear-gradient(176deg, #08080F 0%, #100F26 16%, #181435 32%, #221A47 50%, #2E2154 66%, #3A2A5E 82%, #4A3568 100%)',
        }}
      />
      {/* organic accents — soft, uneven moonstone-violet pools that keep the smooth base
          from looking mechanical (kept subtle so the gradient itself carries the sky) */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            'radial-gradient(48% 40% at 16% 12%, rgba(120,110,185,0.24) 0%, transparent 66%),' +
            'radial-gradient(40% 36% at 62% 6%, rgba(96,74,150,0.18) 0%, transparent 64%),' +
            'radial-gradient(44% 44% at 92% 40%, rgba(158,134,201,0.16) 0%, transparent 66%),' +
            'radial-gradient(46% 40% at 4% 58%, rgba(110,100,175,0.16) 0%, transparent 64%)',
        }}
      />
      {/* starfield — bright and dense across the upper sky, thinning toward the horizon */}
      <div
        className="absolute inset-0 animate-[skyTwinkle_6s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(1.6px 1.6px at 30px 40px, rgba(255,255,255,0.98), transparent 60%),' +
            'radial-gradient(1px 1px at 90px 20px, rgba(255,255,255,0.75), transparent 60%),' +
            'radial-gradient(2px 2px at 150px 90px, #fff, transparent 62%),' +
            'radial-gradient(1px 1px at 60px 130px, rgba(255,255,255,0.7), transparent 60%),' +
            'radial-gradient(1.4px 1.4px at 200px 150px, rgba(255,255,255,0.85), transparent 60%),' +
            'radial-gradient(1px 1px at 130px 190px, rgba(255,255,255,0.65), transparent 60%),' +
            'radial-gradient(1.7px 1.7px at 220px 40px, rgba(255,255,255,0.9), transparent 60%),' +
            'radial-gradient(1px 1px at 20px 205px, rgba(255,255,255,0.6), transparent 60%),' +
            'radial-gradient(1.3px 1.3px at 240px 115px, rgba(255,255,255,0.8), transparent 60%),' +
            'radial-gradient(1px 1px at 175px 235px, rgba(255,255,255,0.62), transparent 60%)',
          backgroundSize: '250px 250px',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 40%, rgba(0,0,0,0.35) 66%, transparent 82%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 40%, rgba(0,0,0,0.35) 66%, transparent 82%)',
        }}
      />
      {/* a few bright hero stars with a soft glow */}
      <div
        className="absolute inset-0 animate-[skyTwinkle_9s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(2.5px 2.5px at 18% 16%, #fff, rgba(255,255,255,0) 66%),' +
            'radial-gradient(2px 2px at 62% 12%, #fff, rgba(255,255,255,0) 66%),' +
            'radial-gradient(2.5px 2.5px at 84% 26%, #fff, rgba(255,255,255,0) 66%),' +
            'radial-gradient(2px 2px at 40% 30%, #fff, rgba(255,255,255,0) 66%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 42%, transparent 72%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 42%, transparent 72%)',
        }}
      />
      {/* horizon glow — fades in as you scroll (the sky lifts to a soft violet), diffuse so it never bands */}
      <div
        ref={dawnRef}
        className="absolute inset-0 opacity-0 will-change-[opacity]"
        style={{ background: 'radial-gradient(150% 132% at 74% 92%, rgba(198,178,228,0.34) 0%, rgba(158,134,201,0.16) 44%, rgba(66,72,130,0.06) 100%)' }}
      />
      {/* rising moon — climbs and brightens on scroll */}
      <div
        ref={sunRef}
        className="absolute inset-0 will-change-transform"
        style={{ background: 'radial-gradient(50% 44% at 74% 80%, rgba(219,205,242,0.4) 0%, rgba(198,178,228,0.18) 40%, rgba(198,178,228,0) 70%)' }}
      >
        {/* the moon disc itself */}
        <div
          className="absolute rounded-full"
          style={{
            left: '74%', top: '80%', width: 'clamp(90px, 14vw, 210px)', height: 'clamp(90px, 14vw, 210px)',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(closest-side, rgba(242,236,251,0.95) 0%, rgba(219,205,242,0.5) 52%, rgba(198,178,228,0) 78%)',
          }}
        />
      </div>
      {/* drifting clouds — soft banks that read as sky */}
      <div className="absolute top-[10%] -left-[12%] w-[70%] h-[24%] rounded-[50%] bg-white/[0.10] blur-[58px] mix-blend-screen animate-[cloudA_75s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-[26%] -right-[16%] w-[62%] h-[20%] rounded-[50%] bg-white/[0.08] blur-[66px] mix-blend-screen animate-[cloudB_92s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-[48%] -left-[10%] w-[58%] h-[18%] rounded-[50%] bg-white/[0.06] blur-[64px] mix-blend-screen animate-[cloudA_104s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[12%] right-[2%] w-[66%] h-[22%] rounded-[50%] bg-moon/[0.10] blur-[64px] mix-blend-screen animate-[cloudB_86s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[24%] left-[8%] w-[46%] h-[15%] rounded-[50%] bg-moon/[0.08] blur-[60px] mix-blend-screen animate-[cloudA_96s_ease-in-out_infinite_alternate]" />

      {/* small, crisper cloud puffs — read as individual little clouds */}
      <div className="absolute top-[16%] left-[24%] w-[20%] h-[9%] rounded-[50%] bg-white/[0.10] blur-[30px] mix-blend-screen animate-[cloudB_70s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-[40%] right-[20%] w-[15%] h-[7%] rounded-[50%] bg-moon/[0.12] blur-[26px] mix-blend-screen animate-[cloudA_84s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[32%] right-[28%] w-[17%] h-[8%] rounded-[50%] bg-white/[0.08] blur-[28px] mix-blend-screen animate-[cloudB_100s_ease-in-out_infinite_alternate]" />

      {/* slow living colour drift */}
      <div className="absolute -top-[10%] -right-[8%] w-[52%] h-[46%] rounded-full bg-moon/[0.09] blur-[150px] mix-blend-screen animate-[blobA_34s_ease-in-out_infinite]" />
      <div className="absolute top-[30%] -left-[10%] w-[50%] h-[48%] rounded-full bg-moon-deep/[0.16] blur-[150px] mix-blend-screen animate-[blobB_40s_ease-in-out_infinite]" />
      <div className="absolute -bottom-[8%] right-[12%] w-[48%] h-[44%] rounded-full bg-moon/[0.10] blur-[150px] mix-blend-screen animate-[blobC_46s_ease-in-out_infinite]" />
      {/* film grain */}
      <div className="absolute inset-0 opacity-70 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
      <div className="absolute inset-0 opacity-[0.12] mix-blend-screen" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
    </div>
  );
};

export default Background;
