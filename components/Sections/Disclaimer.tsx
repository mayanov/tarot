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
                <div className="grid lg:grid-cols-12 gap-y-9 lg:gap-x-16 lg:items-start">
                    {/* LEFT — sticky title + alert notice */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                        <FadeIn>
                            <h2 className="font-elegant font-semibold text-cream text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                                Disclaimer
                            </h2>

                            {/* alert notice — meant to be noticed, not a quiet subtitle */}
                            <div className="mt-6 flex items-start gap-3 rounded-lg border border-moon/35 bg-moon/[0.09] px-4 py-3.5 max-w-sm">
                                <AlertCircle className="w-5 h-5 text-moon shrink-0 mt-0.5" strokeWidth={1.8} />
                                <p className="text-sm text-cream/90 leading-relaxed">
                                    {isIndonesian
                                        ? 'Baca dulu ya — dengan booking, kamu dianggap sudah setuju dengan poin-poin ini.'
                                        : 'Please read first — by booking, you agree to the points here.'}
                                </p>
                            </div>
                        </FadeIn>
                    </div>

                    {/* RIGHT — warm, plain-spoken notes (no legal numbering) */}
                    <div className="lg:col-span-8">
                        {items.map((it, index) => (
                            <FadeIn key={index} delay={Math.min(index, 4) * 70}>
                                <div className="group relative flex items-start gap-4 md:gap-5 rounded-lg px-3 md:px-4 py-5 md:py-6 border-t border-white/10 first:border-t-0 transition-colors duration-300 hover:bg-white/[0.03]">
                                    {/* left accent bar (grows on hover) */}
                                    <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-moon rounded-full transition-all duration-300 group-hover:h-[55%]" />
                                    {/* icon */}
                                    <span className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-white/[0.05] border border-white/12 text-moon transition-colors duration-300 group-hover:border-moon/40">
                                        <it.Icon className="w-5 h-5" strokeWidth={1.6} />
                                    </span>
                                    {/* body */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif font-semibold text-cream text-base md:text-lg leading-snug tracking-tight">
                                            {it.label}
                                        </h3>
                                        <p className="mt-1.5 text-cream/60 text-sm md:text-[0.95rem] leading-relaxed font-light">
                                            {it.text}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
