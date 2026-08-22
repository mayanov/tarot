import React from 'react';
import FadeIn from '../UI/FadeIn';
import SectionHeader from '../UI/SectionHeader';

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
      className="py-12 md:py-16 relative overflow-hidden border-y border-line"
      style={{
        background:
          'radial-gradient(58% 48% at 4% -4%, rgba(93,122,153,0.38), rgba(243,237,230,0) 58%), radial-gradient(64% 60% at 100% 104%, rgba(86,77,77,0.30), rgba(243,237,230,0) 60%), linear-gradient(160deg, #E4E7EC 0%, #E3E4E5 55%, #E5E4E2 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <FadeIn>
          <SectionHeader
            label={isIndonesian ? 'Nilai' : 'Why Me'}
            index="(01 — 04)"
            title={isIndonesian ? 'Kenapa baca tarot sama Mayanov?' : 'Why work with me?'}
            intro={isIndonesian
              ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan sesi curhat yang penuh insight.'
              : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, and centered on you.'}
          />

          {/* Editorial index, not cards */}
          <div className="border-t border-ink/10">
            {reasons.map((reason, index) => {
              const tone = ['text-coral', 'text-plum', 'text-blue', 'text-sage'][index % 4];
              return (
                <div
                  key={index}
                  className="group grid md:grid-cols-12 gap-x-8 gap-y-2 items-baseline py-4 md:py-6 border-b border-ink/10 transition-colors"
                >
                  <div className={`md:col-span-2 font-serif text-3xl md:text-5xl leading-none ${tone}`}>
                    0{index + 1}
                  </div>
                  <h3 className="md:col-span-4 text-xl md:text-2xl font-serif font-medium text-ink leading-snug transition-transform duration-300 md:group-hover:translate-x-1.5">
                    {reason.title}
                  </h3>
                  <p className="md:col-span-6 text-ink-soft font-light leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default WhyChoose;
