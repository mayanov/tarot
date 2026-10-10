import React from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';

interface TarotIntroProps {
  isIndonesian?: boolean;
}

/**
 * A calm, dark editorial band between About and Services — replaces the old
 * scrolling marquee with a real explanation of what a reading feels like.
 * Keeps the dark "breath" in the light→dark→light section rhythm.
 */
const TarotIntro: React.FC<TarotIntroProps> = ({ isIndonesian = false }) => {
  return (
    <section
      id="tarot-intro"
      className="relative overflow-hidden isolate text-cream py-24 md:py-32"
      style={{ background: 'linear-gradient(160deg, #39234E 0%, #241539 58%, #14112B 100%)' }}
    >
      <div className="mx-auto px-8 relative z-10 max-w-4xl">
        <FadeIn>
          <p className="text-cream/50 text-sm font-medium tracking-wide">
            {isIndonesian ? 'Rasanya seperti apa' : 'What a reading feels like'}
          </p>
          <h2 className="mt-5 font-elegant font-medium text-[clamp(2rem,5.2vw,3.6rem)] leading-[1.08] tracking-[-0.02em] max-w-3xl">
            <MaskReveal>
              {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
            </MaskReveal>
          </h2>
        </FadeIn>
        <FadeIn delay={120}>
          <p className="mt-8 md:mt-9 text-cream/70 font-light text-lg md:text-xl leading-relaxed max-w-2xl">
            {isIndonesian
              ? 'Tanpa tekanan, tanpa menghakimi, tanpa ramalan yang menakutkan. Bawa saja apa pun yang sedang kamu rasakan — bahkan pertanyaan yang masih berantakan. Kita buka kartunya, pahami polanya bareng, lalu ubah jadi langkah yang jelas dan bisa kamu ambil. Datang apa adanya.'
              : 'No pressure, no judgment, no scary predictions. Bring whatever you’re carrying — even the messy, half-formed questions. We lay the cards, make sense of the patterns together, and turn them into clear, doable next steps. Come as you are.'}
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default TarotIntro;
