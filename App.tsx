import React, { useState, useEffect } from 'react';
import Background from './components/Layout/Background';
import Header from './components/Layout/Header';
import Hero from './components/Sections/Hero';
import Trust from './components/Sections/Trust';
import About from './components/Sections/About';
import Services from './components/Sections/Services';
import Process from './components/Sections/Process';
import Footer from './components/Layout/Footer';
import Testimonials from './components/Sections/Testimonials';
import WhyChoose from './components/Sections/WhyChoose';
import Events from './components/Sections/Events';
import CTA from './components/Sections/CTA';
import FAQ from './components/Sections/FAQ';
import { Moon, ArrowUp } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { trackEvent, setUserProperties, trackPageView } from './services/analytics';

function App() {
  const [isIndonesian, setIsIndonesian] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDevOverride, setIsDevOverride] = useState<boolean>(false);

  useEffect(() => {
    const checkLocation = async () => {
      try {
        // [DEV ONLY] Secure Sandbox for Geolocation Testing
        // This ensures ONLY the developer (YOU) can simulate locations.
        if (import.meta.env.DEV) {
          const params = new URLSearchParams(window.location.search);
          const geoParam = params.get('geo'); // Use ?geo=id or ?geo=global

          if (geoParam === 'id' || geoParam === 'global') {
            const isID = geoParam === 'id';
            console.log(`[DEV MODE] 🔒 Overriding location to: ${isID ? 'Indonesia' : 'Global'}`);

            setIsIndonesian(isID);
            setIsDevOverride(true);

            // Mock tracking to prevent errors
            setUserProperties({
              country: isID ? 'Indonesia (Dev)' : 'Global (Dev)',
              status: 'DEV_OVERRIDE'
            });
            trackPageView();

            return; // Skip the real API call; 'finally' block handles loading state
          }
        }

        // Create a timeout controller to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

        // Using geojs.io for reliable client-side country lookup
        // Switched to /geo.json to get city information
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const countryCode = data.country_code;

        // geojs returns { country_code: 'ID', city: 'Jakarta', ... }
        const isID = countryCode === 'ID';
        setIsIndonesian(isID);

        // Prepare User Properties for Tracking
        const userProps: Record<string, any> = {};

        if (isID) {
          // For Indonesia: Add City Information
          userProps.country = 'Indonesia';
          userProps.city = data.city || 'Unknown';
          if (data.region) userProps.region = data.region;
        } else {
          // For Global: Use Country
          userProps.country = data.country || countryCode || 'Global';
        }

        // Set properties (will be included in all future events)
        setUserProperties(userProps);

        // Track Page Open (Page View)
        trackPageView();

      } catch (error) {
        // Fallback to Global (English) on error or timeout
        console.warn("GeoIP lookup failed or timed out, defaulting to Global mode.", error);
        setIsIndonesian(false);
        // Track page view even if geo fails
        trackPageView({ note: 'geo_failed' });
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    // Handle PayPal Success Redirects
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('payment_success');
    if (successParam === '3card' || successParam === '5card') {
      console.log(`[PAYMENT] ✅ Success detected for: ${successParam}. Redirecting to thank you page...`);
      // Short timeout to ensure analytics/state are settled if needed, though immediate is fine
      setTimeout(() => {
        window.location.href = `/thankyou-page-${successParam}.html`;
      }, 500);
    }

    checkLocation();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Moon className="w-12 h-12 text-lilac animate-spin-slow" />
          <span className="text-sm tracking-[0.3em] uppercase text-text-subtle">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-text-light selection:bg-lilac/30">
      <Background />

      <Header isIndonesian={isIndonesian} />

      {/* DEV MODE INDICATOR */}
      {isDevOverride && (
        <div className="fixed bottom-4 left-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-md shadow-lg text-xs font-bold font-mono pointer-events-none opacity-80">
          DEV MODE: {isIndonesian ? 'INDONESIA' : 'GLOBAL'} VIEW
        </div>
      )}

      <main>
        <Hero isIndonesian={isIndonesian} />
        <About isIndonesian={isIndonesian} />
        <Trust isIndonesian={isIndonesian} />
        <WhyChoose isIndonesian={isIndonesian} />
        <Process isIndonesian={isIndonesian} />
        <Services isIndonesian={isIndonesian} />
        <Testimonials isIndonesian={isIndonesian} />
        <Events isIndonesian={isIndonesian} />
        <FAQ isIndonesian={isIndonesian} />
        <CTA isIndonesian={isIndonesian} />
      </main>

      <Footer isIndonesian={isIndonesian} />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 items-end">
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="p-3 rounded-full bg-surface-highlight text-lilac shadow-lg hover:bg-lilac hover:text-white transition-all duration-300 border border-white/10 hover:-translate-y-1"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Floating Button */}
        {isIndonesian && (
          <a
            href="https://wa.me/6287786280310?text=Halo%20Mayanov%2C%20saya%20ingin%20bertanya%20mengenai%20tarot%20reading"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('contact', { method: 'WhatsApp', market: 'ID' }, 'Contact', { content_name: 'WhatsApp Chat', content_category: 'ID' })}
            className="p-3 rounded-full bg-[#25D366] text-white shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300 flex items-center justify-center"
            title="Chat on WhatsApp"
          >
            <FaWhatsapp size={24} />
          </a>
        )}
      </div>
    </div>
  );
}

export default App;