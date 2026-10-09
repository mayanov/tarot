import React from 'react';
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
        // warm paper card framed by the night sky behind it (the sky bookends into the footer)
        <section id="disclaimer" className="relative isolate px-3 sm:px-5 md:px-8 pt-8">
            <div className="relative overflow-hidden mx-auto max-w-[1600px] rounded-[2rem] md:rounded-[2.75rem] bg-white text-ink px-6 py-16 md:px-12 lg:px-16 md:py-24 shadow-[0_34px_90px_-54px_rgba(0,0,0,0.65)]">
                {/* faint constellation — a quiet celestial motif in the corner */}
                <svg aria-hidden viewBox="0 0 240 170" fill="none"
                    className="pointer-events-none absolute -top-4 right-2 md:right-6 w-44 md:w-64 text-moon/25">
                    <g stroke="currentColor" strokeWidth="1" opacity="0.55">
                        <line x1="40" y1="140" x2="95" y2="105" />
                        <line x1="95" y1="105" x2="150" y2="125" />
                        <line x1="150" y1="125" x2="195" y2="80" />
                        <line x1="195" y1="80" x2="225" y2="110" />
                        <line x1="195" y1="80" x2="165" y2="45" />
                    </g>
                    <g fill="currentColor">
                        <circle cx="40" cy="140" r="2.4" />
                        <circle cx="95" cy="105" r="2.4" />
                        <circle cx="150" cy="125" r="2.4" />
                        <circle cx="195" cy="80" r="2.8" />
                        <circle cx="225" cy="110" r="2.4" />
                        <circle cx="165" cy="45" r="2.4" />
                    </g>
                    <g fill="currentColor" opacity="0.5">
                        <circle cx="70" cy="55" r="1" />
                        <circle cx="210" cy="150" r="1" />
                        <circle cx="120" cy="160" r="1" />
                        <circle cx="30" cy="85" r="1" />
                        <circle cx="140" cy="90" r="1.2" />
                    </g>
                </svg>

                <div className="relative z-10">
                    {/* gentle, human framing — no "disclaimer", no legalese */}
                    <FadeIn>
                        <div className="max-w-2xl">
                            <p className="flex items-center gap-2 text-moon text-sm font-medium tracking-wide">
                                <span aria-hidden>✦</span>
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
                                        <h3 className="flex items-baseline gap-2.5 font-elegant font-semibold text-ink text-xl md:text-2xl leading-snug transition-colors duration-300 group-hover:text-moon">
                                            <span aria-hidden className="text-moon/70 text-base shrink-0 transition-transform duration-300 group-hover:scale-125">✦</span>
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
