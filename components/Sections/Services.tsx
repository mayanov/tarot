import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';

const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Dark order pill on the light ground — opens the on-site booking flow.
const btnCard = "inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-none border border-cream text-cream text-sm font-semibold hover:bg-cream hover:text-ink transition-colors duration-300";

// A per-category tint — subtle warm-bone panels that alternate for a gentle rhythm on light.
const PANELS = ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'];

// One offer line inside a category row: name (+ inline badge) left, price right.
const OfferRow: React.FC<{ o: any }> = ({ o }) => (
    <div className="py-4 border-t border-white/10 first:border-t-0">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h4 className="text-[1.05rem] font-serif font-semibold text-cream leading-tight tracking-tight">
                    {o.name}{o.sub && <span className="text-sm text-cream/55 font-sans font-normal ml-2">{o.sub}</span>}
                </h4>
                {o.badge && <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded-none ${o.badgeTone || 'bg-white/[0.06] text-cream'}`}>{o.badge}</span>}
            </div>
            <div className="text-right shrink-0">
                {o.oldPrice && <span className="text-xs text-cream/45 line-through leading-none block">{o.oldPrice}</span>}
                <span className="text-lg md:text-xl font-serif font-semibold text-cream leading-none whitespace-nowrap">{o.price}</span>
            </div>
        </div>
        {o.desc && <p className="mt-2 text-sm text-cream/70 font-light leading-relaxed max-w-2xl">{o.desc}</p>}
        {o.features && <p className="mt-1.5 text-xs text-cream/50 leading-relaxed max-w-2xl">{o.features}</p>}
    </div>
);

// Maps a pricelist category to a booking-modal service id (by category name so it
// works for both markets). Unmapped categories (e.g. Call, with 30/60 options) open
// the booking modal on its service picker.
const BOOKING_MAP: Record<string, string> = {
    'Edisi Spesial': 'special',
    'Konsultasi via Chat': 'chat',
    'Panggilan Suara & Video': 'call',
    'Sesi Tatap Muka': 'meetup',
    '3-Card Spread': '3card',
    '5-Card Deep': '5card',
    'Live Session': 'live',
};

const openBooking = (serviceId?: string) =>
    window.dispatchEvent(new CustomEvent('open-booking', { detail: serviceId ? { serviceId } : {} }));

// The order button for a category — opens the on-site booking flow.
const OrderButton: React.FC<{ g: any; isIndonesian: boolean }> = ({ g, isIndonesian }) => {
    const label = isIndonesian ? 'Pesan Sekarang' : 'Book a Reading';
    return (
        <button type="button" onClick={() => openBooking(BOOKING_MAP[g.type])} className={btnCard}>
            {label} <ChevronRight className="w-4 h-4" />
        </button>
    );
};

const Services: React.FC<ServicesProps> = ({ isIndonesian = false }) => {
    // Accordion — one pricelist open at a time; first open by default.
    const [openIdx, setOpenIdx] = useState<number>(0);
    const toggle = (i: number) => setOpenIdx((cur) => (cur === i ? -1 : i));

    // Each category band reveals as it scrolls in: the top rule draws across and
    // the title/price rise from behind a mask (clip reveal — no opacity fade).
    const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [shown, setShown] = useState<boolean[]>([]);
    useEffect(() => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const idx = Number((e.target as HTMLElement).dataset.idx);
                setShown((prev) => { if (prev[idx]) return prev; const n = [...prev]; n[idx] = true; return n; });
                obs.unobserve(e.target);
            });
        }, { threshold: 0.28, rootMargin: '0px 0px -12% 0px' });
        bandRefs.current.forEach((el) => el && obs.observe(el));
        return () => obs.disconnect();
    }, []);

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
            { title: 'Pilih Layanan', desc: 'Pilih paket yang paling sesuai dengan kebutuhanmu saat ini.' },
            { title: 'Booking & Bayar', desc: 'Amankan slotmu lewat platform booking pilihanmu.' },
            { title: 'Ceritakan Masalahmu', desc: 'Bagikan konteks singkat & pertanyaan yang ingin ditanyakan.' },
            { title: 'Sesi Pembacaan', desc: 'Kartu dibuka & dibahas sesuai layanan yang kamu pilih.' },
            { title: 'Langkah Konkret', desc: 'Pulang dengan kejelasan & arah yang bisa langsung dijalankan.' },
        ]
        : [
            { title: 'Pick a Reading', desc: 'Choose the option that fits where you are right now.' },
            { title: 'Book & Pay', desc: 'Secure your slot through your preferred platform.' },
            { title: 'Share Your Question', desc: 'Tell me the context and what you want to explore.' },
            { title: 'The Reading', desc: 'We open the cards and unpack them together.' },
            { title: 'Walk Away Clear', desc: 'Leave with concrete next steps and direction.' },
        ];

    // Editorial accordion pricelist — each service type is a row that expands to its options.
    const groups = isIndonesian
        ? [
            {
                id: 'service-special', type: 'Edisi Spesial', tags: ['PDF', 'MUSIMAN'], seasonal: true,
                blurb: 'Bacaan tematik & musiman, dikirim rapi sebagai PDF via WhatsApp.',
                priceLabel: 'Rp 250K',
                offers: [
                    {
                        name: 'New Year Reading 2026', price: 'Rp 250K',
                        desc: 'Siap hadapi tahun depan dengan strategi matang.',
                        features: 'General Overview 2026 · Harta, Tahta, Cinta · PDF via WhatsApp (2 hari kerja)',
                        book: [{ href: 'https://forms.gle/xpMFUUhkyRW8FgY67', onClick: handleNewYear }],
                    },
                ],
            },
            {
                id: 'service-chat', type: 'Konsultasi via Chat', tags: ['CHAT', 'WHATSAPP'],
                blurb: 'Konsultasi via WhatsApp Chat. Harga per pertanyaan — pertanyaan dapat ditabung untuk lain waktu.',
                priceLabel: 'Rp 140rb–315rb',
                offers: [
                    {
                        name: '1 Pertanyaan', price: 'Rp 140K',
                        book: [{ href: 'https://lynk.id/mayanovtarot/AKbGK0X', onClick: handleChat1Question }],
                    },
                    {
                        name: '3 Pertanyaan', price: 'Rp 315K',
                        book: [{ href: 'https://lynk.id/mayanovtarot/XBpJGb5', onClick: handleChat3Question }],
                    },
                    {
                        name: 'Beli 3 Dapat 5 Pertanyaan', price: 'Rp 315K',
                        badge: 'Promo', badgeTone: 'bg-moon/10 text-moon',
                        features: 'Bayar 3, dapat 5 pertanyaan (dipakai di hari yang sama).',
                        book: [{ href: 'http://lynk.id/mayanovtarot/mm7ykgdwndez/', onClick: handlePromoBuy3Get5 }],
                    },
                ],
            },
            {
                id: 'service-call', type: 'Panggilan Suara & Video', tags: ['VIDEO', 'REAL-TIME'],
                blurb: 'Ngobrol langsung via call / video — tak terbatas jumlah pertanyaan.',
                priceLabel: 'Rp 220rb–360rb',
                offers: [
                    {
                        name: '30-Min Call', price: 'Rp 220K',
                        book: [{ platform: 'Lynk.id', href: 'https://lynk.id/mayanovtarot/9ANjbJE', onClick: handleCall30Lynk }, { platform: 'Picktime', href: 'https://www.picktime.com/mayanovtarot', onClick: handleCall30Picktime }],
                    },
                    {
                        name: '60-Min Call', price: 'Rp 360K',
                        book: [{ platform: 'Lynk.id', href: 'https://lynk.id/mayanovtarot/gw0kzbA', onClick: handleCall60Lynk }, { platform: 'Picktime', href: 'https://www.picktime.com/mayanovtarot', onClick: handleCall60Picktime }],
                    },
                ],
            },
            {
                id: 'service-meetup', type: 'Sesi Tatap Muka', tags: ['JAKSEL', '1 JAM'],
                blurb: <>Temu langsung di Jakarta Selatan — energi lebih terasa, analisa lebih personal. <a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" className="text-cream border-b border-cream/40 hover:border-cream">Rekomendasi tempat</a></>,
                priceLabel: 'Rp 450K',
                offers: [
                    {
                        name: 'Jam Pertama', price: 'Rp 450K',
                        book: [{ href: 'https://www.picktime.com/mayanovtarot', onClick: handleMeetup }],
                    },
                    {
                        name: 'Jam Berikutnya', sub: 'per jam', price: 'Rp 360K',
                        book: [],
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
                        book: [{ href: 'https://www.paypal.com/ncp/payment/DSPX84KBN8GC2', onClick: handleBookBasic }],
                    },
                ],
            },
            {
                id: '', type: '5-Card Deep', tags: ['IN-DEPTH', 'POPULAR'],
                blurb: "The bigger picture — hidden influences and what's coming next.",
                priceLabel: '$20',
                offers: [
                    {
                        name: '5-Card Deep', price: '$20', badge: 'Most Popular', badgeTone: 'bg-moon text-plum-deep',
                        desc: "The bigger picture — hidden influences and what's coming next, read in depth.",
                        features: <>5-card spread · high-res photo · priority 24h · <span className="text-cream font-medium">1 qty = 1 question</span></>,
                        book: [{ href: 'https://www.paypal.com/ncp/payment/V6U4QMAU642KA', onClick: handleBookDeep }],
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
                        book: [{ href: 'https://www.picktime.com/mayanovtarotEn#book/date', onClick: handleBookLive }],
                    },
                ],
            },
        ];

    return (
        <section id="services" className="relative isolate text-cream border-y border-white/[0.08]" style={{ background: '#0B0B0D' }}>
            {/* HEADER — transparent over the sky */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 pt-20 md:pt-28 pb-10 md:pb-14">
                <FadeIn>
                    <div className="grid lg:grid-cols-12 gap-y-6 lg:gap-x-16 items-end">
                        <div className="lg:col-span-7">
                            <h2 className="font-elegant font-medium text-cream text-[2.1rem] md:text-[2.9rem] leading-[1.03] tracking-[-0.02em]">
                                {isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                            </h2>
                        </div>
                        <p className="lg:col-span-4 lg:col-start-9 text-[0.95rem] text-cream/60 font-light leading-relaxed lg:pb-2">
                            {isIndonesian
                                ? 'Pilih metode yang paling nyaman — analisa tajam, solutif, tanpa basa-basi.'
                                : 'Clear options, no hidden fees. Just choose the depth you need.'}
                        </p>
                    </div>
                </FadeIn>
            </div>

            {/* ===== Pricelist — full-width translucent twilight-glass bands, one open at a time ===== */}
            <div className="border-t border-white/[0.08]">
                {groups.map((g: any, i: number) => {
                    const open = openIdx === i;
                    const on = shown[i];
                    return (
                        <div
                            key={g.type}
                            id={g.id || undefined}
                            ref={(el) => { bandRefs.current[i] = el; }}
                            data-idx={i}
                            className="relative scroll-mt-28 border-b border-white/[0.08] backdrop-blur-[3px] will-change-transform"
                            style={{
                                background: PANELS[i % PANELS.length],
                                transform: on ? 'translateY(0)' : 'translateY(56px)',
                                transition: `transform 0.9s ${REVEAL_EASE} ${i * 90}ms`,
                            }}
                        >
                            <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12">
                                {/* header row — spans full width, toggles the band */}
                                <button
                                    type="button"
                                    onClick={() => toggle(i)}
                                    aria-expanded={open}
                                    className="w-full flex items-center justify-between gap-4 py-7 md:py-9 text-left group"
                                >
                                    <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap min-w-0">
                                        <h3 className="font-elegant font-medium text-cream text-[1.55rem] md:text-[2.2rem] leading-none tracking-tight transition-colors group-hover:text-cream">
                                            {g.type}
                                        </h3>
                                        {g.seasonal && (
                                            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-none bg-white/[0.06] text-cream">
                                                {isIndonesian ? 'Musiman' : 'Seasonal'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-6 shrink-0">
                                        <span className="hidden sm:block text-sm md:text-[0.95rem] whitespace-nowrap">
                                            <span className="text-cream/45">{isIndonesian ? 'Mulai ' : 'From '}</span>
                                            <span className="font-serif font-semibold text-cream">{g.priceLabel}</span>
                                        </span>
                                        <span className={`grid place-items-center w-9 h-9 rounded-none border border-cream/25 transition-transform duration-300 ${open ? 'rotate-180 border-cream' : ''}`}>
                                            <ChevronDown className="w-4 h-4 text-cream" />
                                        </span>
                                    </div>
                                </button>

                                {/* body — collapses smoothly via grid-rows trick */}
                                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
                                    <div className="overflow-hidden min-h-0">
                                        <div className="pb-9 md:pb-12">
                                            <div className="flex flex-wrap gap-1.5">
                                                {g.tags.map((t: string) => (
                                                    <span key={t} className="px-2 py-0.5 text-[9px] font-medium tracking-[0.14em] uppercase border border-cream/20 text-cream/55 rounded">{t}</span>
                                                ))}
                                            </div>
                                            <p className="mt-4 text-sm text-cream/65 font-light leading-relaxed max-w-2xl">{g.blurb}</p>
                                            <div className="mt-6 border-t border-white/10">
                                                {g.offers.map((o: any, oi: number) => (<OfferRow key={oi} o={o} />))}
                                            </div>
                                            <div className="mt-6">
                                                <OrderButton g={g} isIndonesian={isIndonesian} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===== How it works — editorial numbered steps, transparent over the sky ===== */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 py-16 md:py-24">
                <FadeIn>
                    <div id="process" className="scroll-mt-24">
                        <h3 className="font-elegant font-medium text-cream text-[2rem] md:text-[2.6rem] leading-[1.05] tracking-[-0.02em] max-w-xl">
                            {isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}
                        </h3>

                        <ol className="mt-12 md:mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
                            {steps.map((step, i) => (
                                <li key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                                    <span className="font-serif text-cream text-lg tabular-nums tracking-tight">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="mt-4 h-px w-full bg-cream/15" />
                                    <h4 className="mt-4 text-[1.05rem] md:text-lg font-serif font-semibold leading-snug text-cream tracking-tight">{step.title}</h4>
                                    <p className="mt-2 text-sm leading-relaxed font-light text-cream/60">{step.desc}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Services;
