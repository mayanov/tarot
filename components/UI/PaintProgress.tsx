import React from 'react';
import { PaintSwatch } from './ButtonInk';

/**
 * Progress on the paper, a touch cleaner than a drawing: a pale band of paint, filled
 * from the left with the brand purple as far as you've got: a flat patch of paint (PaintSwatch: its edge only frays a little, the
 * paper's tooth showing through), so it reads at a glance like a progress bar.
 */
const PaintProgress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const pct = Math.max(0.06, Math.min(1, value)) * 100;
  return (
    <div className={`relative isolate h-2.5 ${className}`}>
      {/* the whole length laid in first, a pale wash of the same purple */}
      <PaintSwatch className="text-moon opacity-[0.12]" />
      <div className="absolute inset-y-0 left-0 isolate transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }}>
        <PaintSwatch className="text-moon" />
      </div>
    </div>
  );
};

export default PaintProgress;
