import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Plus } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';
import { trackEvent } from '../../services/analytics';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Compact pill buttons for the price list.
const btnFilled = "inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-ink text-cream text-sm font-medium hover:bg-charcoal-deep transition-colors w-full sm:w-auto whitespace-nowrap";
const btnOutline = "inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full border border-cream/30 text-cream text-sm font-medium hover:bg-cream hover:text-ink transition-colors w-full sm:w-auto whitespace-nowrap";

// One line item in the editorial price list.
const PriceRow: React.FC<{
    name: string; sub?: string; price: string; oldPrice?: string; desc: React.ReactNode;
    features?: React.ReactNode; badge?: string; badgeTone?: string; children: React.ReactNode;
}> = ({ name, sub, price, oldPrice, desc, features, badge, badgeTone, children }) => (
    <div className="group grid md:grid-cols-12 gap-x-6 gap-y-4 md:items-center py-6 md:py-7 border-b border-white/10">
        <div className="md:col-span-6">
            <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl md:text-2xl font-serif font-semibold text-cream leading-tight tracking-tight">
                    {name}
                    {sub && <span className="text-sm text-cream font-sans font-normal ml-2">{sub}</span>}
                </h3>
                {badge && (
                    <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded-full ${badgeTone || 'bg-white/10 text-cream'}`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="mt-2 text-sm md:text-[0.95rem] text-cream font-light leading-relaxed max-w-md">{desc}</p>
            {features && <p className="mt-1.5 text-xs text-cream leading-relaxed max-w-md">{features}</p>}
        </div>
        <div className="md:col-span-3">
            {oldPrice && <span className="block text-sm text-cream line-through leading-none mb-1">{oldPrice}</span>}
            <span className="text-2xl md:text-[1.9rem] font-serif font-semibold text-cream leading-none whitespace-nowrap">{price}</span>
        </div>
        <div className="md:col-span-3 md:justify-self-end w-full md:w-auto">
            {children}
        </div>
    </div>
);

// Per-category colour so each pricing group is easy to tell apart.
const CAT: Record<string, { tone: string; border: string; rule: string; mesh: string }> = {
    coral: { tone: 'text-coral', border: 'border-white/12', rule: 'border-coral/45', mesh: 'catCoral' },
    plum: { tone: 'text-mauve', border: 'border-white/12', rule: 'border-mauve/45', mesh: 'catPlum' },
    blue: { tone: 'text-[#88ADDA]', border: 'border-white/12', rule: 'border-[#88ADDA]/45', mesh: 'catBlue' },
    sage: { tone: 'text-[#7FC08F]', border: 'border-white/12', rule: 'border-[#7FC08F]/50', mesh: 'catSage' },
};

// Category grouping (ID layout) — a distinct grainy mesh panel per category.
const CategoryGroup: React.FC<{ icon: React.ReactNode; label: string; color: keyof typeof CAT; children: React.ReactNode; id?: string }> = ({ icon, label, color, children, id }) => {
    const c = CAT[color];
    return (
        <div id={id} className={`scroll-mt-24 relative overflow-hidden isolate rounded-2xl md:rounded-[1.75rem] border ${c.border} p-6 md:p-8 lg:p-10`}>
            <GrainyMesh variant={c.mesh} />
            <div className={`relative flex items-center gap-3 mb-5 ${c.tone}`}>
                {icon}
                <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight leading-none">{label}</h3>
            </div>
            <div className={`relative border-t-2 ${c.rule}`}>{children}</div>
        </div>
    );
};

// A single CTA that opens a dropdown of booking platforms (for services with 2 links).
const BookingDropdown: React.FC<{ label: string; btnClass: string; options: { name: string; href: string; onClick?: () => void }[] }> = ({ label, btnClass, options }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative w-full sm:w-auto" ref={ref}>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open} className={btnClass}>
                {label}
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-full sm:w-56 bg-[#20142F] border border-white/12 rounded-xl shadow-[0_20px_45px_-20px_rgba(0,0,0,0.6)] p-1.5 z-30">
                    <p className="px-3 pt-1.5 pb-2 text-[0.6rem] uppercase tracking-[0.18em] text-cream">Pilih platform booking</p>
                    {options.map((o) => (
                        <a key={o.name} href={o.href} target="_blank" rel="noopener noreferrer" onClick={o.onClick}
                            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream hover:bg-white/8 transition-colors">
                            {o.name} <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const Services: React.FC<ServicesProps> = ({ isIndonesian = false }) => {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    // --- Handlers for Global (USD) ---
    const handleBookBasic = () => trackEvent('initiate_checkout', { item_name: '3-Card Reading', market: 'Global' }, 'InitiateCheckout', { content_name: '3-Card Reading', value: 12.00, currency: 'USD', content_category: 'Global Service' });
    const handleBookDeep = () => trackEvent('initiate_checkout', { item_name: '5-Card Reading', market: 'Global' }, 'InitiateCheckout', { content_name: '5-Card Reading', value: 20.00, currency: 'USD', content_category: 'Global Service' });
    const handleBookLive = () => trackEvent('schedule', { item_name: 'Live Call Session', market: 'Global' }, 'Schedule', { content_name: 'Live Call Session', value: 45.00, currency: 'USD', content_category: 'Global Service' });

    // --- Handlers for Indonesia (IDR) ---
    const handleNewYear = () => trackEvent('begin_checkout', { item_name: 'New Year Reading 2026', market: 'ID' }, 'InitiateCheckout', { content_name: 'New Year Reading 2026', value: 250000, currency: 'IDR', content_category: 'ID Service' });
    const handlePromoBuy3Get5 = () => trackEvent('begin_checkout', { item_name: 'Promo Beli 3 Dapat 5', market: 'ID' }, 'InitiateCheckout', { content_name: 'Promo Beli 3 Dapat 5', value: 315000, currency: 'IDR', content_category: 'ID Service' });
    const handleChat3Question = () => trackEvent('begin_checkout', { item_name: '3 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '3 Question Chat', value: 315000, currency: 'IDR', content_category: 'ID Service' });
    const handleChat1Question = () => trackEvent('begin_checkout', { item_name: '1 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '1 Question Chat', value: 140000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall30Lynk = () => trackEvent('begin_checkout', { item_name: '30-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '30-Min Call (Lynk)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall30Picktime = () => trackEvent('schedule', { item_name: '30-Min Call', market: 'ID' }, 'Schedule', { content_name: '30-Min Call (Picktime)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall60Lynk = () => trackEvent('begin_checkout', { item_name: '60-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '60-Min Call (Lynk)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall60Picktime = () => trackEvent('schedule', { item_name: '60-Min Call', market: 'ID' }, 'Schedule', { content_name: '60-Min Call (Picktime)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    const handleMeetup = () => trackEvent('schedule', { item_name: 'Meetup Session', market: 'ID' }, 'Schedule', { content_name: 'Meetup Session', value: 450000, currency: 'IDR', content_category: 'ID Service' });

    const steps = isIndonesian
        ? [
            { title: 'Pilih Layanan', desc: 'Cari paket yang sesuai kebutuhanmu saat ini.' },
            { title: 'Ceritakan Masalahmu', desc: 'Ceritakan secara singkat konteks permasalahan yang ingin ditanyakan.' },
            { title: 'Dapat Pencerahan', desc: 'Dapatkan hasil reading kamu sesuai dengan layanan yang kamu pilih.' },
        ]
        : [
            { title: 'Pick a Reading', desc: 'Choose the option that feels right for you.' },
            { title: 'Send Your Question', desc: "Tell me what's on your mind in the order notes." },
            { title: 'Get Your Answers', desc: 'Receive your personal insights & guidance.' },
        ];

    // Editorial accordion pricelist — each service type is a row that expands to its options.
    const groups = isIndonesian
        ? [
            {
                id: 'service-special', type: 'Edisi Spesial', tags: ['PDF', 'MUSIMAN'],
                blurb: 'Bacaan tematik & musiman, dikirim rapi sebagai PDF via WhatsApp.',
                priceLabel: 'Rp 250.000',
                offers: [
                    {
                        name: 'New Year Reading 2026', price: 'Rp 250.000',
                        badge: 'Limited', badgeTone: 'bg-coral text-cream',
                        desc: 'Siap hadapi tahun depan dengan strategi matang.',
                        features: 'General Overview 2026 · Harta, Tahta, Cinta · PDF via WhatsApp (2 hari kerja)',
                        cta: <a href="https://forms.gle/xpMFUUhkyRW8FgY67" target="_blank" rel="noopener noreferrer" onClick={handleNewYear} className={btnFilled}>Pesan <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
            {
                id: 'service-chat', type: 'Konsultasi via Chat', tags: ['CHAT', 'WHATSAPP'],
                blurb: 'Konsultasi via WhatsApp Chat. Harga per pertanyaan — pertanyaan dapat ditabung untuk lain waktu.',
                priceLabel: 'Rp 140rb–315rb',
                offers: [
                    {
                        name: '1 Pertanyaan', price: 'Rp 140.000',
                        cta: <a href="https://lynk.id/mayanovtarot/AKbGK0X" target="_blank" rel="noopener noreferrer" onClick={handleChat1Question} className={btnOutline}>Pesan <ChevronRight className="w-4 h-4" /></a>,
                    },
                    {
                        name: '3 Pertanyaan', price: 'Rp 315.000',
                        cta: <a href="https://lynk.id/mayanovtarot/XBpJGb5" target="_blank" rel="noopener noreferrer" onClick={handleChat3Question} className={btnOutline}>Pesan <ChevronRight className="w-4 h-4" /></a>,
                    },
                    {
                        name: 'Beli 3 Dapat 5 Pertanyaan', price: 'Rp 315.000',
                        badge: 'Promo', badgeTone: 'bg-coral/20 text-coral',
                        features: 'Bayar 3, dapat 5 pertanyaan (dipakai di hari yang sama).',
                        cta: <a href="http://lynk.id/mayanovtarot/mm7ykgdwndez/" target="_blank" rel="noopener noreferrer" onClick={handlePromoBuy3Get5} className={btnFilled}>Ambil Promo <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
            {
                id: 'service-call', type: 'Panggilan Suara & Video', tags: ['VIDEO', 'REAL-TIME'],
                blurb: 'Ngobrol langsung via call / video — tak terbatas jumlah pertanyaan.',
                priceLabel: 'Rp 220rb–360rb',
                offers: [
                    {
                        name: '30-Min Call', price: 'Rp 220.000',
                        cta: <BookingDropdown label="Pesan" btnClass={btnOutline} options={[{ name: 'Lynk.id', href: 'https://lynk.id/mayanovtarot/9ANjbJE', onClick: handleCall30Lynk }, { name: 'Picktime', href: 'https://www.picktime.com/mayanovtarot', onClick: handleCall30Picktime }]} />,
                    },
                    {
                        name: '60-Min Call', price: 'Rp 360.000',
                        cta: <BookingDropdown label="Pesan" btnClass={btnFilled} options={[{ name: 'Lynk.id', href: 'https://lynk.id/mayanovtarot/gw0kzbA', onClick: handleCall60Lynk }, { name: 'Picktime', href: 'https://www.picktime.com/mayanovtarot', onClick: handleCall60Picktime }]} />,
                    },
                ],
            },
            {
                id: 'service-meetup', type: 'Sesi Tatap Muka', tags: ['JAKSEL', '1 JAM'],
                blurb: 'Temu langsung di Jakarta Selatan — energi lebih terasa, analisa lebih personal.',
                priceLabel: 'Rp 450.000',
                offers: [
                    {
                        name: 'Meetup Session', sub: '1 Jam · Jakarta Selatan', price: 'Rp 450.000',
                        desc: 'Sesi tarot reading temu langsung. Jam pertama; berikutnya Rp 360rb/jam.',
                        features: <><a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" className="text-cream border-b border-cream/40 hover:border-cream">Rekomendasi tempat</a></>,
                        cta: <a href="https://www.picktime.com/mayanovtarot" target="_blank" rel="noopener noreferrer" onClick={handleMeetup} className={btnFilled}>Book <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
        ]
        : [
            {
                id: '', type: '3-Card Spread', tags: ['QUICK', '24H'],
                blurb: 'A quick, direct check-in on one specific question.',
                priceLabel: '$12',
                offers: [
                    {
                        name: '3-Card Spread', price: '$12',
                        desc: 'A quick check-in on one specific question — direct and to the point.',
                        features: <>Photo of your spread · within 24h · <span className="text-cream font-medium">1 qty = 1 question</span></>,
                        cta: <a href="https://www.paypal.com/ncp/payment/DSPX84KBN8GC2" target="_blank" rel="noopener noreferrer" onClick={handleBookBasic} className={btnOutline}>Book <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
            {
                id: '', type: '5-Card Deep', tags: ['IN-DEPTH', 'POPULAR'],
                blurb: "The bigger picture — hidden influences and what's coming next.",
                priceLabel: '$20',
                offers: [
                    {
                        name: '5-Card Deep', price: '$20', badge: 'Most Popular', badgeTone: 'bg-coral text-cream',
                        desc: "The bigger picture — hidden influences and what's coming next, read in depth.",
                        features: <>5-card spread · high-res photo · priority 24h · <span className="text-cream font-medium">1 qty = 1 question</span></>,
                        cta: <a href="https://www.paypal.com/ncp/payment/V6U4QMAU642KA" target="_blank" rel="noopener noreferrer" onClick={handleBookDeep} className={btnFilled}>Get Clarity <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
            {
                id: '', type: 'Live Session', tags: ['LIVE', '30 MIN'],
                blurb: 'Talk it out live on Google Meet and go as deep as you want.',
                priceLabel: '$45',
                offers: [
                    {
                        name: 'Live Session', sub: '30 min', price: '$45',
                        desc: 'Talk it out live on Google Meet and dive as deep as you want, together.',
                        features: <><span className="text-cream font-medium">Unlimited questions</span> · real-time feedback · natural flow</>,
                        cta: <a href="https://www.picktime.com/mayanovtarotEn#book/date" target="_blank" rel="noopener noreferrer" onClick={handleBookLive} className={btnOutline}>Schedule <ChevronRight className="w-4 h-4" /></a>,
                    },
                ],
            },
        ];

    return (
        <section
            id="services"
            className="py-16 md:py-24 relative overflow-hidden isolate border-y border-white/10"
        >
            <div className="max-w-[1640px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
                {/* Header — asymmetric */}
                <FadeIn>
                    <div className="grid lg:grid-cols-12 gap-y-6 lg:gap-x-16 items-end mb-12 md:mb-16">
                        <h2 className={`lg:col-span-7 font-serif font-semibold ${isIndonesian ? 'text-cream' : 'text-cream'} text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]`}>
                            {isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                        </h2>
                        <p className={`lg:col-span-4 lg:col-start-9 ${isIndonesian ? 'text-cream' : 'text-cream'} font-light leading-relaxed lg:pb-2`}>
                            {isIndonesian
                                ? 'Pilih metode yang paling nyaman — analisa tajam, solutif, tanpa basa-basi.'
                                : 'Clear options, no hidden fees. Just choose the depth you need.'}
                        </p>
                    </div>
                </FadeIn>

                {/* ===== Editorial pricelist — category identity merged with its options ===== */}
                <div className="border-t border-white/12">
                    {groups.map((g, i) => (
                        <FadeIn key={g.type} delay={i * 70}>
                            <div id={g.id || undefined} className="border-b border-white/12 scroll-mt-28 grid md:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-6 py-8 md:py-11">
                                {/* LEFT — category identity */}
                                <div className="md:col-span-4">
                                    <h3 className="text-2xl sm:text-3xl md:text-[2.4rem] font-serif font-semibold text-cream leading-none tracking-tight">
                                        {g.type}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-4 mb-3">
                                        {g.tags.map((t) => (
                                            <span key={t} className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] bg-white/[0.07] text-cream rounded">{t}</span>
                                        ))}
                                    </div>
                                    <p className="text-cream text-sm font-light leading-relaxed max-w-sm">{g.blurb}</p>
                                </div>
                                {/* RIGHT — options */}
                                <div className="md:col-span-8 md:border-l md:border-white/10 md:pl-8 lg:pl-14">
                                    {g.offers.map((o, oi) => (
                                        <div key={oi} className="py-4 md:py-5 border-b border-white/10 last:border-b-0 last:pb-0 md:grid md:grid-cols-[minmax(0,1fr)_8rem_auto] md:items-center md:gap-x-6">
                                            <div className="mb-2 md:mb-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="text-lg md:text-xl font-serif font-semibold text-cream leading-tight tracking-tight">
                                                        {o.name}{o.sub && <span className="text-sm text-cream font-sans font-normal ml-2">{o.sub}</span>}
                                                    </h4>
                                                    {o.badge && <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded-full ${o.badgeTone || 'bg-white/10 text-cream'}`}>{o.badge}</span>}
                                                </div>
                                                {o.desc && <p className="mt-1.5 text-sm text-cream font-light leading-relaxed max-w-md">{o.desc}</p>}
                                                {o.features && <p className="mt-1.5 text-xs text-cream leading-relaxed max-w-md">{o.features}</p>}
                                            </div>
                                            <div className="mb-3 md:mb-0">
                                                {o.oldPrice && <span className="block text-xs text-cream line-through leading-none mb-1">{o.oldPrice}</span>}
                                                <span className="text-xl md:text-2xl font-serif font-semibold text-cream leading-none whitespace-nowrap">{o.price}</span>
                                            </div>
                                            <div className="md:justify-self-end w-full md:w-auto">{o.cta}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* ===== How it works ===== */}
                <FadeIn>
                    <div id="process" className={`mt-16 md:mt-24 pt-10 border-t ${isIndonesian ? 'border-cream/15' : 'border-white/12'} scroll-mt-24`}>
                        <h3 className={`font-serif font-semibold ${isIndonesian ? 'text-cream' : 'text-cream'} text-xl md:text-2xl tracking-tight mb-8`}>
                            {isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}
                            <span className={`font-normal ${isIndonesian ? 'text-cream' : 'text-cream'}`}>{isIndonesian ? ' — 3 langkah' : ' — in 3 steps'}</span>
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-x-8 gap-y-8">
                            {steps.map((step, i) => (
                                <div key={i} className={`border-t ${isIndonesian ? 'border-cream/15' : 'border-white/12'} pt-5`}>
                                    <span className={`font-serif font-semibold text-3xl md:text-4xl tabular-nums leading-none ${isIndonesian ? 'text-coral/70' : 'text-coral/40'}`}>0{i + 1}</span>
                                    <h4 className={`mt-4 text-base md:text-lg font-serif font-semibold ${isIndonesian ? 'text-cream' : 'text-cream'}`}>{step.title}</h4>
                                    <p className={`mt-1.5 text-sm leading-relaxed font-light ${isIndonesian ? 'text-cream' : 'text-cream'}`}>{step.desc}</p>
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
