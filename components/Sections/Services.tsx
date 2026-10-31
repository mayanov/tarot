import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import FadeIn from '../UI/FadeIn';
import Disclaimer from './Disclaimer';
import { btnPrimaryDark, btnSecondaryDark } from '../UI/buttons';
import ButtonInk from '../UI/ButtonInk';
import SoftAura from '../UI/SoftAura';
import CelestialMark from '../UI/CelestialMark';
import CardStock from '../UI/CardStock';
import { lockPage, unlockPage } from '../UI/scroll';
import { trackEvent, SERVICE_TRACK_NAME, promoTrackName } from '../../services/analytics';

const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ServicesProps {
    isIndonesian?: boolean;
}

// Standardised button styles (used across the pricelist bands, which sit on dark sky):
// shared button system (dark-background variants — used on the dark card reveal).
const btnPrimary = `${btnPrimaryDark} inline-flex px-7 py-3 text-[1.05rem]`;
const btnSecondary = `${btnSecondaryDark} inline-flex px-7 py-3 text-[1.05rem]`;

// Per-category band backgrounds — rich radial gradients (a glow deepening into
// near-black) so each category feels distinct and has depth, no photos. Paired
// with a faint celestial watermark for mystique.
const CAT_BG = [
  'radial-gradient(135% 120% at 15% -15%, #35508f 0%, #22396F 52%, #162744 100%)', // blue  #22396F
  'radial-gradient(135% 120% at 15% -15%, #553172 0%, #39234E 52%, #20132f 100%)', // plum  #39234E
  'radial-gradient(135% 120% at 15% -15%, #e05b7c 0%, #CB3B5F 52%, #8a2942 100%)', // rose  #CB3B5F
  'radial-gradient(135% 120% at 15% -15%, #ff8a6d 0%, #F76949 52%, #c2472a 100%)', // coral #F76949
  'radial-gradient(135% 120% at 15% -15%, #e7bd63 0%, #B8862F 52%, #6e4c17 100%)', // gold  #B8862F (promo)
];
// The solid accent per card — the flipped detail borrows its card's colour.
const CAT_ACCENT = ['#22396F', '#39234E', '#CB3B5F', '#F76949', '#9A6B1F'];
const CAT_MARKS = ['constellation', 'star', 'sparkle', 'crescent', 'sun'] as const;

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
const CAT_STARS = [0, 1, 2, 3, 4].map((k) => starDust(90210 + k * 7777, 48));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// Cheapest single price in a category (for the card's "from" line — not a range).
const priceValue = (p: any) => { const n = parseFloat(String(p).replace(/[^0-9.]/g, '')); return isNaN(n) ? Infinity : n; };
const fromPrice = (g: any): string => {
    const prices = (g.offers || []).map((o: any) => o.price).filter(Boolean);
    if (!prices.length) return g.priceLabel;
    return prices.reduce((a: string, b: string) => (priceValue(b) < priceValue(a) ? b : a));
};

// The card face is sized in container units (cqw) against the fan card's 216px width,
// so a bigger card — the focused one — is an exact enlargement of the fan card, and the
// flights between the two don't change the text size or spacing mid-way.
const cq = (px: number) => `${(px / 2.16).toFixed(3)}cqw`;

// A single tarot card: front = the card face (motif + name + cheapest price), back =
// the booking options. `big` scales it up for the full-screen "drawn card" reveal.
// `fill` makes the card take its parent's exact size instead of keeping the 5:8 shape (used on phones).
const TarotCard: React.FC<{ g: any; i: number; flipped: boolean; onFlip: () => void; isIndonesian: boolean; big?: boolean; fill?: boolean; compact?: boolean; onBook?: () => void }> = ({ g, i, flipped, onFlip, isIndonesian, big = false, fill = false, compact = false, onBook }) => {
  // colour theme + numeral come from the group itself (so adding/reordering cards never
  // recolours or renumbers the others); fall back to position
  const k = g.theme ?? i;
  const numeral = g.numeral ?? ROMAN[i] ?? '';
  const accent = CAT_ACCENT[k % CAT_ACCENT.length];
  // `compact` squeezes the big card's back for short phone screens so nothing needs scrolling
  const tight = big && compact;
  // the card back's details panel: how the service works (default) or what's included
  const [panel, setPanel] = useState<'steps' | 'points'>('steps');
  const hasSteps = g.steps?.length > 0;
  const hasPoints = g.points?.length > 0;
  const showing = hasSteps && (panel === 'steps' || !hasPoints) ? 'steps' : 'points';
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
                className="absolute inset-0 [backface-visibility:hidden] [container-type:inline-size] overflow-hidden rounded-[1.15rem] [box-shadow:0_1px_2px_rgba(12,8,30,0.35),0_18px_34px_-18px_rgba(12,8,30,0.6)]"
                style={{ background: CAT_BG[k % CAT_BG.length] }}
            >
                <div aria-hidden className="absolute inset-0 opacity-70" style={{ backgroundImage: CAT_STARS[k % CAT_STARS.length] }} />
                {/* ornamental inner frame */}
                <div aria-hidden className="absolute ring-1 ring-white/[0.16]" style={{ inset: cq(10.4), borderRadius: cq(13.6) }} />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-40 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(201,184,232,0.28), transparent 72%)' }} />

                <div className="relative h-full flex flex-col items-center justify-between text-cream text-center" style={{ padding: `${cq(28)} ${cq(20)}` }}>
                    <span className="print-ink font-elegant italic text-cream/55 tracking-wide leading-[1.43]" style={{ fontSize: cq(14) }}>{numeral}</span>
                    {/* fixed slots — the icon box and a two-line title box are the same height on
                        every card, so icons, titles and prices line up across the whole spread */}
                    <div className="flex flex-col items-center" style={{ gap: cq(16) }}>
                        <div className="grid place-items-center" style={{ height: cq(64) }}>
                            <span className="block" style={{ width: cq(64) }}><CelestialMark name={CAT_MARKS[k % CAT_MARKS.length]} className="print-ink block w-full text-cream/90 [filter:drop-shadow(0_4px_20px_rgba(6,4,14,0.5))]" /></span>
                        </div>
                        <h3 className="min-h-[2.24em] flex items-center justify-center font-elegant font-medium leading-[1.12] tracking-tight max-w-[12ch]" style={{ fontSize: cq(22.4) }}>{g.type}</h3>
                    </div>
                    <div className="flex flex-col items-center" style={{ gap: cq(4) }}>
                        <span className="text-cream/45 tracking-[0.18em] uppercase leading-[1.5]" style={{ fontSize: cq(10.5) }}>{g.promo ? 'Promo' : isIndonesian ? 'Mulai dari' : 'From'}</span>
                        <span className="font-serif font-semibold whitespace-nowrap leading-[1.55]" style={{ fontSize: cq(g.promo ? 16.8 : 18) }}>{g.promo ? g.priceLabel : fromPrice(g)}</span>
                    </div>
                </div>
                <CardStock />
            </div>

            {/* ===== BACK — the booking options ===== */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-[1.15rem] bg-paper text-ink [box-shadow:0_1px_2px_rgba(12,8,30,0.35),0_18px_34px_-18px_rgba(12,8,30,0.6)]">
                <CardStock tone="light" />
                {/* soft accent glow from the top for depth */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20" style={{ background: `radial-gradient(85% 100% at 50% 0%, ${accent}1f, transparent 72%)` }} />

                <div className={`relative h-full flex flex-col ${tight ? 'p-3' : big ? 'p-5' : 'p-3.5'}`}>
                    {/* FRAME — a tarot-style frame in the card's colour wrapping the content */}
                    <div className={`relative flex-1 min-h-0 flex flex-col rounded-[0.9rem] border ${tight ? 'px-3.5 pt-3.5 pb-3' : big ? 'px-5 pt-5 pb-5' : 'px-4 pt-4 pb-4'}`} style={{ borderColor: accent }}>
                        {/* inner keyline — the second frame line, in the card's colour */}
                        <div aria-hidden className="pointer-events-none absolute inset-[5px] rounded-[0.72rem] border" style={{ borderColor: `${accent}33` }} />

                        {/* crest — the card's mark at the top of the frame */}
                        <div className="relative flex justify-center" style={{ color: accent }}>
                            <CelestialMark name={CAT_MARKS[k % CAT_MARKS.length]} className={`print-ink ${tight ? 'w-6' : big ? 'w-9' : 'w-7'}`} />
                        </div>
                        {!tight && <span className={`relative block text-center font-elegant italic tracking-[0.15em] ${big ? 'text-[13px]' : 'text-[11px]'}`} style={{ color: accent }}>{numeral}</span>}
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

                            {/* details — two tabs so both fit without scrolling: how this service
                                works, step by step (shown first), and what it includes */}
                            {big && (hasSteps || hasPoints) && (
                                <div className={`rounded-[0.7rem] ${tight ? 'mt-3.5 px-3 py-2.5' : 'mt-4 px-4 py-3'}`} style={{ backgroundColor: `${accent}0d` }}>
                                    <div className={`flex ${tight ? 'gap-3' : 'gap-4'}`} role="tablist">
                                        {([['steps', isIndonesian ? 'Cara kerjanya' : 'How it works', hasSteps], ['points', isIndonesian ? 'Yang kamu dapat' : 'What you get', hasPoints]] as const)
                                            .filter(([, , has]) => has)
                                            .map(([id, label]) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={showing === id}
                                                    onClick={(e) => { e.stopPropagation(); setPanel(id); }}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    className={`pb-1 border-b ${tight ? 'text-[9px]' : 'text-[10px]'} font-medium tracking-[0.18em] uppercase transition-opacity ${showing === id ? 'opacity-100' : 'opacity-45 hover:opacity-80 border-transparent'}`}
                                                    style={{ color: accent, borderColor: showing === id ? accent : 'transparent' }}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                    </div>
                                    {showing === 'steps' ? (
                                        <ol className={tight ? 'mt-2 space-y-1.5' : 'mt-2.5 space-y-2'}>
                                            {g.steps.map((st: string, si: number) => (
                                                <li key={si} className={`flex items-start ${tight ? 'gap-2 text-[12.5px]' : 'gap-2.5 text-[14px]'} leading-snug text-ink/75`}>
                                                    <span
                                                        aria-hidden
                                                        className={`shrink-0 grid place-items-center rounded-full font-semibold tabular-nums text-cream mt-[1px] ${tight ? 'w-4 h-4 text-[9px]' : 'w-[18px] h-[18px] text-[10px]'}`}
                                                        style={{ backgroundColor: accent }}
                                                    >
                                                        {si + 1}
                                                    </span>
                                                    <span>{st}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <ul className={tight ? 'mt-2 space-y-1' : 'mt-2.5 space-y-1.5'}>
                                            {g.points.map((pt: string, pi: number) => (
                                                <li key={pi} className={`flex items-start gap-2.5 ${tight ? 'text-[12.5px] gap-2' : 'text-[14px]'} leading-snug text-ink/75`}>
                                                    <span aria-hidden className="mt-[0.4em] w-[5px] h-[5px] rotate-45 shrink-0" style={{ backgroundColor: accent }} />
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* booking button — OUTSIDE the frame, like a tarot card's title label */}
                    <div className={`flex flex-col gap-2 shrink-0 ${tight ? 'pt-3' : big ? 'pt-4' : 'pt-3'}`}>
                        {g.cta ? (
                            // promo: straight to WhatsApp with a prefilled message
                            <a
                                href={g.cta.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => { e.stopPropagation(); g.cta.onClick && g.cta.onClick(); }}
                                style={{ backgroundColor: accent }}
                                className={`w-full inline-flex items-center justify-center rounded-lg text-cream font-medium hover:brightness-110 transition-[filter] duration-300 ${tight ? 'py-2.5 text-[13px]' : big ? 'py-3 text-sm' : 'py-2.5 text-[13px]'}`}
                            >
                                {g.cta.label}
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onBook && onBook(); }}
                                style={{ backgroundColor: accent }}
                                className={`w-full inline-flex items-center justify-center rounded-lg text-cream font-medium hover:brightness-110 transition-[filter] duration-300 ${tight ? 'py-2.5 text-[13px]' : big ? 'py-3 text-sm' : 'py-2.5 text-[13px]'}`}
                            >
                                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
                            </button>
                        )}
                        {g.mapUrl && (
                            <a
                                href={g.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ ['--acc' as any]: accent }}
                                className={`w-full inline-flex items-center justify-center rounded-lg border border-[var(--acc)] text-[var(--acc)] font-medium hover:bg-[var(--acc)] hover:text-cream transition-colors duration-300 ${tight ? 'py-2 text-[12px]' : big ? 'py-2.5 text-[13px]' : 'py-2 text-[12px]'}`}
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
// The face-down back of a card, used while the deck is stacked before it's dealt.
const CardBack: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden rounded-[1.15rem] [box-shadow:0_1px_2px_rgba(12,8,30,0.35),0_18px_34px_-18px_rgba(12,8,30,0.6)]"
        style={{ background: 'radial-gradient(130% 110% at 50% 0%, #3a2558 0%, #241638 55%, #150c24 100%)' }}>
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ backgroundImage: CAT_STARS[1] }} />
        <div aria-hidden className="absolute inset-[0.65rem] rounded-[0.85rem] ring-1 ring-[#C9B8E8]/25" />
        <div aria-hidden className="absolute inset-[1.15rem] rounded-[0.6rem] ring-1 ring-[#C9B8E8]/10" />
        <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-[#C9B8E8]/80">
                <CelestialMark name="crescent" className="print-ink w-14" />
                <span className="print-ink font-elegant italic text-[11px] tracking-[0.32em] uppercase text-[#C9B8E8]/55">Mayanov</span>
            </div>
        </div>
        <CardStock />
    </div>
);

// Deal timing (ms): each card leaves the deck DEAL_GAP after the previous one, travels
// for DEAL_MOVE, and flips face-up (DEAL_FLIP) as it lands.
const DEAL_START = 120, DEAL_GAP = 130, DEAL_MOVE = 820, DEAL_FLIP = 420;

const TarotFan: React.FC<{ groups: any[]; isIndonesian: boolean }> = ({ groups, isIndonesian }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false); // overlay card flipped to details
    const [hovered, setHovered] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const fanRef = useRef<HTMLDivElement | null>(null);
    const [fanW, setFanW] = useState(1024);
    // The spread starts as a face-down deck and is dealt out the first time it scrolls
    // into view. `settled` = the deal has finished (hover and normal timing return).
    const [dealt, setDealt] = useState(false);
    const [settled, setSettled] = useState(false);
    // 1 on desktop; shrinks the fan on narrower screens (tablet ≈0.85, phone 0.5)
    const fanScale = Math.max(0.5, Math.min(1, fanW / 840));
    useEffect(() => {
        const el = fanRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setFanW(e.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, [isMobile]);
    useEffect(() => {
        const el = fanRef.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDealt(true); setSettled(true); return; }
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            setDealt(true);
        }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    useEffect(() => {
        if (!dealt || settled) return;
        const total = DEAL_START + (groups.length - 1) * DEAL_GAP + DEAL_MOVE + DEAL_FLIP;
        const t = window.setTimeout(() => setSettled(true), total);
        return () => window.clearTimeout(t);
    }, [dealt, settled, groups.length]);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const on = () => setIsMobile(mq.matches);
        on();
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);

    // Each card shown in the reveal pop-up (drawn, or switched to with the tabs/swipe)
    // counts as a "view" of that service in the admin's Service Engagement table.
    useEffect(() => {
        if (selected === null || !groups[selected]) return;
        const g = groups[selected];
        const name = g.promo ? promoTrackName(isIndonesian) : SERVICE_TRACK_NAME[BOOKING_MAP[g.type]] || g.type;
        trackEvent('view_item', { item_name: name, market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: name });
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    // open: every card flies from its spot in the fan into the focused spread (the
    // drawn one to the front), then the drawn card flips to its details
    const fanSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const boxRef = useRef<HTMLDivElement | null>(null);
    const fanAtOpen = useRef<{ cx: number; cy: number; w: number; rot: number }[] | null>(null);
    const [flightStart, setFlightStart] = useState<Record<number, string> | null>(null); // per card: transform at take-off
    const flownRef = useRef(false); // this opening used the flight (vs. reopening from the booking form)
    const fromMenuRef = useRef(false); // opened from the site menu: the fan may be off screen
    const groupsRef = useRef(groups);
    groupsRef.current = groups;
    const FLIGHT_MS = 700;
    // where each card sits in the fan right now (centre, on-screen width, tilt)
    const measureFan = () => groups.map((_, j) => {
        const el = fanSlotRefs.current[j];
        if (!el) return { cx: 0, cy: 0, w: 0, rot: 0 };
        const r = el.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: el.offsetWidth * fanScale, rot: fanRot(j) };
    });
    // per card: the transform that puts it on its fan spot, from the focused spread's box
    const fanTransforms = (fan: { cx: number; cy: number; w: number; rot: number }[]) => {
        const box = boxRef.current?.getBoundingClientRect();
        if (!box) return null;
        const bx = box.left + box.width / 2, by = box.top + box.height / 2;
        const out: Record<number, string> = {};
        fan.forEach((f, j) => {
            if (!f.w) return;
            out[j] = `translate(${(f.cx - bx).toFixed(1)}px, ${(f.cy - by).toFixed(1)}px) rotate(${f.rot.toFixed(2)}deg) scale(${(f.w / box.width).toFixed(4)})`;
        });
        return out;
    };
    const draw = (i: number) => {
        setSwapDir(null);
        setBooking(false);
        setUnflip(false);
        fanAtOpen.current = measureFan();
        flownRef.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        fromMenuRef.current = false;
        setSelected(i);
        setRevealed(false);
        window.setTimeout(() => setRevealed(true), flownRef.current ? FLIGHT_MS - 80 : 0);
    };
    // measure the focused spread's box before paint, park every card at its fan spot,
    // then release them on the next frames so they glide into place
    useLayoutEffect(() => {
        if (selected === null || !fanAtOpen.current || !flownRef.current) return;
        const starts = fanTransforms(fanAtOpen.current);
        fanAtOpen.current = null;
        if (!starts) return;
        setFlightStart(starts);
        requestAnimationFrame(() => requestAnimationFrame(() => setFlightStart(null)));
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
    // booking from a card: the reveal stays open underneath, the card turns edge-on and
    // the booking form turns in from the other side, as if printed on the card's back
    // (see BookingModal); the other cards and the tabs fade away meanwhile. Back turns
    // the form away and the card back round; closing the form closes both.
    const [booking, setBooking] = useState(false);
    const [unflip, setUnflip] = useState(false); // turning back round after the form
    const shut = () => { flownRef.current = false; setBooking(false); setSelected(null); };
    // closing runs the opening backwards: the drawn card turns face-up, then every card
    // flies back to its spot in the fan while the backdrop fades. The big cards are laid
    // out larger than the fan's (bigger type, more padding), so once they're on their
    // spots the fan comes back underneath them and they fade off it (`handover`) rather
    // than being swapped in one frame.
    const [landing, setLanding] = useState<Record<number, string> | null>(null); // per card: transform on its fan spot
    const [closing, setClosing] = useState(false);
    const [handover, setHandover] = useState(false);
    const closingRef = useRef(false);
    const revealedRef = useRef(revealed);
    revealedRef.current = revealed;
    const close = () => {
        if (closingRef.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { shut(); return; }
        closingRef.current = true;
        setClosing(true);
        const turnFirst = revealedRef.current;
        setRevealed(false);
        if (fromMenuRef.current) {
            // opened from the menu, so there's no fan spot on screen to fly back to: the card
            // turns face-up, then fades out as the blur lifts off the page
            window.setTimeout(() => {
                setLanding({});
                setHandover(true);
                window.setTimeout(() => {
                    fromMenuRef.current = false;
                    shut();
                    setLanding(null);
                    requestAnimationFrame(() => requestAnimationFrame(() => { closingRef.current = false; setClosing(false); setHandover(false); }));
                }, FLIGHT_MS);
            }, turnFirst ? CLOSE_TURN_MS : 0);
            return;
        }
        window.setTimeout(() => {
            const targets = fanTransforms(measureFan());
            if (targets) setLanding(targets);
            window.setTimeout(() => {
                setHandover(true);
                window.setTimeout(() => {
                    shut();
                    setLanding(null);
                    // a frame with the fan's fade still switched off before it's back to normal
                    requestAnimationFrame(() => requestAnimationFrame(() => { closingRef.current = false; setClosing(false); setHandover(false); }));
                }, HANDOVER_MS);
            }, targets ? FLIGHT_MS : 0);
        }, turnFirst ? CLOSE_TURN_MS : 0);
    };
    const closeRef = useRef(close);
    closeRef.current = close;
    const bookGroup = (g: any) => {
        if (selected === null) return;
        setBooking(true);
        setUnflip(false);
        openBooking(BOOKING_MAP[g.type], selected);
    };

    useEffect(() => {
        // back from the booking form → the card they booked from comes forward again
        // (reopened on its details if the reveal was closed in the meantime)
        const onReopen = (e: Event) => {
            const index = (e as CustomEvent<{ index: number }>).detail?.index;
            if (typeof index !== 'number' || index < 0 || index >= groups.length) return;
            setBooking(false);
            setUnflip(true);
            if (selectedRef.current === index) return;
            setSwapDir(null);
            setSelected(index);
            setRevealed(true);
        };
        const onClose = () => { fromMenuRef.current = false; shut(); };
        // a service picked in the site menu: its card is drawn in (no flight — the fan may be
        // anywhere) and turns to its details
        const onOpen = (e: Event) => {
            const id = (e as CustomEvent<{ serviceId?: string }>).detail?.serviceId;
            const index = groupsRef.current.findIndex((g) => BOOKING_MAP[g.type] === id);
            if (index < 0 || closingRef.current) return;
            setSwapDir(null);
            setBooking(false);
            setUnflip(false);
            flownRef.current = false;
            fromMenuRef.current = true;
            setSelected(index);
            setRevealed(false);
            window.setTimeout(() => setRevealed(true), 450);
        };
        window.addEventListener('reopen-pricelist-card', onReopen);
        window.addEventListener('close-pricelist-card', onClose);
        window.addEventListener('open-pricelist-card', onOpen);
        return () => {
            window.removeEventListener('reopen-pricelist-card', onReopen);
            window.removeEventListener('close-pricelist-card', onClose);
            window.removeEventListener('open-pricelist-card', onOpen);
        };
    }, [groups.length]);

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
    const bookingRef = useRef(booking);
    bookingRef.current = booking;
    selectedRef.current = selected;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (bookingRef.current) return; // the booking form is on top
            if (e.key === 'Escape') closeRef.current();
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
        lockPage();
        return unlockPage;
    }, [isOpen]);

    const n = groups.length;
    const center = (n - 1) / 2;
    const dealDelay = (i: number) => DEAL_START + i * DEAL_GAP;
    const fanRot = (i: number) => ((i - center) / Math.max(1, (n - 1) / 2)) * 16; // same tilt as fanStyle
    const fanStyle = (i: number): React.CSSProperties => {
        const o = i - center;
        const isHov = settled && hovered === i;
        // On narrow screens the whole fan is scaled down (cards keep their desktop
        // proportions) and the spread tightens so every card stays on screen.
        const s = fanScale;
        const cardW = 216 * s;
        // spread the cards as wide as the row allows so each title stays readable
        const step = n > 1 ? Math.min(196 * s, (fanW - cardW - 56 * s) / (n - 1)) : 0;
        // A tilted spread: the tilt and drop stay the same however many cards there are
        // (the outermost card leans 16deg and sits 58px lower, on an o^2 curve). The drop
        // is matched to the tilt so the tops follow one even arc — less drop and the
        // outer cards look raised, more and they look sunk.
        const edge = Math.max(1, (n - 1) / 2); // |o| of the outermost card
        const rot = (o / edge) * 16;
        const ty = (isHov ? -30 : (o / edge) ** 2 * 58) * s;
        if (!dealt) {
            // the deck: all cards stacked in the middle, slightly fanned, the first card on top
            return {
                transform: `translate(-50%, -50%) translateY(${(14 * s).toFixed(1)}px) rotate(${(o * 1.6).toFixed(2)}deg) scale(${(s * 0.94).toFixed(4)})`,
                zIndex: 30 + (n - i),
                transition: 'none',
            };
        }
        return {
            transform: `translate(-50%, -50%) translateX(${(o * step).toFixed(1)}px) translateY(${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(s * (isHov ? 1.05 : 1)).toFixed(4)})`,
            zIndex: isHov ? 40 : 20 - Math.round(Math.abs(o)),
            // while a card is open the whole fan fades out, so the blurred backdrop
            // doesn't show ghost cards behind the focused spread
            opacity: isOpen && !handover ? 0 : 1, // back (instantly, under the landed cards) at the handover
            transition: settled
                ? `transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity ${closing ? 0 : 0.35}s ease`
                : `transform ${DEAL_MOVE}ms cubic-bezier(0.2,0.9,0.25,1) ${dealDelay(i)}ms, opacity 0.35s ease`,
        };
    };

    return (
        <div>
            {(
                <div className="px-4 md:px-8">
                    <div ref={fanRef} className="relative mx-auto max-w-5xl" style={{ height: `${(27 * fanScale).toFixed(2)}rem` }}>
                        {groups.map((g, i) => (
                            <div
                                key={g.type}
                                id={g.id || undefined}
                                ref={(el) => { fanSlotRefs.current[i] = el; }}
                                className="absolute left-1/2 top-1/2 w-[13.5rem] scroll-mt-28"
                                style={fanStyle(i)}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                            >
                                {/* while dealing, the card pinches flat and opens face-up as it lands */}
                                <div
                                    className="relative"
                                    style={dealt && !settled ? { animation: `dealFlip ${DEAL_FLIP}ms cubic-bezier(0.4,0,0.2,1) ${dealDelay(i) + DEAL_MOVE - 200}ms both` } : undefined}
                                >
                                    <TarotCard g={g} i={i} flipped={false} onFlip={() => draw(i)} isIndonesian={isIndonesian} />
                                    {!settled && (
                                        <div
                                            aria-hidden
                                            className="absolute inset-0 pointer-events-none"
                                            style={dealt ? { animation: `dealCoverOff ${DEAL_FLIP}ms linear ${dealDelay(i) + DEAL_MOVE - 200}ms both` } : undefined}
                                        >
                                            <CardBack />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <p className="print-body mt-12 md:mt-14 text-center text-ink/45 text-xs tracking-wide">
                {isIndonesian ? 'Ketuk kartu untuk menariknya' : 'Tap a card to draw it'}
            </p>

            {/* full-screen "drawn card" reveal — portaled to <body> so it sits above the
                nav and blurs the WHOLE page; click anywhere outside to close */}
            {selected !== null && typeof document !== 'undefined' && createPortal(
                <div data-lenis-prevent className={`fixed inset-0 z-[300] overscroll-none touch-none flex flex-col items-center justify-center md:gap-5 md:p-6 overflow-hidden gap-4 px-5 py-5 ${booking || closing ? 'pointer-events-none' : ''}`} onClick={close} role="dialog" aria-modal="true">
                    <div aria-hidden className="absolute inset-0 bg-ink/55 backdrop-blur-xl" style={{ animation: 'tarotFade 0.3s ease', opacity: landing ? 0 : 1, transition: `opacity ${FLIGHT_MS}ms ease` }} />
                    <div
                        ref={boxRef}
                        className="relative aspect-[5/8]"
                        style={{ height: isMobile ? 'min(calc(100dvh - 9.5rem), 128vw)' : 'min(82vh, 38rem)', opacity: handover ? 0 : 1, transition: `opacity ${HANDOVER_MS}ms ease` }}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* the other services, peeking out behind the drawn card — tap one to switch */}
                        {groups.map((g, j) => {
                            if (j === selected) return null;
                            const d = j - selected;
                            const side = Math.sign(d);
                            const depth = Math.abs(d);
                            const flying = !!flightStart || !!landing; // collapsed onto the fan spot
                            return (
                                // flight layer: starts exactly on the card's spot in the fan
                                <div
                                    key={g.type}
                                    className="absolute inset-0"
                                    style={{
                                        zIndex: 10 - depth,
                                        transform: flightStart ? flightStart[j] : landing ? landing[j] : 'none',
                                        transition: flightStart ? 'none' : `transform ${FLIGHT_MS}ms ${landing ? LAND_EASE : 'cubic-bezier(0.22,1,0.36,1)'}, opacity 300ms ease`,
                                        opacity: booking ? 0 : 1, // away while the booking form is open
                                    }}
                                >
                                    {/* a div acting as a button: the card inside has its own buttons,
                                        and buttons can't be nested */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        aria-label={isIndonesian ? `Lihat ${g.type}` : `See ${g.type}`}
                                        onClick={(e) => { e.stopPropagation(); switchTo(j); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); switchTo(j); } }}
                                        className="absolute inset-0 cursor-pointer rounded-[1.15rem] transition-[transform,opacity,filter] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] brightness-[0.8] hover:brightness-100 focus:outline-none focus-visible:brightness-100"
                                        style={{
                                            transform: flying ? 'none' : `translateX(${side * (38 + (depth - 1) * 9)}%) translateY(${depth * 3}%) rotate(${side * (7 + (depth - 1) * 4)}deg) scale(${0.86 - (depth - 1) * 0.05})`,
                                            transitionDuration: flightStart ? '0ms' : `${FLIGHT_MS}ms`,
                                        }}
                                    >
                                        <span aria-hidden className="pointer-events-none block h-full w-full">
                                            <TarotCard g={g} i={j} flipped={false} onFlip={() => {}} isIndonesian={isIndonesian} big compact={isMobile} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        <div
                            key={selected}
                            className="relative z-20 h-full w-full"
                            style={{
                                // switching services: a swipe; opened from the fan: the flight;
                                // reopened from the booking form: the plain draw-in
                                animation: swapDir ? `${swapDir === 'right' ? 'tarotSwapFromRight' : 'tarotSwapFromLeft'} 0.45s cubic-bezier(0.22,1,0.36,1)` : flownRef.current ? undefined : 'tarotDraw 0.5s cubic-bezier(0.22,1,0.36,1)',
                                // booking: turned edge-on (the form turns in after it); back: round again
                                transform: flightStart && !swapDir ? flightStart[selected] : landing ? landing[selected] : booking ? `perspective(1600px) rotateY(${CARD_TURN_DEG}deg)` : undefined,
                                transition: flightStart ? 'none'
                                    : landing ? `transform ${FLIGHT_MS}ms ${LAND_EASE}`
                                    : booking ? `transform ${TURN_MS}ms cubic-bezier(0.55,0,1,0.45)`
                                    : unflip ? `transform ${TURN_MS + 60}ms cubic-bezier(0,0.55,0.45,1)`
                                    : `transform ${FLIGHT_MS}ms cubic-bezier(0.22,1,0.36,1)`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TarotCard g={groups[selected]} i={selected} flipped={revealed} onFlip={() => setRevealed((r) => !r)} onBook={() => bookGroup(groups[selected])} isIndonesian={isIndonesian} big compact={isMobile} />
                        </div>
                    </div>

                    {/* service tabs — jump straight to another service by name */}
                    <div className={`relative z-30 flex gap-2 max-w-xl flex-wrap justify-center`} style={{ opacity: booking || closing ? 0 : 1, transition: 'opacity 300ms ease' }} onClick={(e) => e.stopPropagation()}>
                        {groups.map((g, j) => (
                            <button
                                key={g.type}
                                type="button"
                                onClick={() => switchTo(j)}
                                aria-current={j === selected}
                                className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors duration-300 ${j === selected ? 'bg-cream text-ink' : 'bg-white/10 text-cream/85 hover:bg-white/20'}`}
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
};

// `returnToCard` (a pricelist card index) lets the booking form's "back" reopen that card.
const openBooking = (serviceId?: string, returnToCard?: number) =>
    window.dispatchEvent(new CustomEvent('open-booking', { detail: { ...(serviceId ? { serviceId } : {}), ...(returnToCard !== undefined ? { returnToCard } : {}) } }));
// the card <-> booking form turn: each half takes TURN_MS (matches BookingModal)
const TURN_MS = 260;
const CARD_TURN_DEG = 90;
// closing the reveal: how long the drawn card turns face-up before the cards fly back,
// and the flight's easing (speeding up into the fan, the opening's ease-out reversed)
const CLOSE_TURN_MS = 380;
const LAND_EASE = 'cubic-bezier(0.55,0,0.45,1)';
const HANDOVER_MS = 240;

// The order button for a category — opens the on-site booking flow.
const OrderButton: React.FC<{ g: any; isIndonesian: boolean }> = ({ g, isIndonesian }) => {
    const label = isIndonesian ? 'Pesan' : 'Book a Reading';
    return (
        <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => openBooking(BOOKING_MAP[g.type])} className={btnPrimary}>
                <ButtonInk kind="primary" tone="dark">
                  {label}
                </ButtonInk>
            </button>
            {g.mapUrl && (
                <a href={g.mapUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    <ButtonInk kind="secondary" tone="dark">
                      {isIndonesian ? 'Rekomendasi Tempat' : 'Recommended Spot'}
                    </ButtonInk>
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

    // --- Handlers for Indonesia (IDR) ---
    const handleNewYear = () => trackEvent('begin_checkout', { item_name: 'New Year Reading 2026', market: 'ID' }, 'InitiateCheckout', { content_name: 'New Year Reading 2026', value: 250000, currency: 'IDR', content_category: 'ID Service' });
    const handleHappyBirthday = () => trackEvent('begin_checkout', { item_name: promoTrackName(true), market: 'ID' }, 'InitiateCheckout', { content_name: promoTrackName(true), currency: 'IDR', content_category: 'ID Service' });
    const handleHappyBirthdayGlobal = () => trackEvent('begin_checkout', { item_name: promoTrackName(false), market: 'Global' }, 'InitiateCheckout', { content_name: promoTrackName(false), currency: 'USD', content_category: 'Global Service' });
    const handleChat3Question = () => trackEvent('begin_checkout', { item_name: '3 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '3 Question Chat', value: 315000, currency: 'IDR', content_category: 'ID Service' });
    const handleChat1Question = () => trackEvent('begin_checkout', { item_name: '1 Question Chat', market: 'ID' }, 'InitiateCheckout', { content_name: '1 Question Chat', value: 140000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall30Lynk = () => trackEvent('begin_checkout', { item_name: '30-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '30-Min Call (Lynk)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall30Picktime = () => trackEvent('schedule', { item_name: '30-Min Call', market: 'ID' }, 'Schedule', { content_name: '30-Min Call (Picktime)', value: 220000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall60Lynk = () => trackEvent('begin_checkout', { item_name: '60-Min Call', market: 'ID' }, 'InitiateCheckout', { content_name: '60-Min Call (Lynk)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    const handleCall60Picktime = () => trackEvent('schedule', { item_name: '60-Min Call', market: 'ID' }, 'Schedule', { content_name: '60-Min Call (Picktime)', value: 360000, currency: 'IDR', content_category: 'ID Service' });
    const handleMeetup = () => trackEvent('schedule', { item_name: 'Meetup Session', market: 'ID' }, 'Schedule', { content_name: 'Meetup Session', value: 450000, currency: 'IDR', content_category: 'ID Service' });

    // Editorial accordion pricelist — each service type is a row that expands to its options.
    const groups = isIndonesian
        ? [
            {
                // Operation Happy Birthday — the "0" card (The Fool: a fresh start), in gold.
                // Its button goes straight to WhatsApp instead of the booking form.
                id: 'service-promo', theme: 4, numeral: '0', promo: true, type: 'Operation Happy Birthday',
                blurb: 'Dalam rangka merayakan HUT Mayanov, jangan ketinggalan promo Pay As U Like!',
                priceLabel: 'Bayar sesukamu',
                points: ['1 pertanyaan, topik bebas', 'Dijawab lewat voice note', 'Langsung via WhatsApp'],
                steps: ['Klik “Ambil Promo Ini” — chat WhatsApp terbuka dengan pesan siap kirim', 'Kirim 1 pertanyaanmu dan bayar sesukamu', 'Jawabanmu dikirim lewat voice note di WhatsApp'],
                offers: [{ name: '1 Pertanyaan', price: 'Bayar sesukamu' }],
                cta: {
                    label: 'Ambil Promo Ini',
                    href: `https://wa.me/6287786280310?text=${encodeURIComponent('Kak aku mau yang promo Operation Happy Birthday 2026 yang pay as u like untuk 1 pertanyaan yaah.')}`,
                    onClick: handleHappyBirthday,
                },
            },
            {
                id: 'service-special', theme: 0, numeral: 'I', type: 'Edisi Spesial', tags: ['PDF', 'Musiman'], seasonal: true,
                blurb: 'Bacaan tematik musiman, dikirim sebagai PDF.',
                points: ['Gambaran umum sesuai momennya', 'Karier & keuangan, hingga percintaan', 'Saran strategis yang bisa dijalankan', 'PDF via WhatsApp, 2 hari kerja'],
                steps: ['Klik “Pesan Sesi”, isi nama, tanggal lahir & nomor WhatsApp', 'Bayar lewat QRIS atau transfer, lalu kirim buktinya via WhatsApp', 'Bacaanmu dikirim sebagai PDF via WhatsApp, maks. 2 hari kerja'],
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
                id: 'service-chat', theme: 1, numeral: 'II', type: 'Konsultasi via Chat', tags: ['Chat', 'WhatsApp'],
                blurb: 'Tanya-jawab tertulis via WhatsApp, per pertanyaan.',
                points: ['Analisa tertulis yang mendalam', 'Cocok untuk pertanyaan spesifik', 'Tanpa harus ngobrol langsung', 'Sisa pertanyaan bisa ditabung'],
                steps: ['Pilih paket 1 atau 3 pertanyaan, lalu isi data dirimu', 'Bayar lewat QRIS atau transfer, lalu kirim buktinya via WhatsApp', 'Kirim pertanyaanmu di WhatsApp', 'Jawaban & analisa tertulis dikirim via WhatsApp'],
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
                ],
            },
            {
                id: 'service-call', theme: 2, numeral: 'III', type: 'Panggilan Suara & Video', tags: ['Video', 'Real-time'],
                blurb: 'Ngobrol langsung via call atau video.',
                points: ['Via WhatsApp Call atau Google Meet', 'Bebas bertanya selama sesi', 'Curhat lebih leluasa', 'Bedah masalah sampai ke akarnya'],
                steps: ['Pilih durasi (30 atau 60 menit), tanggal & jam — Senin–Jumat', 'Isi data dirimu, bayar, lalu kirim bukti via WhatsApp', 'Di jam yang dipilih, kita ngobrol via WhatsApp Call atau Google Meet'],
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
                id: 'service-meetup', theme: 3, numeral: 'IV', type: 'Sesi Tatap Muka', tags: ['Jaksel', '1 Jam'],
                blurb: 'Sesi tatap muka di Jakarta Selatan.',
                points: ['Energi lebih terasa', 'Analisa lebih personal', 'Minimal 1 jam', 'Bisa diperpanjang per jam'],
                steps: ['Pilih durasi, tanggal & jam — hanya Jumat & Minggu', 'Isi data dirimu, bayar, lalu kirim bukti via WhatsApp', 'Kita ketemu langsung di Jakarta Selatan (lihat Rekomendasi Tempat)'],
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
                // Operation Happy Birthday — the "0" card, in gold; button opens WhatsApp
                id: '', theme: 4, numeral: '0', promo: true, type: 'Operation Happy Birthday',
                blurb: "To celebrate Mayanov's birthday, don't miss our Pay As U Like promo!",
                priceLabel: 'Pay as you like',
                points: ['1 question, any topic', 'Answered by voice note', 'Straight on WhatsApp'],
                steps: ['Tap “Claim This Promo” — WhatsApp opens with a ready-to-send message', 'Send your one question and pay what you like', 'Your answer arrives as a voice note on WhatsApp'],
                offers: [{ name: '1 Question', price: 'Pay as you like' }],
                cta: {
                    label: 'Claim This Promo',
                    href: `https://wa.me/6287786280310?text=${encodeURIComponent("Hi! I'd like the Operation Happy Birthday 2026 promo, pay as you like for 1 question.")}`,
                    onClick: handleHappyBirthdayGlobal,
                },
            },
            {
                id: '', theme: 0, numeral: 'I', type: '3-Card Spread', tags: ['Quick', '24h'],
                blurb: 'A quick check-in on one question.',
                points: ['Three-card spread', 'Photo of your spread', 'Written reading within 24h'],
                steps: ['Tap “Book a Reading” and leave your name, date of birth & WhatsApp', 'I’ll reach out on WhatsApp to confirm and take your question', 'Get a photo of your spread and a written reading within 24h'],
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
                id: '', theme: 1, numeral: 'II', type: '5-Card Deep', tags: ['In-depth', 'Popular'],
                blurb: 'An in-depth look at one question.',
                points: ['Bigger picture & hidden influences', "What's coming next", 'High-res photo of your cards', 'Priority delivery within 24h'],
                steps: ['Tap “Book a Reading” and leave your name, date of birth & WhatsApp', 'I’ll reach out on WhatsApp to confirm and take your question', 'Get a high-res photo of your cards and an in-depth reading within 24h'],
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
        ];

    return (
        <section id="services" className="bg-paper relative isolate overflow-hidden text-ink">
            <SoftAura />
            {/* HEADER — transparent over the sky */}
            <div className="mx-auto px-8 pt-14 md:pt-20 pb-6 md:pb-10">
                <FadeIn>
                    {/* centred over the spread, no subtitle — the cards say the rest */}
                    <h2 className="print-text pb-[0.14em] -mb-[0.14em] text-center font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                        {isIndonesian ? 'Pilih layanan tarotmu' : 'Ways we can work together'}
                    </h2>
                </FadeIn>
            </div>

            {/* ===== Pricelist — a fanned tarot spread; click a card to flip for details ===== */}
            <div id="pricelist" className="pb-6 md:pb-10">
                {/* no fade — the deck deals itself out when it scrolls into view */}
                <TarotFan groups={groups} isIndonesian={isIndonesian} />
            </div>

            {/* booking notes — highlighted, right under the cards so they're read before booking */}
            <Disclaimer isIndonesian={isIndonesian} />

        </section>
    );
};

export default Services;
