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
    <section
      id="why-choose"
      className="pt-10 md:pt-16 pb-4 md:pb-6 relative overflow-hidden text-cream isolate"
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-plum-deep/80 backdrop-blur-md shadow-[0_14px_44px_-26px_rgba(0,0,0,0.55)] px-6 sm:px-10 md:px-14 lg:px-16 py-14 md:py-20">
          <div className="grid lg:grid-cols-12 gap-y-12 lg:gap-x-16">
            {/* LEFT — sticky editorial title */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <FadeIn>
                  <span className="inline-block text-[0.66rem] uppercase tracking-[0.3em] text-coral mb-6">
                    {isIndonesian ? 'Kenapa Mayanov' : 'Why me'}
                  </span>
                  <h2 className="font-serif font-semibold text-cream text-[2.6rem] md:text-[3.6rem] xl:text-[4.4rem] leading-[0.96] tracking-[-0.03em]">
                    {isIndonesian
                      ? <>Kenapa tarot<br />sama <span className="text-coral">Mayanov?</span></>
                      : <>Why work<br />with <span className="text-coral">me?</span></>}
                  </h2>
                  <p className="mt-6 text-cream/65 font-light leading-relaxed max-w-xs">
                    {isIndonesian
                      ? 'Sesi tarot yang tidak kaku atau menyeramkan — melainkan sesi curhat yang penuh insight.'
                      : 'The objectivity of a therapist mixed with the warmth of a best friend — grounded, practical, centered on you.'}
                  </p>
                </FadeIn>
              </div>
            </div>

            {/* RIGHT — oversized numbered editorial list */}
            <div className="lg:col-span-8 lg:col-start-5">
              {reasons.map((reason, index) => (
                <FadeIn key={index} delay={index * 55} dir="up">
                  <div className="group grid grid-cols-[2.6rem_1fr] md:grid-cols-[6rem_1fr] gap-4 md:gap-8 items-baseline py-7 md:py-9 border-t border-cream/12 first:border-t-0 first:pt-0">
                    <span className="font-serif font-bold tabular-nums leading-none text-[2.2rem] md:text-[4.5rem] text-transparent [-webkit-text-stroke:1.4px_rgba(255,246,240,0.5)] md:[-webkit-text-stroke:2px_rgba(255,246,240,0.5)] transition-all duration-300 group-hover:[-webkit-text-stroke-color:transparent] group-hover:text-coral">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="pt-1">
                      <h3 className="font-serif font-semibold text-cream text-xl md:text-[1.9rem] leading-[1.12] tracking-tight transition-transform duration-300 group-hover:translate-x-1.5">
                        {reason.title}
                      </h3>
                      <p className="mt-3 text-sm md:text-base text-cream/65 font-light leading-relaxed max-w-xl">
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
    </section>
  );
};

export default WhyChoose;
