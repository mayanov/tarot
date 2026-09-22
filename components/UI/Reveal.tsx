import React, { useEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;      // wrapper classes (positioning, radius, etc.)
  imgClassName?: string;   // classes for the <img>
  delay?: number;
  loading?: 'lazy' | 'eager';
}

// Editorial image reveal (noho-style): as it scrolls into view the image wipes
// up from behind a clip mask while a subtle zoom settles. Respects reduced motion.
export const ImageReveal: React.FC<ImageRevealProps> = ({ src, alt, className = '', imgClassName = '', delay = 0, loading = 'lazy' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setShown(true); obs.unobserve(e.target); } });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={imgClassName}
        style={{
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
