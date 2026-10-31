import React, { useState, useEffect } from 'react';
import { fetchEvents, FALLBACK_EVENTS, EventItem } from '../../services/events';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import EventGallery from './EventGallery';
import { ChevronDown, X } from 'lucide-react';
import { smoothScrollToId } from '../UI/scroll';
import { btnPrimaryLight, btnSecondaryLight } from '../UI/buttons';

interface EventsProps {
  isIndonesian?: boolean;
}

const EVENT_PHOTOS = ['/event-1.jpeg', '/event-2.jpeg', '/event-3.jpeg', '/event-4.jpeg'];

const Events: React.FC<EventsProps> = ({ isIndonesian = false }) => {
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // The list is managed from the admin dashboard (Events) and comes newest-first from
  // the API; the built-in list shows instantly and stays if the API can't be reached.
  const [eventList, setEventList] = useState<EventItem[]>(FALLBACK_EVENTS);
  useEffect(() => {
    let cancelled = false;
    fetchEvents()
      .then((list) => { if (!cancelled && list.length) setEventList(list); })
      .catch(() => { /* keep the built-in list */ });
    return () => { cancelled = true; };
  }, []);

  // Collapsed view shows only the three most recent years, so no year is cut off mid-list
  const recentYears = [...new Set(eventList.map((ev) => ev.year))].slice(0, 3);
  const displayedEvents = showAll ? eventList : eventList.filter((ev) => recentYears.includes(ev.year));

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
      // clip sideways only, so a card lifting on hover isn't cut off at the top
      className="relative overflow-x-clip isolate"
    >
      {/* photo band — a staggered row of four (2×2 on phones) */}
      <EventGallery photos={EVENT_PHOTOS} isIndonesian={isIndonesian} onOpen={setLightbox} />

      {/* events history + CTAs — on the paper ground below the purple block */}
      <div className="mx-auto px-8 pt-10 md:pt-14 pb-10 md:pb-12 relative z-10 text-ink">
          {/* HEADER — now leads its own explanation on the paper ground, so the
              title and the event list read as one unit instead of the title being
              marooned up in the purple band */}
          <FadeIn>
            <div className="mb-6 md:mb-8 max-w-3xl">
              <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[1.02] tracking-[-0.025em]">
                <MaskReveal>{isIndonesian ? "Event & collaboration" : "Community & events"}</MaskReveal>
              </h2>
            </div>
          </FadeIn>
          {/* HISTORY — editorial year-grouped list: lilac year markers, hairline lines */}
          <div>
            {timeline.map((grp, gi) => (
              <FadeIn key={grp.year + gi} delay={Math.min(gi, 6) * 70} dir="up" distance={0.7}>
                <div className="grid md:grid-cols-[7rem_1fr] gap-y-3 md:gap-x-12 md:items-start border-t border-ink/10 pt-4 md:pt-5 pb-4 md:pb-5">
                  {/* year marker */}
                  <div className="font-elegant italic text-moon text-2xl md:text-[1.9rem] leading-none tracking-tight md:pt-1.5">
                    {grp.year}
                  </div>
                  {/* that year's events */}
                  <ul>
                    {grp.items.map((event, ii) => (
                      <li
                        key={event.id || ii}
                        className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-0.5 py-2 border-t border-ink/10 first:border-t-0 first:pt-0"
                      >
                        <h3 className="font-serif font-medium text-ink text-sm md:text-base leading-[1.25] transition-colors duration-500 group-hover:text-moon">
                          {event.title}
                        </h3>
                        <span className="shrink-0 text-[0.8rem] md:text-[0.85rem] tracking-[0.01em] text-moon font-medium leading-snug sm:text-right">
                          {event.loc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-3">
            {(() => {
              const expanded = showAll;
              return (
                <button
                  onClick={() => {
                    if (expanded) {
                      setShowAll(false);
                      // keep the viewer anchored to this section after it collapses
                      setTimeout(() => smoothScrollToId('events', 90), 60);
                    } else {
                      setShowAll(true);
                    }
                  }}
                  className={`${btnSecondaryLight} inline-flex group gap-2 min-w-[11rem] px-7 py-3 text-sm`}
                >
                  {expanded ? (isIndonesian ? "Sembunyikan" : "Show less") : (isIndonesian ? "Lihat Semua" : "View All")}
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                </button>
              );
            })()}
            {/* collab invite — Indonesian version only */}
            {isIndonesian && (
              <a
                href="https://wa.link/5peyhb"
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnPrimaryLight} inline-flex px-7 py-3 text-sm`}
              >
                Yuk Collab
              </a>
            )}
          </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8 bg-ink/80 backdrop-blur-sm animate-[fade-up_0.2s_ease-out]"
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