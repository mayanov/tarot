import React from 'react';
import FadeIn from '../UI/FadeIn';
import CelestialMark from '../UI/CelestialMark';

// a fixed sprinkle of faint stars for the panel (seeded, so it never changes)
const STARS = (() => {
    let t = 4242;
    const r = () => { t = (t * 16807) % 2147483647; return t / 2147483647; };
    return Array.from({ length: 70 }, () => {
        const x = (r() * 100).toFixed(2), y = (r() * 100).toFixed(2);
        const rad = (0.5 + r() * 1).toFixed(2), o = (0.25 + r() * 0.5).toFixed(2);
        return `radial-gradient(${rad}px ${rad}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`;
    }).join(',');
})();

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
        // booking. A deep plum panel (the same night sky as the card backs) makes it
        // stand out on the white page; a tarot-style keyline, star dust and one large
        // faint star keep it from feeling plain. Inside: the heading with the two hard
        // rules as stamped labels, the notes as running text, the agreement to close.
        <section id="disclaimer" className="mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-20 md:pb-28">
            <FadeIn>
                <div
                    className="relative isolate overflow-hidden mx-auto max-w-5xl rounded-[1.25rem] md:rounded-[1.75rem] px-7 py-9 md:px-12 md:py-12 text-cream shadow-[0_40px_80px_-40px_rgba(12,8,30,0.65)]"
                    style={{ background: 'radial-gradient(120% 130% at 0% 0%, #3a2558 0%, #241638 55%, #150c24 100%)' }}
                >
                    <div aria-hidden className="absolute inset-0 -z-10 opacity-70" style={{ backgroundImage: STARS }} />
                    <CelestialMark name="sparkle" className="pointer-events-none absolute -right-8 -top-8 md:-right-6 md:-top-6 -z-10 w-44 md:w-56 text-[#C9B8E8]/[0.12]" />
                    {/* tarot-card keyline */}
                    <div aria-hidden className="pointer-events-none absolute inset-2.5 md:inset-3.5 rounded-[0.95rem] md:rounded-[1.35rem] ring-1 ring-[#C9B8E8]/20" />

                    <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5 border-b border-[#C9B8E8]/20">
                        <h2 className="flex items-center gap-3 font-elegant font-semibold text-cream text-[1.8rem] md:text-[2.3rem] leading-tight tracking-[-0.01em]">
                            <CelestialMark name="sparkle" className="w-5 md:w-6 text-[#C9B8E8]" />
                            Disclaimer
                        </h2>
                        <div className="flex gap-2">
                            {['Non-refundable', '18+'].map((tag) => (
                                <span key={tag} className="rounded-[3px] border border-[#C9B8E8]/60 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#C9B8E8]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="relative mt-6 md:columns-2 md:gap-12">
                        {items.map((it, index) => (
                            <p key={index} className="mb-4 break-inside-avoid text-[0.9rem] md:text-[0.95rem] leading-[1.7] text-cream/70 font-light">
                                <span className="font-medium text-cream">{it.label}.</span> {it.text}
                            </p>
                        ))}
                    </div>

                    <p className="relative mt-2 pt-5 border-t border-[#C9B8E8]/20 font-elegant italic text-[#C9B8E8] text-[1rem] md:text-[1.1rem]">
                        {agreement}
                    </p>
                </div>
            </FadeIn>
        </section>
    );
};

export default Disclaimer;
