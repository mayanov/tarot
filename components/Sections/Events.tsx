import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
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
    <section id="events" className="py-20 bg-bg-dark relative overflow-hidden border-t border-white/5">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-lilac/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-serif mb-6">
              {isIndonesian ? "Event & Collaboration" : "Community & Events"}
            </h2>
            <p className="text-text-subtle text-lg max-w-2xl mx-auto">
              {isIndonesian
                ? "Mayanov Tarot siap sedia meramaikan acara kamu!"
                : "From intimate gatherings to corporate events, I love connecting with people offline too."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
            {displayedEvents.map((event, index) => (
              <div key={index} className="flex gap-4 items-start group">
                {/* Timeline Dot */}
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-lilac/30 group-hover:bg-teal-accent group-hover:shadow-[0_0_8px_rgba(129,244,255,0.6)] transition-all duration-300 shrink-0"></div>

                <div>
                  <span className="text-xs font-bold text-teal-accent mb-1 block">{event.year}</span>
                  <h3 className="text-white font-bold text-base leading-tight mb-1 group-hover:text-lilac transition-colors duration-200">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">{event.loc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < eventList.length && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-white/10 hover:border-lilac/50 hover:bg-white/5 text-sm font-bold text-white transition-all duration-300 group shadow-lg"
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