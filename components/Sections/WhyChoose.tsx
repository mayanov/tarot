import React from 'react';
import FadeIn from '../UI/FadeIn';

interface WhyChooseProps {
  isIndonesian?: boolean;
}

interface ReasonItem {
  title: string;
  description: string;
}

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
    <section id="why-choose" className="relative isolate">
      {/* full-bleed twilight-glass band — sky bleeds through, no floating card */}
      <div className="bg-[rgba(28,18,54,0.6)] backdrop-blur-[3px] border-y border-white/[0.08] text-cream">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-y-14 lg:gap-x-20">
            {/* LEFT — sticky intro */}
            <div className="lg:col-span-4">
              <FadeIn>
                <div className="lg:sticky lg:top-28">
                  <h2 className="font-elegant font-medium text-cream text-[2rem] md:text-[2.6rem] leading-[1.03] tracking-[-0.02em]">
                    {isIndonesian ? 'Kenapa tarot sama Mayanov?' : 'Why work with me?'}
                  </h2>
                  <p className="mt-6 text-[0.95rem] text-cream/55 font-light leading-relaxed max-w-xs">
                    {isIndonesian
                      ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan sesi curhat yang penuh insight.'
                      : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
                  </p>
                </div>
              </FadeIn>
            </div>

            {/* RIGHT — numbered editorial list */}
            <div className="lg:col-span-8">
              <div className="border-t border-cream/15">
                {reasons.map((reason, index) => (
                  <FadeIn key={index} delay={Math.min(index, 6) * 60} dir="up">
                    <div className="group grid grid-cols-[auto_1fr] gap-6 md:gap-12 py-7 md:py-9 border-b border-cream/15 transition-colors duration-300">
                      <span className="font-serif text-moon text-base md:text-lg tabular-nums pt-1.5 tracking-tight">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="transition-transform duration-300 group-hover:translate-x-1.5">
                        <h3 className="font-serif font-semibold text-cream text-xl md:text-[1.65rem] leading-[1.2] tracking-[-0.01em]">
                          {reason.title}
                        </h3>
                        <p className="mt-3 text-sm md:text-[0.95rem] text-cream/55 font-light leading-relaxed max-w-xl">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
