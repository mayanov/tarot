import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
import { ImageReveal } from '../UI/Reveal';
import { ChevronDown, X } from 'lucide-react';

interface EventsProps {
  isIndonesian?: boolean;
}

const EVENT_PHOTOS = ['/event-1.jpeg', '/event-2.jpeg', '/event-3.jpeg', '/event-4.jpeg'];

const Events: React.FC<EventsProps> = ({ isIndonesian = false }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [lightbox, setLightbox] = useState<string | null>(null);

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

  // Group the shown events by year (list is already newest-first) for the timeline
  const timeline: { year: string; items: typeof eventList }[] = [];
  displayedEvents.forEach((ev) => {
    const last = timeline[timeline.length - 1];
    if (last && last.year === ev.year) last.items.push(ev);
    else timeline.push({ year: ev.year, items: [ev] });
  });


  return (
    <section
      id="events"
      className="py-12 md:py-16 relative overflow-hidden isolate"
    >
      {/* light periwinkle-blue — keeps the blue identity but reads bright, not dark */}
      <div className="absolute inset-0" style={{ background: '#E7EAFA' }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 85% 0%, rgba(32,42,92,0.06) 0%, transparent 55%)' }}
      />
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 relative z-10 text-ink">
          <FadeIn>
            {/* HEADER — centered title */}
            <div className="mb-10 md:mb-14 text-center">
              <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                {isIndonesian ? "Event & collaboration" : "Community & events"}
              </h2>
            </div>

            {/* PHOTO GALLERY — a few moments from past events */}
            <div className="mb-10 md:mb-14">
              <span className="block text-[0.66rem] uppercase tracking-[0.22em] text-ink/55 mb-4">
                {isIndonesian ? "Momen dari beberapa event" : "Moments from past events"}
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {EVENT_PHOTOS.map((src, i) => (
                  <FadeIn key={src} delay={i * 60} dir="up">
                    <button
                      type="button"
                      onClick={() => setLightbox(src)}
                      className="group relative block w-full overflow-hidden rounded-lg aspect-[3/4] bg-black/5"
                      aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
                    >
                      <ImageReveal
                        src={src}
                        alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                        className="absolute inset-0"
                        imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        delay={i * 90}
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 group-hover:ring-ink/40 transition-all" />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* TIMELINE — a dark-blue spine with a node per year; events branch off it */}
            <div className="relative pl-7 md:pl-10">
              {/* the spine */}
              <span
                aria-hidden
                className="absolute left-[3px] md:left-[5px] top-2 bottom-2 w-px"
                style={{ background: 'linear-gradient(180deg, rgba(32,42,92,0.55) 0%, rgba(32,42,92,0.28) 55%, rgba(32,42,92,0) 100%)' }}
              />
              {timeline.map((grp, gi) => (
                <FadeIn key={grp.year + gi} delay={Math.min(gi, 6) * 60} dir="up">
                  <div className="relative pb-9 md:pb-11 last:pb-0">
                    {/* node */}
                    <span aria-hidden className="absolute -left-[26px] md:-left-[34px] top-1.5 grid place-items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#202A5C] shadow-[0_0_12px_1px_rgba(32,42,92,0.35)] ring-4 ring-[#E7EAFA]" />
                    </span>
                    {/* year */}
                    <div className="font-elegant font-semibold text-[#202A5C] text-2xl md:text-3xl leading-none tracking-tight mb-4">
                      {grp.year}
                    </div>
                    {/* that year's events */}
                    <ul>
                      {grp.items.map((event, ii) => (
                        <li
                          key={ii}
                          className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-0.5 py-2.5 border-t border-[#202A5C]/12 first:border-t-0"
                        >
                          <h3 className="font-serif font-semibold uppercase text-ink text-sm md:text-base xl:text-lg leading-[1.2] tracking-[-0.005em] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#202A5C]">
                            {event.title}
                          </h3>
                          <span className="shrink-0 text-[0.66rem] uppercase tracking-[0.14em] text-ink/50 font-light leading-snug sm:text-right">
                            {event.loc}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {visibleCount < eventList.length && (
                <button
                  onClick={() => setVisibleCount(eventList.length)}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-lg border border-ink/25 hover:border-ink hover:bg-ink hover:text-cream text-sm font-medium text-ink transition-all duration-300 group"
                >
                  {isIndonesian ? "Lihat Semua" : "View All"} <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}
              <a
                href="https://wa.link/5peyhb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-7 py-2.5 rounded-lg bg-[#202A5C] text-cream hover:bg-[#28346E] text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-[0_16px_36px_-20px_rgba(32,42,92,0.6)]"
              >
                {isIndonesian ? "Yuk Collab" : "Collaborate with me"}
              </a>
            </div>
          </FadeIn>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm animate-[fade-up_0.2s_ease-out]"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 grid place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
};

export default Events;