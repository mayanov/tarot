import React, { useState, useEffect, useRef } from 'react';
import { Instagram } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { trackEvent } from '../../services/analytics';
import { smoothScrollTo, smoothScrollToId } from '../UI/scroll';
import { btnPrimaryDark, btnPrimaryLight } from '../UI/buttons';

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
  const openMenu = () => {
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
  useEffect(() => {
    document.body.style.overflow = menuOpen && !closing ? 'hidden' : 'unset';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpen) closeMenu(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closing]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToSection = (id: string) => {
    if (menuOpen) closeMenu();
    const found = smoothScrollToId(id, 80);
    if (!found) window.location.href = `/#${id}`;
  };

  // "Pesan": take visitors to the service cards. On wider screens frame the
  // "Pilih layanan tarotmu" heading together with the whole card spread (centred when
  // there's room), instead of stopping at the section's top padding.
  const goToServices = () => {
    const title = document.querySelector<HTMLElement>('#services h2');
    const cards = document.getElementById('pricelist');
    if (window.matchMedia('(min-width: 768px)').matches && title && cards) {
      if (menuOpen) closeMenu();
      const top = title.getBoundingClientRect().top + window.scrollY;
      const bottom = cards.getBoundingClientRect().bottom + window.scrollY;
      const gap = Math.max(96, (window.innerHeight - (bottom - top)) / 2);
      smoothScrollTo(Math.max(0, top - gap));
      return;
    }
    scrollToSection('services');
  };

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
        className={`bg-paper fixed inset-0 z-[110] ${menuOpen && !closing ? '' : 'pointer-events-none'}`}
        style={{
          // a wipe from the top edge: the paper is drawn down over the site and lifted
          // back up; hidden (visibility) only once it has lifted
          clipPath: menuOpen ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: `clip-path ${WIPE_MS}ms ${WIPE_EASE}, visibility 0s linear ${menuOpen ? 0 : WIPE_MS}ms`,
        }}
        aria-hidden={!menuOpen}
      >
        <div className="relative h-full mx-auto px-8 flex flex-col">
          {/* Top row — brand + close (in with the paper's leading edge, out with the links) */}
          <div
            className={`flex items-center justify-between py-4 md:py-5 shrink-0 ${closing ? 'animate-[navOut_0.25s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`}
            style={{ animationDelay: closing ? '120ms' : '160ms' }}
          >
            <Wordmark onDark={false} />
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

          {/* Main — the section links */}
          <nav key={menuOpen ? 'open' : 'closed'} className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start lg:justify-center pt-6 pb-8 sm:py-8">
            <ul className="group/nav">
              {navLinks.map((link, i) => (
                <li
                  key={link.name}
                  className="transition-opacity duration-500 lg:group-hover/nav:opacity-35 lg:hover:!opacity-100"
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="group/link w-full flex items-center py-3 sm:py-2.5 text-left"
                  >
                    {/* the mask (with room below for descenders) and the line sliding in it */}
                    <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                      <span
                        className={`block font-elegant font-medium text-ink text-[2rem] sm:text-[3rem] md:text-[3.8rem] leading-[1.1] tracking-[-0.025em] transition-colors duration-500 group-hover/link:text-moon ${closing ? 'animate-[lineOut_0.3s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[lineIn_0.85s_cubic-bezier(0.22,1,0.36,1)_both]' : 'translate-y-[115%]'}`}
                        style={{ animationDelay: `${closing ? (navLinks.length - 1 - i) * 30 : LINE_IN_AT + i * LINE_STEP}ms` }}
                      >
                        {link.name}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom — language toggle + socials + book */}
          <div className={`shrink-0 pt-5 pb-6 md:py-6 border-t border-ink/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 ${closing ? 'animate-[navOut_0.25s_cubic-bezier(0.5,0,0.75,0)_both]' : menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`} style={{ animationDelay: closing ? '0ms' : `${LINE_IN_AT + navLinks.length * LINE_STEP + 80}ms` }}>
            {onSwitchRegion ? (
              <div className="self-start sm:self-auto">
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} light />
              </div>
            ) : <span />}

            <div className="flex flex-wrap items-center gap-6 sm:gap-7 self-start sm:self-auto">
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
                className={`${btnPrimaryLight} inline-flex group gap-3 px-8 py-3.5 text-sm`}
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
