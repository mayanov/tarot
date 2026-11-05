import React, { useId, useMemo } from 'react';

// Stars painted on, not rendered: flecks of white gouache flicked off a brush over the
// wash (a few loose clusters where the flick landed, the rest scattered), each drop a
// little out of round with a rough edge, plus a handful of hand-drawn four-point stars
// like the logo's. One static SVG (drawn once, no per-star animation), so it reads as
// part of the painting instead of a screen effect.
//   seed     – its own pattern per sky
//   flecks   – how many drops
//   sparkles – how many drawn stars
//   yMax     – keep them above this fraction of the height (the darker upper sky)

const W = 1600, H = 1000;
const STAR = 'M0,-1 C0.07,-0.32 0.28,-0.08 1,0 C0.3,0.07 0.08,0.3 0,1 C-0.06,0.28 -0.32,0.09 -1,0 C-0.3,-0.06 -0.08,-0.29 0,-1 Z';

const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const PaintedStars: React.FC<{ seed?: number; flecks?: number; sparkles?: number; yMax?: number; className?: string; style?: React.CSSProperties }> = ({
  seed = 7, flecks = 140, sparkles = 6, yMax = 1, className = '', style,
}) => {
  const id = `ps${useId().replace(/:/g, '')}`;
  const { drops, stars } = useMemo(() => {
    const r = mulberry32(seed);
    const gauss = () => (r() + r() + r() - 1.5) / 1.5; // roughly −1…1, bunched at 0
    const top = H * yMax;
    // where the flicks landed
    const clusters = Array.from({ length: 5 }, () => [80 + r() * (W - 160), 40 + r() * (top - 80)]);
    const drops = Array.from({ length: flecks }, (_, i) => {
      const inCluster = r() < 0.55;
      const [cx, cy] = clusters[i % clusters.length];
      const x = inCluster ? cx + gauss() * 170 : r() * W;
      const y = inCluster ? cy + gauss() * 90 : r() * top;
      // most drops tiny, a few fat ones
      const big = r() < 0.08;
      const rad = big ? 2.8 + r() * 2 : 0.9 + r() * r() * 1.9;
      return {
        x: +x.toFixed(1), y: +Math.min(y, top).toFixed(1),
        rx: +rad.toFixed(2), ry: +(rad * (0.7 + r() * 0.3)).toFixed(2),
        rot: Math.round(r() * 180), o: +(0.35 + r() * 0.55).toFixed(2),
      };
    });
    const stars = Array.from({ length: sparkles }, () => ({
      x: +(60 + r() * (W - 120)).toFixed(1), y: +(30 + r() * (top * 0.8)).toFixed(1),
      s: +(5 + r() * 7).toFixed(1), rot: Math.round(-12 + r() * 24), o: +(0.6 + r() * 0.3).toFixed(2),
    }));
    return { drops, stars };
  }, [seed, flecks, sparkles, yMax]);

  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={`pointer-events-none ${className}`} style={style}>
      <defs>
        {/* a rough, slightly soaked edge on every drop */}
        <filter id={id} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.4" result="core" />
          {/* the paint bleeding a little into the damp wash round each drop */}
          <feGaussianBlur in="d" stdDeviation="3" result="bleed" />
          <feComponentTransfer in="bleed" result="halo"><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
          <feMerge><feMergeNode in="halo" /><feMergeNode in="core" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="#F8F2FF">
        {drops.map((d, i) => (
          <ellipse key={i} cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} opacity={d.o} transform={`rotate(${d.rot} ${d.x} ${d.y})`} />
        ))}
        {stars.map((s, i) => (
          <path key={`s${i}`} d={STAR} opacity={s.o} transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${s.s})`} />
        ))}
      </g>
    </svg>
  );
};

export default PaintedStars;
