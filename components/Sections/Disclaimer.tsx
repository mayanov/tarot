import React from 'react';
import FadeIn from '../UI/FadeIn';
import CelestialMark from '../UI/CelestialMark';

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
        // No card — flows straight on from the FAQ on the same white background, set
        // apart only by a hairline rule.
        <section id="disclaimer" className="relative isolate text-ink pb-20 md:pb-28" style={{ background: '#FFFFFF' }}>
            <div className="mx-auto px-8 relative z-10">
                {/* celestial section break — no rule: a quiet constellation over a soft
                    glow marks the shift into a new section on the same white ground */}
                <div className="relative flex justify-center pt-3 md:pt-4 pb-6 md:pb-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[13rem] max-w-[88vw] rounded-full blur-[80px]"
                        style={{ background: 'radial-gradient(closest-side, rgba(107,63,160,0.12), transparent)' }}
                    />
                    <CelestialMark name="constellation" className="relative w-20 md:w-24 text-moon/40" />
                </div>

                <div className="relative">
                    {/* gentle, human framing — no "disclaimer", no legalese */}
                    <FadeIn>
                        <div className="max-w-2xl">
                            <p className="flex items-center gap-2 text-moon text-sm font-medium tracking-wide">
                                <CelestialMark name="sparkle" className="w-3.5 h-3.5 shrink-0" />
                                {isIndonesian ? 'Sebelum kita mulai' : 'Before we begin'}
                            </p>
                            <h2 className="mt-4 font-elegant font-semibold text-ink text-[2.1rem] sm:text-[2.7rem] lg:text-[3.3rem] leading-[1.04] tracking-[-0.02em]">
                                {isIndonesian ? 'Beberapa catatan jujur' : 'A few honest notes'}
                            </h2>
                            <p className="mt-5 text-ink/60 font-light leading-relaxed text-base md:text-lg">
                                {isIndonesian
                                    ? 'Biar sesinya nyaman dan kita sepaham, ini beberapa hal yang baik kamu tahu dulu.'
                                    : "So the session feels easy and we're on the same page, here are a few things worth knowing first."}
                            </p>
                        </div>
                    </FadeIn>

                    {/* the notes — a calm 2-column list; the last (payment) spans full width
                        so there's no orphan. Celestial ✦ markers, gentle hover, no numerals/boxes. */}
                    <div className="mt-10 md:mt-14 grid sm:grid-cols-2 gap-x-10 md:gap-x-16 gap-y-9 md:gap-y-11 max-w-5xl">
                        {items.map((it, index) => {
                            const full = index === items.length - 1;
                            return (
                                <FadeIn key={index} delay={Math.min(index, 4) * 80} dir="up" className={full ? 'sm:col-span-2' : undefined}>
                                    <div className={`group ${full ? 'sm:pt-9 sm:border-t sm:border-ink/10' : ''}`}>
                                        <h3 className="flex items-baseline gap-2.5 font-elegant font-semibold text-ink text-xl md:text-2xl leading-snug transition-colors duration-500 group-hover:text-moon">
                                            <span aria-hidden className="text-moon/70 text-base shrink-0 transition-transform duration-500 group-hover:scale-110">✦</span>
                                            {it.label}
                                        </h3>
                                        <p className="mt-2.5 pl-6 text-ink/60 font-light text-sm md:text-base leading-relaxed max-w-2xl">
                                            {it.text}
                                        </p>
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>

                    {/* soft closing — the agreement, said gently */}
                    <FadeIn>
                        <p className="mt-11 md:mt-14 pt-6 border-t border-ink/10 text-ink/55 font-light text-sm leading-relaxed max-w-2xl">
                            {isIndonesian
                                ? 'Dengan melakukan booking, kamu menyetujui catatan di atas. Berlaku untuk semua layanan · 18+.'
                                : 'By booking a session, you agree to the notes above. Applies to all services · 18+.'}
                        </p>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
