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
            <div className="mx-auto max-w-[1600px] rounded-[2rem] md:rounded-[2.75rem] bg-[#FAF6EF] text-ink px-6 py-12 md:px-12 lg:px-16 md:py-16 shadow-[0_34px_90px_-54px_rgba(0,0,0,0.65)]">
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

                {/* the notes — a calm 2-column list, celestial ✦ markers, no numerals/boxes */}
                <div className="mt-10 md:mt-14 grid sm:grid-cols-2 gap-x-10 md:gap-x-16 gap-y-9 md:gap-y-11 max-w-5xl">
                    {items.map((it, index) => (
                        <FadeIn key={index} delay={Math.min(index, 4) * 80} dir="up">
                            <div>
                                <h3 className="flex items-baseline gap-2.5 font-elegant font-semibold text-ink text-xl md:text-2xl leading-snug">
                                    <span aria-hidden className="text-moon/70 text-base shrink-0">✦</span>
                                    {it.label}
                                </h3>
                                <p className="mt-2.5 pl-6 text-ink/60 font-light text-sm md:text-base leading-relaxed">
                                    {it.text}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
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
        </section>
    );
};

export default Disclaimer;
