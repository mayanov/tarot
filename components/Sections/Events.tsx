import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
import SectionHeader from '../UI/SectionHeader';
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
      className="py-12 md:py-16 relative overflow-hidden border-y border-line"
      style={{
        background:
          'radial-gradient(56% 50% at 6% 2%, rgba(86,77,77,0.24), rgba(243,237,230,0) 58%), radial-gradient(58% 56% at 96% 102%, rgba(95,129,105,0.30), rgba(243,237,230,0) 60%), linear-gradient(160deg, #E9E8E3 0%, #E5EAE5 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <FadeIn>
          <SectionHeader
            label={isIndonesian ? "Rekam Jejak" : "Track Record"}
            accent="text-sage"
            title={isIndonesian ? "Event & collaboration" : "Community & events"}
            intro={isIndonesian
              ? "Mayanov Tarot siap sedia meramaikan acara kamu!"
              : "From intimate gatherings to corporate events, I love connecting with people offline too."}
          />
          {isIndonesian && (
            <div className="mb-10 -mt-2">
              <a
                href="https://wa.link/5peyhb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-terracotta hover:bg-terracotta-dark text-sm font-medium text-paper transition-all duration-300 shadow-[0_10px_30px_-12px_rgba(193,97,74,0.7)] hover:-translate-y-0.5"
              >
                Yuk Collab
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7 mb-12">
            {displayedEvents.map((event, index) => (
              <div key={index} className="flex gap-4 items-start group border-b border-line pb-5">
                {/* Timeline Dot */}
                <div className="mt-1.5 w-2 h-2 rounded-full bg-line group-hover:bg-sage transition-all duration-300 shrink-0"></div>

                <div>
                  <span className="text-xs font-semibold text-sage mb-1 block tracking-wide">{event.year}</span>
                  <h3 className="text-ink font-serif font-medium text-base leading-snug mb-1 group-hover:text-sage transition-colors duration-200">
                    {event.title}
                  </h3>
                  <p className="text-sm text-taupe font-light">{event.loc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < eventList.length && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-line hover:border-terracotta hover:text-terracotta bg-surface-1 text-sm font-medium text-ink transition-all duration-300 group"
              >
                {isIndonesian ? "Lihat Lainnya" : "Load More Events"} <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

        </FadeIn>
      </div>
    </section>
  );
};

export default Events;