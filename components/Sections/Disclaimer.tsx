import React from 'react';
import { AlertCircle } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface DisclaimerProps {
    isIndonesian?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ isIndonesian = false }) => {
    const items = [
        {
            label: isIndonesian ? 'Bukan pengganti ahlinya' : 'Not a substitute for the pros',
            text: isIndonesian
                ? 'Untuk hal medis, hukum, keuangan, atau psikologis, tetap konsultasi ke profesional ya — tarot bukan penggantinya.'
                : "For anything medical, legal, financial, or mental-health related, please talk to a qualified professional — tarot isn't a replacement for that.",
        },
        {
            label: isIndonesian ? 'Keputusan tetap punyamu' : 'The choices stay yours',
            text: isIndonesian
                ? 'Aku bantu kasih sudut pandang dan pilihan, tapi apa yang kamu putuskan setelahnya sepenuhnya ada di tanganmu.'
                : "I'll offer perspective and options, but whatever you decide to do afterward is completely up to you.",
        },
        {
            label: isIndonesian ? 'Nggak ada yang mutlak' : 'Nothing is set in stone',
            text: isIndonesian
                ? 'Kartu menunjukkan gambaran saat ini, bukan takdir yang pasti. Usaha dan pilihanmu selalu bisa mengubah arah.'
                : 'The cards show a snapshot of right now, not a fixed fate. Your effort and choices can always change where things go.',
        },
    ];

    return (
        <section id="disclaimer" className="py-12 md:py-16 relative isolate text-cream" style={{ background: '#0C1430' }}>
            {/* soft moonstone bloom for depth */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(90% 70% at 88% 0%, rgba(198,178,228,0.10) 0%, transparent 55%)' }}
            />
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
                {/* header — title + alert notice */}
                <FadeIn>
                    <div className="max-w-2xl">
                        <h2 className="font-elegant font-semibold text-cream text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                            Disclaimer
                        </h2>
                        {/* alert notice — meant to be noticed */}
                        <div className="mt-6 inline-flex items-start gap-3 rounded-lg border border-moon/35 bg-moon/[0.09] px-4 py-3.5">
                            <AlertCircle className="w-5 h-5 text-moon shrink-0 mt-0.5" strokeWidth={1.8} />
                            <p className="text-sm text-cream/90 leading-relaxed">
                                {isIndonesian
                                    ? 'Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini.'
                                    : 'By making a booking, you have agreed to these terms and conditions.'}
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* bold editorial numbered notes */}
                <div className="mt-10 md:mt-14">
                    {items.map((it, index) => (
                        <FadeIn key={index} delay={Math.min(index, 4) * 80} dir="up">
                            <div className="group grid grid-cols-[auto_1fr] items-start gap-x-5 md:gap-x-12 py-7 md:py-9 border-t border-white/10 first:border-t-0">
                                <span
                                    aria-hidden
                                    className="font-elegant font-semibold leading-none text-transparent text-[3rem] md:text-[5.5rem] transition-all duration-300 group-hover:text-moon"
                                    style={{ WebkitTextStroke: '1.5px rgba(198,178,228,0.55)' }}
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="pt-1 md:pt-3 max-w-2xl">
                                    <h3 className="font-elegant font-semibold text-cream text-xl md:text-3xl leading-snug tracking-tight">
                                        {it.label}
                                    </h3>
                                    <p className="mt-2 md:mt-3 text-cream/60 text-sm md:text-base leading-relaxed font-light">
                                        {it.text}
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
