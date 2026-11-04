import React, { useEffect, useRef } from 'react';
import { PAGE_SECTIONS, trackSectionView } from '../../services/analytics';

/**
 * How far down the page people get: each section counts once per page load when its
 * top reaches the lower part of the screen (40% up from the bottom), and "end" when
 * the page is scrolled to the bottom. Sections that load later (lazy) are picked up as
 * they appear. After a site-version switch it starts again for the new version, once the
 * page has scrolled back to the top (so the sections passed on the way aren't counted).
 * Renders nothing.
 */
const SectionTracker: React.FC<{ isIndonesian: boolean }> = ({ isIndonesian }) => {
  const first = useRef(true);
  useEffect(() => {
    const delay = first.current ? 0 : 1500;
    first.current = false;
    const market = isIndonesian ? 'ID' : 'Global';
    const seen = new Set<string>();
    const watched = new Set<string>();
    const see = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      trackSectionView(id, market);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        see(e.target.id);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -40% 0px' });
    const ids = PAGE_SECTIONS.map(([id]) => id).filter((id) => id !== 'end');
    const attach = () => {
      ids.forEach((id) => {
        if (watched.has(id)) return;
        const el = document.getElementById(id);
        if (el) { watched.add(id); io.observe(el); }
      });
    };
    let poll = 0;
    let stopPoll = 0;
    const start = window.setTimeout(() => {
      attach();
      // lazy sections mount later; look again for a while
      poll = window.setInterval(() => { attach(); if (watched.size === ids.length) window.clearInterval(poll); }, 1000);
      stopPoll = window.setTimeout(() => window.clearInterval(poll), 60000);
      window.addEventListener('scroll', onScroll, { passive: true });
    }, delay);
    const onScroll = () => {
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 40) {
        see('end');
        window.removeEventListener('scroll', onScroll);
      }
    };
    return () => {
      window.clearTimeout(start);
      io.disconnect();
      window.clearInterval(poll);
      window.clearTimeout(stopPoll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isIndonesian]);
  return null;
};

export default SectionTracker;
