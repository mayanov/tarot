import React from 'react';
import FadeIn from '../UI/FadeIn';
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
        <section id="disclaimer" className="py-12 md:py-16 relative overflow-hidden">
            <div className="max-w-3xl mx-auto px-6 relative z-10">
                <FadeIn>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2">
                            <Shield className="w-5 h-5 text-coral" strokeWidth={1.75} />
                            <h2 className="text-xl md:text-2xl font-serif font-medium text-ink tracking-wide">
                                Disclaimer
                            </h2>
                        </div>
                    </div>

                    {/* Disclaimer Items */}
                    <div className="bg-surface-1 border border-line rounded-2xl p-6 md:p-8 shadow-[0_16px_40px_-32px_rgba(42,35,32,0.35)]">
                        <div className="space-y-4 mb-6">
                            {disclaimers.map((item, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                                            <span className="text-gold font-semibold text-xs">{index + 1}</span>
                                        </div>
                                    </div>
                                    <p className="text-ink-soft text-sm md:text-base leading-relaxed font-light">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Agreement Notice */}
                        <div className="pt-6 border-t border-line">
                            <div className="flex items-start gap-3 bg-gold/[0.07] p-4 rounded-xl border border-gold/25">
                                <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                                <p className="text-ink text-sm md:text-base font-medium leading-relaxed">
                                    {isIndonesian
                                        ? "Dengan melakukan booking, kamu telah menyetujui syarat dan ketentuan ini."
                                        : "By making a booking, you have agreed to these terms and conditions."}
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Disclaimer;
