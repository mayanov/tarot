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
      className="relative overflow-hidden isolate text-ink py-14 md:py-20"
      style={{
        background:
          'radial-gradient(120% 140% at 50% 0%, #FFFFFF 0%, #FCFBFC 42%, #F1EEEF 100%)',
      }}
    >
      {/* faint texture so the colour block isn't flat */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.4) 0, transparent 40%)',
        }}
      />

      {/* film grain — noise texture over the surface */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-30"
        style={{ backgroundImage: GRAIN, backgroundSize: '150px 150px' }}
      />

      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <FadeIn>
          <div className="max-w-5xl mx-auto text-center">
            {/* pull-quote */}
            <p className="font-elegant italic text-[#5B2E8C] text-[2rem] sm:text-[2.6rem] md:text-[3.4rem] lg:text-[3.9rem] leading-[1.08] tracking-[-0.01em]">
              {isIndonesian ? (
                <>Tarot bukan meramal masa depan — tapi memberi <span className="not-italic font-serif font-semibold">kejelasan</span> untuk kamu bentuk sendiri.</>
              ) : (
                <>Tarot won&rsquo;t predict your future — it hands you the <span className="not-italic font-serif font-semibold">clarity</span> to shape it.</>
              )}
            </p>

            {/* signature */}
            <div className="mt-10 md:mt-12 text-[0.72rem] uppercase tracking-[0.26em] text-ink/55">
              {isIndonesian ? 'Mayanov · Pembaca Tarot' : 'Mayanov · Tarot Reader'}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Interlude;
