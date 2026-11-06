import React, { useEffect, useId, useState } from 'react';
import { paintsMayStart, trackPaint } from '../UI/introGate';

// Tonight's moon, for the menu: a faint photo moon printed into the paper, lit to the
// real phase. Same terminator as the divider's Phase glyphs (a half disc closed by an
// ellipse), so the two always agree.

const SYNODIC = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export type MoonNow = { p: number; waning: boolean };

export function moonNow(at = Date.now()): MoonNow {
  const age = ((((at - NEW_MOON_REF) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC;
  const angle = (age / SYNODIC) * 2 * Math.PI;
  return {
    p: (1 - Math.cos(angle)) / 2,
    waning: age > SYNODIC / 2,
  };
}

const MOON_IMG = `${import.meta.env.BASE_URL}moon.jpg`;

// the watermark: the whole disc ghosted (earthshine), the lit part a little stronger,
// its edge softened and a touch uneven where the ink took to the paper, and a pencil
// circle drawn round it — multiplied into the paper so it reads as printed, not pasted
export const MoonWatermark: React.FC<{ moon: MoonNow; className?: string; style?: React.CSSProperties }> = ({ moon, className = '', style }) => {
  const id = useId().replace(/:/g, '');
  // the photo is only seen in the menu, which can't open before the intro's over: it's
  // fetched then, not while the page is loading
  const [img, setImg] = useState<string>();
  // fetched behind the loader once the hero is ready (the loader waits for it)
  useEffect(() => {
    let live = true;
    paintsMayStart()
      .then(() => trackPaint(new Promise<void>((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = MOON_IMG; })))
      .then(() => { if (live) setImg(MOON_IMG); });
    return () => { live = false; };
  }, []);
  const r = 98, c = 100;
  const rx = Math.abs(1 - 2 * moon.p) * r;
  const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${moon.p > 0.5 ? 1 : 0} ${c} ${c - r} Z`;
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={`pointer-events-none mix-blend-multiply ${className}`} style={style}>
      <defs>
        <clipPath id={`${id}d`}><circle cx={c} cy={c} r={r} /></clipPath>
        <clipPath id={`${id}l`}>
          {moon.p > 0.985
            ? <circle cx={c} cy={c} r={r} />
            : <path d={lit} transform={moon.waning ? 'translate(200 0) scale(-1 1)' : undefined} />}
        </clipPath>
        {/* the printed disc's edge: not a clean cut, it wavers and blurs a little */}
        <filter id={`${id}e`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.6" />
        </filter>
        {/* a pencil circle: a hand's wobble, the lead skipping over the paper's tooth */}
        <filter id={`${id}p`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="9" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="ga" />
          <feComposite in="d" in2="ga" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}e)`}>
      {img && <image href={img} x={-4} y={-4} width={208} height={208} clipPath={`url(#${id}d)`} opacity={0.035} />}
      {img && <image href={img} x={-4} y={-4} width={208} height={208} clipPath={`url(#${id}l)`} opacity={0.11} />}
      </g>
      <g filter={`url(#${id}p)`} fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx={c} cy={c} r={r} strokeOpacity={0.22} strokeWidth={0.6} />
        {/* where the hand went round a second time, a little off the first */}
        <path d={`M ${c - r * 0.7} ${c - r * 0.73} A ${r + 0.8} ${r + 0.8} 0 0 1 ${c + r + 0.6} ${c + 6}`} strokeOpacity={0.1} strokeWidth={0.45} />
      </g>
    </svg>
  );
};
