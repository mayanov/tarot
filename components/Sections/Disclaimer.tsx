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

    const agreement = isIndonesian
        ? 'Dengan melakukan booking, kamu menyetujui catatan di atas. Berlaku untuk semua layanan · 18+.'
        : 'By booking a session, you agree to the notes above. Applies to all services · 18+.';

    return (
        // Sits right under the pricelist (rendered by Services), so it's read before
        // booking. Styled like printed fine print rather than a feature block: a thin
        // ink frame, one plain heading, the notes as running text in two columns, and
        // the two hard rules as small stamped labels.
        <section id="disclaimer" className="mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-20 md:pb-28">
            <FadeIn>
                <div className="mx-auto max-w-5xl rounded-md border border-ink/20 px-6 py-8 md:px-12 md:py-11">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pb-5 border-b border-ink/15">
                        <h2 className="font-elegant font-semibold text-ink text-[1.6rem] md:text-[2rem] leading-tight tracking-[-0.01em]">
                            {isIndonesian ? 'Catatan sebelum booking' : 'Before you book'}
                        </h2>
                        <div className="flex gap-2">
                            {[isIndonesian ? 'Non-refundable' : 'Non-refundable', '18+'].map((tag) => (
                                <span key={tag} className="rounded-[3px] border border-moon/60 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-moon">
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

                    <p className="mt-2 pt-5 border-t border-ink/15 font-elegant italic text-ink/75 text-[1rem] md:text-[1.05rem]">
                        {agreement}
                    </p>
                </div>
            </FadeIn>
        </section>
    );
};

export default Disclaimer;
