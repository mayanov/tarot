import React, { useEffect, useId, useRef, useState } from 'react';

// A small bubble of finer print: shown while the pointer is over its trigger or the
// trigger has keyboard focus, and on a tap (phones have no hover); a tap elsewhere or
// Escape hides it again.
//
//   <Tooltip text="Compared with 12 Oct – 10 Nov"><span>↑ 12%</span></Tooltip>
export const Tooltip: React.FC<{
    text: React.ReactNode;
    children: React.ReactNode;
    /** which edge of the trigger the bubble lines up with */
    align?: 'start' | 'center' | 'end';
    /** 'wide' for a few sentences (a page's note), 'narrow' for a few words */
    size?: 'narrow' | 'wide';
    /** a label for screen readers when the trigger is only an icon */
    label?: string;
}> = ({ text, children, align = 'center', size = 'narrow', label }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const id = useId();
    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const edge = align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
    const width = size === 'wide' ? 'w-[min(22rem,calc(100vw-2rem))]' : 'w-max max-w-[16rem]';
    return (
        <span ref={ref} className="relative inline-flex"
            onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
            <span role="button" tabIndex={0} aria-describedby={open ? id : undefined} aria-label={label}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
                className="inline-flex items-center cursor-help rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-lilac/60">
                {children}
            </span>
            {open && (
                <span role="tooltip" id={id}
                    className={`absolute z-40 top-full mt-2 ${edge} ${width} rounded-lg bg-[#2A2236] px-3 py-2 whitespace-normal text-left text-[12.5px] font-normal normal-case tracking-normal leading-relaxed text-[#EEE9F5] shadow-lg`}>
                    {text}
                </span>
            )}
        </span>
    );
};

export default Tooltip;
