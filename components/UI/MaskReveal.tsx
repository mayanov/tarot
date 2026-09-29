import React, { useEffect, useRef, useState } from 'react';

interface MaskRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// Editorial "curtain wipe" for headings: the text rises up out from behind a
// clipped edge as it enters view — echoes the loader's aperture reveal.
const MaskReveal: React.FC<MaskRevealProps> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setInView(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // small vertical padding + matching negative margin so descenders/italics
    // aren't clipped by the overflow-hidden mask, without shifting layout.
    <span ref={ref} className={`block overflow-hidden pb-[0.14em] -mb-[0.14em] ${className}`}>
      <span
        className="block"
        style={{
          transform: inView ? 'translateY(0)' : 'translateY(105%)',
          opacity: inView ? 1 : 0,
          transition: `transform 1.05s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.9s ease ${delay}ms`,
          willChange: 'transform',
        }}
      >
        {children}
      </span>
    </span>
  );
};

export default MaskReveal;
