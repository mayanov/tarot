import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Instagram } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollTo, smoothScrollToId, lockPage, unlockPage } from '../UI/scroll';
import { btnPrimaryDark, btnPrimaryLight } from '../UI/buttons';
import CelestialMark from '../UI/CelestialMark';
import { MoonWatermark, moonNow } from '../UI/PrintedMoon';

interface HeaderProps {
  isIndonesian?: boolean;
  onSwitchRegion?: (toID: boolean) => void;
}

const REGIONS = {
  global: { name: 'Global', cur: 'EN' },
  id: { name: 'Indonesia', cur: 'ID' },
} as const;

// Region switcher: a quiet EN / ID text toggle (no box, flags or sliding thumb).
// Active language is full-strength; the other is dimmed. `light` is for light bgs.
const RegionSwitcher: React.FC<{ isIndonesian: boolean; onSwitch: (toID: boolean) => void; light?: boolean }> = ({ isIndonesian, onSwitch, light = false }) => {
  const activeCls = light ? 'text-ink' : 'text-cream';
  const dimCls = light ? 'text-ink/40 hover:text-ink/70' : 'text-cream/55 hover:text-cream/85';
  const items = [['global', false, 'EN'], ['id', true, 'ID']] as const;
  return (
    <div
      role="group"
      aria-label="Site version"
      className={`inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.04em] ${!light ? '[text-shadow:0_1px_8px_rgba(0,0,0,0.5)]' : ''}`}
    >
      {items.map(([key, toID, label], i) => (
        <React.Fragment key={key}>
          {i === 1 && <span aria-hidden className={light ? 'text-ink/25' : 'text-cream/30'}>/</span>}
          <button
            onClick={() => onSwitch(toID)}
            aria-pressed={toID === isIndonesian}
            title={`Switch to the ${REGIONS[key].name} version`}
            className={`transition-colors duration-500 ${toID === isIndonesian ? activeCls : dimCls}`}
          >
            {label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

interface NavItem {
  name: string;
  id: string;
  children?: { name: string; id: string }[];
}

// Menu motion: opening, the paper wipes down over the site (WIPE_MS) and the links rise
// in one by one as it settles; closing plays it backwards — the links drop out, last
// first (OUT_MS), then the paper wipes back up.
const WIPE_MS = 700;
const WIPE_EASE = 'cubic-bezier(0.76,0,0.24,1)';
const OUT_MS = 380;
// the links: each line slides up into place from behind its own baseline (a mask),
// one after another, starting while the paper is still coming down
const LINE_IN_AT = 260;
const LINE_STEP = 60;

// The services in the menu — the same mark and starting price as their pricelist
// card (a short name for the phone chips); picking one opens the booking form on it.
type MenuService = { id: string; name: string; short: string; price: string; mark: 'constellation' | 'star' | 'sparkle' | 'crescent' };
const MENU_SERVICES_ID: MenuService[] = [
  { id: 'special', name: 'Edisi Spesial', short: 'Edisi Spesial', price: 'Rp 250K', mark: 'constellation' },
  { id: 'chat', name: 'Konsultasi via Chat', short: 'Chat', price: 'Rp 140K', mark: 'star' },
  { id: 'call', name: 'Panggilan Suara & Video', short: 'Call / Video', price: 'Rp 220K', mark: 'sparkle' },
  { id: 'meetup', name: 'Sesi Tatap Muka', short: 'Tatap Muka', price: 'Rp 450K', mark: 'crescent' },
];
const MENU_SERVICES_EN: MenuService[] = [
  { id: '3card', name: '3-Card Spread', short: '3-Card', price: '$12', mark: 'constellation' },
  { id: '5card', name: '5-Card Deep', short: '5-Card', price: '$20', mark: 'star' },
];

const Header: React.FC<HeaderProps> = ({ isIndonesian = false, onSwitchRegion }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false); // links leaving, paper still down
  const closingRef = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const closeMenu = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => { setMenuOpen(false); setClosing(false); closingRef.current = false; }, OUT_MS);
  };
  // opening again mid-close cancels the close (the links come straight back)
  // the section on screen when the menu opens (marked in the index)
  const [activeId, setActiveId] = useState<string | null>(null);
  const openMenu = () => {
    const mid = window.innerHeight * 0.4;
    setActiveId(navLinks.map((l) => l.id).filter((id) => {
      const el = document.getElementById(id);
      return el && el.getBoundingClientRect().top <= mid;
    }).pop() ?? null);
    window.clearTimeout(closeTimer.current);
    closingRef.current = false;
    setClosing(false);
    setMenuOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll while the menu overlay is open (released as soon as it starts closing,
  // so a picked section can scroll into place under the lifting paper); close on Escape.
  // (the shared, counted lock, so booking a service from the menu — the form locks the
  // page as the menu closes — doesn't get unlocked by the menu)
  useEffect(() => {
    if (!menuOpen || closing) return;
    lockPage();
    return unlockPage;
  }, [menuOpen, closing]);
  // a section picked in the menu scrolls only once the lock above has been released:
  // releasing restarts Lenis, which would cancel a scroll already under way
  const pendingScroll = useRef<(() => void) | null>(null);
  const afterUnlock = (scroll: () => void) => {
    if (!menuOpen) { scroll(); return; }
    pendingScroll.current = scroll;
    closeMenu();
  };
  useEffect(() => {
    if (!closing || !pendingScroll.current) return;
    const scroll = pendingScroll.current;
    pendingScroll.current = null;
    scroll();
  }, [closing]);
  // keyboard: focus moves into the menu as it opens (onto the panel itself, so no ring
  // shows on a close button nobody pressed), Tab stays
  // inside it while open, and focus goes back to the menu button once it has closed
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const t = window.setTimeout(() => overlayRef.current?.focus({ preventScroll: true }), LINE_IN_AT);
    return () => {
      window.clearTimeout(t);
      if (overlayRef.current?.contains(document.activeElement)) menuBtnRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!menuOpen) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab' || !overlayRef.current) return;
      const items = [...overlayRef.current.querySelectorAll<HTMLElement>('button, a[href]')].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === overlayRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToSection = (id: string) => afterUnlock(() => {
    const found = smoothScrollToId(id, 80);
    if (!found) window.location.href = `/#${id}`;
  });

  // "Pesan": take visitors to the service cards. On wider screens frame the
  // "Pilih layanan tarotmu" heading together with the whole card spread (centred when
  // there's room), instead of stopping at the section's top padding.
  const goToServices = () => {
    const title = document.querySelector<HTMLElement>('#services h2');
    const cards = document.getElementById('pricelist');
    if (window.matchMedia('(min-width: 768px)').matches && title && cards) {
      afterUnlock(() => {
        const top = title.getBoundingClientRect().top + window.scrollY;
        const bottom = cards.getBoundingClientRect().bottom + window.scrollY;
        const gap = Math.max(96, (window.innerHeight - (bottom - top)) / 2);
        smoothScrollTo(Math.max(0, top - gap));
      });
      return;
    }
    scrollToSection('services');
  };

  // a service from the menu: its pricelist card is drawn over the menu as it closes,
  // turning to its details (booking is one step further, from the card)
  const showService = (id: string) => {
    closeMenu();
    window.dispatchEvent(new CustomEvent('open-pricelist-card', { detail: { serviceId: id } }));
  };
  const menuServices = isIndonesian ? MENU_SERVICES_ID : MENU_SERVICES_EN;
  // tonight's moon, worked out again each time the menu opens
  const moon = useMemo(() => moonNow(), [menuOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // the rows that fade/rise in (and out) with the links
  const rowAnim = (inAt: number, outAt = 0) => ({
    className: closing ? 'animate-[navOut_0.25s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0',
    style: { animationDelay: `${closing ? outAt : inAt}ms` },
  });

  const handleLogoClick = () => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      smoothScrollTo(0);
    } else {
      window.location.href = '/';
    }
  };

  const navLinks: NavItem[] = [
    { name: isIndonesian ? 'Tentang' : 'About', id: 'about' },
    {
      name: isIndonesian ? 'Layanan' : 'Services',
      id: 'services',
      children: isIndonesian ? [
        { name: 'Edisi Spesial', id: 'service-special' },
        { name: 'Chat', id: 'service-chat' },
        { name: 'Call/Video Call', id: 'service-call' },
        { name: 'Meetup', id: 'service-meetup' }
      ] : undefined
    },
    { name: isIndonesian ? 'Kenapa Mayanov?' : 'Values', id: 'why-choose' },
    { name: isIndonesian ? 'Testimony' : 'Reviews', id: 'testimonials' },
    { name: isIndonesian ? 'Events & Collaborations' : 'Track Record', id: 'events' },
    { name: isIndonesian ? 'FAQ' : 'FAQ', id: 'faq' },
  ];

  // The floating bar's marks stay cream throughout; on scroll a translucent dark
  // glass fades in behind them (readable over both the light and dark sections).

  // Brand mark — badge always; full wordmark eases in once scrolled.
  const Wordmark: React.FC<{ onDark?: boolean }> = ({ onDark = true }) => (
    <div className="flex items-center gap-2 cursor-pointer group whitespace-nowrap" onClick={handleLogoClick}>
      <span className={`grid place-items-center w-7 h-7 shrink-0 rounded-full border font-serif text-base leading-none transition-colors duration-500 ${onDark ? 'border-cream/50 text-cream group-hover:bg-cream group-hover:text-ink [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.4)]' : 'border-ink/30 text-ink group-hover:bg-ink group-hover:text-cream'}`}>
        M
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled || menuOpen ? 'max-w-[220px]' : 'max-w-0'}`}>
        <span className={`pl-0.5 text-base font-serif font-bold uppercase tracking-tight ${onDark ? 'text-cream [text-shadow:0_1px_10px_rgba(0,0,0,0.55),0_0_2px_rgba(0,0,0,0.4)]' : 'text-ink'}`}>
          Mayanov <span className={onDark ? 'text-cream/55' : 'text-ink/45'}>Tarot</span>
        </span>
      </span>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* solid frosted glass bar (fades in on scroll) — a flat tint + blur with a
            hairline bottom edge, so it reads as a defined nav bar, not a gradient */}
        <div
          className={`pointer-events-none absolute inset-0 backdrop-blur-xl border-b border-white/[0.08] transition-opacity duration-500 ${isScrolled && !menuOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(10,12,22,0.18)' }}
        />

        <div className="relative mx-auto px-8 flex justify-between items-center py-2.5 md:py-3">
          {/* LEFT — brand (hidden while the overlay owns the top row) */}
          <div className={`transition-opacity duration-300 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Wordmark />
          </div>

          {/* RIGHT — language toggle + the Pesan/Menu pair (joined) */}
          <div className={`flex items-stretch gap-2.5 transition-opacity duration-300 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {onSwitchRegion && (
              <div className="hidden md:flex mr-1">
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
              </div>
            )}

            {/* one 'Pesan' pill + a bare menu icon (no second pill) */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToServices}
                className={`${btnPrimaryDark} hidden sm:inline-flex px-6 py-2.5 text-[13px] tracking-[0.01em] whitespace-nowrap shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)]`}
              >
                {isIndonesian ? 'Pesan' : 'Book'}
              </button>

              <button
                ref={menuBtnRef}
                onClick={openMenu}
                aria-label={isIndonesian ? 'Buka menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="group inline-flex items-center justify-center p-1.5 text-cream [filter:drop-shadow(0_1px_8px_rgba(0,0,0,0.55))]"
              >
                <span className="flex flex-col items-end gap-[5px] w-6">
                  <span className="block h-[1.5px] w-6 bg-current transition-all duration-500" />
                  <span className="block h-[1.5px] w-4 bg-current group-hover:w-6 transition-all duration-500" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen editorial menu overlay — on the site's paper texture */}
      <div
        className={`bg-paper fixed inset-0 z-[110] overflow-hidden outline-none ${menuOpen && !closing ? '' : 'pointer-events-none'}`}
        style={{
          // a wipe from the top edge: the paper is drawn down over the site and lifted
          // back up; hidden (visibility) only once it has lifted
          clipPath: menuOpen ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: `clip-path ${WIPE_MS}ms ${WIPE_EASE}, visibility 0s linear ${menuOpen ? 0 : WIPE_MS}ms`,
        }}
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        tabIndex={-1}
      >
        {/* tonight's moon, printed faintly into the paper — behind the services on wide
            screens, low in the corner on phones; it rises and turns into place as the
            paper comes down */}
        <div aria-hidden className="pointer-events-none absolute aspect-square w-[92vw] -right-[34vw] bottom-[12dvh] sm:w-[62vw] sm:-right-[14vw] lg:w-[min(38rem,76vh)] lg:right-[calc(14rem-min(38rem,76vh)/2)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          <div
            className={`w-full h-full ${closing ? 'animate-[moonOut_0.35s_ease-in_both]' : menuOpen ? 'animate-[moonRise_1.8s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`}
            style={{ animationDelay: closing ? '0ms' : '220ms' }}
          >
            <MoonWatermark moon={moon} className="w-full h-full text-ink" />
          </div>
        </div>

        <div className="relative h-full mx-auto px-8 flex flex-col">
          {/* Top row — brand + close (in with the paper's leading edge, out with the links) */}
          <div
            className={`flex items-center justify-between py-4 md:py-5 shrink-0 ${closing ? 'animate-[navOut_0.25s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`}
            style={{ animationDelay: closing ? '120ms' : '160ms' }}
          >
            <Wordmark onDark={false} />
            {/* phones: the language switch sits up here, keeping the bottom row to one line */}
            {onSwitchRegion && (
              <div className="sm:hidden ml-auto mr-5">
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} light />
              </div>
            )}
            <button
              onClick={closeMenu}
              aria-label={isIndonesian ? 'Tutup menu' : 'Close menu'}
              className="group inline-flex items-center justify-center -mr-2 p-2 text-ink"
            >
              <span className="relative block w-5 h-5">
                <span className="absolute top-1/2 left-0 h-px w-5 bg-ink -translate-y-1/2 rotate-45 transition-transform duration-500 group-hover:rotate-[135deg]" />
                <span className="absolute top-1/2 left-0 h-px w-5 bg-ink -translate-y-1/2 -rotate-45 transition-transform duration-500 group-hover:rotate-[45deg]" />
              </span>
            </button>
          </div>

          {/* Main — the section index (left) and, on wide screens, the services (right) */}
          <div key={menuOpen ? 'open' : 'closed'} className="flex-1 min-h-0 overflow-y-auto lg:grid lg:grid-cols-[1fr_minmax(20rem,24rem)] lg:gap-16 xl:gap-24 lg:items-center pt-[2.5dvh] pb-[2dvh] sm:py-8">
          <nav className="flex flex-col justify-start lg:justify-center">
            <ul className="group/nav">
              {navLinks.map((link, i) => {
                const active = link.id === activeId;
                return (
                <li
                  key={link.name}
                  className="transition-opacity duration-500 lg:group-hover/nav:opacity-35 lg:hover:!opacity-100"
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    aria-current={active ? 'true' : undefined}
                    className="group/link w-full flex items-center py-[1.1dvh] sm:py-2.5 text-left"
                  >
                    {/* the mask (with room below for descenders, and to the right for the name's
                        hover step and italic overhang) and the line sliding in it */}
                    <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em] lg:pr-8 lg:-mr-8">
                      <span
                        className={`flex items-baseline gap-3 sm:gap-5 transition-colors duration-500 group-hover/link:text-moon ${active ? 'text-moon' : 'text-ink'} ${closing ? 'animate-[lineOut_0.3s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[lineIn_0.85s_cubic-bezier(0.22,1,0.36,1)_both]' : 'translate-y-[115%]'}`}
                        style={{ animationDelay: `${closing ? (navLinks.length - 1 - i) * 30 : LINE_IN_AT + i * LINE_STEP}ms` }}
                      >
                        {/* index number, like the FAQ list — on hover (desktop) it lifts away
                            and a small star takes its place, while the name steps forward */}
                        <span className={`relative w-6 sm:w-8 shrink-0 font-elegant italic text-[0.8rem] sm:text-sm tabular-nums ${active ? 'text-moon' : 'text-ink/35'}`}>
                          <span className="inline-block transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-hover/link:-translate-y-2 lg:group-hover/link:opacity-0">{String(i + 1).padStart(2, '0')}</span>
                          <CelestialMark name="sparkle" className="absolute left-0 top-1/2 w-3.5 text-moon opacity-0 translate-y-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-hover/link:opacity-100 lg:group-hover/link:-translate-y-1/2" />
                        </span>
                        <span className={`font-elegant font-medium text-[clamp(1.3rem,4.3dvh,2rem)] sm:text-[3rem] md:text-[3.8rem] lg:text-[clamp(2.4rem,4.2vw,3.8rem)] leading-[1.1] tracking-[-0.025em] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-hover/link:translate-x-3 ${active ? 'italic' : ''}`}>{link.name}</span>
                      </span>
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>

            {/* phones / tablets: the services as a row of chips under the index */}
            <div className={`lg:hidden mt-[2.5dvh] sm:mt-7 ${rowAnim(LINE_IN_AT + navLinks.length * LINE_STEP).className}`} style={rowAnim(LINE_IN_AT + navLinks.length * LINE_STEP).style}>
              <p className="font-elegant italic text-sm text-ink/45 mb-2">{isIndonesian ? 'Langsung pesan' : 'Book directly'}</p>
              <div className="flex flex-wrap gap-2">
                {menuServices.map((sv) => (
                  <button key={sv.id} type="button" onClick={() => showService(sv.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-[13px] text-ink hover:border-moon hover:text-moon transition-colors">
                    <CelestialMark name={sv.mark} className="w-3 text-moon" />
                    {sv.short}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* wide screens: book a service directly, plus the practical bits — set in the
              index's own type (serif names, italic small print, hairlines), no badges */}
          {/* (its rows come in one after another, like the index; the hover dimming sits on
              the buttons, since the rows' entrance animation holds their opacity) */}
          <aside className="hidden lg:block">
            <p className={`font-elegant italic text-sm text-ink/45 ${rowAnim(LINE_IN_AT + 180, 60).className}`} style={rowAnim(LINE_IN_AT + 180, 60).style}>{isIndonesian ? 'Langsung pesan sesi' : 'Book a reading'}</p>
            <ul className="mt-3 group/svs">
              {menuServices.map((sv, j) => (
                <li key={sv.id} className={`border-t border-ink/10 last:border-b ${rowAnim(LINE_IN_AT + 240 + j * LINE_STEP, 60).className}`} style={rowAnim(LINE_IN_AT + 240 + j * LINE_STEP, 60).style}>
                  <button type="button" onClick={() => showService(sv.id)} className="group/sv w-full flex items-baseline gap-3 py-3.5 text-left transition-[opacity,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/svs:opacity-40 hover:!opacity-100 hover:pl-2">
                    <CelestialMark name={sv.mark} className="w-3.5 shrink-0 self-center text-ink/35 transition-colors duration-300 group-hover/sv:text-moon" />
                    <span className="flex-1 min-w-0 font-elegant font-medium text-ink text-[1.45rem] leading-tight tracking-[-0.01em] transition-colors duration-300 group-hover/sv:text-moon">{sv.name}</span>
                    <span className="shrink-0 font-elegant italic text-ink/50 text-[0.95rem] whitespace-nowrap">{isIndonesian ? 'mulai' : 'from'} {sv.price}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          </div>

          {/* Bottom — language toggle + socials + book */}
          <div className={`shrink-0 pt-4 pb-5 md:py-6 border-t border-ink/10 flex flex-row items-center justify-between gap-5 ${closing ? 'animate-[navOut_0.25s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`} style={{ animationDelay: closing ? '0ms' : `${LINE_IN_AT + navLinks.length * LINE_STEP + 80}ms` }}>
            {onSwitchRegion ? (
              <div className="hidden sm:block">
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} light />
              </div>
            ) : <span className="hidden sm:block" />}

            <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-end gap-6 sm:gap-7">
              {/* socials — plain ink icons, no containers */}
              <nav className="flex items-center gap-6" aria-label="Social">
                <a
                  href="https://www.instagram.com/mayanov_/" target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', { platform: 'Instagram', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'Instagram', content_category: isIndonesian ? 'ID' : 'Global' })}
                  aria-label="Instagram" className="text-ink/60 hover:text-moon transition-all duration-500 hover:-translate-y-0.5">
                  <Instagram className="w-5 h-5" strokeWidth={1.7} />
                </a>
                <a
                  href="https://www.tiktok.com/@mayanov_" target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', { platform: 'TikTok', market: isIndonesian ? 'ID' : 'Global' }, 'ViewContent', { content_name: 'TikTok', content_category: isIndonesian ? 'ID' : 'Global' })}
                  aria-label="TikTok" className="text-ink/60 hover:text-moon transition-all duration-500 hover:-translate-y-0.5">
                  <FaTiktok size={18} />
                </a>
                <a
                  href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading" target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('contact', { method: 'WhatsApp', market: isIndonesian ? 'ID' : 'Global' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: isIndonesian ? 'ID' : 'Global' })}
                  aria-label="WhatsApp" className="text-ink/60 hover:text-moon transition-all duration-500 hover:-translate-y-0.5">
                  <FaWhatsapp size={20} />
                </a>
              </nav>

              <button
                onClick={goToServices}
                className={`${btnPrimaryLight} inline-flex group gap-3 px-6 sm:px-8 py-3 sm:py-3.5 text-sm`}
              >
                {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
