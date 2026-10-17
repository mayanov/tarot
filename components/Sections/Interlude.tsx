import React from 'react';
import IlluminateText from '../UI/IlluminateText';
import CelestialMark from '../UI/CelestialMark';

interface InterludeProps {
  isIndonesian?: boolean;
}

/**
 * A full-bleed, saturated coral "interlude" band — a centered editorial
 * pull-quote in the Fraunces italic face. Deliberately breaks the run of
 * dark sections and ivory cards with a jolt of brand colour and a new layout.
 */
const Interlude: React.FC<InterludeProps> = ({ isIndonesian = false }) => {
  return (
    <section
      id="interlude"
      className="relative overflow-hidden isolate text-cream py-24 md:py-32"
      style={{ background: 'linear-gradient(165deg, #28336B 0%, #202A5C 48%, #0E1A3D 100%)' }}
    >
      {/* faint indigo glow for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-[60rem] h-[36rem] max-w-[120vw] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(74,96,190,0.28), transparent 70%)' }}
      />


      <div className="mx-auto px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* a quiet radiant sun — 'clarity, arriving' (completes the celestial set) */}
          <div className="mb-8 md:mb-11 flex justify-center">
            <CelestialMark name="sun" className="w-10 md:w-[3.25rem] text-cream/80 [filter:drop-shadow(0_4px_28px_rgba(6,4,14,0.5))]" />
          </div>
          {/* pull-quote — words illuminate one-by-one as it scrolls through view */}
          <IlluminateText
            className="font-elegant italic font-bold text-cream text-[2.5rem] sm:text-[3.4rem] md:text-[4.4rem] lg:text-[5.2rem] leading-[1.03] tracking-[-0.02em]"
            text={isIndonesian
              ? 'Tarot bukan meramal masa depan — tapi memberi kejelasan untuk kamu bentuk sendiri.'
              : 'Tarot won’t predict your future — it hands you the clarity to shape it.'}
          />
        </div>
      </div>

      {/* signature — bottom-right, off-axis so it feels hand-signed, not templated */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-12 z-10">
        <span className="font-elegant text-cream text-xl md:text-3xl leading-none">Mayanov</span>
      </div>
    </section>
  );
};

export default Interlude;
