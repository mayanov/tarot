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
        <section id="disclaimer" className="py-16 bg-[#0A0A0F] border-y border-white/5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <FadeIn>
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <Shield className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif">
                                {isIndonesian ? "DISCLAIMER" : "DISCLAIMER"}
                            </h2>
                        </div>
                    </div>

                    {/* Disclaimer Items */}
                    <div className="bg-[#13131F]/80 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                        <div className="space-y-4 mb-6">
                            {disclaimers.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 group">
                                    <div className="mt-1 shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors duration-300">
                                            <span className="text-yellow-500 font-bold text-xs">{index + 1}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Agreement Notice */}
                        <div className="pt-6 border-t border-white/10">
                            <div className="flex items-start gap-3 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-yellow-500/90 text-sm md:text-base font-medium leading-relaxed">
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
