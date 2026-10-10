import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { smoothScrollTo, smoothScrollToId } from '../UI/scroll';

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

const Header: React.FC<HeaderProps> = ({ isIndonesian = false, onSwitchRegion }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll while the menu overlay is open; close on Escape.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const found = smoothScrollToId(id, 80);
    if (!found) window.location.href = `/#${id}`;
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
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
                className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-full bg-cream text-ink text-[13px] tracking-[0.01em] font-medium whitespace-nowrap hover:bg-plum hover:text-cream transition-colors duration-500 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)]"
              >
                {isIndonesian ? 'Pesan' : 'Book'}
              </button>

              <button
                onClick={() => setMenuOpen(true)}
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

      {/* Full-screen editorial menu overlay */}
      <div
        className={`fixed inset-0 z-[110] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ background: 'linear-gradient(180deg, #202A5C 0%, #14112B 100%)' }}
        aria-hidden={!menuOpen}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 55% at 82% 110%, rgba(107,63,160,0.11) 0%, transparent 62%)' }} />
        {/* celestial atmosphere — the menu is a night-sky moment (matches hero/footer) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 15% 22%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 72% 14%, rgba(255,255,255,0.4), transparent), radial-gradient(1.5px 1.5px at 86% 58%, rgba(255,255,255,0.45), transparent), radial-gradient(1px 1px at 28% 72%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 54% 88%, rgba(255,255,255,0.4), transparent), radial-gradient(1.5px 1.5px at 93% 32%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 9% 56%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 40% 40%, rgba(255,255,255,0.3), transparent)' }}
        />

        <div className="relative h-full mx-auto px-8 flex flex-col">
          {/* Top row — brand + close */}
          <div className="flex items-center justify-between py-4 md:py-5 shrink-0">
            <Wordmark onDark />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label={isIndonesian ? 'Tutup menu' : 'Close menu'}
              className="group inline-flex items-center justify-center -mr-2 p-2 text-cream"
            >
              <span className="relative block w-5 h-5">
                <span className="absolute top-1/2 left-0 h-px w-5 bg-cream -translate-y-1/2 rotate-45 transition-transform duration-500 group-hover:rotate-[135deg]" />
                <span className="absolute top-1/2 left-0 h-px w-5 bg-cream -translate-y-1/2 -rotate-45 transition-transform duration-500 group-hover:rotate-[45deg]" />
              </span>
            </button>
          </div>

          {/* Main — the section links */}
          <nav key={menuOpen ? 'open' : 'closed'} className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start lg:justify-center pt-6 pb-8 sm:py-8">
            <ul className="group/nav">
              {navLinks.map((link, i) => (
                <li
                  key={link.name}
                  className={`${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'} transition-opacity duration-500 lg:group-hover/nav:opacity-35 lg:hover:!opacity-100`}
                  style={{ animationDelay: `${i * 65 + 120}ms` }}
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="group/link w-full flex items-center py-3 sm:py-2.5 text-left"
                  >
                    <span className="font-elegant font-medium text-cream text-[2rem] sm:text-[3rem] md:text-[3.8rem] leading-[1.1] tracking-[-0.025em] transition-colors duration-500 group-hover/link:text-[#C9B8E8]">
                      {link.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom — language toggle + book */}
          <div className={`shrink-0 pt-5 pb-6 md:py-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-5 ${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`} style={{ animationDelay: '480ms' }}>
            {onSwitchRegion ? (
              <div className="self-start sm:self-auto">
                <RegionSwitcher isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
              </div>
            ) : <span />}
            <button
              onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('open-booking')); }}
              className="group self-start sm:self-auto inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-cream text-ink text-sm font-medium hover:bg-plum hover:text-cream transition-colors duration-500"
            >
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
