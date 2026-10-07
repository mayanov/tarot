import React from 'react';
import IlluminateText from '../UI/IlluminateText';

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
      className="relative overflow-hidden isolate text-cream py-16 md:py-20"
      style={{ background: '#2A1330' }}
    >
      {/* aurora sky photo — drifts slower than the content (parallax) */}
      <div
        data-parallax="0.05"
        data-parallax-scale="1.18"
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}aurora-quote.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          transform: 'scale(1.18)',
        }}
      />
      {/* cool, lighter overlay so the quote reads without feeling gloomy */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(6,12,24,0.36) 0%, rgba(6,12,24,0.22) 50%, rgba(6,12,24,0.44) 100%)' }}
      />


      <div className="mx-auto px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
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
        <span className="font-elegant text-white text-xl md:text-3xl leading-none">Mayanov</span>
      </div>
    </section>
  );
};

export default Interlude;
