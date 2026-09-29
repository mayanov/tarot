import React, { useRef } from 'react';

interface MagneticProps {
  children: React.ReactNode;
  /** how strongly the element follows the cursor (0–1) */
  strength?: number;
  className?: string;
}

// Wraps an element so it gently pulls toward the cursor on hover — a small,
// hand-crafted micro-interaction for primary CTAs. No-ops on touch / reduced
// motion so it never gets in the way.
const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.3, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  const canHover = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !canHover()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-block will-change-transform ${className}`}
      style={{ transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {children}
    </div>
  );
};

export default Magnetic;
