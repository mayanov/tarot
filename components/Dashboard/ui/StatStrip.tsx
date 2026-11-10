import React from 'react';

// A row of figures in one panel, split by hairlines instead of a box each. A figure can
// have a line per currency (rupiah over dollars, never added together), each with a small
// note beside it (a change, a date), and a quiet line under it. On a wide screen the
// currencies sit side by side, split by a hairline, each note under its figure.
export interface Stat {
    label: string;
    lines: { key: string; value: string; note?: React.ReactNode }[];
    foot?: string;
}

const StatStrip: React.FC<{ stats: Stat[]; layout: 'three' | 'four' }> = ({ stats, layout }) => (
    <div className={`grid gap-px rounded-2xl overflow-hidden border border-adm-line bg-adm-line ${layout === 'three' ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {stats.map((s) => (
            <div key={s.label} className="bg-surface-1 min-w-0 px-3 py-3.5 sm:px-5 sm:py-4">
                <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle truncate">{s.label}</div>
                <div className="mt-2 space-y-1 xl:space-y-0 xl:flex xl:gap-5 xl:[&>*+*]:border-l xl:[&>*+*]:border-adm-line xl:[&>*+*]:pl-5">
                    {s.lines.map((l) => (
                        // the note goes under the figure when there's no room beside it
                        <div key={l.key} className="flex flex-wrap items-baseline gap-x-2 xl:flex-col xl:items-start xl:gap-0.5 min-w-0">
                            <span className="text-[14px] sm:text-xl font-serif font-bold text-text-light tabular-nums whitespace-nowrap leading-tight">{l.value}</span>
                            {l.note && <span className="text-[11px] text-text-subtle whitespace-nowrap">{l.note}</span>}
                        </div>
                    ))}
                </div>
                {s.foot && <div className="mt-1.5 text-[11px] sm:text-xs text-text-subtle truncate">{s.foot}</div>}
            </div>
        ))}
    </div>
);

export default StatStrip;
