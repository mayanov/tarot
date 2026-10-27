import React, { useEffect, useRef, useState } from 'react';
import FadeIn from '../UI/FadeIn';
import MaskReveal from '../UI/MaskReveal';
import WordReveal from '../UI/WordReveal';
import CountUp from '../UI/CountUp';
import CelestialMark from '../UI/CelestialMark';
import SoftAura from '../UI/SoftAura';
import { trackEvent } from '../../services/analytics';
import { REVEAL_FLIGHT_MS } from '../Layout/Loader';

interface AboutProps {
  isIndonesian?: boolean;
}


const About: React.FC<AboutProps> = ({ isIndonesian = false }) => {
  useEffect(() => {
    // a section view, not a product — kept out of the booking funnel's item reports
    trackEvent(
      'view_section',
      { section: 'About Me', market: isIndonesian ? 'ID' : 'Global' },
      'ViewContent',
      { content_name: 'About Me', content_category: isIndonesian ? 'ID' : 'Global' }
    );
  }, [isIndonesian]);

  // The sheet's rounded top peeks over the bottom of the hero. Keep it tucked just
  // below the screen while the loader hands off, then let it rise into place once
  // the moon and title have landed — so it arrives as its own beat, not a pop.
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRisen(true); return; }
    let t: number | undefined;
    const rise = () => { t = window.setTimeout(() => setRisen(true), REVEAL_FLIGHT_MS + 250); };
    window.addEventListener('mt:reveal', rise, { once: true });
    const fallback = window.setTimeout(() => setRisen(true), 6000);
    return () => { window.removeEventListener('mt:reveal', rise); if (t) clearTimeout(t); clearTimeout(fallback); };
  }, []);

  // The portrait starts face-down (a tarot card back) and turns over to the photo once
  // the sheet has risen, the photo has loaded and a good part of it is on screen — the
  // first card "drawn" on the page.
  const PORTRAIT = `${import.meta.env.BASE_URL}bio image/WhatsApp Image 2026-01-20 at 16.21.09.jpeg`;
  const imgRef = useRef<HTMLImageElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const [imgReady, setImgReady] = useState(false);
  const [inView, setInView] = useState(false); // enough of the portrait is on screen to watch it turn
  const [turned, setTurned] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { if (imgRef.current?.complete) setImgReady(true); }, []);
  useEffect(() => {
    const el = portraitRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setInView(true);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!risen || !imgReady || !inView) return;
    const t = window.setTimeout(() => setTurned(true), reduce ? 0 : 150);
    return () => clearTimeout(t);
  }, [risen, imgReady, inView, reduce]);

  return (
    <section
      id="about"
      style={{
        transform: risen ? 'none' : 'translateY(6rem)',
        transition: 'transform 1100ms cubic-bezier(0.16,1,0.3,1)',
      }}
      className="bg-paper relative z-10 isolate overflow-hidden text-ink lg:min-h-[72vh] -mt-[2.75rem] lg:-mt-[4.5rem] rounded-t-[2.75rem] lg:rounded-t-[4.5rem] shadow-[0_-30px_70px_-22px_rgba(6,4,20,0.55)]">
      <SoftAura />
      {/* portrait — top on mobile, bleeds to the right viewport edge on desktop; soft
          organic radius on the edges that face the content (arch-like, wellness feel) */}
      <div ref={portraitRef} className="relative lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[47%] min-h-[62vh] lg:min-h-0 overflow-hidden rounded-b-[2.75rem] lg:rounded-b-none lg:rounded-l-[4.5rem]">
        <div className="absolute inset-0 [perspective:2400px]">
          <div
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{
              transform: turned ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              transition: reduce ? 'none' : 'transform 1300ms cubic-bezier(0.65,0,0.25,1)',
            }}
          >
            {/* front — the photo */}
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <img
                ref={imgRef}
                src={PORTRAIT}
                alt="Mayanov"
                // lazy so this large photo doesn't hold up the page's load event (the
                // loader waits on it); it sits just below the fold, so it still loads at once
                loading="lazy"
                decoding="async"
                onLoad={() => setImgReady(true)}
                className="w-full h-full object-cover object-top"
              />
              {/* flat plum tint (no directional gradient) to cohere with the palette */}
              <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(42,24,57,0.14)' }} />
            </div>
            {/* back — a tarot card back, shown until the portrait turns over */}
            <div
              aria-hidden
              className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] grid place-items-center"
              style={{ background: 'radial-gradient(120% 90% at 50% 10%, #3a2558 0%, #241638 55%, #150c24 100%)' }}
            >
              <div className="absolute inset-4 lg:inset-6 rounded-[2rem] ring-1 ring-[#C9B8E8]/25" />
              <div className="absolute inset-7 lg:inset-10 rounded-[1.6rem] ring-1 ring-[#C9B8E8]/10" />
              <div className="flex flex-col items-center gap-4 text-[#C9B8E8]/80">
                <CelestialMark name="crescent" className="w-20 lg:w-24" />
                <span className="font-elegant italic text-xs tracking-[0.36em] uppercase text-[#C9B8E8]/55">Mayanov</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* text — inside the page container, held to the left so the portrait can bleed right */}
      <div className="relative mx-auto px-8 lg:min-h-[72vh] flex items-center">
        <div className="w-full lg:w-[53%] lg:pr-14 py-20 md:py-28">
          {/* hook title */}
          <h2 className="font-elegant font-semibold text-ink text-[2.4rem] sm:text-[3.1rem] lg:text-[3.7rem] leading-[1.02] tracking-[-0.03em]">
            <MaskReveal>
              {isIndonesian ? 'Perkenalkan, saya Mayanov' : 'Meet Mayanov'}
            </MaskReveal>
          </h2>

          {/* the story — each paragraph sharpens into focus, one after another */}
          <div className="mt-7 md:mt-9 space-y-5">
            <FadeIn dir="blur" delay={0} distance={0.5}>
              <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:font-elegant first-letter:font-semibold first-letter:text-ink first-letter:text-[3.4rem] first-letter:leading-[0.72]">
                {isIndonesian
                  ? 'Saya sudah membaca kartu Tarot sejak 2009 — lebih dari 15 tahun menjadikannya ruang untuk refleksi diri. Pada dasarnya, Tarot bekerja dengan membaca energi: gambaran dari situasi dan perasaan yang sedang kamu bawa saat ini.'
                  : 'I’ve been reading Tarot since 2009 — over 15 years using it as a space for self-reflection. At its core, Tarot works by reading energy: a snapshot of the situation and feelings you’re carrying right now.'}
              </p>
            </FadeIn>
            <FadeIn dir="blur" delay={140} distance={0.5}>
              <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light">
                {isIndonesian
                  ? 'Dari situ kita lihat pola yang mungkin belum kamu sadari — soal karier, hubungan, keuangan, keluarga, atau keputusan besar — lalu menerjemahkannya jadi langkah yang jelas dan bisa kamu ambil.'
                  : 'From there we spot patterns you might not have noticed — around career, relationships, finances, family, or a big decision — and turn them into clear steps you can actually take.'}
              </p>
            </FadeIn>
            <FadeIn dir="blur" delay={280} distance={0.5}>
              <p className="text-[15px] md:text-base leading-[1.8] text-ink/60 font-light">
                {isIndonesian
                  ? 'Jadi ini bukan soal ‘menerawang’ masa depan, melainkan sesi konsultasi yang jujur dan menenangkan — bukan untuk menakuti, tapi untuk memberi arah.'
                  : 'So it isn’t about ‘predicting’ the future — it’s an honest, grounding consultation, not to frighten you but to give you direction.'}
              </p>
            </FadeIn>
          </div>

          {/* goal — a flush-left closing statement (aligned with the title), with
              a decorative quote mark above and a signature, so it stays designed */}
          <figure className="relative mt-10 md:mt-12">
            <span aria-hidden className="block font-serif text-moon/30 text-[4rem] leading-[0.4] h-7 select-none">”</span>
            <blockquote className="font-elegant text-ink text-[1.5rem] md:text-[1.9rem] leading-[1.24] tracking-[-0.02em]">
              {/* arrives word by word */}
              <WordReveal
                text={isIndonesian
                  ? 'Tujuan saya simpel: memberikan kejelasan agar kamu bisa mengambil keputusan dengan percaya diri.'
                  : 'My goal is simple: to give you the clarity to make decisions with confidence.'}
              />
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5 font-elegant italic text-[1.05rem] tracking-[0.01em] text-moon">
              <span aria-hidden className="h-px w-6 bg-moon/60" /> Mayanov
            </figcaption>
          </figure>

          {/* quiet credentials — a calm 3-up proof row (big serif numbers that count up), not a KPI bar */}
          <div className="mt-10 md:mt-12 pt-8 border-t border-ink/10 grid grid-cols-3 gap-x-5 sm:gap-x-8">
            {[
              { n: isIndonesian ? '7.700+' : '7,700+', l: isIndonesian ? 'sesi tarot' : 'readings' },
              { n: isIndonesian ? '1.500+' : '1,500+', l: isIndonesian ? 'orang terbantu' : 'people guided' },
              { n: '5.0', l: isIndonesian ? 'rating Google' : 'on Google' },
            ].map((s, i) => (
              <div key={i} className={i > 0 ? 'pl-5 sm:pl-8 border-l border-ink/10' : undefined}>
                <div className="font-elegant font-semibold text-moon text-[1.9rem] md:text-[2.4rem] leading-none tracking-[-0.02em]"><CountUp value={s.n} duration={1400 + i * 200} /></div>
                <div className="mt-2.5 text-ink/50 font-normal text-[13px] md:text-sm leading-snug">{s.l}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
