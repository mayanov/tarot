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
                ? 'Tarot reading bukan pengganti profesional di bidang hukum, keuangan, kesehatan, maupun psikologi.'
                : "A tarot reading isn't a substitute for a qualified professional in law, finance, health, or psychology.",
        },
        {
            label: isIndonesian ? 'Keputusan tetap punyamu' : 'The choices stay yours',
            text: isIndonesian
                ? 'Kamu memegang kendali atas setiap pilihanmu. Keputusan yang kamu ambil setelah sesi adalah di luar tanggung jawab reader.'
                : "You hold control over every choice you make. Any decision you take after a session is outside the reader's responsibility.",
        },
        {
            label: isIndonesian ? 'Masa depan bisa berubah' : 'The future can change',
            text: isIndonesian
                ? 'Dengan usaha, kamu selalu bisa mengubah arah — setiap langkahmu memengaruhi hasil akhir. Sesi tarot hanya menampilkan gambaran sementara di masa depan.'
                : 'With effort, you can always change your direction — every action shapes the outcome. A tarot session only shows a temporary glimpse of what may come.',
        },
        {
            label: isIndonesian ? 'Privasimu terjaga' : 'Your privacy is safe',
            text: isIndonesian
                ? 'Kerahasiaan sesi terjamin. Pertanyaan, cerita, dan hasil reading tidak akan disebarluaskan tanpa persetujuanmu.'
                : 'Your session stays confidential. Questions, stories, and readings are never shared without your consent.',
        },
        {
            label: isIndonesian ? 'Pembayaran non-refundable' : 'Payment is non-refundable',
            text: isIndonesian
                ? 'Seluruh pembayaran tidak dapat dikembalikan dan wajib diselesaikan sebelum sesi reading dimulai.'
                : 'All payments are non-refundable and must be completed before the reading session begins.',
        },
    ];

    return (
        <section id="disclaimer" className="py-12 relative isolate text-cream">
            {/* soft violet bloom for depth over the shared sky backdrop */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(90% 70% at 88% 0%, rgba(107,63,160,0.18) 0%, transparent 55%)' }}
            />
            <div className="mx-auto px-8 relative z-10">
                <div className="grid lg:grid-cols-12 gap-y-10 lg:gap-x-16 lg:items-start">
                    {/* LEFT — bold editorial numbered notes (fills the column) */}
                    <div className="order-2 lg:order-1 lg:col-span-8">
                        {items.map((it, index) => (
                            <FadeIn key={index} delay={Math.min(index, 4) * 90} dir="left">
                                <div className="group grid grid-cols-[auto_1fr] items-start gap-x-5 md:gap-x-10 py-7 md:py-9 border-t border-white/10 first:border-t-0 first:pt-0 lg:first:pt-0">
                                    <span
                                        aria-hidden
                                        className="font-elegant font-semibold leading-none text-sky text-[3rem] md:text-[5.5rem] transition-colors duration-300 group-hover:text-cream"
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="pt-1 md:pt-3">
                                        <h3 className="font-elegant font-semibold text-cream text-xl md:text-3xl leading-snug tracking-tight">
                                            {it.label}
                                        </h3>
                                        <p className="mt-2 md:mt-3 text-cream text-sm md:text-base leading-relaxed font-light">
                                            {it.text}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* RIGHT — sticky title + alert notice (above the notes on mobile) */}
                    <div className="order-1 lg:order-2 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                        <FadeIn dir="right">
                            <h2 className="font-elegant font-semibold text-cream text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                                Disclaimer
                            </h2>
                            {/* agreement notice — frosted glass block floating over the night sky */}
                            <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)] max-w-sm pl-5 pr-4 py-4">
                                {/* soft top-edge highlight so the glass catches light */}
                                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-sky" />
                                <div className="flex items-center gap-2 text-sky">
                                    <AlertCircle className="w-4 h-4" strokeWidth={2} />
                                    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold">{isIndonesian ? 'Penting' : 'Note'}</span>
                                </div>
                                <p className="mt-2 text-sm text-cream/85 leading-relaxed">
                                    {isIndonesian
                                        ? 'Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini.'
                                        : 'By making a booking, you have agreed to these terms and conditions.'}
                                </p>
                            </div>
                            <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-cream/35">
                                {isIndonesian ? 'Berlaku untuk semua layanan · 18+' : 'Applies to all services · 18+'}
                            </p>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
