import React from 'react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';
import { AlertCircle, Shield } from 'lucide-react';

interface DisclaimerProps {
    isIndonesian?: boolean;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ isIndonesian = false }) => {
    const disclaimersID = [
        "Tarot bukan pengganti profesional bidang hukum, keuangan, kesehatan, dan psikologi",
        "Segala keputusan setelah sesi reading diluar tanggungjawab reader",
        "Tarot menampilkan gambaran sementara masa depan. Kita dapat mengubah nasib asalkan berusaha"
    ];

    const disclaimersEN = [
        "Tarot is not a substitute for professional services in law, finance, health, or psychology",
        "All decisions made after the reading session are outside the reader's responsibility",
        "Tarot shows a temporary picture of the future. We can change our destiny as long as we make the effort"
    ];

    const disclaimers = isIndonesian ? disclaimersID : disclaimersEN;

    return (
        <section id="disclaimer" className="pt-16 md:pt-24 pb-8 md:pb-10 relative overflow-hidden isolate border-t-2 border-white/15">
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
                <FadeIn>
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-white/15">
                        <div className="flex items-center gap-3">
                            <Shield className="w-7 h-7 md:w-8 md:h-8 text-coral shrink-0" strokeWidth={1.75} />
                            <h2 className="text-[2.5rem] md:text-[3.4rem] font-serif font-semibold text-cream tracking-[-0.03em] leading-[1.0]">
                                Disclaimer
                            </h2>
                        </div>
                        <p className="text-sm text-cream/55 font-light max-w-xs sm:text-right">
                            {isIndonesian
                                ? "Penting dipahami sebelum kamu memesan sesi."
                                : "Important to understand before you book a session."}
                        </p>
                    </div>

                    {/* Three terms, side by side */}
                    <div className="grid sm:grid-cols-3 gap-x-10 gap-y-9 mt-10 md:mt-12">
                        {disclaimers.map((item, index) => (
                            <div key={index}>
                                <span className="block font-serif font-semibold text-4xl leading-none text-coral/80 tabular-nums mb-4">
                                    0{index + 1}
                                </span>
                                <p className="text-cream/70 text-sm md:text-[0.95rem] leading-relaxed font-light">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Agreement */}
                    <div className="mt-12 md:mt-14 pt-7 border-t border-white/15 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                        <p className="text-cream text-sm md:text-base font-medium leading-relaxed max-w-2xl">
                            {isIndonesian
                                ? "Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini."
                                : "By making a booking, you have agreed to these terms and conditions."}
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Disclaimer;
