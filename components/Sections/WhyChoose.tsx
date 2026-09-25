import React from 'react';
import FadeIn from '../UI/FadeIn';
import Testimonials from './Testimonials';

interface WhyChooseProps {
  isIndonesian?: boolean;
}

interface ReasonItem {
  label: string; // small eyebrow category
  stat: string;  // the big punchy statement
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
      <div className="text-ink" style={{ background: '#ffffff' }}>
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 pt-12 md:pt-16">
          {/* Big lead statement */}
          <FadeIn>
            <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em] max-w-4xl">
              {isIndonesian ? 'Kenapa tarot sama Mayanov?' : 'Why work with me?'}
            </h2>
            <p className="mt-6 text-lg md:text-xl text-ink/60 font-light leading-relaxed max-w-2xl">
              {isIndonesian
                ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan ruang aman untuk bercerita, dengan kesimpulan yang jelas dan langkah yang bisa kamu ambil.'
                : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
            </p>
          </FadeIn>

          {/* Big-stat panels — eyebrow label, a bold centered statement, an index number */}
          <div className="mt-12 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {reasons.map((reason, index) => (
              <FadeIn key={index} delay={Math.min(index, 6) * 60} dir="up">
                <div className="group/card relative overflow-hidden flex h-full min-h-[18rem] md:min-h-[23rem] flex-col rounded-lg bg-[#202A5C] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(74,46,119,0.6)]">
                  {/* purple reveal — a diagonal gradient that wipes up from the corner on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-bottom translate-y-full scale-y-100 bg-gradient-to-tr from-[#33205C] via-[#4A2E77] to-[#6B3FA0] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:translate-y-0"
                  />
                  <div className="relative z-10 flex flex-1 flex-col p-6 md:p-8">
                    {/* eyebrow */}
                    <div className="flex items-center gap-2.5 text-sm md:text-[0.95rem] text-cream/70 transition-colors duration-300 group-hover/card:text-cream/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-cream/70 shrink-0 transition-all duration-300 group-hover/card:bg-moon group-hover/card:scale-125" />
                      <span>{reason.label}</span>
                    </div>
                    {/* big statement */}
                    <div className="flex-1 grid place-items-center py-8">
                      <p className="text-center font-semibold text-cream text-[1.55rem] md:text-[1.9rem] leading-[1.12] tracking-[-0.02em] max-w-[15ch] transition-transform duration-300 group-hover/card:-translate-y-0.5">
                        {reason.stat}
                      </p>
                    </div>
                    {/* index */}
                    <div className="text-sm text-cream/40 tabular-nums transition-colors duration-300 group-hover/card:text-moon">{String(index + 1).padStart(2, '0')}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ===== Social proof — testimonials merged into this section ===== */}
        <div className="pt-16 md:pt-24 pb-12 md:pb-16">
          <Testimonials isIndonesian={isIndonesian} />
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
