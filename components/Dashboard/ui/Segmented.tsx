import React from 'react';

// The one toggle used across the admin (Schedule / Orders, Active / Done, ID / Global,
// date ranges…): a quiet track with the picked option raised on it, never a block of colour.
export interface SegOption<T extends string> { id: T; label: React.ReactNode; count?: number }

interface Props<T extends string> {
    value: T;
    options: SegOption<T>[];
    onChange: (v: T) => void;
    size?: 'sm' | 'md';
    className?: string;
}

function Segmented<T extends string>({ value, options, onChange, size = 'md', className = '' }: Props<T>) {
    const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
    return (
        <div role="tablist" className={`inline-flex items-center rounded-lg bg-adm-hover p-0.5 ${className}`}>
            {options.map((o) => {
                const on = o.id === value;
                return (
                    <button
                        key={o.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(o.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${pad} ${on
                            ? 'bg-surface-1 text-text-light shadow-sm ring-1 ring-adm-line'
                            : 'text-text-subtle hover:text-text-light'}`}
                    >
                        {o.label}
                        {o.count !== undefined && <span className={`tabular-nums text-[0.7rem] ${on ? 'text-lilac' : 'opacity-70'}`}>{o.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

export default Segmented;
