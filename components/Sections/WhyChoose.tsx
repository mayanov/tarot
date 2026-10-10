import React from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import SoftAura from '../UI/SoftAura';
import Testimonials from './Testimonials';

interface WhyChooseProps {
  isIndonesian?: boolean;
}

interface ReasonItem {
  label: string; // small supporting category
  stat: string;  // the calm headline statement
}

const WhyChoose: React.FC<WhyChooseProps> = ({ isIndonesian = false }) => {
  const reasonsGlobal: ReasonItem[] = [
    { label: 'Empowering', stat: 'Your power, first' },
    { label: 'Warm & safe', stat: 'Therapy meets a best friend' },
    { label: 'Flexible', stat: 'Chat, call, or in person' },
    { label: 'Confidential', stat: 'Stays between us' },
    { label: 'Experienced', stat: 'Reading since 2009' },
    { label: 'Honest', stat: 'The real read, with care' },
  ];

  const reasonsID: ReasonItem[] = [
    { label: 'Empowering', stat: 'Fokus ke langkah nyata' },
    { label: 'Hangat & aman', stat: 'Senyaman curhat ke bestie' },
    { label: 'Fleksibel', stat: 'Chat, call, atau tatap muka' },
    { label: 'Rahasia', stat: 'Berhenti di antara kita' },
    { label: 'Berpengalaman', stat: 'Membaca sejak 2009' },
    { label: 'Jujur', stat: 'Apa adanya, dengan hati' },
  ];

  const reasons = isIndonesian ? reasonsID : reasonsGlobal;

  return (
    <section id="why-choose" className="relative isolate overflow-hidden">
      {/* LIGHT band — white with dark text (no seam lines) */}
      <div className="relative isolate overflow-hidden text-ink" style={{ background: '#FFFFFF' }}>
        <SoftAura />
        <div className="relative z-10 mx-auto px-8 pt-20 md:pt-28">
          {/* Lead — left-aligned heading + paragraph across the top */}
          <FadeIn>
            <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em] max-w-4xl">
              <MaskReveal>{isIndonesian ? 'Kenapa tarot sama Mayanov?' : 'Why work with me?'}</MaskReveal>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-ink/60 font-light leading-relaxed max-w-2xl">
              {isIndonesian
                ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan ruang aman untuk bercerita, dengan kesimpulan yang jelas dan langkah yang bisa kamu ambil.'
                : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
            </p>
          </FadeIn>

          {/* Editorial list — no cards, no feature icons: two calm columns of big
              serif statements, each with a small lowercase italic label as a quiet
              kicker above it. Compact but still magazine, not a feature grid. */}
          <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-14 lg:gap-x-24 gap-y-9 md:gap-y-12">
            {reasons.map((reason, index) => (
              <FadeIn key={index} delay={Math.min(index, 6) * 80} dir="up">
                <div className="group/row">
                  {/* quiet kicker label */}
                  <span className="block font-elegant italic lowercase text-moon/70 text-[1rem] md:text-[1.05rem] transition-colors duration-500 group-hover/row:text-moon">
                    {reason.label}
                  </span>
                  {/* the statement does the talking */}
                  <p className="mt-2 font-elegant text-ink text-[1.5rem] md:text-[1.95rem] leading-[1.2] tracking-[-0.015em]">
                    {reason.stat}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ===== Social proof — testimonials merged into this section ===== */}
        <div className="pt-20 md:pt-32 pb-20 md:pb-28">
          <Testimonials isIndonesian={isIndonesian} />
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
