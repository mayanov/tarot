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

    const NUMERALS = ['i', 'ii', 'iii', 'iv', 'v'];

    return (
        // Sits right under the pricelist (rendered by Services), so it's read before
        // booking. Set like the fine-print page of a book, not a boxed notice: no frame
        // or wash, a centred heading with an italic "before you book", the notes in one
        // book-width column with hanging serif numerals, and the agreement as a closing line
        // under a small sparkle rule.
        <section id="disclaimer" className="mx-auto max-w-4xl px-8 pt-14 md:pt-20 pb-24 md:pb-32">
            <FadeIn>
                <div className="text-center">
                    <CelestialMark name="sparkle" className="print-ink mx-auto w-5 md:w-6 text-moon" />
                    <h2 className="print-text mt-5 pb-[0.14em] -mb-[0.14em] font-elegant font-semibold text-ink text-[2.1rem] sm:text-[2.5rem] md:text-[2.9rem] leading-none tracking-[-0.02em]">
                        Disclaimer
                    </h2>
                    <p className="print-text mt-3 font-elegant italic text-moon text-[1.05rem] md:text-[1.15rem]">
                        {isIndonesian ? 'baca dulu sebelum memesan' : 'worth a read before you book'}
                    </p>
                </div>
            </FadeIn>

            <ol className="mx-auto mt-12 md:mt-16 max-w-2xl grid gap-y-8 md:gap-y-10">
                {items.map((it, index) => (
                    <li key={index}>
                        <FadeIn delay={0.06 * index} className="grid grid-cols-[2.25rem_1fr] md:grid-cols-[3.5rem_1fr]">
                            <span aria-hidden className="print-text pt-[0.2rem] font-elegant italic text-moon/70 text-[1.05rem] md:text-[1.15rem] leading-none">
                                {NUMERALS[index]}.
                            </span>
                            <div>
                                <h3 className="print-text font-elegant font-semibold text-ink text-[1.2rem] md:text-[1.3rem] leading-snug">
                                    {it.label}
                                </h3>
                                <p className="print-body mt-1.5 text-[0.9rem] md:text-[0.95rem] leading-[1.7] text-ink/60 font-light">
                                    {it.text}
                                </p>
                            </div>
                        </FadeIn>
                    </li>
                ))}
            </ol>

            <FadeIn>
                <div className="mt-14 md:mt-20 flex items-center justify-center gap-4 text-moon/50" aria-hidden>
                    <span className="h-px w-16 md:w-24 bg-current" />
                    <CelestialMark name="sparkle" className="print-ink w-3 text-moon/70" />
                    <span className="h-px w-16 md:w-24 bg-current" />
                </div>
                <p className="print-text mt-6 mx-auto max-w-2xl text-center font-elegant italic text-ink/75 text-[1.05rem] md:text-[1.15rem] leading-relaxed">
                    {agreement}
                </p>
            </FadeIn>
        </section>
    );
};

export default Disclaimer;
