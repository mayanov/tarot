import React from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';

interface TarotIntroProps {
  isIndonesian?: boolean;
}

/**
 * A calm, dark editorial band between About and Services — replaces the old
 * scrolling marquee with a real explanation of what a reading feels like.
 * Two columns, a soft violet bloom for depth, and the old ticker's reassuring
 * phrases revived as quiet affirmations. Keeps the dark section rhythm.
 */
const TarotIntro: React.FC<TarotIntroProps> = ({ isIndonesian = false }) => {
  const affirmations = isIndonesian
    ? ['Datang apa adanya', 'Tanpa tekanan', 'Tanpa dihakimi', 'Rahasia terjaga']
    : ['Come as you are', 'No pressure', 'No judgment', 'Kept between us'];

  return (
    <section
      id="tarot-intro"
      className="relative overflow-hidden isolate text-cream py-24 md:py-32"
      style={{ background: 'linear-gradient(160deg, #39234E 0%, #241539 58%, #14112B 100%)' }}
    >
      {/* soft violet bloom — depth, so the dark band isn't flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 -right-1/4 w-[46rem] h-[46rem] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(circle, rgba(122,88,190,0.34), transparent 70%)' }}
      />

      <div className="mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-y-9 lg:gap-x-16 lg:items-start">
          {/* left — label + statement */}
          <div className="lg:col-span-5">
            <FadeIn>
              <h2 className="font-elegant font-medium text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.08] tracking-[-0.02em]">
                <MaskReveal>
                  {isIndonesian ? 'Ruang tenang untuk berpikir dengan jujur.' : 'A calm space to think out loud.'}
                </MaskReveal>
              </h2>
            </FadeIn>
          </div>

          {/* right — the explanation + quiet affirmations */}
          <div className="lg:col-span-6 lg:col-start-7">
            <FadeIn delay={120}>
              <p className="text-cream/90 font-light text-lg md:text-xl leading-relaxed">
                {isIndonesian
                  ? 'Kita buka kartunya dan baca energi yang sedang kamu bawa — pola yang sedang kamu jalani, perasaan yang belum sempat kamu ucapkan — lalu kita ubah jadi langkah yang jelas dan bisa kamu ambil.'
                  : 'We lay the cards and read the energy you’re carrying — the patterns you’re in, the feelings you haven’t quite put into words — then turn them into clear, doable next steps.'}
              </p>

              <p className="mt-6 font-elegant italic text-[#C9B8E8] text-xl md:text-[1.6rem] leading-snug">
                {isIndonesian ? 'Bukan meramal, tapi memahami — bareng-bareng.' : 'Less fortune-telling, more figuring it out — together.'}
              </p>

              <div className="mt-9 pt-7 border-t border-cream/10 flex flex-wrap items-center gap-x-4 gap-y-3 font-elegant italic text-cream/70 text-[1.05rem]">
                {affirmations.map((w, i) => (
                  <span key={w} className="inline-flex items-center gap-4">
                    {i > 0 && <span aria-hidden className="not-italic text-cream/25">&middot;</span>}
                    {w}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TarotIntro;
