import React, { useEffect, useRef } from 'react';

const clamp = (n: number, a = 0, b = 1) => Math.min(Math.max(n, a), b);

interface Props {
  text: string;
  /** word to accent (matched ignoring case/punctuation) */
  emphasize?: string;
  className?: string;
  emphasizeClassName?: string;
  /** resting (un-lit) opacity for words not yet reached */
  baseOpacity?: number;
}

// "Core-vision" reveal: the statement starts dim and each word lights up (opacity
// + defocus) one after another as the block scrolls through the viewport. It is
// scrubbed to scroll position, so it is always visibly animating — scroll up and
// the words dim again. Respects prefers-reduced-motion.
const IlluminateText: React.FC<Props> = ({
  text,
  emphasize,
  className = '',
  emphasizeClassName = '',
  baseOpacity = 0.15,
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll('[data-w]')) as HTMLElement[];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => { s.style.opacity = '1'; s.style.filter = 'none'; });
      return;
    }
    const N = spans.length;
    const spread = 5; // how many words are mid-transition at once (soft edge)
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top sits low in the viewport, 1 once it has risen past
      // the upper third — the window in which the words illuminate.
      const p = clamp((vh * 0.82 - r.top) / (vh * 0.82 - vh * 0.3));
      const reveal = p * (N + spread);
      for (let i = 0; i < N; i++) {
        const o = clamp((reveal - i) / spread);
        spans[i].style.opacity = (baseOpacity + (1 - baseOpacity) * o).toFixed(3);
        spans[i].style.filter = o < 1 ? `blur(${((1 - o) * 2.4).toFixed(2)}px)` : 'none';
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [text, baseOpacity]);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const bare = w.replace(/[^\p{L}]/gu, '').toLowerCase();
        const isEm = !!emphasize && bare === emphasize.toLowerCase();
        return (
          <React.Fragment key={i}>
            <span
              data-w
              className={`inline-block ${isEm ? emphasizeClassName : ''}`}
              style={{
                opacity: baseOpacity,
                transition: 'opacity 0.25s ease-out, filter 0.25s ease-out',
                willChange: 'opacity, filter',
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </p>
  );
};

export default IlluminateText;
