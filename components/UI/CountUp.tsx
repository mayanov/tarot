import React, { useEffect, useRef, useState } from 'react';

// Counts a stat up from 0 the first time it scrolls into view. Takes the display
// string as written ("7.700+", "1,500+", "5.0") and keeps its separator, decimals and
// suffix, so the final frame is exactly that string. Respects prefers-reduced-motion.
const CountUp: React.FC<{ value: string; duration?: number; className?: string }> = ({ value, duration = 1600, className }) => {
  const m = value.match(/^([\d.,]+)(.*)$/);
  const raw = m ? m[1] : '';
  const suffix = m ? m[2] : value;
  // "7.700" / "7,700" = thousands separator; "5.0" = one decimal
  const sep = /^\d{1,3}([.,]\d{3})+$/.test(raw) ? raw.match(/[.,]/)![0] : '';
  const decimals = !sep && raw.includes('.') ? raw.split('.')[1].length : 0;
  const target = sep ? Number(raw.split(sep).join('')) : Number(raw);

  const format = (n: number) => {
    if (decimals) return n.toFixed(decimals);
    const s = String(Math.round(n));
    return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
  };

  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(m ? format(0) + suffix : value);
  useEffect(() => {
    if (!m) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setText(value); return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setText(p < 1 ? format(target * eased) + suffix : value);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={`tabular-nums ${className || ''}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden>{text}</span>
    </span>
  );
};

export default CountUp;
