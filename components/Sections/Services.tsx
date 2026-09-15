import React from 'react';
import { ChevronRight } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';

// Sticky-stacking pricelist: each category pins a little lower than the one above,
// so as you scroll each band slides up and stops just below the previous (à la grigoletti.ch).
const STACK_TOP = 84;   // where the first band pins (below the fixed nav)
const STACK_STEP = 112; // each subsequent band pins this much lower — clears the header above (~108px)

interface ServicesProps {
    isIndonesian?: boolean;
}

// One dark order pill per category — opens the on-site booking flow.
const btnCard = "inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-ink text-cream text-sm font-medium hover:bg-charcoal-deep transition-colors";

// A soft, muted palette tint per collapsible pricelist panel — distinct but cohesive
// (all low-saturation and similar lightness so it reads as one intentional set).
const PANELS = ['#F4E9DE', '#EFE6EE', '#E5ECF1', '#E8EEE3'];

// One offer line inside a category row: name (+ inline badge) left, price right.
const OfferRow: React.FC<{ o: any }> = ({ o }) => (
    <div className="py-4 border-t border-ink/10 first:border-t-0">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h4 className="text-[1.05rem] font-serif font-semibold text-ink leading-tight tracking-tight">
                    {o.name}{o.sub && <span className="text-sm text-ink/55 font-sans font-normal ml-2">{o.sub}</span>}
                </h4>
                {o.badge && <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded-full ${o.badgeTone || 'bg-ink/10 text-ink'}`}>{o.badge}</span>}
            </div>
            <div className="text-right shrink-0">
                {o.oldPrice && <span className="text-xs text-ink/45 line-through leading-none block">{o.oldPrice}</span>}
                <span className="text-lg md:text-xl font-serif font-semibold text-blue leading-none whitespace-nowrap">{o.price}</span>
            </div>
        </div>
        {o.desc && <p className="mt-2 text-sm text-ink/70 font-light leading-relaxed">{o.desc}</p>}
        {o.features && <p className="mt-1.5 text-xs text-ink/50 leading-relaxed">{o.features}</p>}
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
                        badge: 'Promo', badgeTone: 'bg-coral/20 text-coral',
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
                blurb: <>Temu langsung di Jakarta Selatan — energi lebih terasa, analisa lebih personal. <a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" className="text-ink border-b border-ink/40 hover:border-ink">Rekomendasi tempat</a></>,
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
                        features: <>Photo of your spread · within 24h · <span className="text-ink font-medium">1 qty = 1 question</span></>,
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
                        name: '5-Card Deep', price: '$20', badge: 'Most Popular', badgeTone: 'bg-coral text-cream',
                        desc: "The bigger picture — hidden influences and what's coming next, read in depth.",
                        features: <>5-card spread · high-res photo · priority 24h · <span className="text-ink font-medium">1 qty = 1 question</span></>,
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
                        features: <><span className="text-ink font-medium">Unlimited questions</span> · real-time feedback · natural flow</>,
                        book: [{ href: 'https://www.picktime.com/mayanovtarotEn#book/date', onClick: handleBookLive }],
                    },
                ],
            },
        ];

    return (
        <section id="services" className="relative isolate text-ink">
            {/* HEADER — on a bone band */}
            <div className="bg-[#F6F2EB]">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-10 md:pb-14">
                    <FadeIn>
                        <div className="grid lg:grid-cols-12 gap-y-6 lg:gap-x-16 items-end">
                            <div className="lg:col-span-7">
                                <span className="block text-[11px] uppercase tracking-[0.28em] text-coral-deep mb-5">
                                    {isIndonesian ? 'Layanan' : 'Services'}
                                </span>
                                <h2 className="font-serif font-semibold text-ink text-[2rem] md:text-[2.6rem] leading-[1.03] tracking-[-0.02em]">
                                    {isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                                </h2>
                            </div>
                            <p className="lg:col-span-4 lg:col-start-9 text-[0.95rem] text-ink/60 font-light leading-relaxed lg:pb-2">
                                {isIndonesian
                                    ? 'Pilih metode yang paling nyaman — analisa tajam, solutif, tanpa basa-basi.'
                                    : 'Clear options, no hidden fees. Just choose the depth you need.'}
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </div>

            {/* ===== Pricelist — sticky-stacking panels (grigoletti-style): each pins a step
                 below the one above; as you scroll the next slides up and stacks under it.
                 Content is always shown, so nothing gets hidden behind the next panel. ===== */}
            <div className="bg-[#F6F2EB]">
                {groups.map((g: any, i: number) => (
                    <div
                        key={g.type}
                        id={g.id || undefined}
                        className="scroll-mt-28 border-t border-black/[0.06] shadow-[0_-18px_40px_-26px_rgba(0,0,0,0.3)]"
                        style={{
                            background: PANELS[i % PANELS.length],
                            position: 'sticky',
                            top: `${STACK_TOP + i * STACK_STEP}px`,
                        }}
                    >
                        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-11">
                            {/* title row — stays visible as the peeking strip when stacked */}
                            <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
                                <h3 className="font-serif font-semibold text-ink text-[1.5rem] md:text-[2.1rem] leading-none tracking-tight">
                                    {g.type}
                                </h3>
                                {g.seasonal && (
                                    <span className="text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-full bg-coral/20 text-coral-deep">
                                        {isIndonesian ? 'Musiman' : 'Seasonal'}
                                    </span>
                                )}
                                <div className="ml-auto flex flex-wrap gap-1.5">
                                    {g.tags.map((t: string) => (
                                        <span key={t} className="px-2 py-0.5 text-[9px] font-medium tracking-[0.14em] uppercase border border-ink/20 text-ink/55 rounded">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* content — identity left, offers + order right */}
                            <div className="mt-6 md:mt-8 grid lg:grid-cols-12 gap-y-6 lg:gap-x-14">
                                <div className="lg:col-span-5">
                                    <p className="text-sm text-ink/65 font-light leading-relaxed max-w-sm">{g.blurb}</p>
                                </div>
                                <div className="lg:col-span-6 lg:col-start-7">
                                    <div className="border-t border-ink/10">
                                        {g.offers.map((o: any, oi: number) => (<OfferRow key={oi} o={o} />))}
                                    </div>
                                    <div className="mt-6">
                                        <OrderButton g={g} isIndonesian={isIndonesian} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== How it works — editorial numbered steps, on a bone band ===== */}
            <div className="bg-[#F6F2EB] border-t border-black/[0.06]">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
                    <FadeIn>
                        <div id="process" className="scroll-mt-24">
                            <span className="block text-[11px] uppercase tracking-[0.28em] text-coral-deep mb-5">
                                {isIndonesian ? 'Prosesnya' : 'The process'}
                            </span>
                            <h3 className="font-serif font-semibold text-ink text-[1.9rem] md:text-[2.4rem] leading-[1.05] tracking-[-0.02em] max-w-xl">
                                {isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}
                            </h3>

                            <ol className="mt-12 md:mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
                                {steps.map((step, i) => (
                                    <li key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                                        <span className="font-serif text-coral-deep text-lg tabular-nums tracking-tight">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="mt-4 h-px w-full bg-ink/15" />
                                        <h4 className="mt-4 text-[1.05rem] md:text-lg font-serif font-semibold leading-snug text-ink tracking-tight">{step.title}</h4>
                                        <p className="mt-2 text-sm leading-relaxed font-light text-ink/60">{step.desc}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default Services;
