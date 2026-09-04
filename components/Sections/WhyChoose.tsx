import React from 'react';
import FadeIn from '../UI/FadeIn';
import { Compass, HeartHandshake, Globe, Lock, Award, Zap } from 'lucide-react';

interface WhyChooseProps {
  isIndonesian?: boolean;
}

interface ReasonItem {
  title: string;
  description: string;
}

const ICONS = [Compass, HeartHandshake, Globe, Lock, Award, Zap];

const WhyChoose: React.FC<WhyChooseProps> = ({ isIndonesian = false }) => {
  const reasonsGlobal: ReasonItem[] = [
    {
      title: 'Your Power, First',
      description: 'I focus on actionable steps. This is about strategy and choices, not just fate.',
    },
    {
      title: 'Therapeutic Insight, Friendly Vibe',
      description: 'A unique blend of therapeutic insight and warm friendship. Safe, non-judgmental, and deeply supportive.',
    },
    {
      title: 'Here For You, Anywhere',
      description: 'Get detailed readings via chat, call, or meet face-to-face — whatever suits you.',
    },
    {
      title: 'Strictly Confidential',
      description: 'What we discuss stays between us. Your privacy is my top priority.',
    },
    {
      title: 'Rooted in Real Experience',
      description: 'Reading the cards since 2009 — over 15 years of grounded, practical wisdom.',
    },
    {
      title: 'Honest, Even When It Stings',
      description: 'You get the real read — not just what is comfortable to hear — always delivered with care.',
    },
  ];

  const reasonsID: ReasonItem[] = [
    {
      title: 'Bukan Nakutin, Tapi Empowering',
      description: 'Pembacaan jujur yang fokus pada langkah nyata yang bisa kamu ambil. Baca tarot jadi soal susun strategi dan menentukan pilihan, bukan hanya pasrah pada keadaan',
    },
    {
      title: 'Sesi Tarot yang Hangat Seperti Curhat',
      description: 'Sesi tarot jadi ruangnya buat kamu bercerita dan dapat insight dengan aman dan tanpa penghakiman.',
    },
    {
      title: 'Ada untuk Kamu di Mana Saja',
      description: 'Dapatkan bacaan detil via chat, call/video call, ataupun temu langsung. Super fleksibel sesuai dengan kebutuhanmu.',
    },
    {
      title: 'Rahasia Terjamin',
      description: 'Apa yang kita bahas berhenti di antara kita. Cerita kamu dijamin aman.',
    },
    {
      title: 'Berpengalaman Sejak 2009',
      description: 'Lebih dari 15 tahun membaca kartu — insight yang teruji, bukan sekadar tebakan.',
    },
    {
      title: 'Jujur, Meski Kadang Nampol',
      description: 'Kamu dapat bacaan apa adanya — bukan cuma yang enak didengar — tapi selalu disampaikan dengan hati.',
    },
  ];

  const reasons = isIndonesian ? reasonsID : reasonsGlobal;

  return (
    <section
      id="why-choose"
      className="py-10 md:py-16 relative overflow-hidden text-cream isolate"
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-plum-deep/80 backdrop-blur-md shadow-[0_40px_120px_-55px_rgba(0,0,0,0.85)] px-6 sm:px-10 md:px-14 lg:px-16 py-14 md:py-20">
          <FadeIn>
            {/* header — title left, subtitle right */}
            <div className="grid lg:grid-cols-12 gap-y-5 lg:gap-x-16 items-end mb-10 md:mb-14">
              <h2 className="lg:col-span-7 font-serif font-semibold text-cream text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
                {isIndonesian ? 'Kenapa baca tarot sama Mayanov?' : 'Why work with me?'}
              </h2>
              <p className="lg:col-span-4 lg:col-start-9 text-cream/70 font-light leading-relaxed lg:pb-2">
                {isIndonesian
                  ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan sesi curhat yang penuh insight.'
                  : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
              </p>
            </div>

            {/* feature cards — 6 in a responsive grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {reasons.map((reason, index) => {
                const Icon = ICONS[index % ICONS.length];
                return (
                  <FadeIn key={index} delay={index * 70} dir="up">
                    <div className="group h-full rounded-2xl bg-white/[0.08] p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
                      <Icon className="w-7 h-7 text-coral transition-transform duration-300 group-hover:scale-110" strokeWidth={1.75} />
                      <h3 className="mt-5 text-lg md:text-xl font-serif font-semibold text-cream leading-snug tracking-tight">
                        {reason.title}
                      </h3>
                      <p className="mt-2.5 text-sm md:text-[0.95rem] text-cream font-light leading-relaxed">
                        {reason.description}
                      </p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
