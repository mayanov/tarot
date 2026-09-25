import React from 'react';
import { ShieldCheck, Compass, Sparkles, AlertCircle } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface DisclaimerProps {
    isIndonesian?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ isIndonesian = false }) => {
    const items = [
        {
            Icon: ShieldCheck,
            label: isIndonesian ? 'Bukan pengganti ahlinya' : 'Not a substitute for the pros',
            text: isIndonesian
                ? 'Untuk hal medis, hukum, keuangan, atau psikologis, tetap konsultasi ke profesional ya — tarot bukan penggantinya.'
                : "For anything medical, legal, financial, or mental-health related, please talk to a qualified professional — tarot isn't a replacement for that.",
        },
        {
            Icon: Compass,
            label: isIndonesian ? 'Keputusan tetap punyamu' : 'The choices stay yours',
            text: isIndonesian
                ? 'Aku bantu kasih sudut pandang dan pilihan, tapi apa yang kamu putuskan setelahnya sepenuhnya ada di tanganmu.'
                : "I'll offer perspective and options, but whatever you decide to do afterward is completely up to you.",
        },
        {
            Icon: Sparkles,
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
                        {/* alert notice — meant to be noticed, not a quiet subtitle */}
                        <div className="mt-6 inline-flex items-start gap-3 rounded-lg border border-moon/35 bg-moon/[0.09] px-4 py-3.5">
                            <AlertCircle className="w-5 h-5 text-moon shrink-0 mt-0.5" strokeWidth={1.8} />
                            <p className="text-sm text-cream/90 leading-relaxed">
                                {isIndonesian
                                    ? 'Baca dulu ya — dengan booking, kamu dianggap sudah setuju dengan poin-poin ini.'
                                    : 'Please read first — by booking, you agree to the points here.'}
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* a 3-card tarot spread — the notes fanned out like a reading */}
                <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                    {items.map((it, index) => {
                        const tilt = ['md:-rotate-[2.5deg]', 'md:-translate-y-4', 'md:rotate-[2.5deg]'][index];
                        return (
                            <FadeIn key={index} delay={Math.min(index, 4) * 90} dir="up">
                                <div className={`group relative origin-bottom rounded-xl bg-white p-1.5 shadow-[0_22px_50px_-28px_rgba(0,0,0,0.55)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!rotate-0 hover:-translate-y-3 hover:z-20 hover:shadow-[0_36px_70px_-26px_rgba(0,0,0,0.6)] ${tilt}`}>
                                    <div className="relative flex h-full flex-col items-center overflow-hidden rounded-lg border border-ink/10 px-6 py-7 md:py-8 text-center">
                                        {/* ghosted icon watermark */}
                                        <it.Icon aria-hidden className="pointer-events-none absolute -right-6 -bottom-7 w-28 h-28 text-ink/[0.035] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1} />
                                        {/* roman numeral — the tarot signature */}
                                        <span aria-hidden className="font-serif text-moon-deep/55 text-sm tracking-[0.3em] mb-4">
                                            {['I', 'II', 'III'][index]}
                                        </span>
                                        {/* emblem */}
                                        <span className="grid place-items-center w-12 h-12 rounded-full border border-ink/10 bg-moon/15 text-moon-deep">
                                            <it.Icon className="w-5 h-5" strokeWidth={1.7} />
                                        </span>
                                        <h3 className="relative mt-4 font-serif font-semibold text-ink text-base md:text-lg leading-snug tracking-tight">
                                            {it.label}
                                        </h3>
                                        <p className="relative mt-2 text-ink/55 text-sm leading-relaxed font-light">
                                            {it.text}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
