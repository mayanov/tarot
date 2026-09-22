import React from 'react';
import FadeIn from '../UI/FadeIn';

interface InterludeProps {
  isIndonesian?: boolean;
}

// Film-grain noise (same fractal-noise texture used across the site).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E\")";

/**
 * A full-bleed, saturated coral "interlude" band — a centered editorial
 * pull-quote in the Fraunces italic face. Deliberately breaks the run of
 * dark sections and ivory cards with a jolt of brand colour and a new layout.
 */
const Interlude: React.FC<InterludeProps> = ({ isIndonesian = false }) => {
  return (
    <section
      id="interlude"
      className="relative overflow-hidden isolate text-plum-deep py-20 md:py-28 border-y border-black/[0.06]"
      style={{
        background:
          'linear-gradient(180deg, #F1ECF6 0%, #E7DEF0 100%)',
      }}
    >
      {/* soft moonstone bloom from below — a light, airy accent moment */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 118%, rgba(158,134,201,0.20) 0%, rgba(158,134,201,0.06) 42%, transparent 72%)',
        }}
      />

      {/* film grain — very subtle over the light surface */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.05]"
        style={{ backgroundImage: GRAIN, backgroundSize: '150px 150px' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
        <FadeIn>
          <div className="max-w-5xl mx-auto text-center">
            {/* pull-quote */}
            <p className="font-elegant italic text-plum-deep text-[2rem] sm:text-[2.6rem] md:text-[3.4rem] lg:text-[3.9rem] leading-[1.08] tracking-[-0.01em]">
              {isIndonesian ? (
                <>Tarot bukan meramal masa depan — tapi memberi <span className="text-[#7C4DB8]">kejelasan</span> untuk kamu bentuk sendiri.</>
              ) : (
                <>Tarot won&rsquo;t predict your future — it hands you the <span className="text-[#7C4DB8]">clarity</span> to shape it.</>
              )}
            </p>

            {/* signature */}
            <div className="mt-10 md:mt-12 text-[0.72rem] uppercase tracking-[0.26em] text-plum-deep/50">
              {isIndonesian ? 'Mayanov · Pembaca Tarot' : 'Mayanov · Tarot Reader'}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Interlude;
