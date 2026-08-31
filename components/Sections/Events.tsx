import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
import GrainyMesh from '../UI/GrainyMesh';
import SectionPanel from '../UI/SectionPanel';
import { ChevronDown } from 'lucide-react';

interface EventsProps {
  isIndonesian?: boolean;
}

const Events: React.FC<EventsProps> = ({ isIndonesian = false }) => {
  const [visibleCount, setVisibleCount] = useState(10);

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
    setVisibleCount(prev => prev + 10);
  };

  return (
    <section
      id="events"
      className="py-10 md:py-16 relative overflow-hidden isolate"
    >
      <SectionPanel>
        <FadeIn>
          {/* HEADER — title on the left, count + CTA on the right */}
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-10 md:mb-14">
            <h2 className="font-serif font-semibold text-ink text-[2.5rem] md:text-[3.4rem] leading-[1.0] tracking-[-0.03em]">
              {isIndonesian ? "Event & collaboration" : "Community & events"}
            </h2>

            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif font-semibold text-5xl md:text-6xl text-ink leading-none tracking-tight">{eventList.length}+</span>
                <span className="text-[0.66rem] uppercase tracking-[0.22em] text-ink/60 leading-snug max-w-[6rem]">
                  {isIndonesian ? "Event sejak 2016" : "Events since 2016"}
                </span>
              </div>
              <a
                href="https://wa.link/5peyhb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-ink text-cream hover:bg-ink-soft text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
              >
                {isIndonesian ? "Yuk Collab" : "Collaborate with me"}
              </a>
            </div>
          </div>

          {/* AWARD-LIST — full-width rows: year · title · venue · arrow */}
          <div className="border-t border-ink/12">
            {displayedEvents.map((event, index) => (
              <FadeIn key={index} delay={Math.min(index, 6) * 40} dir="up">
                <div className="group grid grid-cols-12 items-center gap-x-4 py-2.5 md:py-3 border-b border-ink/12 transition-colors duration-300 hover:bg-ink/[0.04]">
                  {/* year */}
                  <span className="col-span-3 md:col-span-2 font-medium text-[0.62rem] md:text-xs uppercase tracking-[0.18em] text-ink tabular-nums pl-0 md:pl-2">
                    {event.year}
                  </span>
                  {/* title */}
                  <h3 className="col-span-9 md:col-span-7 font-serif font-semibold uppercase text-ink text-sm md:text-base xl:text-lg leading-[1.15] tracking-[-0.005em] transition-transform duration-300 group-hover:translate-x-1.5">
                    {event.title}
                  </h3>
                  {/* venue */}
                  <span className="hidden md:block md:col-span-3 text-[0.66rem] uppercase tracking-[0.14em] text-ink font-light leading-snug">
                    {event.loc}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>

          {visibleCount < eventList.length && (
            <button
              onClick={handleLoadMore}
              className="mt-8 inline-flex items-center gap-2 px-7 py-2.5 rounded-full border border-ink/25 hover:border-ink hover:bg-ink hover:text-cream text-sm font-medium text-ink transition-all duration-300 group"
            >
              {isIndonesian ? "Lihat Lainnya" : "Load More Events"} <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          )}
        </FadeIn>
      </SectionPanel>
    </section>
  );
};

export default Events;