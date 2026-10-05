import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import { smoothScrollTo, smoothScrollToId } from '../UI/scroll';

interface HeaderProps {
  isIndonesian?: boolean;
  onSwitchRegion?: (toID: boolean) => void;
}

const REGIONS = {
  global: { name: 'Global', cur: 'EN' },
  id: { name: 'Indonesia', cur: 'ID' },
} as const;

// Custom region icons (crisp + consistent across devices, unlike emoji flags).
const RegionIcon: React.FC<{ region: 'global' | 'id'; className?: string }> = ({ region, className = '' }) =>
  region === 'id' ? (
    <span className={`inline-block overflow-hidden rounded-[3px] ring-1 ring-black/10 ${className}`}>
      <svg viewBox="0 0 3 2" className="block w-full h-full" preserveAspectRatio="none">
        <rect width="3" height="1" fill="#E4002B" />
        <rect y="1" width="3" height="1" fill="#FFFFFF" />
      </svg>
    </span>
  ) : (
    <Globe strokeWidth={1.6} className={className} />
  );

// Region switcher: a two-segment toggle with a sliding moonstone thumb.
// `compact` is the small variant used directly in the nav bar.
const RegionSwitcher: React.FC<{ isIndonesian: boolean; onSwitch: (toID: boolean) => void; compact?: boolean; light?: boolean }> = ({ isIndonesian, onSwitch, compact = false, light = false }) => {
  const options = [['global', false], ['id', true]] as const;
  return (
    <div
      role="group"
      aria-label="Site version"
      className={`relative flex items-center p-0.5 rounded-lg border transition-colors duration-300 ${light ? 'border-ink/20' : 'border-cream/40'} ${compact ? 'w-[12.25rem] h-full' : 'w-full max-w-none sm:max-w-[17rem]'}`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${light ? 'bg-ink/[0.08]' : 'bg-[#202A5C]/60 backdrop-blur-sm'}`}
        style={{ transform: isIndonesian ? 'translateX(100%)' : 'translateX(0)' }}
      />
      {options.map(([key, toID]) => {
        const r = REGIONS[key];
        const active = toID === isIndonesian;
        return (
          <button
            key={key}
            onClick={() => onSwitch(toID)}
            aria-pressed={active}
            title={`Switch to the ${r.name} version`}
            className={`relative z-10 flex-1 basis-0 flex items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-colors duration-300 ${compact ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} ${light ? (active ? 'text-ink' : 'text-ink/45 hover:text-ink/70') : (active ? 'text-cream' : 'text-cream/55 hover:text-cream/80')}`}
          >
            <RegionIcon
              region={key}
              className={`shrink-0 transition-opacity duration-300 ${key === 'id' ? (compact ? 'w-[15px] h-[10px]' : 'w-[18px] h-3') : (compact ? 'w-[15px] h-[15px]' : 'w-[17px] h-[17px]')} ${active ? '' : 'opacity-75'}`}
            />
            {compact ? (
              <span>{r.cur}</span>
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span>{r.name}</span>
                <span className="text-[0.8em] opacity-55">({r.cur})</span>
              </span>
            )}
          </button>
        );
      })}
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
      <span className={`grid place-items-center w-7 h-7 shrink-0 rounded-full border font-serif text-base leading-none transition-colors duration-300 ${onDark ? 'border-cream/40 text-cream group-hover:bg-cream group-hover:text-ink' : 'border-ink/30 text-ink group-hover:bg-ink group-hover:text-cream'}`}>
        M
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled || menuOpen ? 'max-w-[220px]' : 'max-w-0'}`}>
        <span className={`pl-0.5 text-base font-serif font-bold uppercase tracking-tight ${onDark ? 'text-cream' : 'text-ink'}`}>
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
          className={`pointer-events-none absolute inset-0 backdrop-blur-md border-b border-black/[0.06] transition-opacity duration-500 ${isScrolled && !menuOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(255,255,255,0.65)' }}
        />

        <div className="relative mx-auto px-8 flex justify-between items-center py-2.5 md:py-3">
          {/* LEFT — brand (hidden while the overlay owns the top row) */}
          <div className={`transition-opacity duration-200 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Wordmark onDark={!isScrolled} />
          </div>

          {/* RIGHT — language toggle + the Pesan/Menu pair (joined) */}
          <div className={`flex items-stretch gap-2.5 transition-opacity duration-200 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {onSwitchRegion && (
              <div className="hidden md:flex mr-1">
                <RegionSwitcher compact light={isScrolled} isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
              </div>
            )}

            {/* Pesan + Menu — a joined, rounded pair */}
            <div className="flex">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
                className={`hidden sm:inline-flex items-center px-4 py-2.5 rounded-l-lg border text-[10.5px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-colors duration-300 ${isScrolled ? 'bg-ink text-cream border-ink hover:bg-plum' : 'bg-cream text-ink border-ink/10 hover:bg-plum hover:text-cream'}`}
              >
                {isIndonesian ? 'Pesan' : 'Book'}
              </button>

              <button
                onClick={() => setMenuOpen(true)}
                aria-label={isIndonesian ? 'Buka menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg sm:rounded-l-none sm:rounded-r-lg border sm:border-l-0 text-[10.5px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-colors duration-300 ${isScrolled ? 'bg-ink text-cream border-ink hover:bg-plum' : 'bg-cream text-ink border-ink/10 hover:bg-plum hover:text-cream'}`}
              >
                <span>Menu</span>
                <span className="flex flex-col items-end gap-[4px] w-4">
                  <span className="block h-px w-4 bg-current transition-all duration-300" />
                  <span className="block h-px w-2.5 bg-current group-hover:w-4 transition-all duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen editorial menu overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ background: 'linear-gradient(180deg, #0C0C0D 0%, #050505 100%)' }}
        aria-hidden={!menuOpen}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 55% at 82% 110%, rgba(107,63,160,0.11) 0%, transparent 62%)' }} />

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
                <span className="absolute top-1/2 left-0 h-px w-5 bg-cream -translate-y-1/2 rotate-45 transition-transform duration-300 group-hover:rotate-[135deg]" />
                <span className="absolute top-1/2 left-0 h-px w-5 bg-cream -translate-y-1/2 -rotate-45 transition-transform duration-300 group-hover:rotate-[45deg]" />
              </span>
            </button>
          </div>

          {/* Main — the section links */}
          <nav key={menuOpen ? 'open' : 'closed'} className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start lg:justify-center pt-6 pb-8 sm:py-8">
            <ul className="group/nav">
              {navLinks.map((link, i) => (
                <li
                  key={link.name}
                  className={`${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'} transition-opacity duration-300 lg:group-hover/nav:opacity-35 lg:hover:!opacity-100`}
                  style={{ animationDelay: `${i * 65 + 120}ms` }}
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="group/link w-full flex items-center gap-4 py-3 sm:py-2.5 text-left"
                  >
                    <span className="flex-1 font-elegant font-medium text-cream text-[2rem] sm:text-[3rem] md:text-[3.8rem] leading-[1.1] tracking-[-0.025em] transition-transform duration-300 group-hover/link:translate-x-2">
                      {link.name}
                    </span>
                    <ArrowUpRight className="w-6 h-6 md:w-9 md:h-9 text-cream shrink-0 opacity-60 -translate-x-0 sm:opacity-0 sm:-translate-x-3 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom — language toggle + book */}
          <div className={`shrink-0 pt-5 pb-6 md:py-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-5 ${menuOpen ? 'animate-[navSlide_0.6s_cubic-bezier(0.22,1,0.36,1)_both]' : 'opacity-0'}`} style={{ animationDelay: '480ms' }}>
            {onSwitchRegion ? (
              <div className="self-start sm:self-auto">
                <RegionSwitcher compact isIndonesian={isIndonesian} onSwitch={onSwitchRegion} />
              </div>
            ) : <span />}
            <button
              onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('open-booking')); }}
              className="group self-start sm:self-auto inline-flex items-center gap-3 px-6 py-3 rounded-lg border border-cream/40 text-cream text-sm font-semibold hover:bg-cream hover:text-ink transition-colors duration-300"
            >
              {isIndonesian ? 'Pesan Sesi' : 'Book a Reading'}
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
