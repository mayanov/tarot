import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// The admin's one way of narrowing a list, as Payments first had it: a line with the
// views as underlined tabs on the left, and the filters on the right, each a word and
// a little arrow (grey until something is picked) that opens a short menu; "Clear"
// appears once any filter is set.
//
//   <FilterBar tabs={<ViewTabs … />}>
//     <FilterMenu label="Anywhere" active={…}>
//       <MenuHead>Where they live</MenuHead>
//       <MenuOption on={…} onPick={…}>Indonesia</MenuOption>
//     </FilterMenu>
//     <ClearFilters show={…} onClear={…} />
//   </FilterBar>

/** the line itself: views on the left, filters on the right, a rule underneath */
export const FilterBar: React.FC<{ tabs?: React.ReactNode; children?: React.ReactNode; className?: string }> = ({ tabs, children, className = '' }) => (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-adm-line ${className}`}>
        {tabs ?? <span />}
        {children && <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pb-1.5">{children}</div>}
    </div>
);

export interface TabOption<T extends string> {
    id: T;
    label: React.ReactNode;
    /** shown beside the label (hidden at 0); 'due' colours it like something waiting */
    count?: number | null;
    tone?: 'due' | 'muted';
}

/** the views: underlined tabs, the picked one dark and bold */
export function ViewTabs<T extends string>({ value, options, onChange, label }: {
    value: T;
    options: TabOption<T>[];
    onChange: (v: NoInfer<T>) => void;
    /** what the tabs choose, for screen readers */
    label: string;
}) {
    return (
        <div role="tablist" aria-label={label} className="flex gap-6">
            {options.map((o) => {
                const on = o.id === value;
                return (
                    <button key={o.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(o.id)}
                        className={`-mb-px border-b-2 py-2.5 text-[15px] whitespace-nowrap transition-colors ${on ? 'border-text-light font-semibold text-text-light' : 'border-transparent font-medium text-text-subtle hover:text-text-light'}`}>
                        {o.label}
                        {o.count != null && o.count > 0 && (
                            <span className={`ml-1.5 font-semibold tabular-nums ${o.tone === 'due' ? 'due-soon-text' : 'text-text-subtle'}`}>{o.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// a menu's options close it once picked
const CloseMenu = createContext<() => void>(() => {});

/** one filter: its word and arrow, and the short menu it opens (closed again on a
 *  pick, a click outside or Escape) */
export const FilterMenu: React.FC<{
    /** what it's set to now, e.g. "Anywhere" or "Indonesia · Booked on the site" */
    label: React.ReactNode;
    /** something other than "all" is picked: the word turns dark */
    active?: boolean;
    /** which edge of the word the menu lines up with; 'end' for the last one on the line */
    align?: 'start' | 'end';
    /** a wider menu (e.g. one holding a calendar) */
    menuClassName?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}> = ({ label, active = false, align = 'start', menuClassName = 'w-56', icon, children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
    // (on a phone a start-aligned menu opens to the right of its word, an end-aligned one
    // to its left, so none runs off the screen)
    const edge = align === 'start' ? 'left-0 sm:left-auto sm:right-0' : 'right-0';
    return (
        <div ref={ref} className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
                className={`inline-flex items-center gap-1 py-2 text-[14px] whitespace-nowrap transition-colors ${active ? 'font-semibold text-text-light' : 'font-medium text-text-subtle hover:text-text-light'}`}>
                {icon}{label}<ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="menu" className={`absolute z-30 top-full mt-1 ${edge} max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-adm-line-2 bg-surface-1 shadow-lg p-1.5 ${menuClassName}`}>
                    <CloseMenu.Provider value={() => setOpen(false)}>{children}</CloseMenu.Provider>
                </div>
            )}
        </div>
    );
};

/** a small grey heading inside a menu */
export const MenuHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-2.5 pt-2 pb-1 text-[12px] text-text-subtle">{children}</div>
);

/** a line between groups in a menu */
export const MenuDivider: React.FC = () => <div className="my-1 border-t border-adm-line" />;

/** one choice in a menu, ticked when it's the one picked; picking it closes the menu
 *  (keepOpen leaves it open, e.g. for a choice that shows more fields below) */
export const MenuOption: React.FC<{ on: boolean; onPick: () => void; keepOpen?: boolean; /** a choice inside the one above it (a sub-service under its service) */ sub?: boolean; /** nothing behind it yet (e.g. a service with no orders): greyed, still pickable */ dim?: boolean; children: React.ReactNode }> = ({ on, onPick, keepOpen, sub, dim, children }) => {
    const close = useContext(CloseMenu);
    return (
        <button type="button" role="menuitemradio" aria-checked={on} onClick={() => { onPick(); if (!keepOpen) close(); }}
            className={`w-full flex items-center justify-between gap-2 py-1.5 rounded-md text-left hover:bg-adm-hover ${sub ? 'pl-6 pr-2.5 text-[13.5px] text-text-subtle hover:text-text-light' : 'px-2.5 text-[14px] text-text-light'} ${dim && !on ? 'opacity-45' : ''} ${on ? 'font-semibold !text-text-light' : ''}`}>
            {children}{on && <Check size={14} className="text-lilac shrink-0" />}
        </button>
    );
};

/** closes the menu it's in (for a menu's own buttons, like "Show these dates") */
export const useCloseMenu = () => useContext(CloseMenu);

/** a date picked inside a menu */
export const MenuDate: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, ...rest }) => (
    <label className="block">
        <span className="block text-xs text-text-subtle mb-1">{label}</span>
        <input type="date" {...rest}
            className="w-full px-2.5 py-2 rounded-lg border border-adm-line-2 bg-bg-dark text-sm text-text-light focus:border-lilac focus:outline-none cursor-pointer" />
    </label>
);

/** "Clear", once any filter is set */
export const ClearFilters: React.FC<{ show: boolean; onClear: () => void }> = ({ show, onClear }) => show ? (
    <button type="button" onClick={onClear} className="py-2 text-[14px] font-medium text-lilac hover:underline">Clear</button>
) : null;
