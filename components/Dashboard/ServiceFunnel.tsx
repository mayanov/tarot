import React, { useState } from 'react';
import { ServicePerformance } from '../../services/mockAnalytics';

// Booking funnel for one market as a drop-off chart:
//   - one column per step (Opened a card → Clicked Pesan → Booked), height = people
//     who reached it, all on one scale;
//   - on top of each later column, a faded striped block = people who dropped off
//     since the previous step, with the drop-off % written between the columns;
//   - chips filter the chart to one service; the table below has the exact numbers
//     per service and where each one loses the most people.

type Props = { services: ServicePerformance[] };

const STEPS = [
    { key: 'views', label: 'Opened a card', short: 'Opened' },
    { key: 'clicks', label: 'Clicked Pesan', short: 'Pesan' },
    { key: 'bookings', label: 'Booked', short: 'Booked' },
] as const;

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : null);
const fmtPct = (v: number | null) => (v === null ? '—' : `${v}%`);
// faded, striped fill for "dropped off" (texture keeps it distinct without relying on colour)
const DROP_STYLE: React.CSSProperties = {
    backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--adm-accent) / 0.28) 0 2px, transparent 2px 7px)',
    backgroundColor: 'rgb(var(--adm-accent) / 0.10)',
};
const CHART_H = 240; // px — whole plot, including the value labels
const BAR_H = CHART_H - 30; // px — tallest possible column (leaves room for its label)

const ServiceFunnel: React.FC<Props> = ({ services }) => {
    const [filter, setFilter] = useState<string>('all');
    const [hover, setHover] = useState<number | null>(null);

    const shown = filter === 'all' ? services : services.filter((s) => s.name === filter);
    const counts = STEPS.map((st) => shown.reduce((a, s) => a + s[st.key], 0));
    const scale = Math.max(1, ...counts); // normally the first step
    const empty = counts.every((n) => n === 0);

    const h = (n: number) => (n / scale) * BAR_H;
    const dropped = (i: number) => (i === 0 ? 0 : Math.max(0, counts[i - 1] - counts[i]));
    const dropPct = (i: number) => (i === 0 ? null : counts[i - 1] > 0 ? Math.round((dropped(i) / counts[i - 1]) * 100) : null);

    // biggest drop for a service: which step loses the largest share
    const biggestDrop = (s: ServicePerformance) => {
        const v = [s.views, s.clicks, s.bookings];
        let best: { at: string; p: number } | null = null;
        for (let i = 1; i < v.length; i++) {
            if (v[i - 1] <= 0) continue;
            const p = Math.round((Math.max(0, v[i - 1] - v[i]) / v[i - 1]) * 100);
            if (!best || p > best.p) best = { at: `${STEPS[i - 1].short} → ${STEPS[i].short}`, p };
        }
        return best;
    };

    return (
        <div className="p-5 space-y-6">
            {/* FILTER — one row of chips above the chart */}
            <div className="flex flex-wrap gap-1.5">
                {[{ name: 'all', label: 'All services' }, ...services.map((s) => ({ name: s.name, label: s.name }))].map((c) => (
                    <button
                        key={c.name}
                        onClick={() => setFilter(c.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === c.name
                            ? 'bg-lilac text-white border-lilac'
                            : 'border-adm-line text-text-subtle hover:text-text-light hover:bg-adm-hover'}`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* LEGEND */}
            <div className="flex items-center gap-5 text-xs text-text-subtle">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-lilac" /> Reached this step</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm border border-lilac/40" style={DROP_STYLE} /> Dropped off</span>
            </div>

            {/* CHART */}
            <div className="relative">
                {/* recessive grid: 0 / half / tallest column, in people */}
                <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: CHART_H }}>
                    {[1, 0.5, 0].map((g) => (
                        <div key={g} className="absolute inset-x-0 flex items-center gap-2" style={{ top: CHART_H - g * BAR_H }}>
                            <span className="w-9 -translate-y-1/2 text-[10px] tabular-nums text-text-subtle text-right">{empty ? '' : Math.round(g * scale)}</span>
                            <span className="flex-1 border-t border-adm-line" />
                        </div>
                    ))}
                </div>

                <div className="relative pl-11 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-x-2 sm:gap-x-4">
                    {STEPS.map((st, i) => {
                        const n = counts[i];
                        const lost = dropped(i);
                        const isHover = hover === i;
                        return (
                            <React.Fragment key={st.key}>
                                {i > 0 && (
                                    // drop-off between the two columns
                                    <div className="w-12 sm:w-16 flex flex-col justify-center items-center" style={{ height: CHART_H }}>
                                        <span className={`text-xs sm:text-sm font-semibold tabular-nums ${dropPct(i) ? 'text-text-light' : 'text-text-subtle'}`}>
                                            {dropPct(i) === null ? '—' : `−${dropPct(i)}%`}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-text-subtle">dropped</span>
                                    </div>
                                )}
                                <div
                                    className="relative flex flex-col justify-end cursor-default"
                                    style={{ height: CHART_H }}
                                    onMouseEnter={() => setHover(i)}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    {/* value label above the column */}
                                    <div className="text-center mb-1.5">
                                        <span className="text-lg font-semibold tabular-nums text-text-light">{n.toLocaleString()}</span>
                                    </div>
                                    {lost > 0 && (
                                        <div className="mx-auto w-full max-w-[9rem] rounded-t border border-b-0 border-lilac/30" style={{ ...DROP_STYLE, height: h(lost) }} />
                                    )}
                                    <div
                                        className={`mx-auto w-full max-w-[9rem] bg-lilac transition-all duration-500 ${lost > 0 ? '' : 'rounded-t'} ${isHover ? 'opacity-90' : ''}`}
                                        style={{ height: Math.max(n > 0 ? 3 : 0, h(n)) }}
                                    />

                                    {/* tooltip */}
                                    {isHover && !empty && (
                                        <div className="absolute z-10 left-1/2 -translate-x-1/2 top-9 w-52 rounded-lg border border-adm-line bg-surface-1 shadow-xl p-3 text-xs">
                                            <p className="font-semibold text-text-light mb-1.5">{st.label}</p>
                                            <div className="space-y-0.5 text-text-subtle tabular-nums">
                                                <p className="flex justify-between"><span>People</span><span className="text-text-light">{n}</span></p>
                                                <p className="flex justify-between"><span>Of first step</span><span className="text-text-light">{fmtPct(pct(n, counts[0]))}</span></p>
                                                {i > 0 && <p className="flex justify-between"><span>Of previous step</span><span className="text-text-light">{fmtPct(pct(n, counts[i - 1]))}</span></p>}
                                                {i > 0 && <p className="flex justify-between"><span>Dropped off</span><span className="text-text-light">{lost}</span></p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* step labels under the columns */}
                <div className="pl-11 mt-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 sm:gap-x-4">
                    {STEPS.map((st, i) => (
                        <React.Fragment key={st.key}>
                            {i > 0 && <span className="w-12 sm:w-16" />}
                            <div className="text-center">
                                <p className="text-xs sm:text-sm font-medium text-text-light">{st.label}</p>
                                <p className="text-[11px] text-text-subtle tabular-nums">{i === 0 ? 'start' : `${fmtPct(pct(counts[i], counts[0]))} of start`}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                {empty && (
                    <p className="absolute inset-x-0 top-1/3 text-center text-sm text-text-subtle">No activity counted yet for this period.</p>
                )}
            </div>
            {!empty && counts[1] > counts[0] && (
                <p className="text-xs text-text-subtle">
                    More Pesan clicks than card opens: Google Analytics can take up to a day to count card opens, so recent numbers may still be catching up.
                </p>
            )}

            {/* TABLE — exact numbers per service + where each loses the most */}
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full min-w-[36rem] text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-text-subtle border-b border-adm-line">
                            <th className="py-2.5 font-semibold">Service</th>
                            <th className="py-2.5 font-semibold text-right">Opened</th>
                            <th className="py-2.5 font-semibold text-right">Clicked Pesan</th>
                            <th className="py-2.5 font-semibold text-right">Booked</th>
                            <th className="py-2.5 font-semibold text-right" title="Booked ÷ Opened a card">Opened → Booked</th>
                            <th className="py-2.5 font-semibold text-right">Biggest drop</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((s) => {
                            const bd = biggestDrop(s);
                            const cell = (n: number) => (
                                <td className={`py-3 text-right tabular-nums ${n ? 'text-text-light font-medium' : 'text-text-subtle'}`}>{n}</td>
                            );
                            return (
                                <tr
                                    key={s.name}
                                    onClick={() => setFilter(s.name)}
                                    className={`border-b border-adm-line last:border-0 cursor-pointer hover:bg-adm-hover ${filter === s.name ? 'bg-adm-hover' : ''}`}
                                >
                                    <td className="py-3 text-text-light">{s.name}</td>
                                    {cell(s.views)}
                                    {cell(s.clicks)}
                                    {cell(s.bookings)}
                                    <td className="py-3 text-right tabular-nums text-text-light">{fmtPct(pct(s.bookings, s.views))}</td>
                                    <td className="py-3 text-right text-xs text-text-subtle">
                                        {bd ? <><span className="text-text-light font-medium tabular-nums">−{bd.p}%</span> {bd.at}</> : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceFunnel;
