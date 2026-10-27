import React, { useEffect, useRef, useState } from 'react';

// Reveals a sentence word by word once it scrolls into view: each word rises a
// little and sharpens from a soft blur, one after another. Plain text only.
// Respects prefers-reduced-motion (shows the text straight away).
const WordReveal: React.FC<{ text: string; className?: string; step?: number; delay?: number }> = ({ text, className = '', step = 55, delay = 0 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setShown(true);
    }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(' ');
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        // the space stays outside the inline-block so lines can still wrap between words
        <React.Fragment key={i}>
          <span
            aria-hidden
            className="inline-block"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? 'none' : 'translateY(0.35em)',
              filter: shown ? 'blur(0)' : 'blur(6px)',
              transition: 'opacity 700ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1), filter 800ms ease',
              transitionDelay: `${delay + i * step}ms`,
            }}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

export default WordReveal;
