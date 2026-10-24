import React, { useEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;      // wrapper classes (positioning, radius, etc.)
  imgClassName?: string;   // classes for the <img>
  delay?: number;
  loading?: 'lazy' | 'eager';
  /** how much of the image must be on screen before it unveils (0 = any pixel) */
  threshold?: number;
}

// Editorial image reveal (noho-style): as it scrolls into view the image wipes
// up from behind a clip mask while a subtle zoom settles. Respects reduced motion.
export const ImageReveal: React.FC<ImageRevealProps> = ({ src, alt, className = '', imgClassName = '', delay = 0, loading = 'lazy', threshold = 0.12 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const [near, setNear] = useState(loading === 'eager');
  const [loaded, setLoaded] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduce) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setInView(true); obs.unobserve(e.target); } });
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduce, threshold]);

  // Start downloading well before the photo scrolls in (~1.5 screens ahead). The
  // browser's own loading="lazy" decides "near" very differently per browser — iOS
  // Safari waits until it's almost on screen — so we do it ourselves, the same everywhere.
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); obs.disconnect(); }
    }, { rootMargin: '150% 0px 150% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [near]);

  // the image may already be cached (complete) before React attaches onLoad
  useEffect(() => {
    const img = imgRef.current;
    if (near && img && img.complete && img.naturalWidth) setLoaded(true);
  }, [near]);

  // Only unveil once the photo is actually there — otherwise the reveal plays over
  // an empty tile and the photo pops in afterwards. If it's slow, it simply waits.
  const shown = inView && loaded;

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={near ? src : undefined}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={imgClassName}
        style={reduce ? undefined : {
          clipPath: shown ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          transform: shown ? 'scale(1)' : 'scale(1.14)',
          transition: `clip-path 1.1s ${EASE} ${delay}ms, transform 1.5s ${EASE} ${delay}ms`,
          willChange: 'clip-path, transform',
        }}
      />
    </div>
  );
};

export default ImageReveal;
