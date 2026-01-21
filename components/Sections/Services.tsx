import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, MessageCircle, Phone, MapPin, X, ChevronRight, ExternalLink } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';

interface ServicesProps {
    isIndonesian?: boolean;
}

const Services: React.FC<ServicesProps> = ({ isIndonesian = false }) => {
    // State to manage which card has its booking options expanded
    const [activeCard, setActiveCard] = useState<string | null>(null);

    // --- Handlers for Global (USD) ---
    const handleBookBasic = () => {
        trackEvent(
            'initiate_checkout',
            { item_name: '3-Card Reading', market: 'Global' },
            'InitiateCheckout',
            { content_name: '3-Card Reading', value: 12.00, currency: 'USD', content_category: 'Global Service' }
        );
    };
    const handleBookDeep = () => {
        trackEvent(
            'initiate_checkout',
            { item_name: '5-Card Reading', market: 'Global' },
            'InitiateCheckout',
            { content_name: '5-Card Reading', value: 20.00, currency: 'USD', content_category: 'Global Service' }
        );
    };
    const handleBookLive = () => {
        trackEvent(
            'schedule',
            { item_name: 'Live Call Session', market: 'Global' },
            'Schedule',
            { content_name: 'Live Call Session', value: 45.00, currency: 'USD', content_category: 'Global Service' }
        );
    };

    // --- Handlers for Indonesia (IDR) ---

    // 1. Seasonal & Promo Services
    const handleNewYear = () => {
        trackEvent(
            'begin_checkout',
            { item_name: 'New Year Reading 2026', market: 'ID' },
            'InitiateCheckout',
            { content_name: 'New Year Reading 2026', value: 250000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handlePromoBuy3Get5 = () => {
        trackEvent(
            'begin_checkout',
            { item_name: 'Promo Beli 3 Dapat 5', market: 'ID' },
            'InitiateCheckout',
            { content_name: 'Promo Beli 3 Dapat 5', value: 315000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    // 2. Standard Chat Services
    const handleChat3Question = () => {
        trackEvent(
            'begin_checkout',
            { item_name: '3 Question Chat', market: 'ID' },
            'InitiateCheckout',
            { content_name: '3 Question Chat', value: 315000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handleChat1Question = () => {
        trackEvent(
            'begin_checkout',
            { item_name: '1 Question Chat', market: 'ID' },
            'InitiateCheckout',
            { content_name: '1 Question Chat', value: 140000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    // 3. Call & Meetup Sessions
    const handleCall30Lynk = () => {
        trackEvent(
            'begin_checkout',
            { item_name: '30-Min Call', market: 'ID' },
            'InitiateCheckout',
            { content_name: '30-Min Call (Lynk)', value: 220000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handleCall30Picktime = () => {
        trackEvent(
            'schedule',
            { item_name: '30-Min Call', market: 'ID' },
            'Schedule',
            { content_name: '30-Min Call (Picktime)', value: 220000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handleCall60Lynk = () => {
        trackEvent(
            'begin_checkout',
            { item_name: '60-Min Call', market: 'ID' },
            'InitiateCheckout',
            { content_name: '60-Min Call (Lynk)', value: 360000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handleCall60Picktime = () => {
        trackEvent(
            'schedule',
            { item_name: '60-Min Call', market: 'ID' },
            'Schedule',
            { content_name: '60-Min Call (Picktime)', value: 360000, currency: 'IDR', content_category: 'ID Service' }
        );
    };

    const handleMeetup = () => {
        trackEvent(
            'schedule',
            { item_name: 'Meetup Session', market: 'ID' },
            'Schedule',
            { content_name: 'Meetup Session', value: 450000, currency: 'IDR', content_category: 'ID Service' }
        );
    };


    // Standardized Button Styles
    const baseButtonClass = "flex items-center justify-center w-full py-4 rounded-full font-bold transition-all duration-300 shadow-lg text-sm hover:-translate-y-1 gap-2";

    const buttonClass = `${baseButtonClass} bg-white text-[#0F0F1A] hover:bg-lilac border border-transparent`;
    const highlightButtonClass = `${baseButtonClass} bg-lilac text-[#0F0F1A] hover:bg-white shadow-[0_0_20px_rgba(192,160,255,0.3)]`;
    const goldButtonClass = `${baseButtonClass} bg-gold-accent text-[#0F0F1A] hover:bg-white shadow-[0_0_20px_rgba(255,215,0,0.3)]`;
    const tealButtonClass = `${baseButtonClass} bg-teal-accent text-[#0F0F1A] hover:bg-white shadow-[0_0_20px_rgba(129,244,255,0.3)]`;
    const whiteButtonClass = `${baseButtonClass} bg-white text-[#0F0F1A] hover:bg-gray-200`;
    const outlineButtonClass = "flex items-center justify-center w-full py-3 rounded-full font-bold border border-white/20 text-white hover:bg-white/10 transition-all duration-300 text-sm";

    const QuantityNote = () => (
        <div className="mt-auto mb-6 p-4 rounded-xl bg-[#0A0A0F]/50 border border-white/5">
            <p className="text-[11px] text-lilac font-bold mb-1 uppercase tracking-wider">
                Quick Tip: 1 Qty = 1 Question
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
                Have more on your mind? Just adjust the 'Quantity' at checkout.
            </p>
        </div>
    );

    return (
        <section id="services" className="py-12 md:py-24 relative bg-[#020205] overflow-hidden">
            <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slower pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <FadeIn>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white font-serif">
                            {isIndonesian ? "Pilih Layanan Tarotmu" : "Ways We Can Work Together"}
                        </h2>
                        <p className="text-text-subtle text-lg max-w-2xl mx-auto">
                            {isIndonesian
                                ? "Pilih metode yang paling nyaman buat kamu. Analisa tajam, solutif, dan tanpa basa-basi."
                                : "Clear options, no hidden fees. Just choose the depth you need."}
                        </p>
                    </div>
                </FadeIn>

                {/* =========================================================
            CONDITIONAL RENDERING: INDONESIA vs GLOBAL
           ========================================================= */}

                {!isIndonesian ? (
                    /* --- GLOBAL (USD) LAYOUT --- */
                    <div className="grid gap-6 items-stretch grid-cols-1 lg:grid-cols-3">
                        {/* 1. Basic (3-CARD SPREAD) */}
                        <FadeIn className="h-full">
                            <div className="group relative h-full">
                                <div className="absolute inset-0 bg-gradient-to-b from-lilac/10 to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative bg-surface-1 border border-white/5 flex flex-col h-full p-8 rounded-3xl hover:border-lilac/30 transition duration-300 shadow-2xl group-hover:shadow-lilac/5">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-white font-serif mb-2">3-Card Spread</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-lilac">$12</span>
                                        </div>
                                    </div>
                                    <p className="text-text-subtle mb-8 text-sm leading-relaxed border-b border-white/5 pb-6 min-h-[5.5rem]">
                                        Perfect for a quick check-in or a specific burning question. Direct and to the point.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-lilac shrink-0"></div><span>Insight for <strong>1 specific question</strong></span></li>
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-lilac shrink-0"></div><span>Photo of your card spread</span></li>
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-lilac shrink-0"></div><span>Sent within 24 hours</span></li>
                                    </ul>
                                    <QuantityNote />
                                    <div>
                                        <a href="https://www.paypal.com/ncp/payment/DSPX84KBN8GC2" target="_blank" rel="noopener noreferrer" onClick={handleBookBasic} className={buttonClass}>Book This</a>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* 2. Standard (5-CARD DEEP) */}
                        <FadeIn delay={100} className="h-full relative z-10">
                            <div className="group relative h-full transform lg:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-gradient-to-b from-lilac/30 to-lilac/5 rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition duration-500" />
                                <div className="relative bg-[#232336] border border-lilac/30 flex flex-col h-full p-8 rounded-3xl hover:border-lilac/50 transition duration-300 shadow-2xl group-hover:shadow-lilac/20">
                                    <div className="absolute top-6 right-6"><span className="bg-lilac text-[#0F0F1A] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Most Popular</span></div>
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-white font-serif mb-2">5-Card Deep</h3>
                                        <div className="flex items-baseline gap-1"><span className="text-5xl font-bold text-lilac">$20</span></div>
                                    </div>
                                    <p className="text-gray-300 mb-8 text-sm leading-relaxed border-b border-white/5 pb-6 min-h-[5.5rem]">
                                        The best value. We'll look at the bigger picture, hidden influences, and what's coming next.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-start text-sm text-white"><CheckCircle2 className="w-5 h-5 text-lilac mr-3 shrink-0" /><span>Detailed 5-card reading</span></li>
                                        <li className="flex items-start text-sm text-white"><CheckCircle2 className="w-5 h-5 text-lilac mr-3 shrink-0" /><span>In-depth analysis of <strong>1 question</strong></span></li>
                                        <li className="flex items-start text-sm text-white"><CheckCircle2 className="w-5 h-5 text-lilac mr-3 shrink-0" /><span>High-res photo of cards</span></li>
                                        <li className="flex items-start text-sm text-white"><CheckCircle2 className="w-5 h-5 text-lilac mr-3 shrink-0" /><span>Priority 24h delivery</span></li>
                                    </ul>
                                    <QuantityNote />
                                    <div>
                                        <a href="https://www.paypal.com/ncp/payment/V6U4QMAU642KA" target="_blank" rel="noopener noreferrer" onClick={handleBookDeep} className={highlightButtonClass}>Get Clarity Now</a>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* 3. Live Session */}
                        <FadeIn delay={200} className="h-full">
                            <div className="group relative h-full">
                                <div className="absolute inset-0 bg-gradient-to-b from-teal-accent/10 to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative bg-surface-1 border border-white/5 flex flex-col h-full p-8 rounded-3xl hover:border-teal-accent/30 transition duration-300 shadow-2xl group-hover:shadow-teal-accent/5">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-white font-serif mb-2">Live Session</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-teal-accent">$45</span>
                                            <span className="text-sm text-teal-accent/60 font-medium ml-2">/ 30 mins</span>
                                        </div>
                                    </div>
                                    <p className="text-text-subtle mb-8 text-sm leading-relaxed border-b border-white/5 pb-6 min-h-[5.5rem]">
                                        Want to talk it out? Let's hop on a Google Meet call and dive deep into your situation together.
                                    </p>
                                    <ul className="space-y-4 mb-8 flex-grow">
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-teal-accent shrink-0"></div><span>Ask as many questions as we can fit</span></li>
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-teal-accent shrink-0"></div><span>Real-time connection & feedback</span></li>
                                        <li className="flex items-start text-sm text-gray-300"><div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-teal-accent shrink-0"></div><span>No scripts, just natural flow</span></li>
                                    </ul>
                                    <div className="mt-auto">
                                        <a href="https://www.picktime.com/mayanovtarotEn#book/date" target="_blank" rel="noopener noreferrer" onClick={handleBookLive} className={buttonClass}>Schedule Call</a>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                ) : (
                    /* --- INDONESIA (IDR) LAYOUT - GROUPED CATEGORIES --- */
                    /* Using strict heights and flex-col for better grid alignment */
                    <div className="space-y-24">

                        {/* CATEGORY 1: Edisi Spesial */}
                        <div className="relative" id="service-special">
                            <div className="absolute inset-0 bg-gradient-to-b from-gold-accent/5 to-transparent rounded-[3rem] -z-10 blur-xl"></div>

                            <div className="flex flex-col items-center gap-2 mb-10">
                                <div className="p-3 bg-gold-accent/10 rounded-full border border-gold-accent/20">
                                    <Sparkles className="w-6 h-6 text-gold-accent" />
                                </div>
                                <h3 className="text-2xl font-bold text-gold-accent font-serif tracking-wide uppercase">Edisi Spesial</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold-accent/50 to-transparent rounded-full"></div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6">
                                {/* New Year Reading */}
                                <FadeIn className="w-full max-w-[380px]">
                                    <div className="group relative h-full">
                                        <div className="absolute inset-0 bg-gradient-to-b from-gold-accent/20 to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                                        <div className="relative bg-surface-1 border-2 border-gold-accent/50 flex flex-col h-full p-6 rounded-2xl hover:border-gold-accent transition duration-300 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                                            <div className="absolute top-0 right-0 bg-gold-accent text-[#05050A] font-bold px-3 py-1 text-xs rounded-bl-lg">LIMITED</div>
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">New Year Reading 2026</h3>
                                                <p className="text-xs uppercase tracking-wider text-gold-accent font-bold mt-1">Seasonal Special</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-4xl font-extrabold text-gold-accent">Rp 250.000</div>
                                            </div>
                                            <p className="text-text-light text-center text-sm mb-4">Siap hadapi tahun depan dengan strategi matang.</p>
                                            <ul className="space-y-2 mb-6 bg-white/5 p-4 rounded-xl flex-grow">
                                                <li className="flex items-start text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gold-accent mr-2 shrink-0" /><span>General Overview 2026</span></li>
                                                <li className="flex items-start text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gold-accent mr-2 shrink-0" /><span>Harta, Tahta, Cinta</span></li>
                                                <li className="flex items-start text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-gold-accent mr-2 shrink-0" /><span>Saran Strategis</span></li>
                                            </ul>
                                            <p className="text-[10px] text-center text-gray-500 italic mb-4">*Dikirim PDF via WhatsApp (2 hari kerja).</p>
                                            <div className="mt-auto">
                                                <a href="https://forms.gle/xpMFUUhkyRW8FgY67" target="_blank" rel="noopener noreferrer" onClick={handleNewYear} className={goldButtonClass}>Pesan Edisi Spesial</a>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>

                        {/* CATEGORY 2: Konsultasi Chat */}
                        <div className="relative" id="service-chat">
                            <div className="absolute inset-0 bg-gradient-to-b from-lilac/5 to-transparent rounded-[3rem] -z-10 blur-xl"></div>

                            <div className="flex flex-col items-center gap-2 mb-10">
                                <div className="p-3 bg-lilac/10 rounded-full border border-lilac/20">
                                    <MessageCircle className="w-6 h-6 text-lilac" />
                                </div>
                                <h3 className="text-2xl font-bold text-lilac font-serif tracking-wide uppercase">Konsultasi Chat</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-lilac/50 to-transparent rounded-full"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Promo Beli 3 Dapat 5 */}
                                <FadeIn delay={100} className="h-full">
                                    <div className="group relative h-full">
                                        <div className="absolute inset-0 bg-gradient-to-b from-teal-accent/20 to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                                        <div className="relative bg-surface-1 border-2 border-teal-accent/50 flex flex-col h-full p-6 rounded-2xl hover:border-teal-accent transition duration-300 shadow-[0_0_20px_rgba(129,244,255,0.1)]">
                                            <div className="absolute top-0 right-0 bg-teal-accent text-[#05050A] font-bold px-3 py-1 text-xs rounded-bl-lg">PROMO</div>
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">Beli 3 Dapat 5</h3>
                                                <p className="text-xs uppercase tracking-wider text-teal-accent font-bold mt-1">Best Value</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-4xl font-extrabold text-teal-accent">Rp 315.000</div>
                                                <p className="text-xs text-text-subtle line-through opacity-60">Normal: Rp 500.000+</p>
                                            </div>
                                            <p className="text-text-light text-center text-sm mb-4 flex-grow">Cukup bayar 3 pertanyaan, dapat <b>5 pertanyaan</b>. Lebih hemat.</p>
                                            <div className="bg-teal-accent/10 border border-teal-accent/20 p-3 rounded-lg mb-6">
                                                <p className="text-xs text-teal-accent/90 flex gap-2">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    <span><b>Syarat:</b> 5 pertanyaan harus digunakan di hari yang sama.</span>
                                                </p>
                                            </div>
                                            <div className="mt-auto">
                                                <a href="http://lynk.id/mayanovtarot/mm7ykgdwndez/" target="_blank" rel="noopener noreferrer" onClick={handlePromoBuy3Get5} className={tealButtonClass}>Ambil Promo Ini</a>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* 3 Question Chat */}
                                <FadeIn delay={200} className="h-full">
                                    <div className="group relative h-full">
                                        <div className="relative bg-surface-1 border border-lilac/30 flex flex-col h-full p-6 rounded-2xl hover:bg-surface-2 transition duration-300">
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">3 Question Chat</h3>
                                                <p className="text-xs uppercase tracking-wider text-text-subtle">Best Seller</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-lilac">Rp 315.000</div>
                                            </div>
                                            <div className="text-center text-sm text-text-light space-y-4 mb-6 flex-grow">
                                                <p>Konsultasi via chat. Kirim pertanyaanmu, saya balas dengan analisa mendalam via WhatsApp.</p>
                                                <p className="text-lilac/80 font-bold">Keunggulan: Pertanyaan bisa ditabung untuk lain waktu.</p>
                                            </div>
                                            <div className="mt-auto">
                                                <a href="https://lynk.id/mayanovtarot/XBpJGb5" target="_blank" rel="noopener noreferrer" onClick={handleChat3Question} className={highlightButtonClass}>Pesan Sekarang</a>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* 1 Question Chat */}
                                <FadeIn className="h-full">
                                    <div className="group relative h-full">
                                        <div className="relative bg-surface-1 border border-white/10 flex flex-col h-full p-6 rounded-2xl hover:border-lilac/30 transition duration-300">
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">1 Question Chat</h3>
                                                <p className="text-xs uppercase tracking-wider text-text-subtle">Via Chat Teks</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-white">Rp 140.000</div>
                                            </div>
                                            <div className="text-center text-sm text-text-light mb-6 flex-grow">
                                                <p>Solusi kilat untuk satu pertanyaan mendesak yang butuh jawaban segera.</p>
                                            </div>
                                            <div className="mt-auto">
                                                <a href="https://lynk.id/mayanovtarot/AKbGK0X" target="_blank" rel="noopener noreferrer" onClick={handleChat1Question} className={whiteButtonClass}>Pesan Sekarang</a>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>

                        {/* CATEGORY 3: Panggilan Suara */}
                        <div className="relative" id="service-call">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] -z-10 blur-xl"></div>

                            <div className="flex flex-col items-center gap-2 mb-10 text-center">
                                <div className="p-3 bg-white/10 rounded-full border border-white/20">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white font-serif tracking-wide uppercase text-center">Panggilan Suara & Video</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"></div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                                {/* 30-Min Call */}
                                <FadeIn className="w-full md:w-[calc(50%-12px)]">
                                    <div className="group relative h-full">
                                        <div className="relative bg-surface-1 border border-white/10 flex flex-col h-full p-6 rounded-2xl hover:border-white/40 transition duration-300">
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">30-Min Call</h3>
                                                <p className="text-xs uppercase tracking-wider text-text-subtle">Sesi Singkat</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-white">Rp 220.000</div>
                                            </div>
                                            <div className="text-center text-sm text-text-light mb-6 flex-grow">
                                                <p>Ngobrol langsung selama 30 menit. Curhat lebih leluasa, feedback langsung.</p>
                                            </div>
                                            <div className="mt-auto min-h-[56px] flex items-end">
                                                {activeCard === 'call-30' ? (
                                                    <div className="w-full flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-[#252538] p-2 rounded-xl border border-white/10">
                                                        <div className="flex justify-between items-center px-2 mb-1">
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Pilih Platform</span>
                                                            <button onClick={() => setActiveCard(null)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                                        </div>
                                                        <a href="https://lynk.id/mayanovtarot/9ANjbJE" target="_blank" rel="noopener noreferrer" onClick={handleCall30Lynk} className={whiteButtonClass + " py-2 text-xs"}>Via Lynk.id <ExternalLink className="w-3 h-3 opacity-50" /></a>
                                                        <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleCall30Picktime} className={outlineButtonClass + " py-2 text-xs"}>Via Picktime <ExternalLink className="w-3 h-3 opacity-50" /></a>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setActiveCard('call-30')} className={whiteButtonClass}>Pesan Sesi <ChevronRight className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* 60-Min Call */}
                                <FadeIn className="w-full md:w-[calc(50%-12px)]">
                                    <div className="group relative h-full">
                                        <div className="relative bg-surface-1 border border-lilac/30 flex flex-col h-full p-6 rounded-2xl hover:border-lilac/60 transition duration-300">
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">60-Min Call</h3>
                                                <p className="text-xs uppercase tracking-wider text-text-subtle">Deep Dive</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-lilac">Rp 360.000</div>
                                            </div>
                                            <div className="text-center text-sm text-text-light mb-6 flex-grow">
                                                <p>Deep dive selama 60 menit. Kita bedah masalahmu sampai ke akarnya.</p>
                                            </div>
                                            <div className="mt-auto min-h-[56px] flex items-end">
                                                {activeCard === 'call-60' ? (
                                                    <div className="w-full flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-[#252538] p-2 rounded-xl border border-lilac/20">
                                                        <div className="flex justify-between items-center px-2 mb-1">
                                                            <span className="text-[10px] text-lilac/70 uppercase tracking-wider font-bold">Pilih Platform</span>
                                                            <button onClick={() => setActiveCard(null)} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                                        </div>
                                                        <a href="https://lynk.id/mayanovtarot/gw0kzbA" target="_blank" rel="noopener noreferrer" onClick={handleCall60Lynk} className={highlightButtonClass + " py-2 text-xs"}>Via Lynk.id <ExternalLink className="w-3 h-3 opacity-50" /></a>
                                                        <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleCall60Picktime} className={outlineButtonClass + " py-2 text-xs"}>Via Picktime <ExternalLink className="w-3 h-3 opacity-50" /></a>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setActiveCard('call-60')} className={highlightButtonClass}>Pesan Sesi <ChevronRight className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>

                        {/* CATEGORY 4: Tatap Muka */}
                        <div className="relative" id="service-meetup">
                            <div className="absolute inset-0 bg-gradient-to-b from-teal-accent/5 to-transparent rounded-[3rem] -z-10 blur-xl"></div>

                            <div className="flex flex-col items-center gap-2 mb-10">
                                <div className="p-3 bg-teal-accent/10 rounded-full border border-teal-accent/20">
                                    <MapPin className="w-6 h-6 text-teal-accent" />
                                </div>
                                <h3 className="text-2xl font-bold text-teal-accent font-serif tracking-wide uppercase">Sesi Tatap Muka</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent rounded-full"></div>
                            </div>

                            <div className="flex flex-wrap justify-center max-w-md mx-auto">
                                {/* Meetup Session */}
                                <FadeIn className="w-full">
                                    <div className="group relative h-full">
                                        <div className="relative bg-surface-1 border border-white/10 flex flex-col h-full p-6 rounded-2xl hover:border-teal-accent/50 transition duration-300">
                                            <div className="mb-4 pt-4 text-center min-h-[80px] flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white font-serif">Meetup Session</h3>
                                                <p className="text-xs uppercase tracking-wider text-text-subtle">1 Jam (Jakarta Selatan)</p>
                                            </div>
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-teal-accent">Rp 450.000</div>
                                                <p className="text-[10px] text-text-subtle mt-1 font-bold">(Jam Pertama. Berikutnya Rp 300rb)</p>
                                            </div>
                                            <div className="text-center text-sm text-text-light mb-6 flex-grow">
                                                <p>Tatap muka langsung. Energi lebih terasa, analisa lebih tajam dan personal.</p>
                                            </div>
                                            <div className="mt-auto space-y-4">
                                                <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleMeetup} className={tealButtonClass}>Book Sekarang</a>

                                                <div className="text-center">
                                                    <a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('outbound_click', { label: 'Meetup Location', market: 'ID' }, 'FindLocation', { content_category: 'ID Service' })} className="inline-flex items-center gap-1 text-xs text-text-subtle hover:text-teal-accent transition-colors border-b border-transparent hover:border-teal-accent pb-0.5">
                                                        <MapPin className="w-3 h-3" />
                                                        Rekomendasi Tempat
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </section>
    );
};

export default Services;