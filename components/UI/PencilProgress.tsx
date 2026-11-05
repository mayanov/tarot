import React from 'react';
import { PencilFrame, PaintSwatch } from './ButtonInk';

/**
 * Progress on the paper, a touch cleaner than a drawing: a long box sketched in pencil,
 * like one on a printed form, filled from the left with the brand purple as far as
 * you've got: a flat patch of paint (PaintSwatch: its edge only frays a little, the
 * paper's tooth showing through), so it reads at a glance like a progress bar.
 */
const PencilProgress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const pct = Math.max(0.06, Math.min(1, value)) * 100;
  return (
    <div className={`relative isolate h-3.5 ${className}`}>
      <PencilFrame className="text-ink/35" />
      <div className="absolute inset-y-[2px] left-[2px] isolate transition-[width] duration-700 ease-out" style={{ width: `calc(${pct}% - 4px)` }}>
        <PaintSwatch className="text-moon" />
      </div>
    </div>
  );
};

export default PencilProgress;
