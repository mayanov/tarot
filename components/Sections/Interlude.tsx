import React from 'react';
import FadeIn from '../UI/FadeIn';
import SkyLayer from '../UI/SkyLayer';

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
      className="relative overflow-hidden isolate text-cream py-24 md:py-32 border-y border-white/[0.08]"
      style={{
        background:
          'linear-gradient(165deg, #241546 0%, #3A1C46 55%, #4A2247 100%)',
      }}
    >
      {/* rose-dusk sky — stars + small clouds + a warm bloom from below */}
      <SkyLayer
        cloud="rgba(236,188,216,0.13)"
        star="rgba(255,238,247,0.9)"
        glow="radial-gradient(60% 80% at 50% 116%, rgba(232,150,190,0.26) 0%, rgba(180,120,180,0.10) 44%, transparent 74%)"
      />

      {/* film grain */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{ backgroundImage: GRAIN, backgroundSize: '150px 150px' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
        <FadeIn>
          <div className="max-w-5xl mx-auto text-center">
            {/* pull-quote */}
            <p className="font-elegant italic text-cream text-[2rem] sm:text-[2.6rem] md:text-[3.4rem] lg:text-[3.9rem] leading-[1.08] tracking-[-0.01em]">
              {isIndonesian ? (
                <>Tarot bukan meramal masa depan — tapi memberi <span className="text-moon">kejelasan</span> untuk kamu bentuk sendiri.</>
              ) : (
                <>Tarot won&rsquo;t predict your future — it hands you the <span className="text-moon">clarity</span> to shape it.</>
              )}
            </p>

            {/* signature */}
            <div className="mt-10 md:mt-12 text-[0.72rem] uppercase tracking-[0.26em] text-cream/50">
              {isIndonesian ? 'Mayanov · Pembaca Tarot' : 'Mayanov · Tarot Reader'}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Interlude;
