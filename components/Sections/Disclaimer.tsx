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
        // No card — flows straight on from the FAQ on the same white background. Same
        // editorial split as the FAQ: on desktop the intro holds the left column (and
        // stays put while you read) and the notes run down the right as ruled rows.
        <section id="disclaimer" className="relative text-ink pb-20 md:pb-28">
            <div className="mx-auto px-8 relative z-10">
                <div className="relative pt-4 md:pt-6 grid lg:grid-cols-12 gap-y-10 lg:gap-x-16 lg:items-start">
                    {/* LEFT — gentle, human framing (no "disclaimer", no legalese) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28">
                        <FadeIn>
                            <p className="flex items-center gap-2 text-moon text-sm font-medium tracking-wide">
                                <CelestialMark name="sparkle" className="w-3.5 h-3.5 shrink-0" />
                                {isIndonesian ? 'Sebelum kita mulai' : 'Before we begin'}
                            </p>
                            <h2 className="mt-4 font-elegant font-semibold text-ink text-[2.1rem] sm:text-[2.7rem] lg:text-[3.3rem] leading-[1.04] tracking-[-0.02em]">
                                {isIndonesian ? 'Beberapa catatan jujur' : 'A few honest notes'}
                            </h2>
                            <p className="mt-5 text-ink/60 font-light leading-relaxed text-base md:text-lg max-w-xl">
                                {isIndonesian
                                    ? 'Biar sesinya nyaman dan kita sepaham, ini beberapa hal yang baik kamu tahu dulu.'
                                    : "So the session feels easy and we're on the same page, here are a few things worth knowing first."}
                            </p>
                            {/* the agreement sits under the intro on desktop */}
                            <p className="hidden lg:block mt-10 pt-6 border-t border-ink/10 text-ink/55 font-light text-sm leading-relaxed">
                                {agreement}
                            </p>
                        </FadeIn>
                    </div>

                    {/* RIGHT — the notes as ruled rows: name on the left, the why beside it */}
                    <ol className="lg:col-span-8 border-t border-ink/10">
                        {items.map((it, index) => (
                            <li key={index} className="group border-b border-ink/10">
                              <FadeIn delay={Math.min(index, 4) * 70} dir="up" className="py-6 md:py-7 sm:grid sm:grid-cols-[minmax(0,15rem)_1fr] md:grid-cols-[minmax(0,17rem)_1fr] sm:gap-x-10 sm:items-baseline">
                                    <h3 className="flex items-baseline gap-3 font-elegant font-semibold text-ink text-xl md:text-[1.4rem] leading-snug transition-colors duration-500 group-hover:text-moon">
                                        <span aria-hidden className="font-elegant italic font-medium text-moon/70 text-base tabular-nums shrink-0">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {it.label}
                                    </h3>
                                    <p className="mt-2 sm:mt-0 pl-9 sm:pl-0 text-ink/60 font-light text-sm md:text-base leading-relaxed">
                                        {it.text}
                                    </p>
                              </FadeIn>
                            </li>
                        ))}
                    </ol>

                    {/* the agreement closes the list on phones/tablets */}
                    <FadeIn className="lg:hidden">
                        <p className="text-ink/55 font-light text-sm leading-relaxed max-w-2xl">
                            {agreement}
                        </p>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default Disclaimer;
