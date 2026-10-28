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

    const agreement = isIndonesian
        ? 'Dengan melakukan booking, kamu menyetujui catatan di atas. Berlaku untuk semua layanan · 18+.'
        : 'By booking a session, you agree to the notes above. Applies to all services · 18+.';

    return (
        // Sits right under the pricelist (rendered by Services), so the notes are read
        // before booking. A tinted, bordered panel makes it stand out from the page: a
        // short intro + the agreement on top, the five notes in a compact grid below.
        <section id="disclaimer" className="mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-20 md:pb-28">
            <FadeIn>
                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem] border border-moon/25 bg-moon/[0.06] px-6 py-9 md:px-12 md:py-12">
                    {/* faint mark in the corner, so the panel reads as its own card */}
                    <CelestialMark name="sparkle" className="pointer-events-none absolute -right-6 -top-6 w-36 text-moon/[0.07]" />

                    <div className="relative grid lg:grid-cols-12 gap-y-6 lg:gap-x-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <p className="flex items-center gap-2 text-moon text-sm font-medium tracking-wide">
                                <CelestialMark name="sparkle" className="w-3.5 h-3.5 shrink-0" />
                                {isIndonesian ? 'Sebelum kamu booking' : 'Before you book'}
                            </p>
                            <h2 className="mt-3 font-elegant font-semibold text-ink text-[1.9rem] sm:text-[2.3rem] lg:text-[2.6rem] leading-[1.05] tracking-[-0.02em]">
                                {isIndonesian ? 'Beberapa catatan jujur' : 'A few honest notes'}
                            </h2>
                        </div>
                        {/* the agreement — the line that matters, set apart */}
                        <p className="lg:col-span-5 flex gap-3 rounded-2xl bg-paper/80 border border-moon/20 px-4 py-3.5 text-ink/80 text-sm md:text-[0.95rem] leading-relaxed">
                            <span aria-hidden className="mt-[0.45em] w-1.5 h-1.5 rotate-45 shrink-0 bg-moon" />
                            <span>{agreement}</span>
                        </p>
                    </div>

                    <ol className="relative mt-8 md:mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-10 gap-y-6 md:gap-y-8 border-t border-moon/15 pt-8 md:pt-10">
                        {items.map((it, index) => (
                            <li key={index}>
                                <h3 className="flex items-baseline gap-2.5 font-elegant font-semibold text-ink text-lg md:text-[1.15rem] leading-snug">
                                    <span aria-hidden className="font-elegant italic font-medium text-moon text-sm tabular-nums shrink-0">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {it.label}
                                </h3>
                                <p className="mt-1.5 pl-7 text-ink/60 font-light text-sm leading-[1.7]">
                                    {it.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </FadeIn>
        </section>
    );
};

export default Disclaimer;
