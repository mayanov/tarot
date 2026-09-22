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
      {/* LIGHT band — warm bone with dark text (noho-style) */}
      <div className="border-y border-black/[0.08] text-ink" style={{ background: 'linear-gradient(180deg, #EFEAE0 0%, #E7E0D5 100%)' }}>
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 py-24 md:py-32">
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

          {/* Feature prose blocks — titled paragraphs in a generous 2-column grid */}
          <div className="mt-16 md:mt-24 grid md:grid-cols-2 gap-x-12 lg:gap-x-28 gap-y-12 md:gap-y-16">
            {reasons.map((reason, index) => (
              <FadeIn key={index} delay={Math.min(index, 6) * 70} dir="up">
                <div className="max-w-xl">
                  <span aria-hidden className="block text-plum text-base leading-none mb-4">✦</span>
                  <h3 className="font-serif font-semibold text-ink text-xl md:text-[1.7rem] leading-[1.15] tracking-[-0.015em]">
                    {reason.title}
                  </h3>
                  <p className="mt-4 text-[0.95rem] md:text-base text-ink/65 font-light leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
