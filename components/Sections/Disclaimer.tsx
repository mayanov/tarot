import React from 'react';
import FadeIn from '../UI/FadeIn';

interface DisclaimerProps {
    isIndonesian?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ isIndonesian = false }) => {
    const disclaimersID = [
        "Tarot bukan pengganti profesional bidang hukum, keuangan, kesehatan, dan psikologi",
        "Segala keputusan setelah sesi reading diluar tanggungjawab reader",
        "Tarot menampilkan gambaran sementara masa depan. Kita dapat mengubah nasib asalkan berusaha",
    ];

    const disclaimersEN = [
        "Tarot is not a substitute for professional services in law, finance, health, or psychology",
        "All decisions made after the reading session are outside the reader's responsibility",
        "Tarot shows a temporary picture of the future. We can change our destiny as long as we make the effort",
    ];

    const disclaimers = isIndonesian ? disclaimersID : disclaimersEN;

    return (
        <section id="disclaimer" className="py-16 md:py-20 relative overflow-hidden isolate border-y border-black/[0.08] text-ink" style={{ background: '#ffffff' }}>
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10">
                <FadeIn>
                    <div className="pt-8 border-t border-black/10">
                        <div className="grid lg:grid-cols-12 gap-y-9 lg:gap-x-16">
                            {/* LEFT — title + subtitle */}
                            <div className="lg:col-span-4">
                                <h2 className="font-elegant font-medium text-plum text-[1.9rem] md:text-[2.5rem] leading-[1.05] tracking-[-0.02em]">
                                    Disclaimer
                                </h2>
                                <p className="mt-5 text-sm text-ink/60 font-light leading-relaxed max-w-xs">
                                    {isIndonesian
                                        ? 'Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini.'
                                        : 'By making a booking, you have agreed to these terms and conditions.'}
                                </p>
                            </div>

                            {/* RIGHT — terms */}
                            <div className="lg:col-span-8">
                                <div className="border-t border-black/10">
                                    {disclaimers.map((item, index) => (
                                        <div key={index} className="flex gap-5 py-5 border-b border-black/10">
                                            <span className="font-serif font-semibold text-plum text-sm tabular-nums pt-0.5 shrink-0 w-6">0{index + 1}</span>
                                            <p className="text-ink/70 text-sm md:text-[0.95rem] leading-relaxed font-light">
                                                {item}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Disclaimer;
