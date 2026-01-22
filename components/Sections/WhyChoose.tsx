import React from 'react';
import FadeIn from '../UI/FadeIn';
import { Smile, Lock, Send } from 'lucide-react';

interface WhyChooseProps {
  isIndonesian?: boolean;
}

interface ReasonItem {
  title: string;
  description: string;
  color: string;
  borderColor: string;
  textColor: string;
  bgGradient: string;
  icon?: React.ReactNode;
}

const WhyChoose: React.FC<WhyChooseProps> = ({ isIndonesian = false }) => {
  // Global Content
  const reasonsGlobal: ReasonItem[] = [
    {
      title: "Your Power, First",
      description: "I focus on actionable steps. This is about strategy and choices, not just fate.",
      color: "from-gold-accent/20 to-transparent",
      borderColor: "group-hover:border-gold-accent/50",
      textColor: "text-gold-accent",
      bgGradient: "from-[#252535] to-[#1A1A27]"
    },
    {
      title: "Therapeutic Insight, Friendly Vibe",
      description: "A unique blend of therapeutic insight and warm friendship. Safe, non-judgmental, and deeply supportive.",
      color: "from-teal-accent/20 to-transparent",
      borderColor: "group-hover:border-teal-accent/50",
      textColor: "text-teal-accent",
      bgGradient: "from-[#1A2530] to-[#1A1A27]"
    },
    {
      title: "Here For You, Anywhere",
      description: "Get detailed readings via email or meet face-to-face on Google Meet.",
      color: "from-lilac/20 to-transparent",
      borderColor: "group-hover:border-lilac/50",
      textColor: "text-lilac",
      bgGradient: "from-[#2A2035] to-[#1A1A27]"
    },
    {
      title: "Strictly Confidential",
      description: "What we discuss stays between us. Your privacy is my top priority.",
      color: "from-pink-400/20 to-transparent",
      borderColor: "group-hover:border-pink-400/50",
      textColor: "text-pink-400",
      bgGradient: "from-[#301A25] to-[#1A1A27]"
    }
  ];

  // Indonesian Content from HTML
  // Indonesian Content (Aligned with Global)
  const reasonsID: ReasonItem[] = [
    {
      title: "Bukan Nakutin, Tapi Empowering",
      description: "Pembacaan jujur yang fokus pada langkah nyata yang bisa kamu ambil. Baca tarot jadi soal susun strategi dan menentukan pilihan, bukan hanya pasrah pada keadaan",
      color: "from-gold-accent/20 to-transparent",
      borderColor: "group-hover:border-gold-accent/50",
      textColor: "text-gold-accent",
      bgGradient: "from-[#252535] to-[#1A1A27]"
    },
    {
      title: "Sesi Tarot yang Hangat Seperti Curhat",
      description: "Sesi tarot jadi ruangnya buat kamu bercerita dan dapat insight dengan aman dan tanpa penghakiman.",
      color: "from-teal-accent/20 to-transparent",
      borderColor: "group-hover:border-teal-accent/50",
      textColor: "text-teal-accent",
      bgGradient: "from-[#1A2530] to-[#1A1A27]"
    },
    {
      title: "Ada untuk Kamu di Mana Saja",
      description: "Dapatkan bacaan detil via chat, call/video call, ataupun temu langsung. Super fleksibel sesuai dengan kebutuhanmu.",
      color: "from-lilac/20 to-transparent",
      borderColor: "group-hover:border-lilac/50",
      textColor: "text-lilac",
      bgGradient: "from-[#2A2035] to-[#1A1A27]"
    },
    {
      title: "Rahasia Terjamin",
      description: "Apa yang kita bahas berhenti di antara kita. Cerita kamu dijamin aman.",
      color: "from-pink-400/20 to-transparent",
      borderColor: "group-hover:border-pink-400/50",
      textColor: "text-pink-400",
      bgGradient: "from-[#301A25] to-[#1A1A27]"
    }
  ];

  const reasons = isIndonesian ? reasonsID : reasonsGlobal;

  return (
    <section id="why-choose" className="py-24 relative bg-[#0F0F16] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-serif mb-6">
              {isIndonesian ? "Kenapa Baca Tarot sama Mayanov?" : "Why Work With Me?"}
            </h2>
            <p className="text-text-subtle text-lg max-w-2xl mx-auto">
              {isIndonesian
                ? "Sesi pembacaan tarot tidak menjadi sesuatu yang kaku, apalagi menyeramkan. Melainkan jadi sesi curhat yang penuh insight."
                : "Imagine the objectivity of a therapist mixed with the warmth of a best friend. My approach is grounded, practical, and centered on you."}
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, index) => (
              <div key={index} className={`relative bg-gradient-to-b ${reason.bgGradient} border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden`}>

                {/* Decorative Gradient Background */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${reason.color} blur-[40px] opacity-30 transition-opacity duration-500`}></div>

                {/* Large Number Background */}
                <div className="absolute -bottom-4 -right-2 text-8xl font-serif font-bold text-white/5 transition-colors duration-300 pointer-events-none select-none">
                  0{index + 1}
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex flex-col items-center text-center">
                    <h3 className={`text-base md:text-xl font-bold text-white mb-3 leading-tight ${isIndonesian ? 'text-lg' : ''}`}>{reason.title}</h3>
                  </div>

                  <p className={`text-[11px] md:text-sm text-text-subtle leading-relaxed font-medium ${isIndonesian ? 'text-center' : ''}`}>
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default WhyChoose;