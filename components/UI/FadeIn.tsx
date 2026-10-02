import React, { useEffect, useRef, useState } from 'react';
import { FadeInProps } from '../../types';

type Dir = 'up' | 'down' | 'left' | 'right' | 'none' | 'blur' | 'scale' | 'zoom';

interface Props extends FadeInProps {
  dir?: Dir;
  /** travel distance multiplier (1 = default) */
  distance?: number;
  /** override the transform transition duration (seconds) */
  duration?: number;
}

// Each variant describes its hidden-state transform + whether it defocuses, so the
// same observer can drive very different entrances across the site.
const VARIANT: Record<Dir, { t: string; blur?: number }> = {
  up: { t: 'translate3d(0, 46px, 0) scale(0.985)' },
  down: { t: 'translate3d(0, -42px, 0)' },
  left: { t: 'translate3d(-60px, 0, 0)' },
  right: { t: 'translate3d(60px, 0, 0)' },
  none: { t: 'scale(0.985)' },
  blur: { t: 'translate3d(0, 24px, 0)', blur: 10 },
  scale: { t: 'scale(0.9)', blur: 2 },
  zoom: { t: 'scale(1.06)' },
};

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Reveal-on-scroll: content enters with a soft spring once it hits the viewport.
// `dir` picks the motion (rise / slide / blur-focus / zoom); `delay` staggers
// siblings; `distance` scales the travel. Respects prefers-reduced-motion.
const FadeIn: React.FC<Props> = ({ children, delay = 0, className = '', dir = 'up', distance = 1, duration = 1.05 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setIsVisible(true); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    const el = domRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  const v = VARIANT[dir];
  // scale the translate distance when requested (leaves scale()-only variants alone)
  const hidden = distance !== 1 && v.t.startsWith('translate3d')
    ? v.t.replace(/-?\d+(\.\d+)?px/g, (m) => `${(parseFloat(m) * distance).toFixed(0)}px`)
    : v.t;

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : hidden,
        filter: v.blur ? (isVisible ? 'blur(0px)' : `blur(${v.blur}px)`) : undefined,
        transition:
          `opacity ${(duration * 0.85).toFixed(2)}s ease ${delay}ms, transform ${duration}s ${EASE} ${delay}ms` +
          (v.blur ? `, filter ${(duration * 0.8).toFixed(2)}s ease ${delay}ms` : ''),
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
