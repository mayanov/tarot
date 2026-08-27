import React, { useEffect, useRef, useState } from 'react';
import { FadeInProps } from '../../types';

type Dir = 'up' | 'left' | 'right' | 'none';

interface Props extends FadeInProps {
  dir?: Dir;
}

const HIDDEN: Record<Dir, string> = {
  up: 'translate3d(0, 46px, 0) scale(0.985)',
  left: 'translate3d(-56px, 0, 0)',
  right: 'translate3d(56px, 0, 0)',
  none: 'scale(0.985)',
};

// Reveal-on-scroll: content rises (or slides) into place with a soft spring once
// it enters the viewport. `dir` varies the entrance; `delay` staggers siblings.
const FadeIn: React.FC<Props> = ({ children, delay = 0, className = '', dir = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : HIDDEN[dir],
        transition: `opacity 0.9s ease ${delay}ms, transform 1.05s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
