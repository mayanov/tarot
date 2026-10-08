import React, { useState } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import { ImageReveal } from '../UI/Reveal';
import { ChevronDown, X } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';

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
      className="py-12 relative overflow-hidden isolate"
    >
      {/* aurora sky background — zoomed toward the top so the horizon/ground is cropped out (sky only) */}
      <div
        data-parallax="0.07"
        data-parallax-scale="1.16"
        className="absolute inset-0 will-change-transform"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}aurora-sky.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center 28%', transform: 'scale(1.16)', transformOrigin: 'center' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(6,10,16,0.42) 0%, rgba(6,10,16,0.3) 45%, rgba(6,10,16,0.72) 100%)' }}
      />
      <div className="mx-auto px-8 relative z-10 text-cream">
          <FadeIn>
            {/* HEADER — left-aligned editorial title */}
            <div className="mb-10 md:mb-14 max-w-3xl">
              <h2 className="font-elegant font-semibold text-cream text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                <MaskReveal>{isIndonesian ? "Event & collaboration" : "Community & events"}</MaskReveal>
              </h2>
            </div>

            {/* PHOTO GALLERY — an even, calm grid of moments */}
            <div className="mb-10 md:mb-14">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {EVENT_PHOTOS.map((src, i) => (
                  <FadeIn key={src} delay={i * 90} dir={i % 2 === 0 ? 'up' : 'down'} distance={0.8}>
                    <button
                      type="button"
                      onClick={() => setLightbox(src)}
                      className="group relative block w-full overflow-hidden rounded-[1.5rem] aspect-[3/4] bg-white/5"
                      aria-label={isIndonesian ? `Lihat foto event ${i + 1}` : `View event photo ${i + 1}`}
                    >
                      <ImageReveal
                        src={src}
                        alt={isIndonesian ? `Sesi tarot Mayanov di event ${i + 1}` : `Mayanov tarot session at event ${i + 1}`}
                        className="absolute inset-0"
                        imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        delay={i * 90}
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15 group-hover:ring-cream/50 transition-all" />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* TIMELINE — on its own white panel (a different background from the
                aurora section) so the list reads clearly */}
            <div className="rounded-2xl bg-[#FAF6EF] text-ink p-6 md:p-9 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.6)]">
              <div className="relative pl-7 md:pl-10">
                {/* the spine */}
                <span
                  aria-hidden
                  className="absolute left-[3px] md:left-[5px] top-2 bottom-2 w-px"
                  style={{ background: 'linear-gradient(180deg, rgba(122,127,209,0.9) 0%, rgba(122,127,209,0.45) 55%, rgba(122,127,209,0) 100%)' }}
                />
                {timeline.map((grp, gi) => (
                  <FadeIn key={grp.year + gi} delay={Math.min(gi, 6) * 70} dir="left" distance={0.7}>
                    <div className="relative pb-9 md:pb-11 last:pb-0">
                      {/* node */}
                      <span aria-hidden className="absolute -left-[26px] md:-left-[34px] top-1.5 grid place-items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky shadow-[0_0_12px_1px_rgba(122,127,209,0.4)] ring-4 ring-white" />
                      </span>
                      {/* year */}
                      <div className="font-elegant font-semibold text-sky text-2xl md:text-3xl leading-none tracking-tight mb-4">
                        {grp.year}
                      </div>
                      {/* that year's events */}
                      <ul>
                        {grp.items.map((event, ii) => (
                          <li
                            key={ii}
                            className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-0.5 py-2.5 border-t border-black/10 first:border-t-0"
                          >
                            <h3 className="font-serif font-semibold text-ink text-sm md:text-base xl:text-lg leading-[1.2] tracking-[-0.005em] transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#39234E]">
                              {event.title}
                            </h3>
                            <span className="shrink-0 text-[0.78rem] tracking-[0.01em] text-ink/60 font-light leading-snug sm:text-right">
                              {event.loc}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {(() => {
                const expanded = visibleCount >= eventList.length;
                return (
                  <button
                    onClick={() => {
                      if (expanded) {
                        setVisibleCount(10);
                        // keep the viewer anchored to this section after it collapses
                        setTimeout(() => smoothScrollToId('events', 90), 60);
                      } else {
                        setVisibleCount(eventList.length);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 min-w-[11rem] px-7 py-3 rounded-full border border-cream/35 text-cream text-sm font-medium hover:bg-cream hover:text-ink transition-colors duration-300 group"
                  >
                    {expanded ? (isIndonesian ? "Sembunyikan" : "Show less") : (isIndonesian ? "Lihat Semua" : "View All")}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                  </button>
                );
              })()}
              <a
                href="https://wa.link/5peyhb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-cream text-ink text-sm font-medium hover:bg-plum hover:text-cream transition-colors duration-300"
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