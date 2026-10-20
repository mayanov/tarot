import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import { btnPrimaryDark, btnSecondaryDark } from '../UI/buttons';
import SoftAura from '../UI/SoftAura';
import CelestialMark from '../UI/CelestialMark';
import { stopLenis, startLenis } from '../UI/scroll';
import { trackEvent } from '../../services/analytics';

const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Standardised button styles (used across the pricelist bands, which sit on dark sky):
// shared button system (dark-background variants — used on the dark card reveal).
const btnPrimary = `${btnPrimaryDark} inline-flex px-7 py-3 text-sm`;
const btnSecondary = `${btnSecondaryDark} inline-flex px-7 py-3 text-sm`;

// Per-category band backgrounds — rich radial gradients (a glow deepening into
// near-black) so each category feels distinct and has depth, no photos. Paired
// with a faint celestial watermark for mystique.
const CAT_BG = [
  'radial-gradient(135% 120% at 15% -15%, #35508f 0%, #22396F 52%, #162744 100%)', // blue  #22396F
  'radial-gradient(135% 120% at 15% -15%, #553172 0%, #39234E 52%, #20132f 100%)', // plum  #39234E
  'radial-gradient(135% 120% at 15% -15%, #e05b7c 0%, #CB3B5F 52%, #8a2942 100%)', // rose  #CB3B5F
  'radial-gradient(135% 120% at 15% -15%, #ff8a6d 0%, #F76949 52%, #c2472a 100%)', // coral #F76949
];
// The solid accent per card — the flipped detail borrows its card's colour.
const CAT_ACCENT = ['#22396F', '#39234E', '#CB3B5F', '#F76949'];
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

// Cheapest single price in a category (for the card's "from" line — not a range).
const priceValue = (p: any) => { const n = parseFloat(String(p).replace(/[^0-9.]/g, '')); return isNaN(n) ? Infinity : n; };
const fromPrice = (g: any): string => {
    const prices = (g.offers || []).map((o: any) => o.price).filter(Boolean);
    if (!prices.length) return g.priceLabel;
    return prices.reduce((a: string, b: string) => (priceValue(b) < priceValue(a) ? b : a));
};

// A single tarot card: front = the card face (motif + name + cheapest price), back =
// the booking options. `big` scales it up for the full-screen "drawn card" reveal.
// `fill` makes the card take its parent's exact size instead of keeping the 5:8 shape (used on phones).
const TarotCard: React.FC<{ g: any; i: number; flipped: boolean; onFlip: () => void; isIndonesian: boolean; big?: boolean; fill?: boolean; compact?: boolean; onBook?: () => void }> = ({ g, i, flipped, onFlip, isIndonesian, big = false, fill = false, compact = false, onBook }) => {
  const accent = CAT_ACCENT[i % CAT_ACCENT.length];
  // `compact` squeezes the big card's back for short phone screens so nothing needs scrolling
  const tight = big && compact;
  return (
    <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={g.type}
        onClick={onFlip}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }}
        className={`group/card relative block w-full ${fill ? 'h-full' : 'aspect-[5/8]'} cursor-pointer select-none [perspective:1600px] focus:outline-none`}
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
                    <span className={`font-elegant italic text-cream/55 tracking-wide ${big ? 'text-base' : 'text-sm'}`}>{ROMAN[i] ?? ''}</span>
                    <div className={`flex flex-col items-center ${big ? 'gap-5' : 'gap-3 md:gap-5'}`}>
                        <CelestialMark name={CAT_MARKS[i % CAT_MARKS.length]} className={`${big ? 'w-20' : 'w-10 md:w-16'} text-cream/90 [filter:drop-shadow(0_4px_20px_rgba(6,4,14,0.5))]`} />
                        <h3 className={`font-elegant font-medium leading-[1.12] tracking-tight max-w-[12ch] ${big ? 'text-[1.75rem]' : 'text-[1.1rem] md:text-[1.45rem]'}`}>{g.type}</h3>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-cream/45 text-[10.5px] tracking-[0.18em] uppercase">{isIndonesian ? 'Mulai dari' : 'From'}</span>
                        <span className={`font-serif font-semibold ${big ? 'text-2xl' : 'text-lg'}`}>{fromPrice(g)}</span>
                    </div>
                </div>
            </div>

            {/* ===== BACK — the booking options ===== */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-[1.15rem] bg-paper text-ink [box-shadow:0_34px_70px_-34px_rgba(12,8,30,0.7)]">
                {/* soft accent glow from the top for depth */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20" style={{ background: `radial-gradient(85% 100% at 50% 0%, ${accent}1f, transparent 72%)` }} />

                <div className={`relative h-full flex flex-col ${tight ? 'p-3' : big ? 'p-5' : 'p-3.5'}`}>
                    {/* FRAME — a tarot-style frame in the card's colour wrapping the content */}
                    <div className={`relative flex-1 min-h-0 flex flex-col rounded-[0.9rem] border ${tight ? 'px-3.5 pt-3.5 pb-3' : big ? 'px-5 pt-5 pb-5' : 'px-4 pt-4 pb-4'}`} style={{ borderColor: accent }}>
                        {/* inner keyline — the second frame line, in the card's colour */}
                        <div aria-hidden className="pointer-events-none absolute inset-[5px] rounded-[0.72rem] border" style={{ borderColor: `${accent}33` }} />

                        {/* crest — the card's mark at the top of the frame */}
                        <div className="relative flex justify-center" style={{ color: accent }}>
                            <CelestialMark name={CAT_MARKS[i % CAT_MARKS.length]} className={tight ? 'w-6' : big ? 'w-9' : 'w-7'} />
                        </div>
                        {!tight && <span className={`relative block text-center font-elegant italic tracking-[0.15em] ${big ? 'text-[13px]' : 'text-[11px]'}`} style={{ color: accent }}>{ROMAN[i] ?? ''}</span>}
                        <h3 className={`relative mt-0.5 text-center font-elegant font-semibold leading-tight ${tight ? 'text-[1.15rem]' : big ? 'text-[1.45rem]' : 'text-[1.08rem]'}`}>{g.type}</h3>
                        {g.blurb && <p className={`relative mt-1 text-center text-ink/55 font-light leading-snug ${tight ? 'text-[12px]' : big ? 'text-[14px]' : 'text-[10.5px] line-clamp-2'}`}>{g.blurb}</p>}

                        <div className={`relative flex-1 min-h-0 overflow-y-auto ${tight ? 'mt-3' : big ? 'mt-4' : 'mt-3'}`}>
                            <ul className={tight ? 'space-y-2' : big ? 'space-y-3' : 'space-y-2.5'}>
                                {g.offers.map((o: any, oi: number) => (
                                    <li key={oi} style={{ borderColor: `${accent}26` }} className={`border-t first:border-t-0 ${tight ? 'pt-2' : 'pt-2.5'} first:pt-0 flex items-baseline justify-between gap-3`}>
                                        <span className={`font-medium leading-tight ${tight ? 'text-[13px]' : big ? 'text-[15px]' : 'text-[12px]'}`}>{o.name}{o.sub && <span className="text-ink/45 font-light"> · {o.sub}</span>}</span>
                                        <span style={{ color: accent }} className={`font-serif font-semibold whitespace-nowrap ${tight ? 'text-[13.5px]' : big ? 'text-[16px]' : 'text-[12.5px]'}`}>{o.price}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* what the service includes — short points in a soft panel tinted with the card's colour */}
                            {big && g.points?.length > 0 && (
                                <div className={`rounded-[0.7rem] ${tight ? 'mt-3.5 px-3 py-2.5' : 'mt-4 px-4 py-3'}`} style={{ backgroundColor: `${accent}0d` }}>
                                    <span className={`block ${tight ? 'text-[9px]' : 'text-[10px]'} font-medium tracking-[0.18em] uppercase`} style={{ color: accent }}>
                                        {isIndonesian ? 'Yang kamu dapat' : 'What you get'}
                                    </span>
                                    <ul className={tight ? 'mt-1.5 space-y-1' : 'mt-2 space-y-1.5'}>
                                        {g.points.map((pt: string, pi: number) => (
                                            <li key={pi} className={`flex items-start gap-2.5 ${tight ? 'text-[12.5px] gap-2' : 'text-[14px]'} leading-snug text-ink/75`}>
                                                <span aria-hidden className="mt-[0.4em] w-[5px] h-[5px] rotate-45 shrink-0" style={{ backgroundColor: accent }} />
                                                <span>{pt}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* booking button — OUTSIDE the frame, like a tarot card's title label */}
                    <div className={`flex flex-col gap-2 shrink-0 ${tight ? 'pt-3' : big ? 'pt-4' : 'pt-3'}`}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onBook && onBook(); }}
                            style={{ backgroundColor: accent }}
                            className={`w-full inline-flex items-center justify-center rounded-full text-cream font-medium hover:brightness-110 transition-[filter] duration-300 ${tight ? 'py-2.5 text-[13px]' : big ? 'py-3 text-sm' : 'py-2.5 text-[13px]'}`}
                        >
                            {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                        </button>
                        {g.mapUrl && (
                            <a
                                href={g.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ ['--acc' as any]: accent }}
                                className={`w-full inline-flex items-center justify-center rounded-full border border-[var(--acc)] text-[var(--acc)] font-medium hover:bg-[var(--acc)] hover:text-cream transition-colors duration-300 ${tight ? 'py-2 text-[12px]' : big ? 'py-2.5 text-[13px]' : 'py-2 text-[12px]'}`}
                            >
                                {isIndonesian ? 'Rekomendasi Tempat' : 'Recommended Spot'}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// The spread. Desktop: cards fanned in an arc, hover lifts. Mobile: a 2x2 grid so all
// cards are visible at once. Clicking any card "draws" it into a full-screen reveal
// that flips to the details; clicking the dark backdrop (anywhere outside) closes it.
const TarotFan: React.FC<{ groups: any[]; isIndonesian: boolean }> = ({ groups, isIndonesian }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false); // overlay card flipped to details
    const [hovered, setHovered] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const fanRef = useRef<HTMLDivElement | null>(null);
    const [fanW, setFanW] = useState(1024);
    useEffect(() => {
        const el = fanRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setFanW(e.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, [isMobile]);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const on = () => setIsMobile(mq.matches);
        on();
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);

    // open: show the drawn card (front), then flip it to details
    const draw = (i: number) => {
        setSwapDir(null);
        setSelected(i);
        setRevealed(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    };
    const close = () => setSelected(null);
    const bookGroup = (g: any) => { close(); openBooking(BOOKING_MAP[g.type]); };

    // switch to another service while the reveal is open — it arrives already showing its details
    const [swapDir, setSwapDir] = useState<'left' | 'right' | null>(null);
    const switchTo = (j: number) => {
        if (selected === null || j === selected || j < 0 || j >= groups.length) return;
        setSwapDir(j > selected ? 'right' : 'left');
        setSelected(j);
        setRevealed(true);
    };
    const switchRef = useRef(switchTo);
    switchRef.current = switchTo;
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            if (selectedRef.current === null) return;
            if (e.key === 'ArrowRight') switchRef.current(selectedRef.current + 1);
            if (e.key === 'ArrowLeft') switchRef.current(selectedRef.current - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // swipe left/right on the revealed card to move to the next/previous service
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null || selected === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) switchTo(selected + (dx < 0 ? 1 : -1));
    };
    // lock the page behind the reveal — pause smooth scroll (wheel/touch) as well as native scroll
    const isOpen = selected !== null;
    useEffect(() => {
        if (!isOpen) return;
        stopLenis();
        document.body.style.overflow = 'hidden';
        return () => { startLenis(); document.body.style.overflow = ''; };
    }, [isOpen]);

    const n = groups.length;
    const center = (n - 1) / 2;
    const fanStyle = (i: number): React.CSSProperties => {
        const o = i - center;
        const isHov = hovered === i;
        // spread the cards as wide as the row allows (card is 216px) so each title stays readable
        const step = n > 1 ? Math.min(196, Math.max(150, (fanW - 216 - 40) / (n - 1))) : 0;
        const ty = isHov ? -30 : Math.abs(o) * 40;
        return {
            transform: `translate(-50%, -50%) translateX(${o * step}px) translateY(${ty}px) rotate(${o * 12}deg) scale(${isHov ? 1.05 : 1})`,
            zIndex: isHov ? 40 : 20 - Math.round(Math.abs(o)),
            transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        };
    };

    return (
        <div>
            {isMobile ? (
                <div className="grid grid-cols-2 gap-4 px-8 max-w-md mx-auto">
                    {groups.map((g, i) => (
                        <div key={g.type} id={g.id || undefined} className="scroll-mt-28">
                            <TarotCard g={g} i={i} flipped={false} onFlip={() => draw(i)} isIndonesian={isIndonesian} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-8">
                    <div ref={fanRef} className="relative mx-auto h-[30rem] max-w-5xl">
                        {groups.map((g, i) => (
                            <div
                                key={g.type}
                                id={g.id || undefined}
                                className="absolute left-1/2 top-1/2 w-[13.5rem] scroll-mt-28"
                                style={fanStyle(i)}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                            >
                                <TarotCard g={g} i={i} flipped={false} onFlip={() => draw(i)} isIndonesian={isIndonesian} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <p className="mt-4 md:mt-2 text-center text-ink/45 text-xs tracking-wide">
                {isIndonesian ? 'Ketuk kartu untuk menariknya' : 'Tap a card to draw it'}
            </p>

            {/* full-screen "drawn card" reveal — portaled to <body> so it sits above the
                nav and blurs the WHOLE page; click anywhere outside to close */}
            {selected !== null && typeof document !== 'undefined' && createPortal(
                <div data-lenis-prevent className={`fixed inset-0 z-[300] overscroll-none touch-none flex flex-col items-center justify-center md:gap-5 md:p-6 overflow-hidden gap-4 px-5 py-5`} onClick={close} role="dialog" aria-modal="true">
                    <div aria-hidden className="absolute inset-0 bg-ink/55 backdrop-blur-xl" style={{ animation: 'tarotFade 0.3s ease' }} />
                    <div
                        className="relative aspect-[5/8]"
                        style={{ height: isMobile ? 'min(calc(100dvh - 9.5rem), 128vw)' : 'min(82vh, 38rem)' }}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* the other services, peeking out behind the drawn card — tap one to switch */}
                        {groups.map((g, j) => {
                            if (j === selected) return null;
                            const d = j - selected;
                            const side = Math.sign(d);
                            const depth = Math.abs(d);
                            return (
                                <button
                                    key={g.type}
                                    type="button"
                                    aria-label={isIndonesian ? `Lihat ${g.type}` : `See ${g.type}`}
                                    onClick={(e) => { e.stopPropagation(); switchTo(j); }}
                                    className="absolute inset-0 rounded-[1.15rem] transition-[transform,opacity,filter] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] brightness-[0.8] hover:brightness-100 focus:outline-none focus-visible:brightness-100"
                                    style={{
                                        transform: `translateX(${side * (38 + (depth - 1) * 9)}%) translateY(${depth * 3}%) rotate(${side * (7 + (depth - 1) * 4)}deg) scale(${0.86 - (depth - 1) * 0.05})`,
                                        zIndex: 10 - depth,
                                    }}
                                >
                                    <span aria-hidden className="pointer-events-none block h-full w-full">
                                        <TarotCard g={g} i={j} flipped={false} onFlip={() => {}} isIndonesian={isIndonesian} big compact={isMobile} />
                                    </span>
                                </button>
                            );
                        })}

                        <div
                            key={selected}
                            className="relative z-20 h-full w-full"
                            style={{ animation: swapDir ? `${swapDir === 'right' ? 'tarotSwapFromRight' : 'tarotSwapFromLeft'} 0.45s cubic-bezier(0.22,1,0.36,1)` : 'tarotDraw 0.5s cubic-bezier(0.22,1,0.36,1)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TarotCard g={groups[selected]} i={selected} flipped={revealed} onFlip={() => setRevealed((r) => !r)} onBook={() => bookGroup(groups[selected])} isIndonesian={isIndonesian} big compact={isMobile} />
                        </div>
                    </div>

                    {/* service tabs — jump straight to another service by name */}
                    <div className={`relative z-30 flex gap-2 max-w-xl flex-wrap justify-center`} onClick={(e) => e.stopPropagation()}>
                        {groups.map((g, j) => (
                            <button
                                key={g.type}
                                type="button"
                                onClick={() => switchTo(j)}
                                aria-current={j === selected}
                                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors duration-300 ${j === selected ? 'bg-cream text-ink' : 'bg-white/10 text-cream/85 hover:bg-white/20'}`}
                            >
                                {g.type}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
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
                blurb: 'Bacaan tematik musiman, dikirim sebagai PDF.',
                points: ['Gambaran umum sesuai momennya', 'Karier & keuangan, hingga percintaan', 'Saran strategis yang bisa dijalankan', 'PDF via WhatsApp, 2 hari kerja'],
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
                blurb: 'Tanya-jawab tertulis via WhatsApp, per pertanyaan.',
                points: ['Analisa tertulis yang mendalam', 'Cocok untuk pertanyaan spesifik', 'Tanpa harus ngobrol langsung', 'Sisa pertanyaan bisa ditabung'],
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
                blurb: 'Ngobrol langsung via call atau video.',
                points: ['Via WhatsApp Call atau Google Meet', 'Bebas bertanya selama sesi', 'Curhat lebih leluasa', 'Bedah masalah sampai ke akarnya'],
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
                blurb: 'Sesi tatap muka di Jakarta Selatan.',
                points: ['Energi lebih terasa', 'Analisa lebih personal', 'Minimal 1 jam', 'Bisa diperpanjang per jam'],
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
                blurb: 'A quick check-in on one question.',
                points: ['Three-card spread', 'Photo of your spread', 'Written reading within 24h'],
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
                blurb: 'An in-depth look at one question.',
                points: ['Bigger picture & hidden influences', "What's coming next", 'High-res photo of your cards', 'Priority delivery within 24h'],
                priceLabel: '$20',
                offers: [
                    {
                        name: '5-Card Deep', price: '$20', badge: 'Most Popular', badgeTone: 'bg-moon text-plum',
                        desc: "The bigger picture — hidden influences and what's coming next, read in depth.",
                        features: <>5-card spread · high-res photo · priority 24h · <span className="text-cream font-medium">1 qty = 1 question</span></>,
                        book: [{ href: 'https://www.paypal.com/ncp/payment/V6U4QMAU642KA', onClick: handleBookDeep }],
                    },
                ],
            },
            {
                id: '', type: 'Live Session', tags: ['Live', '30 min'],
                blurb: 'A live 30-minute call on Google Meet.',
                points: ['Ask as many questions as we can fit', 'Real-time back-and-forth', 'No script, natural flow'],
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
        <section id="services" className="bg-paper relative isolate overflow-hidden text-ink">
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
                        <div className="max-w-2xl mx-auto text-center">
                            <h3 className="font-elegant font-medium text-ink text-[2.1rem] md:text-[2.9rem] leading-[1.03] tracking-[-0.02em]">
                                {isIndonesian ? 'Gimana cara kerjanya?' : 'How it works'}
                            </h3>
                        </div>

                        {/* steps — 2 per row on mobile, a single row on desktop */}
                        <ol className="mt-10 md:mt-16 grid grid-cols-2 lg:grid-cols-5 gap-x-5 lg:gap-x-6 gap-y-9">
                            {steps.map((step, i) => {
                                const isLast = i === steps.length - 1;
                                return (
                                <li key={i} className={`group animate-fade-up ${isLast ? 'col-span-2 lg:col-span-1' : ''}`} style={{ animationDelay: `${i * 80}ms` }}>
                                    {/* number + title side by side, so each step stays short */}
                                    <div className={`flex items-center gap-3 ${isLast ? 'justify-center lg:justify-start' : ''}`}>
                                        <span
                                            aria-hidden
                                            className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-moon/10 text-moon grid place-items-center font-elegant font-semibold text-sm md:text-base leading-none transition-colors duration-500 group-hover:bg-moon/[0.16]"
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <h4 className="text-base md:text-lg font-serif font-semibold leading-tight text-ink tracking-tight">{step.title}</h4>
                                    </div>
                                    <p className={`mt-2.5 text-sm md:text-[0.95rem] leading-relaxed font-light text-ink/60 ${isLast ? 'text-center lg:text-left' : ''}`}>{step.desc}</p>
                                </li>
                                );
                            })}
                        </ol>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Services;
