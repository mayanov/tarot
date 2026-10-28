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
        // Sits right under the pricelist (rendered by Services), so it's read before
        // booking. Printed fine print, lifted just enough to read as important: a faint
        // lilac wash and purple border, one large very faint star in the corner, the
        // two hard rules as stamped labels, the notes as running text in two columns.
        <section id="disclaimer" className="mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-20 md:pb-28">
            <FadeIn>
                <div className="relative isolate overflow-hidden mx-auto max-w-5xl rounded-lg border-[1.5px] border-moon/60 bg-moon/[0.07] px-6 py-8 md:px-12 md:py-11">
                    <CelestialMark name="sparkle" className="pointer-events-none absolute -right-7 -top-7 -z-10 w-40 md:w-52 text-moon/[0.11]" />

                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-6 border-b border-moon/30">
                        {/* the title carries the weight: large, in the brand purple */}
                        <h2 className="flex items-center gap-3 font-elegant font-bold text-moon text-[2.2rem] sm:text-[2.6rem] md:text-[3.1rem] leading-none tracking-[-0.02em]">
                            <CelestialMark name="sparkle" className="w-6 md:w-8 text-moon" />
                            Disclaimer
                        </h2>
                        <div className="flex gap-2">
                            {['Non-refundable', '18+'].map((tag) => (
                                <span key={tag} className="rounded-[3px] bg-moon px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 md:columns-2 md:gap-12">
                        {items.map((it, index) => (
                            <p key={index} className="mb-4 break-inside-avoid text-[0.9rem] md:text-[0.95rem] leading-[1.7] text-ink/65 font-light">
                                <span className="font-medium text-ink">{it.label}.</span> {it.text}
                            </p>
                        ))}
                    </div>

                    <p className="mt-2 pt-5 border-t border-moon/30 font-elegant italic font-medium text-moon text-[1rem] md:text-[1.05rem]">
                        {agreement}
                    </p>
                </div>
            </FadeIn>
        </section>
    );
};

export default Disclaimer;
