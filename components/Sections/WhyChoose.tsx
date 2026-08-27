import React from 'react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';

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
      description: 'Get detailed readings via email or meet face-to-face on Google Meet.',
    },
    {
      title: 'Strictly Confidential',
      description: 'What we discuss stays between us. Your privacy is my top priority.',
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
  ];

  const reasons = isIndonesian ? reasonsID : reasonsGlobal;

  return (
    <section
      id="why-choose"
      className="py-16 md:py-24 relative overflow-hidden text-cream isolate"
    >

      <div className="max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <FadeIn>
          <div className="grid lg:grid-cols-12 gap-y-12 lg:gap-x-16 items-start">
            {/* LEFT — heading */}
            <div className="lg:col-span-4">
              <h2 className="font-serif font-semibold text-cream text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
                {isIndonesian ? 'Kenapa baca tarot sama Mayanov?' : 'Why work with me?'}
              </h2>
              <p className="mt-6 text-cream/60 font-light leading-relaxed max-w-sm">
                {isIndonesian
                  ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan sesi curhat yang penuh insight.'
                  : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
              </p>
            </div>

            {/* RIGHT — big numbered index */}
            <div className="lg:col-span-7 lg:col-start-6 border-t border-cream/15">
              {reasons.map((reason, index) => (
                <FadeIn key={index} delay={index * 90} dir="right">
                  <div className="group grid grid-cols-[auto_1fr] gap-x-5 md:gap-x-8 py-7 md:py-8 border-b border-cream/15">
                    <span className="font-serif font-semibold text-2xl md:text-4xl leading-none text-coral/90 tabular-nums">
                      0{index + 1}
                    </span>
                    <div className="transition-transform duration-300 md:group-hover:translate-x-1.5">
                      <h3 className="text-xl md:text-2xl font-serif font-semibold text-cream leading-snug tracking-tight">
                        {reason.title}
                      </h3>
                      <p className="mt-2.5 text-cream/60 font-light leading-relaxed max-w-xl">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default WhyChoose;
