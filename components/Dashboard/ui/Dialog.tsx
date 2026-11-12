import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// The one popup frame for the admin. Every popup reads the same way:
//   a small line saying what it is (Session · MYV-2), the title, a line under it,
//   then the content in named sections split by hairlines, label on the left and value
//   on the right, and the buttons (if any) in a footer that stays put.
// It sits on the page itself (a portal), so the dim behind it always covers the whole
// screen; Escape and a click outside close the top one only; on a phone it rises from the
// bottom like a sheet.

// the open popups, newest last: Escape closes only the top one
const stack: symbol[] = [];

export const Dialog: React.FC<{
    onClose: () => void;
    title: React.ReactNode;
    eyebrow?: React.ReactNode;     // what it is: 'Session · MYV-2', 'Customer'
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;     // small buttons beside the close button (Edit)
    footer?: React.ReactNode;      // the main buttons
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    label?: string;                // for screen readers when the title isn't plain text
    accent?: string;               // a colour to tint the header with (a booking's service)
    hero?: React.ReactNode;        // the big fact under the title (a session's time)
}> = ({ onClose, title, eyebrow, subtitle, actions, footer, size = 'md', children, label, accent, hero }) => {
    const id = useRef(Symbol('dialog'));
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const me = id.current;
        stack.push(me);
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || stack[stack.length - 1] !== me) return;
            e.stopPropagation();
            close.current();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            const i = stack.indexOf(me);
            if (i >= 0) stack.splice(i, 1);
        };
    }, []);
    // the admin's colours (light or dark) live on its wrapper; the popup takes the same
    const theme = document.querySelector('.admin-shell[data-theme]')?.getAttribute('data-theme') || 'light';
    const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md';
    return createPortal(
        // (z-[90]: the bell's panel checks for it before closing on Escape)
        <div className="admin-shell fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4 text-text-light font-sans" data-theme={theme} role="presentation">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
            <div role="dialog" aria-modal="true" aria-label={label || (typeof title === 'string' ? title : undefined)}
                className={`relative w-full ${width} max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-surface-1 border border-adm-line-2 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden`}>
                {/* a grab line on a phone, where it's a sheet */}
                <span className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-adm-line-3" aria-hidden />
                <header className={`shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-4 sm:pt-5 pb-4 ${accent ? '' : 'border-b border-adm-line'}`}
                    style={accent ? { background: `color-mix(in srgb, ${accent} 14%, var(--adm-surface-1))` } : undefined}>
                    <div className="min-w-0 flex-1">
                        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle mb-1">{eyebrow}</div>}
                        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-text-light leading-tight break-words">{title}</h2>
                        {subtitle && <div className="mt-1 text-sm text-text-subtle">{subtitle}</div>}
                        {hero && <div className="mt-3">{hero}</div>}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 -mr-2 -mt-1">
                        {actions}
                        <DialogIconButton label="Close" onClick={onClose}><X size={18} /></DialogIconButton>
                    </div>
                </header>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-adm-line" data-lenis-prevent>
                    {children}
                </div>
                {footer && <footer className="shrink-0 flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-adm-line bg-adm-hover">{footer}</footer>}
            </div>
        </div>,
        document.body,
    );
};

/** a small square button in the header (Edit, Close) */
export const DialogIconButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
    <button type="button" aria-label={label} title={label} onClick={onClick}
        className="grid place-items-center w-9 h-9 rounded-lg text-text-subtle hover:text-text-light hover:bg-adm-hover-2 transition-colors">
        {children}
    </button>
);

/** one part of a popup: its name (and maybe a button on the right), then what's in it */
export const Section: React.FC<{ title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, aside, children, className = '' }) => (
    <section className={`px-5 sm:px-6 py-4 ${className}`}>
        {(title || aside) && (
            <div className="flex items-center justify-between gap-3 mb-2">
                {title && <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">{title}</h3>}
                {aside}
            </div>
        )}
        {children}
    </section>
);

/** a line of facts: what it is on the left, the value on the right */
export const KV: React.FC<{ label: React.ReactNode; children: React.ReactNode; strong?: boolean }> = ({ label, children, strong }) => (
    <div className="flex items-center justify-between gap-4 min-h-[2.25rem] py-1 text-sm">
        <span className="shrink-0 text-text-subtle">{label}</span>
        <span className={`min-w-0 flex items-center justify-end gap-2 text-right break-words ${strong ? 'font-semibold text-text-light' : 'text-text-light'}`}>{children}</span>
    </div>
);

/** form field styles shared by the popups */
export const FIELD_LABEL = 'block text-[12px] font-medium text-text-subtle mb-1.5';
export const FIELD = 'w-full rounded-lg border border-adm-line-2 bg-bg-dark px-3 py-2 text-sm text-text-light placeholder:text-text-subtle/60 focus:border-lilac focus:outline-none focus:ring-2 focus:ring-lilac/20';

export default Dialog;
