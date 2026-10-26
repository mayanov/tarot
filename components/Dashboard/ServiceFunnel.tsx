import React, { useState } from 'react';
import { ServicePerformance } from '../../services/mockAnalytics';

// Booking funnel for one market: Card opened → Clicked Pesan → Booked.
// Top: the market's overall funnel (all services added up). Below: the same three
// steps per service, so it's clear which service loses people where.
// Bars are one hue (it's one measure at three stages); every bar carries its count
// as text, and the step-to-step rate sits beside it.

type Props = {
    services: ServicePerformance[];
    currency: 'IDR' | 'USD';
};

const STEPS = [
    { key: 'views', label: 'Card opened', hint: 'Opened the service card in the pricelist' },
    { key: 'clicks', label: 'Clicked Pesan', hint: 'Clicked Pesan (booking form or WhatsApp opened)' },
    { key: 'bookings', label: 'Booked', hint: 'Finished the booking form' },
] as const;
type StepKey = typeof STEPS[number]['key'];

// share of the previous step that made it to this one ("—" when there's nothing to compare)
const rate = (n: number, prev: number) => (prev > 0 ? `${Math.round((n / prev) * 100)}%` : '—');
const money = (v: number, currency: 'IDR' | 'USD') =>
    currency === 'USD' ? `$${v.toLocaleString()}` : `Rp ${v.toLocaleString('id-ID')}`;

const Bar: React.FC<{ value: number; max: number; title: string }> = ({ value, max, title }) => (
    <div className="relative w-full h-2 rounded bg-adm-line" title={title}>
        {value > 0 && (
            <div
                className="absolute inset-y-0 left-0 rounded bg-lilac transition-[width] duration-500"
                style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
            />
        )}
    </div>
);

// One stage of the overall funnel: a centred block whose width is its share of the
// widest stage, so the stack narrows like a funnel. An empty stage shows a faint outline.
const Stage: React.FC<{ value: number; max: number; title: string }> = ({ value, max, title }) => (
    <div className="flex justify-center w-full" title={title}>
        {value > 0 ? (
            <div
                className="h-9 rounded bg-lilac transition-[width] duration-500"
                style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
            />
        ) : (
            <div className="h-9 w-full rounded border border-dashed border-adm-line" />
        )}
    </div>
);

const ServiceFunnel: React.FC<Props> = ({ services, currency }) => {
    const [hover, setHover] = useState<string | null>(null);
    const total = (k: StepKey) => services.reduce((a, s) => a + s[k], 0);
    const totals = STEPS.map((s) => total(s.key));
    const max = Math.max(1, ...totals);
    const skipped = totals[1] > totals[0]; // Pesan clicks from pages without the card step

    return (
        <div className="p-5 space-y-8">
            {/* OVERALL FUNNEL */}
            <div className="space-y-2.5">
                {STEPS.map((step, i) => {
                    const n = totals[i];
                    return (
                        <div key={step.key} className="grid grid-cols-[7.5rem_1fr_auto] sm:grid-cols-[9rem_1fr_7rem] items-center gap-3 sm:gap-5">
                            <div>
                                <p className="text-sm font-medium text-text-light">{step.label}</p>
                                <p className="text-[11px] text-text-subtle leading-tight hidden sm:block">{step.hint}</p>
                            </div>
                            <Stage value={n} max={max} title={`${step.label}: ${n}`} />
                            <div className="text-right">
                                <p className="text-lg font-semibold tabular-nums text-text-light leading-none">{n.toLocaleString()}</p>
                                {i > 0 && (
                                    <p className="mt-1 text-[11px] text-text-subtle tabular-nums">
                                        {rate(n, totals[i - 1])} of previous
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {skipped && (
                    <p className="text-xs text-text-subtle">
                        More Pesan clicks than card opens: some clicks come from pages without the card step
                        (the current live site still has the old pricelist).
                    </p>
                )}
            </div>

            {/* PER SERVICE */}
            <div>
                <div className="hidden md:grid grid-cols-[minmax(10rem,1.4fr)_repeat(3,1fr)_8rem] gap-5 pb-2 border-b border-adm-line text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                    <span>Service</span>
                    {STEPS.map((s) => <span key={s.key}>{s.label}</span>)}
                    <span className="text-right" title="Clicked Pesan × starting price">Est. revenue</span>
                </div>
                <ul>
                    {services.map((s) => {
                        const vals = STEPS.map((st) => s[st.key]);
                        const rowMax = Math.max(1, ...vals);
                        return (
                            <li
                                key={s.name}
                                onMouseEnter={() => setHover(s.name)}
                                onMouseLeave={() => setHover(null)}
                                className={`grid grid-cols-3 md:grid-cols-[minmax(10rem,1.4fr)_repeat(3,1fr)_8rem] gap-x-5 gap-y-2 py-3.5 border-b border-adm-line last:border-0 transition-colors ${hover === s.name ? 'bg-adm-hover' : ''}`}
                            >
                                <div className="col-span-3 md:col-span-1 flex items-baseline justify-between md:block">
                                    <p className="text-sm font-medium text-text-light">{s.name}</p>
                                    <p className="md:hidden text-xs text-text-subtle tabular-nums">{money(s.revenuePotential, currency)}</p>
                                </div>
                                {STEPS.map((st, i) => (
                                    <div key={st.key} className="min-w-0">
                                        <p className="md:hidden text-[10px] uppercase tracking-wider text-text-subtle mb-1">{st.label}</p>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-sm font-semibold tabular-nums text-text-light">{vals[i]}</span>
                                            {i > 0 && <span className="text-[11px] tabular-nums text-text-subtle">{rate(vals[i], vals[i - 1])}</span>}
                                        </div>
                                        <Bar value={vals[i]} max={rowMax} title={`${s.name} · ${st.label}: ${vals[i]}`} />
                                    </div>
                                ))}
                                <p className="hidden md:block text-right text-sm tabular-nums text-text-light self-center">{money(s.revenuePotential, currency)}</p>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default ServiceFunnel;
