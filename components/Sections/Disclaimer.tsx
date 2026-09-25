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

                    {/* RIGHT — each note as a small white tarot card (frame + roman numeral) */}
                    <div className="lg:col-span-8 space-y-3 md:space-y-4">
                        {items.map((it, index) => (
                            <FadeIn key={index} delay={Math.min(index, 4) * 70}>
                                {/* white card w/ tarot frame */}
                                <div className="group relative rounded-xl bg-white p-1.5 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_56px_-26px_rgba(0,0,0,0.55)]">
                                    <div className="relative overflow-hidden rounded-lg border border-ink/10 px-5 md:px-6 py-4 md:py-5">
                                        {/* ghosted icon watermark */}
                                        <it.Icon aria-hidden className="pointer-events-none absolute -right-4 -bottom-5 w-24 h-24 text-ink/[0.04] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1} />
                                        {/* roman numeral — the tarot signature */}
                                        <span aria-hidden className="absolute top-4 right-5 font-serif text-moon-deep/50 text-xs tracking-[0.25em]">
                                            {['I', 'II', 'III'][index]}
                                        </span>
                                        <div className="relative flex items-center gap-3.5">
                                            {/* emblem */}
                                            <span className="shrink-0 grid place-items-center w-10 h-10 rounded-full border border-ink/10 bg-moon/15 text-moon-deep">
                                                <it.Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
                                            </span>
                                            <h3 className="font-serif font-semibold text-ink text-base md:text-lg leading-snug tracking-tight">
                                                {it.label}
                                            </h3>
                                        </div>
                                        <p className="relative mt-2.5 text-ink/55 text-sm leading-relaxed font-light max-w-xl">
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
