import React, { useState, useEffect } from 'react';
import { Moon, Menu, X, ChevronDown } from 'lucide-react';

interface HeaderProps {
  isIndonesian?: boolean;
}

interface NavItem {
  name: string;
  id: string;
  children?: { name: string; id: string }[];
}

const Header: React.FC<HeaderProps> = ({ isIndonesian = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false); // For mobile expand

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Height of sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navLinks: NavItem[] = [
    { name: isIndonesian ? 'Tentang' : 'About', id: 'about' },
    { name: isIndonesian ? 'Kenapa Mayanov?' : 'Values', id: 'why-choose' },
    { name: isIndonesian ? 'Cara Kerja' : 'How it Works', id: 'process' },
    {
      name: isIndonesian ? 'Layanan' : 'Services',
      id: 'services',
      // Only show sub-menu for Indonesian version where we have specific sections
      children: isIndonesian ? [
        { name: 'Edisi Spesial', id: 'service-special' },
        { name: 'Chat', id: 'service-chat' },
        { name: 'Call/Video Call', id: 'service-call' },
        { name: 'Meetup', id: 'service-meetup' }
      ] : undefined
    },
    { name: isIndonesian ? 'Testimony' : 'Reviews', id: 'testimonials' },
    { name: isIndonesian ? 'Events & Collaborations' : 'Track Record', id: 'events' },
    { name: isIndonesian ? 'FAQ' : 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-bg-dark/80 backdrop-blur-md py-4 shadow-lg border-b border-white/5' : 'bg-transparent py-6'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative z-50">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="p-1.5 rounded-full bg-lilac/10 border border-lilac/20 group-hover:bg-lilac/20 transition duration-300">
              <Moon className="w-5 h-5 text-lilac" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white group-hover:text-lilac transition duration-300 font-serif">
              Mayanov Tarot
            </span>
          </div>

          {/* Desktop Nav - Hidden on tablet/mobile */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group/menu">
                <button
                  onClick={() => scrollToSection(link.id)}
                  className="flex items-center gap-1 text-sm font-medium text-text-subtle hover:text-lilac transition duration-300 tracking-wide whitespace-nowrap py-2"
                >
                  {link.name}
                  {link.children && <ChevronDown className="w-3 h-3 group-hover/menu:rotate-180 transition-transform duration-200" />}
                </button>

                {/* Desktop Dropdown */}
                {link.children && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 transform translate-y-2 group-hover/menu:translate-y-0 w-48">
                    <div className="bg-[#1E1E2E] border border-white/10 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                      {link.children.map(child => (
                        <button
                          key={child.name}
                          onClick={(e) => { e.stopPropagation(); scrollToSection(child.id); }}
                          className="text-left px-4 py-2 text-sm text-text-subtle hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => scrollToSection('services')}
              className="px-6 py-2 rounded-full bg-lilac text-[#05050A] text-sm font-bold hover:bg-white hover:text-[#05050A] transition-all duration-300 shadow-[0_0_15px_rgba(192,160,255,0.3)] hover:shadow-[0_0_20px_rgba(192,160,255,0.5)] hover:-translate-y-0.5 ml-2 whitespace-nowrap"
            >
              {isIndonesian ? 'Pesan Sekarang' : 'Book Now'}
            </button>
          </nav>

          {/* Mobile Menu Toggle (Visible on tablet/mobile) */}
          {!isMobileMenuOpen && (
            <button
              className="lg:hidden text-text-light hover:text-lilac transition p-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-bg-dark/98 backdrop-blur-2xl z-[60] flex flex-col items-center justify-start pt-32 transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
          }`}
      >
        {/* Close Button inside Overlay */}
        <button
          className="absolute top-6 right-4 text-text-light hover:text-lilac transition p-2 bg-white/5 rounded-full"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-8 h-8" />
        </button>

        <div className="flex flex-col space-y-4 text-center p-4 w-full max-w-sm overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="mb-2 shrink-0">
            <Moon className="w-12 h-12 text-lilac mx-auto opacity-80" />
          </div>

          {navLinks.map((link, idx) => (
            <div key={link.name} className="flex flex-col w-full">
              <button
                onClick={() => {
                  if (link.children) {
                    setIsServicesOpen(!isServicesOpen);
                  } else {
                    scrollToSection(link.id);
                  }
                }}
                className={`text-xl font-serif font-medium text-text-light hover:text-lilac transition-colors flex items-center justify-center gap-2 ${link.children ? 'mb-2' : ''}`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                {link.name}
                {link.children && <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />}
              </button>

              {/* Mobile Submenu */}
              {link.children && (
                <div className={`flex flex-col gap-3 bg-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isServicesOpen ? 'max-h-64 py-4 mb-4' : 'max-h-0 py-0'}`}>
                  {link.children.map(child => (
                    <button
                      key={child.name}
                      onClick={() => scrollToSection(child.id)}
                      className="text-base text-text-subtle hover:text-white"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => scrollToSection('services')}
            className="mt-4 px-10 py-4 rounded-full bg-lilac text-[#05050A] font-bold text-lg hover:bg-white transition shadow-[0_0_20px_rgba(192,160,255,0.4)] shrink-0"
          >
            {isIndonesian ? 'Pesan Pembacaan' : 'Book a Reading'}
          </button>
        </div>

        {/* Decorative background element in menu */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-lilac/10 to-transparent pointer-events-none"></div>
      </div>
    </>
  );
};

export default Header;