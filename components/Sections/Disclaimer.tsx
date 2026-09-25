import React from 'react';
import { ShieldCheck, Compass, Sparkles } from 'lucide-react';
import FadeIn from '../UI/FadeIn';

interface DisclaimerProps {
    isIndonesian?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ isIndonesian = false }) => {
    const items = [
        {
            Icon: ShieldCheck,
            label: isIndonesian ? 'Bukan pengganti profesional' : 'Not professional advice',
            text: isIndonesian
                ? 'Tarot bukan pengganti profesional bidang hukum, keuangan, kesehatan, dan psikologi.'
                : 'Tarot is not a substitute for professional services in law, finance, health, or psychology.',
        },
        {
            Icon: Compass,
            label: isIndonesian ? 'Keputusan ada di tanganmu' : 'Your decisions, your path',
            text: isIndonesian
                ? 'Segala keputusan setelah sesi reading di luar tanggung jawab reader.'
                : "All decisions made after the reading session are outside the reader's responsibility.",
        },
        {
            Icon: Sparkles,
            label: isIndonesian ? 'Masa depan bisa berubah' : "The future isn't fixed",
            text: isIndonesian
                ? 'Tarot menampilkan gambaran sementara masa depan. Kita dapat mengubah nasib asalkan berusaha.'
                : 'Tarot shows a temporary picture of the future. We can change our destiny as long as we make the effort.',
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
                    {/* LEFT — sticky title + subtitle */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                        <FadeIn>
                            <h2 className="font-elegant font-semibold text-cream text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                                Disclaimer
                            </h2>
                            <p className="mt-5 text-sm text-cream/60 font-light leading-relaxed max-w-xs">
                                {isIndonesian
                                    ? 'Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini.'
                                    : 'By making a booking, you have agreed to these terms and conditions.'}
                            </p>

                            {/* acknowledgement chip */}
                            <div className="mt-7 inline-flex items-center gap-2.5 rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2.5">
                                <span className="grid place-items-center w-4 h-4 rounded-full bg-moon text-plum-deep">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                </span>
                                <span className="text-[11px] uppercase tracking-[0.16em] text-cream/70">
                                    {isIndonesian ? 'Berlaku saat booking' : 'Applies at booking'}
                                </span>
                            </div>
                        </FadeIn>
                    </div>

                    {/* RIGHT — terms as iconed rows */}
                    <div className="lg:col-span-8">
                        {items.map((it, index) => (
                            <FadeIn key={index} delay={Math.min(index, 4) * 70}>
                                <div className="group relative flex items-start gap-4 md:gap-5 rounded-lg px-3 md:px-4 py-5 md:py-6 border-t border-white/10 first:border-t-0 transition-colors duration-300 hover:bg-white/[0.03]">
                                    {/* left accent bar (grows on hover) */}
                                    <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-moon rounded-full transition-all duration-300 group-hover:h-[55%]" />
                                    {/* icon */}
                                    <span className="shrink-0 grid place-items-center w-11 h-11 rounded-lg bg-white/[0.05] border border-white/12 text-moon transition-colors duration-300 group-hover:border-moon/40">
                                        <it.Icon className="w-5 h-5" strokeWidth={1.6} />
                                    </span>
                                    {/* body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-3">
                                            <span className="font-serif font-semibold text-cream/35 text-xs tabular-nums">0{index + 1}</span>
                                            <h3 className="font-serif font-semibold text-cream text-base md:text-lg leading-snug tracking-tight">
                                                {it.label}
                                            </h3>
                                        </div>
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
