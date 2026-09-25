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
                                    ? 'Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini.'
                                    : 'By making a booking, you have agreed to these terms and conditions.'}
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* a warm, personal note — the terms written like a hand-signed letter */}
                <FadeIn delay={80} dir="up">
                    <div className="mt-10 md:mt-14 max-w-3xl rounded-2xl bg-white text-ink p-7 md:p-10 shadow-[0_30px_70px_-34px_rgba(0,0,0,0.6)]">
                        <p className="font-elegant italic text-ink/70 text-lg md:text-xl leading-snug">
                            {isIndonesian ? 'Beberapa catatan jujur sebelum kita mulai —' : 'A few honest notes before we begin —'}
                        </p>

                        <ul className="mt-7 divide-y divide-ink/10">
                            {items.map((it, index) => (
                                <li key={index} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                                    <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-ink/10 bg-moon/15 text-moon-deep">
                                        <it.Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-serif font-semibold text-ink text-[0.95rem] md:text-base leading-snug tracking-tight">
                                            {it.label}
                                        </h3>
                                        <p className="mt-1 text-ink/55 text-sm leading-relaxed font-light">
                                            {it.text}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* signature */}
                        <div className="mt-7 pt-5 border-t border-ink/10 flex items-center gap-3">
                            <span className="font-elegant italic text-ink text-xl md:text-2xl">Mayanov</span>
                            <span aria-hidden className="text-moon-deep leading-none">✦</span>
                            <span className="text-[11px] uppercase tracking-[0.22em] text-ink/45">
                                {isIndonesian ? 'Pembaca Tarot' : 'Tarot Reader'}
                            </span>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Disclaimer;
