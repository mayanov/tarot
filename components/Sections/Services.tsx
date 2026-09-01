import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Plus } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { trackEvent } from '../../services/analytics';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Compact pill buttons for the price list (dark buttons on the light cards).
const btnFilled = "inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-ink text-cream text-sm font-medium hover:bg-charcoal-deep transition-colors w-full sm:w-auto whitespace-nowrap";
const btnOutline = "inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full border border-ink/30 text-ink text-sm font-medium hover:bg-ink hover:text-cream transition-colors w-full sm:w-auto whitespace-nowrap";

// Film-grain noise (shared with the rest of the site) — keeps colour blocks from feeling flat.
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E\")";

// Light grainy mesh-gradient card surfaces — soft pastel sunrise (peach → pink → lavender)
// over a cream base, so the cards read bright and pop against the dark page.
// Four presets vary the blob placement so cards feel random, not identical.
const MESHES = [
    'radial-gradient(80% 70% at 88% 6%, rgba(246,178,132,0.60) 0%, transparent 55%), radial-gradient(75% 65% at 100% 58%, rgba(233,158,190,0.48) 0%, transparent 55%), radial-gradient(95% 92% at 4% 98%, rgba(168,178,226,0.52) 0%, transparent 60%), linear-gradient(155deg, #FBF4EC 0%, #F2E9F1 100%)',
    'radial-gradient(80% 70% at 10% 8%, rgba(246,178,132,0.55) 0%, transparent 55%), radial-gradient(82% 72% at 92% 94%, rgba(168,185,230,0.55) 0%, transparent 58%), radial-gradient(70% 65% at 96% 16%, rgba(233,158,190,0.44) 0%, transparent 55%), linear-gradient(160deg, #FAF3EE 0%, #EFEAF3 100%)',
    'radial-gradient(88% 70% at 50% 0%, rgba(233,158,190,0.50) 0%, transparent 55%), radial-gradient(82% 78% at 3% 42%, rgba(168,185,230,0.52) 0%, transparent 58%), radial-gradient(72% 66% at 97% 97%, rgba(246,185,140,0.52) 0%, transparent 55%), linear-gradient(155deg, #FBF3EF 0%, #F0EAF2 100%)',
    'radial-gradient(80% 70% at 8% 8%, rgba(170,188,232,0.52) 0%, transparent 55%), radial-gradient(82% 72% at 92% 90%, rgba(246,180,134,0.52) 0%, transparent 55%), radial-gradient(78% 72% at 60% 46%, rgba(232,160,192,0.40) 0%, transparent 55%), linear-gradient(150deg, #F9F3F0 0%, #EEE9F2 100%)',
];

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
                        features: <><a href="https://maps.app.goo.gl/LE2YwZiM2exhqunh8" target="_blank" rel="noopener noreferrer" className="text-ink border-b border-ink/40 hover:border-ink">Rekomendasi tempat</a></>,
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
                        features: <>Photo of your spread · within 24h · <span className="text-ink font-medium">1 qty = 1 question</span></>,
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
                        features: <>5-card spread · high-res photo · priority 24h · <span className="text-ink font-medium">1 qty = 1 question</span></>,
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
                        features: <><span className="text-ink font-medium">Unlimited questions</span> · real-time feedback · natural flow</>,
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
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
                {/* Header — asymmetric */}
                <FadeIn>
                    <div className="grid lg:grid-cols-12 gap-y-6 lg:gap-x-16 items-end mb-12 md:mb-16">
                        <h2 className="lg:col-span-7 font-serif font-semibold text-cream text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
                            {isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                        </h2>
                        <p className="lg:col-span-4 lg:col-start-9 text-cream/70 font-light leading-relaxed lg:pb-2">
                            {isIndonesian
                                ? 'Pilih metode yang paling nyaman — analisa tajam, solutif, tanpa basa-basi.'
                                : 'Clear options, no hidden fees. Just choose the depth you need.'}
                        </p>
                    </div>
                </FadeIn>

                {/* ===== Pricelist — every category visible; aligned colour-coded cards ===== */}
                <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
                    {groups.map((g, i) => {
                        return (
                            <div
                                key={g.type}
                                id={g.id || undefined}
                                className="animate-fade-up scroll-mt-28 relative overflow-hidden isolate rounded-2xl border border-black/5 p-6 md:p-7 lg:p-8 flex flex-col shadow-[0_30px_70px_-40px_rgba(0,0,0,0.75)]"
                                style={{ background: MESHES[i % MESHES.length], animationDelay: `${i * 90}ms` }}
                            >
                                {/* film grain over the mesh */}
                                <div className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.14]" style={{ backgroundImage: GRAIN, backgroundSize: '130px 130px' }} />

                                {/* category header */}
                                <div className="relative mb-5">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-xl md:text-2xl font-serif font-semibold text-ink leading-none tracking-tight">
                                            {g.type}
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {g.tags.map((t) => (
                                                <span key={t} className="px-2 py-0.5 text-[9px] font-medium tracking-[0.14em] uppercase border border-ink/20 text-ink/55 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="mt-2.5 text-sm text-ink/65 font-light leading-relaxed">{g.blurb}</p>
                                </div>

                                {/* offers — each with its own price + CTA */}
                                <div className="relative border-t border-ink/12">
                                    {g.offers.map((o, oi) => (
                                        <div key={oi} className="py-4 md:py-5 border-t border-ink/10 first:border-t-0">
                                            <div className="flex items-baseline justify-between gap-4">
                                                <h4 className="text-lg font-serif font-semibold text-ink leading-tight tracking-tight">
                                                    {o.name}{o.sub && <span className="text-sm text-ink/55 font-sans font-normal ml-2">{o.sub}</span>}
                                                </h4>
                                                <div className="text-right shrink-0">
                                                    {o.oldPrice && <span className="text-xs text-ink/45 line-through leading-none block">{o.oldPrice}</span>}
                                                    <span className="text-xl md:text-2xl font-serif font-semibold text-ink leading-none whitespace-nowrap">{o.price}</span>
                                                </div>
                                            </div>
                                            {o.badge && <span className={`inline-block mt-2 text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1 rounded-full ${o.badgeTone || 'bg-ink/10 text-ink'}`}>{o.badge}</span>}
                                            {o.desc && <p className="mt-2 text-sm text-ink/65 font-light leading-relaxed">{o.desc}</p>}
                                            {o.features && <p className="mt-1.5 text-xs text-ink/50 leading-relaxed">{o.features}</p>}
                                            <div className="mt-4">{o.cta}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
