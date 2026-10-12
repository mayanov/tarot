import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import SoftAura from '../UI/SoftAura';
import CelestialMark from '../UI/CelestialMark';
import { trackEvent } from '../../services/analytics';

const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Standardised button styles (used across the pricelist bands, which sit on dark sky):
// primary = solid cream fill (hover → brand plum); secondary = cream outline.
const btnPrimary = "inline-flex items-center justify-center px-7 py-3 rounded-full bg-cream text-ink text-sm font-medium hover:bg-plum hover:text-cream transition-colors duration-500";
const btnSecondary = "inline-flex items-center justify-center px-7 py-3 rounded-full border border-cream/35 text-cream text-sm font-medium hover:bg-cream hover:text-ink transition-colors duration-500";

// Per-category band backgrounds — rich radial gradients (a glow deepening into
// near-black) so each category feels distinct and has depth, no photos. Paired
// with a faint celestial watermark for mystique.
const CAT_BG = [
  'radial-gradient(135% 120% at 15% -15%, #4e2f88 0%, #2a1550 46%, #140a2b 100%)', // violet
  'radial-gradient(135% 120% at 15% -15%, #2f4c98 0%, #1a2656 46%, #0c1230 100%)', // indigo
  'radial-gradient(135% 120% at 15% -15%, #612f7c 0%, #371b4e 46%, #190d2a 100%)', // plum
  'radial-gradient(135% 120% at 15% -15%, #3f3176 0%, #221a48 46%, #110c2a 100%)', // dusk
];
const CAT_MARKS = ['constellation', 'star', 'sparkle', 'crescent'] as const;

// A faint star dusting inside each band, so every category reads like its own
// little night sky (one pattern per category for variety).
const sMul = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const starDust = (seed: number, count: number) => {
  const r = sMul(seed);
  return Array.from({ length: count }, () => {
    const x = (r() * 100).toFixed(2), y = (r() * 100).toFixed(2);
    const rad = (0.5 + r() * 1).toFixed(2), o = (0.3 + r() * 0.55).toFixed(2);
    return `radial-gradient(${rad}px ${rad}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(255,255,255,0) 60%)`;
  }).join(',');
};
const CAT_STARS = [0, 1, 2, 3].map((k) => starDust(90210 + k * 7777, 48));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// A single flippable tarot card: front = the card face (motif + name + price-from),
// back = the booking options. The whole card toggles the flip; links inside stop
// propagation so booking doesn't flip it back.
const TarotCard: React.FC<{ g: any; i: number; flipped: boolean; onFlip: () => void; isIndonesian: boolean }> = ({ g, i, flipped, onFlip, isIndonesian }) => (
    <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={g.type}
        onClick={onFlip}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }}
        className="group/card relative block w-full aspect-[5/8] cursor-pointer select-none [perspective:1400px] focus:outline-none"
    >
        <div
            className="relative h-full w-full transition-transform duration-[650ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
            {/* ===== FRONT — the card face ===== */}
            <div
                className="absolute inset-0 [backface-visibility:hidden] overflow-hidden rounded-[1.15rem] ring-1 ring-white/15 [box-shadow:0_34px_70px_-34px_rgba(12,8,30,0.7)]"
                style={{ background: CAT_BG[i % CAT_BG.length] }}
            >
                <div aria-hidden className="absolute inset-0 opacity-70" style={{ backgroundImage: CAT_STARS[i % CAT_STARS.length] }} />
                {/* ornamental inner frame */}
                <div aria-hidden className="absolute inset-[0.65rem] rounded-[0.85rem] ring-1 ring-white/[0.16]" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-40 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(201,184,232,0.28), transparent 72%)' }} />

                <div className="relative h-full flex flex-col items-center justify-between py-7 px-5 text-cream text-center">
                    <span className="font-elegant italic text-cream/55 text-sm tracking-wide">{ROMAN[i] ?? ''}</span>
                    <div className="flex flex-col items-center gap-5">
                        <CelestialMark name={CAT_MARKS[i % CAT_MARKS.length]} className="w-14 md:w-16 text-cream/90 [filter:drop-shadow(0_4px_20px_rgba(6,4,14,0.5))]" />
                        <h3 className="font-elegant font-medium text-[1.3rem] md:text-[1.45rem] leading-[1.12] tracking-tight max-w-[12ch]">{g.type}</h3>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-cream/45 text-[10.5px] tracking-[0.18em] uppercase">{isIndonesian ? 'Mulai dari' : 'From'}</span>
                        <span className="font-serif font-semibold text-lg">{g.priceLabel}</span>
                    </div>
                </div>
            </div>

            {/* ===== BACK — the booking options ===== */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-[1.15rem] ring-1 ring-ink/10 bg-white text-ink [box-shadow:0_34px_70px_-34px_rgba(12,8,30,0.7)]">
                <div className="h-full overflow-y-auto p-5 flex flex-col">
                    <h3 className="font-elegant font-semibold text-[1.05rem] leading-tight pr-6">{g.type}</h3>
                    {g.blurb && <p className="mt-1.5 text-[11px] text-ink/55 font-light leading-snug line-clamp-3">{g.blurb}</p>}

                    <ul className="mt-3 flex-1 space-y-3">
                        {g.offers.map((o: any, oi: number) => (
                            <li key={oi} className="border-t border-ink/10 pt-2.5">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-medium text-[12.5px] leading-tight">{o.name}{o.sub && <span className="text-ink/45 font-light"> · {o.sub}</span>}</span>
                                    <span className="font-serif font-semibold text-[13px] text-moon whitespace-nowrap">{o.price}</span>
                                </div>
                                {o.book && o.book.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {o.book.map((b: any, bi: number) => (
                                            <a
                                                key={bi}
                                                href={b.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => { e.stopPropagation(); b.onClick && b.onClick(); }}
                                                className="inline-flex items-center rounded-full bg-ink text-cream px-3 py-1 text-[10.5px] font-medium hover:bg-plum transition-colors duration-300"
                                            >
                                                {b.platform || (isIndonesian ? 'Pesan' : 'Book')}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onFlip(); }}
                        className="mt-3 self-start text-[11px] text-ink/40 hover:text-ink transition-colors"
                    >
                        ← {isIndonesian ? 'Tutup kartu' : 'Flip back'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// The fanned spread. Desktop: cards overlap in an arc, hover lifts, click brings the
// card forward + flips it. Mobile: a snap-scroll row of upright cards.
const TarotFan: React.FC<{ groups: any[]; isIndonesian: boolean }> = ({ groups, isIndonesian }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const on = () => setIsMobile(mq.matches);
        on();
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);

    const n = groups.length;
    const center = (n - 1) / 2;
    const fanStyle = (i: number): React.CSSProperties => {
        const o = i - center;
        const isSel = selected === i;
        const isHov = hovered === i && selected === null;
        const anySel = selected !== null;
        const rot = isSel ? 0 : o * 7;
        const tx = o * 136;
        const ty = isSel ? -62 : isHov ? -28 : Math.abs(o) * 26;
        const scale = isSel ? 1.12 : isHov ? 1.04 : anySel ? 0.92 : 1;
        return {
            transform: `translate(-50%, -50%) translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})`,
            zIndex: isSel ? 50 : isHov ? 40 : 20 - Math.round(Math.abs(o)),
            opacity: anySel && !isSel ? 0.5 : 1,
            transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease',
        };
    };

    if (isMobile) {
        return (
            <div>
                <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-8 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {groups.map((g, i) => (
                        <div key={g.type} id={g.id || undefined} className="snap-center shrink-0 w-[72vw] max-w-[17rem] scroll-mt-28">
                            <TarotCard g={g} i={i} flipped={selected === i} onFlip={() => setSelected(selected === i ? null : i)} isIndonesian={isIndonesian} />
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-center text-ink/45 text-xs tracking-wide">{isIndonesian ? 'Geser & ketuk kartu untuk detail' : 'Swipe & tap a card for details'}</p>
            </div>
        );
    }

    return (
        <div className="px-8">
            <div className="relative mx-auto h-[32rem] max-w-5xl">
                {groups.map((g, i) => (
                    <div
                        key={g.type}
                        id={g.id || undefined}
                        className="absolute left-1/2 top-1/2 w-[14rem] scroll-mt-28"
                        style={fanStyle(i)}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    >
                        <TarotCard g={g} i={i} flipped={selected === i} onFlip={() => setSelected(selected === i ? null : i)} isIndonesian={isIndonesian} />
                    </div>
                ))}
            </div>
            <p className="mt-2 text-center text-ink/45 text-xs tracking-wide">{isIndonesian ? 'Ketuk kartu untuk lihat detail & harga' : 'Tap a card to reveal details & pricing'}</p>
        </div>
    );
};

// One offer line inside a category row: name (+ inline badge) left, price right.
const OfferRow: React.FC<{ o: any }> = ({ o }) => (
    <div className="py-4 border-t border-white/10 first:border-t-0">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h4 className="text-[1.05rem] font-serif font-semibold text-cream leading-tight tracking-tight">
                    {o.name}{o.sub && <span className="text-sm text-cream/80 font-sans font-normal ml-2">{o.sub}</span>}
                </h4>
                {o.badge && <span className={`text-[11px] tracking-[0.01em] font-medium px-2.5 py-1 rounded-full ${o.badgeTone || 'bg-white/[0.06] text-cream'}`}>{o.badge}</span>}
            </div>
            <div className="text-right shrink-0">
                {o.oldPrice && <span className="text-xs text-cream/45 line-through leading-none block">{o.oldPrice}</span>}
                <span className="text-lg md:text-xl font-serif font-semibold text-cream leading-none whitespace-nowrap">{o.price}</span>
            </div>
        </div>
        {o.desc && <p className="mt-2 text-sm text-cream/95 font-light leading-relaxed max-w-2xl">{o.desc}</p>}
        {o.features && <p className="mt-1.5 text-xs text-cream/80 leading-relaxed max-w-2xl">{o.features}</p>}
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
    const label = isIndonesian ? 'Pesan' : 'Book a Reading';
    return (
        <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => openBooking(BOOKING_MAP[g.type])} className={btnPrimary}>
                {label}
            </button>
            {g.mapUrl && (
                <a href={g.mapUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    {isIndonesian ? 'Rekomendasi Tempat' : 'Recommended Spot'}
                </a>
            )}
        </div>
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
                id: 'service-special', type: 'Edisi Spesial', tags: ['PDF', 'Musiman'], seasonal: true,
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
                id: 'service-chat', type: 'Konsultasi via Chat', tags: ['Chat', 'WhatsApp'],
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
                id: 'service-call', type: 'Panggilan Suara & Video', tags: ['Video', 'Real-time'],
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
                id: 'service-meetup', type: 'Sesi Tatap Muka', tags: ['Jaksel', '1 Jam'],
                blurb: 'Temu langsung di Jakarta Selatan — energi lebih terasa, analisa lebih personal.',
                mapUrl: 'https://maps.app.goo.gl/LE2YwZiM2exhqunh8',
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
                id: '', type: '3-Card Spread', tags: ['Quick', '24h'],
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
                id: '', type: '5-Card Deep', tags: ['In-depth', 'Popular'],
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
                id: '', type: 'Live Session', tags: ['Live', '30 min'],
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
        <section id="services" className="relative isolate overflow-hidden text-ink" style={{ background: '#FFFFFF' }}>
            <SoftAura />
            {/* HEADER — transparent over the sky */}
            <div className="mx-auto px-8 pt-20 md:pt-28 pb-16 md:pb-20">
                <FadeIn>
                    <div className="grid lg:grid-cols-12 gap-y-6 lg:gap-x-16 items-end">
                        <div className="lg:col-span-7">
                            <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
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

            {/* ===== Pricelist — a fanned tarot spread; click a card to flip for details ===== */}
            <div className="pb-6 md:pb-10">
                <FadeIn dir="up">
                    <TarotFan groups={groups} isIndonesian={isIndonesian} />
                </FadeIn>
            </div>

            {/* ===== How it works — heading on top, steps flow horizontally so it stays
                 compact instead of a tall vertical list ===== */}
            <div className="mx-auto px-8 py-16 md:py-24">
                <FadeIn>
                    <div id="process" className="scroll-mt-24">
                        <div className="max-w-2xl">
                            <h3 className="font-elegant font-medium text-ink text-[2.1rem] md:text-[2.9rem] leading-[1.03] tracking-[-0.02em]">
                                {isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}
                            </h3>
                            <p className="mt-4 text-ink/55 font-light leading-relaxed">
                                {isIndonesian
                                    ? 'Langkah sederhana — dari pilih layanan sampai pulang dengan arah yang jelas.'
                                    : 'A few simple steps — from choosing a reading to walking away with clear direction.'}
                            </p>
                        </div>

                        {/* steps — a horizontal row on desktop (wraps on small screens) */}
                        <ol className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 lg:gap-x-6 gap-y-10">
                            {steps.map((step, i) => (
                                <li key={i} className="group animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                                    <span
                                        aria-hidden
                                        className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-moon/10 text-moon grid place-items-center font-elegant font-semibold text-base md:text-lg leading-none transition-colors duration-500 group-hover:bg-moon/[0.16]"
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <h4 className="mt-4 text-lg md:text-xl font-serif font-semibold leading-snug text-ink tracking-tight">{step.title}</h4>
                                    <p className="mt-2 text-sm md:text-[0.95rem] leading-relaxed font-light text-ink/60">{step.desc}</p>
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
