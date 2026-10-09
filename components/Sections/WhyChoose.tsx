import React from 'react';
import { Compass, Heart, MessageCircle, Lock, Award, Feather } from 'lucide-react';
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

// Soft line icons, one per reason (same order in both languages).
const ICONS = [Compass, Heart, MessageCircle, Lock, Award, Feather];

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

          {/* Calm, airy panels — a soft icon chip, a serif statement, a gentle supporting label */}
          <div className="mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {reasons.map((reason, index) => {
              const Icon = ICONS[index];
              return (
                <FadeIn key={index} delay={Math.min(index, 6) * 80} dir="up">
                  <div className="group/card h-full rounded-[1.75rem] border border-ink/[0.07] bg-white p-6 md:p-8 shadow-[0_18px_44px_-30px_rgba(33,30,46,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-moon/15 hover:shadow-[0_26px_54px_-30px_rgba(107,63,160,0.3)]">
                    {/* soft pastel icon chip */}
                    <div className="w-12 h-12 rounded-2xl bg-moon/10 text-moon grid place-items-center transition-colors duration-300 group-hover/card:bg-moon/[0.16]">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    {/* calm statement */}
                    <p className="mt-5 font-elegant text-ink text-[1.3rem] md:text-[1.5rem] leading-[1.2] tracking-[-0.01em]">
                      {reason.stat}
                    </p>
                    {/* supporting label */}
                    <p className="mt-2.5 text-sm text-moon/70 font-medium">{reason.label}</p>
                  </div>
                </FadeIn>
              );
            })}
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
