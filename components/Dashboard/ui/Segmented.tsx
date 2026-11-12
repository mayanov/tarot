import React from 'react';

// The one toggle used across the admin (Schedule / Orders, Active / Done, ID / Global,
// date ranges…): a quiet track with the picked option raised on it, never a block of colour.
export interface SegOption<T extends string> { id: T; label: React.ReactNode; count?: number }

interface Props<T extends string> {
    value: T;
    options: SegOption<T>[];
    // (the values come from value and options: a state setter passed straight in here
    // would otherwise have them read as any text)
    onChange: (v: NoInfer<T>) => void;
    size?: 'sm' | 'md';
    className?: string;
}

function Segmented<T extends string>({ value, options, onChange, size = 'md', className = '' }: Props<T>) {
    const pad = size === 'sm' ? 'px-3 py-1 text-[12.5px]' : 'px-3.5 py-1.5 text-[13.5px]';
    return (
        <div role="tablist" className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
            {options.map((o) => {
                const on = o.id === value;
                return (
                    <button
                        key={o.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(o.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${pad} ${on
                            ? 'bg-text-light text-bg-deep'
                            : 'bg-adm-hover-2 text-text-light hover:bg-adm-hover-3'}`}
                    >
                        {o.label}
                        {o.count !== undefined && <span className="tabular-nums opacity-70">{o.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

export default Segmented;
