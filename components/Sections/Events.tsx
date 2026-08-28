import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';
import { ChevronDown } from 'lucide-react';

interface EventsProps {
  isIndonesian?: boolean;
}

const Events: React.FC<EventsProps> = ({ isIndonesian = false }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  // Original list in chronological order (2016 -> 2025)
  const rawEventList = [
    { year: "2016", title: "Music Night 2016: Rollin With The Homies", loc: "Prasetiya Mulya Business School" },
    { year: "2017", title: "Music Night 2017: Music Night Getaway", loc: "Prasetiya Mulya Business School" },
    { year: "2016-2017", title: "Tarot Reading @ Horizon Radio", loc: "Prasetiya Mulya Business School" },
    { year: "2019", title: "Bincang: Komunitas dan Profesi Tarot", loc: "Perpusnas Expo" },
    { year: "2019", title: "Halloweekend 2019", loc: "Lobbyn Sky Terrace" },
    { year: "2019", title: "Halloween Event 2019", loc: "Ibis Styles Simatupang" },
    { year: "2019", title: "Hashloween 2019: Cursed Wedding", loc: "Hash Entertainment" },
    { year: "2020", title: "Interview with Bibir Jakarta", loc: "Bibir Jakarta by Harry DeFretes" },
    { year: "2020", title: "Santuy Kuy Year-End Gathering", loc: "HM Sampoerna" },
    { year: "2021", title: "Live Tarot Reading Session", loc: "C Channel Indonesia" },
    { year: "2021", title: "Meramal Masa Depan dengan Tarot", loc: "Late Night Shift Podcast" },
    { year: "2022", title: "Misteri dan Tarot Maraton", loc: "Tiktok Indonesia" },
    { year: "2022", title: "BERAWALMULA Pop Up Store at Dekhad", loc: "BERAWALMULA" },
    { year: "2022", title: "Jerit Malam", loc: "UMN Radio" },
    { year: "2023", title: "Gordon's Fall Gin Love Party at Bocarica", loc: "Gordon's" },
    { year: "2023", title: "UR Night to Remember KOL Gathering", loc: "Urban Republic" },
    { year: "2024", title: "Kokatto 10th Anniversary", loc: "Kokatto" },
    { year: "2024", title: "Dual Muse Collection Launch", loc: "Dya Sejiiwa" },
    { year: "2024", title: "Fomo Market in collaboration with Padu Sinar", loc: "Fomo Market ASHTA District 8" },
    { year: "2024", title: "New Year 2025 Event", loc: "Grand Dafam Hotel Ancol" },
    { year: "2025", title: "Pasar Kaget Banget in collaboration with Padu Sinar", loc: "Pasar Kaget Banget MBloc" },
    { year: "2025", title: "Hotel Ciputra Jakarta Halloween Event", loc: "Hotel Ciputra Jakarta" },
    { year: "2025", title: "Logs and Pebbles Halloween Event", loc: "Logs and Pebbles" },
  ];

  // Reverse list to show newest events first
  const eventList = [...rawEventList].reverse();
  const displayedEvents = eventList.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  return (
    <section
      id="events"
      className="py-16 md:py-24 relative overflow-hidden isolate border-y border-white/10"
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        <FadeIn>
          <div className="grid lg:grid-cols-12 gap-y-10 lg:gap-x-16">
            {/* LEFT — heading + count */}
            <div className="lg:col-span-5 relative">
              <div className="relative z-10 py-9 md:py-12 pr-8 md:pr-12 text-cream">
                <h2 className="font-serif font-semibold text-cream text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em] [text-shadow:0_2px_24px_rgba(20,12,26,0.5)]">
                  {isIndonesian ? "Event & collaboration" : "Community & events"}
                </h2>

                <div className="mt-8 flex items-baseline gap-3">
                  <span className="font-serif font-semibold text-6xl md:text-7xl text-cream leading-none tracking-tight [text-shadow:0_2px_22px_rgba(20,12,26,0.5)]">{eventList.length}+</span>
                  <span className="text-[0.7rem] uppercase tracking-[0.24em] text-cream whitespace-nowrap leading-snug [text-shadow:0_1px_10px_rgba(20,12,26,0.6)]">
                    {isIndonesian ? "Event sejak 2016" : "Events since 2016"}
                  </span>
                </div>

                <a
                  href="https://wa.link/5peyhb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center px-8 py-3 rounded-full bg-cream text-ink hover:bg-white text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isIndonesian ? "Yuk Collab" : "Collaborate with me"}
                </a>
              </div>
            </div>

            {/* RIGHT — timeline list */}
            <div className="lg:col-span-7 lg:col-start-6 border-t border-white/10">
              {displayedEvents.map((event, index) => (
                <FadeIn key={index} delay={Math.min(index, 6) * 60} dir="left">
                  <div className="group grid grid-cols-[3.5rem_1fr] md:grid-cols-[4.5rem_1fr] gap-x-4 py-5 border-b border-white/10">
                    <span className="font-serif font-semibold text-sage text-sm md:text-base tabular-nums pt-0.5">{event.year}</span>
                    <div>
                      <h3 className="text-cream font-serif font-semibold text-base md:text-lg leading-snug group-hover:text-sage transition-colors duration-200">
                        {event.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-cream/55 font-light">{event.loc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}

              {visibleCount < eventList.length && (
                <button
                  onClick={handleLoadMore}
                  className="mt-8 inline-flex items-center gap-2 px-7 py-2.5 rounded-full border border-cream/30 hover:border-cream hover:bg-cream hover:text-ink text-sm font-medium text-cream transition-all duration-300 group"
                >
                  {isIndonesian ? "Lihat Lainnya" : "Load More Events"} <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Events;