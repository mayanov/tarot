import React from 'react';
import { ChevronRight, ExternalLink, Sparkles, MessageCircle, Phone, MapPin, MousePointerClick, MessageSquare } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import SectionHeader from '../UI/SectionHeader';
import { trackEvent } from '../../services/analytics';

interface ServicesProps {
    isIndonesian?: boolean;
}

const Services: React.FC<ServicesProps> = ({ isIndonesian = false }) => {
    // --- Handlers for Global (USD) ---
    const handleBookBasic = () => {
        trackEvent('initiate_checkout', { item_name: '3-Card Reading', market: 'Global' }, 'InitiateCheckout', { content_name: '3-Card Reading', value: 12.00, currency: 'USD', content_category: 'Global Service' });
    };
    const handleBookDeep = () => {
        trackEvent('initiate_checkout', { item_name: '5-Card Reading', market: 'Global' }, 'InitiateCheckout', { content_name: '5-Card Reading', value: 20.00, currency: 'USD', content_category: 'Global Service' });
    };
    const handleBookLive = () => {
        trackEvent('schedule', { item_name: 'Live Call Session', market: 'Global' }, 'Schedule', { content_name: 'Live Call Session', value: 45.00, currency: 'USD', content_category: 'Global Service' });
    };

    // --- Handlers for Indonesia (IDR) ---
    const handleNewYear = () => {
        trackEvent('begin_checkout', { item_name: 'New Year Reading 2026', market: 'ID' }, 'InitiateCheckout', { content_name: 'New Year Reading 2026', value: 250000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handlePromoBuy3Get5 = () => {
        trackEvent('begin_checkout', { item_name: 'Promo Beli 3 Dapat 5', market: 'ID' }, 'InitiateCheckout', { content_name: 'Promo Beli 3 Dapat 5', value: 315000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleChat3Question = () => {
        trackEvent('begin_checkout', { item_name: '3 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '3 Question Chat', value: 315000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleChat1Question = () => {
        trackEvent('begin_checkout', { item_name: '1 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '1 Question Chat', value: 140000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleCall30Lynk = () => {
        trackEvent('begin_checkout', { item_name: '30-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '30-Min Call (Lynk)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleCall30Picktime = () => {
        trackEvent('schedule', { item_name: '30-Min Call', market: 'ID' }, 'Schedule', { content_name: '30-Min Call (Picktime)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleCall60Lynk = () => {
        trackEvent('begin_checkout', { item_name: '60-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '60-Min Call (Lynk)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleCall60Picktime = () => {
        trackEvent('schedule', { item_name: '60-Min Call', market: 'ID' }, 'Schedule', { content_name: '60-Min Call (Picktime)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    };
    const handleMeetup = () => {
        trackEvent('schedule', { item_name: 'Meetup Session', market: 'ID' }, 'Schedule', { content_name: 'Meetup Session', value: 450000, currency: 'IDR', content_category: 'ID Service' });
    };

    // "How It Works" steps (merged in as a subsection of the pricing).
    const steps = [
        {
            icon: MousePointerClick,
            tone: 'text-coral',
            title: isIndonesian ? '1. Pilih Layanan' : '1. Pick a Reading',
            desc: isIndonesian ? 'Cari paket yang sesuai kebutuhanmu saat ini.' : 'Choose the option that feels right for you.',
        },
        {
            icon: MessageSquare,
            tone: 'text-plum',
            title: isIndonesian ? '2. Ceritakan Masalahmu' : '2. Send Your Question',
            desc: isIndonesian ? 'Ceritakan secara singkat konteks permasalahan yang ingin ditanyakan.' : "Tell me what's on your mind in the order notes.",
        },
        {
            icon: Sparkles,
            tone: 'text-sage',
            title: isIndonesian ? '3. Dapat Pencerahan' : '3. Get Your Answers',
            desc: isIndonesian ? 'Dapatkan hasil reading kamu sesuai dengan layanan yang kamu pilih.' : 'Receive your personal insights & guidance.',
        },
    ];

    // Buttons stay coral throughout (per brand guideline); plan colour lives in the price/badge.
    const btnOutline = "inline-flex items-center justify-center gap-1 w-full px-5 py-2.5 rounded-full border border-coral/50 text-coral text-sm font-medium hover:bg-coral hover:text-cream transition-colors";
    const btnFilled = "inline-flex items-center justify-center gap-1 w-full px-5 py-2.5 rounded-full bg-coral text-cream text-sm font-medium hover:bg-coral-deep transition-colors shadow-[0_12px_28px_-14px_rgba(216,128,90,0.9)]";
    const btnMini = "inline-flex items-center justify-center gap-1 w-full px-3 py-2 rounded-full border border-coral/50 text-coral text-xs font-medium hover:bg-coral hover:text-cream transition-colors";

    // Compact vertical card, used in side-by-side grids.
    const PlanCard: React.FC<{
        name: string; sub?: string; price: string; desc: React.ReactNode; badge?: string;
        tone: string; toneBorder: string; featured?: boolean; features?: React.ReactNode; children: React.ReactNode;
    }> = ({ name, sub, price, desc, badge, tone, toneBorder, featured, features, children }) => (
        <div className={`relative flex flex-col h-full rounded-2xl p-5 shadow-[0_18px_40px_-30px_rgba(42,35,32,0.4)] ${featured ? `bg-paper-2 border-2 ${toneBorder}` : 'bg-surface-1 border border-line'}`}>
            {badge && <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold mb-2 ${tone}`}>{badge}</span>}
            <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-serif font-medium text-ink leading-tight">
                    {name}
                    {sub && <span className="block text-xs text-taupe font-medium font-sans mt-0.5">{sub}</span>}
                </h3>
                <span className={`text-xl font-serif font-medium leading-none whitespace-nowrap ${tone}`}>{price}</span>
            </div>
            <p className="mt-2.5 text-sm text-ink-soft font-light leading-relaxed flex-grow">{desc}</p>
            {features && <p className="mt-2.5 text-xs text-taupe leading-relaxed">{features}</p>}
            <div className="mt-4">{children}</div>
        </div>
    );

    // Category label for the ID layout.
    const CategoryHeader: React.FC<{ icon: React.ReactNode; label: string; tone: string }> = ({ icon, label, tone }) => (
        <div className="flex items-center justify-center gap-2.5 mb-4">
            <span className={`grid place-items-center w-8 h-8 rounded-full border ${tone}`}>{icon}</span>
            <h3 className="text-lg font-serif font-medium text-ink tracking-wide">{label}</h3>
        </div>
    );

    return (
        <section
            id="services"
            className="py-12 md:py-16 relative overflow-hidden border-y border-line"
            style={{
                background:
                    'radial-gradient(56% 48% at 100% -2%, rgba(84,77,90,0.30), rgba(243,237,230,0) 56%), radial-gradient(58% 55% at 0% 102%, rgba(93,122,153,0.30), rgba(243,237,230,0) 60%), linear-gradient(160deg, #E8E7E9 0%, #E4E6EA 100%)',
            }}
        >
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <FadeIn>
                    <SectionHeader
                        label={isIndonesian ? 'Layanan' : 'The Readings'}
                        index={isIndonesian ? '(Pilih paketmu)' : '(Pick a depth)'}
                        title={isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                        intro={isIndonesian
                            ? 'Pilih metode yang paling nyaman — analisa tajam, solutif, tanpa basa-basi.'
                            : 'Clear options, no hidden fees. Just choose the depth you need.'}
                    />
                </FadeIn>

                {!isIndonesian ? (
                    /* ===================== GLOBAL (USD) ===================== */
                    <FadeIn>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
                            <PlanCard tone="text-terracotta" toneBorder="border-terracotta/45" name="3-Card Spread" price="$12"
                                desc="A quick check-in on one specific question — direct and to the point."
                                features={<>Photo of your spread · within 24h · <span className="text-terracotta font-medium">1 qty = 1 question</span></>}>
                                <a href="https://www.paypal.com/ncp/payment/DSPX84KBN8GC2" target="_blank" rel="noopener noreferrer" onClick={handleBookBasic} className={btnOutline}>Book <ChevronRight className="w-4 h-4" /></a>
                            </PlanCard>

                            <PlanCard tone="text-terracotta" toneBorder="border-terracotta/45" featured badge="Most Popular" name="5-Card Deep" price="$20"
                                desc="The bigger picture — hidden influences and what's coming next, read in depth."
                                features={<>5-card spread · high-res photo · priority 24h · <span className="text-terracotta font-medium">1 qty = 1 question</span></>}>
                                <a href="https://www.paypal.com/ncp/payment/V6U4QMAU642KA" target="_blank" rel="noopener noreferrer" onClick={handleBookDeep} className={btnFilled}>Get Clarity <ChevronRight className="w-4 h-4" /></a>
                            </PlanCard>

                            <PlanCard tone="text-blue" toneBorder="border-blue/45" name="Live Session" sub="/ 30 min" price="$45"
                                desc="Talk it out live on Google Meet and dive as deep as you want, together."
                                features={<><span className="text-blue font-medium">Unlimited questions</span> · real-time feedback · natural flow</>}>
                                <a href="https://www.picktime.com/mayanovtarotEn#book/date" target="_blank" rel="noopener noreferrer" onClick={handleBookLive} className={btnOutline}>Schedule <ChevronRight className="w-4 h-4" /></a>
                            </PlanCard>
                        </div>
                    </FadeIn>
                ) : (
                    /* ===================== INDONESIA (IDR) ===================== */
                    <div className="space-y-12">

                        {/* CATEGORY 1: Edisi Spesial (single → full-width row) */}
                        <div id="service-special">
                            <CategoryHeader tone="bg-coral/10 border-coral/25 text-coral" icon={<Sparkles className="w-4 h-4" />} label="Edisi Spesial" />
                            <FadeIn>
                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 pl-6 sm:pl-7 rounded-2xl bg-paper-2 border-2 border-coral/40 max-w-3xl mx-auto shadow-[0_20px_45px_-32px_rgba(216,128,90,0.4)]">
                                    <span className="absolute left-0 inset-y-0 w-1 bg-coral"></span>
                                    <div className="sm:flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-serif font-medium text-ink">New Year Reading 2026</h3>
                                            <span className="bg-coral text-cream text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Limited</span>
                                        </div>
                                        <p className="mt-1 text-sm text-ink-soft font-light leading-relaxed">Siap hadapi tahun depan dengan strategi matang.</p>
                                        <p className="mt-2 text-xs text-taupe">General Overview 2026 · Harta, Tahta, Cinta · Saran Strategis · <span className="italic">PDF via WhatsApp (2 hari kerja)</span></p>
                                    </div>
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-3 sm:shrink-0">
                                        <span className="text-2xl font-serif font-medium text-coral leading-none">Rp 250.000</span>
                                        <a href="https://forms.gle/xpMFUUhkyRW8FgY67" target="_blank" rel="noopener noreferrer" onClick={handleNewYear} className={`${btnFilled} sm:w-auto sm:px-6`}>Pesan <ChevronRight className="w-4 h-4" /></a>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                        {/* CATEGORY 2: Konsultasi Chat (3 → grid) */}
                        <div id="service-chat">
                            <CategoryHeader tone="bg-plum/10 border-plum/25 text-plum" icon={<MessageCircle className="w-4 h-4" />} label="Konsultasi Chat" />
                            <FadeIn>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
                                    <PlanCard tone="text-plum" toneBorder="border-plum/45" featured badge="Promo · Best Value" name="Beli 3 Dapat 5" price="Rp 315.000"
                                        desc={<>Cukup bayar 3 pertanyaan, dapat <b className="text-ink font-medium">5 pertanyaan</b>. Lebih hemat.</>}
                                        features={<><span className="line-through opacity-70">Normal Rp 500.000+</span> · Syarat: dipakai di hari yang sama</>}>
                                        <a href="http://lynk.id/mayanovtarot/mm7ykgdwndez/" target="_blank" rel="noopener noreferrer" onClick={handlePromoBuy3Get5} className={btnFilled}>Ambil Promo <ChevronRight className="w-4 h-4" /></a>
                                    </PlanCard>

                                    <PlanCard tone="text-plum" toneBorder="border-plum/45" badge="Best Seller" name="3 Question Chat" price="Rp 315.000"
                                        desc="Konsultasi via chat — dibalas dengan analisa mendalam via WhatsApp."
                                        features="Pertanyaan bisa ditabung untuk lain waktu">
                                        <a href="https://lynk.id/mayanovtarot/XBpJGb5" target="_blank" rel="noopener noreferrer" onClick={handleChat3Question} className={btnOutline}>Pesan <ChevronRight className="w-4 h-4" /></a>
                                    </PlanCard>

                                    <PlanCard tone="text-ink" toneBorder="border-line" name="1 Question Chat" price="Rp 140.000"
                                        desc="Solusi kilat untuk satu pertanyaan mendesak yang butuh jawaban segera."
                                        features="Via chat teks">
                                        <a href="https://lynk.id/mayanovtarot/AKbGK0X" target="_blank" rel="noopener noreferrer" onClick={handleChat1Question} className={btnOutline}>Pesan <ChevronRight className="w-4 h-4" /></a>
                                    </PlanCard>
                                </div>
                            </FadeIn>
                        </div>

                        {/* CATEGORY 3: Panggilan Suara & Video (2 → grid) */}
                        <div id="service-call">
                            <CategoryHeader tone="bg-blue/10 border-blue/25 text-blue" icon={<Phone className="w-4 h-4" />} label="Panggilan Suara & Video" />
                            <FadeIn>
                                <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto items-stretch">
                                    <PlanCard tone="text-blue" toneBorder="border-blue/45" name="30-Min Call" sub="Sesi Singkat" price="Rp 220.000"
                                        desc="Ngobrol langsung 30 menit via WhatsApp Call / Google Meet. Tidak terbatas jumlah pertanyaan.">
                                        <div className="grid grid-cols-2 gap-2">
                                            <a href="https://lynk.id/mayanovtarot/9ANjbJE" target="_blank" rel="noopener noreferrer" onClick={handleCall30Lynk} className={btnMini}>Lynk.id <ExternalLink className="w-3 h-3 opacity-60" /></a>
                                            <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleCall30Picktime} className={btnMini}>Picktime <ExternalLink className="w-3 h-3 opacity-60" /></a>
                                        </div>
                                    </PlanCard>

                                    <PlanCard tone="text-blue" toneBorder="border-blue/45" featured badge="Deep Dive" name="60-Min Call" sub="Bedah Tuntas" price="Rp 360.000"
                                        desc="Ngobrol langsung 60 menit via WhatsApp Call / Google Meet. Bedah masalah sampai ke akarnya.">
                                        <div className="grid grid-cols-2 gap-2">
                                            <a href="https://lynk.id/mayanovtarot/gw0kzbA" target="_blank" rel="noopener noreferrer" onClick={handleCall60Lynk} className={btnMini}>Lynk.id <ExternalLink className="w-3 h-3 opacity-60" /></a>
                                            <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleCall60Picktime} className={btnMini}>Picktime <ExternalLink className="w-3 h-3 opacity-60" /></a>
                                        </div>
                                    </PlanCard>
                                </div>
                            </FadeIn>
                        </div>

                        {/* CATEGORY 4: Sesi Tatap Muka (single → full-width row) */}
                        <div id="service-meetup">
                            <CategoryHeader tone="bg-sage/10 border-sage/25 text-sage" icon={<MapPin className="w-4 h-4" />} label="Sesi Tatap Muka" />
                            <FadeIn>
                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-surface-1 border border-line max-w-3xl mx-auto shadow-[0_20px_45px_-34px_rgba(42,35,32,0.4)]">
                                    <div className="sm:flex-1 min-w-0">
                                        <h3 className="text-lg font-serif font-medium text-ink">Meetup Session <span className="text-xs text-taupe font-medium">· 1 Jam, Jakarta Selatan</span></h3>
                                        <p className="mt-1 text-sm text-ink-soft font-light leading-relaxed">Sesi tarot reading temu langsung di Jakarta Selatan. Energi lebih terasa, analisa lebih personal.</p>
                                        <p className="mt-2 text-xs text-taupe">
                                            Jam pertama; berikutnya Rp 360rb/jam ·{' '}
                                            <a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('outbound_click', { label: 'Meetup Location', market: 'ID' }, 'FindLocation', { content_category: 'ID Service' })} className="text-sage font-medium border-b border-sage/40 hover:border-sage">Rekomendasi tempat</a>
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:shrink-0">
                                        <span className="text-2xl font-serif font-medium text-sage leading-none">Rp 450.000</span>
                                        <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleMeetup} className={`${btnFilled} sm:w-auto sm:px-6`}>Book <ChevronRight className="w-4 h-4" /></a>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                    </div>
                )}

                {/* ===== How It Works — compact subsection of the pricing ===== */}
                <FadeIn>
                    <div id="process" className="mt-8 md:mt-10 pt-7 border-t border-line max-w-3xl mx-auto scroll-mt-24">
                        <h3 className="text-center text-base md:text-lg font-serif font-medium text-ink mb-6">
                            <span className="text-terracotta">{isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}</span>
                            {isIndonesian ? ' — 3 langkah mudah' : ' — in 3 easy steps'}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                            {steps.map((step, i) => (
                                <div key={i} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                                    <div className={`shrink-0 grid place-items-center w-10 h-10 rounded-full bg-surface-1 border border-line ${step.tone}`}>
                                        <step.icon className="w-4 h-4" strokeWidth={1.75} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-serif font-medium text-ink">{step.title}</h4>
                                        <p className="text-xs text-ink-soft leading-relaxed font-light">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Services;
