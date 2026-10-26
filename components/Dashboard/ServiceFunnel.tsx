import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { ServicePerformance } from '../../services/mockAnalytics';

// Booking funnel for one market, written to be read at a glance:
//   1. three numbered steps (Opened a card → Clicked Pesan → Booked) with the share
//      of people who carried on between each step,
//   2. one plain sentence that sums it up,
//   3. a simple table of the same steps per service.

type Props = { services: ServicePerformance[] };

const STEPS = [
    { key: 'views', label: 'Opened a card', hint: 'Looked at a service in the pricelist' },
    { key: 'clicks', label: 'Clicked Pesan', hint: 'Started booking (form or WhatsApp)' },
    { key: 'bookings', label: 'Booked', hint: 'Finished the booking form' },
] as const;

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : null);

const Continue: React.FC<{ value: number | null }> = ({ value }) => (
    <div className="flex sm:flex-col items-center justify-center gap-1.5 text-text-subtle py-1 sm:py-0">
        <ArrowDown size={16} className="sm:hidden" />
        <ArrowRight size={18} className="hidden sm:block" />
        <span className="text-xs font-semibold tabular-nums text-text-light">{value === null ? '—' : `${value}%`}</span>
        <span className="text-[10px] uppercase tracking-wider">continued</span>
    </div>
);

const ServiceFunnel: React.FC<Props> = ({ services }) => {
    const totals = STEPS.map((s) => services.reduce((a, x) => a + x[s.key], 0));
    const [opened, clicked, booked] = totals;
    const empty = totals.every((n) => n === 0);

    // the sentence under the steps
    const summary = empty
        ? 'No activity counted yet for this period.'
        : opened > 0
            ? `Of ${opened} ${opened === 1 ? 'person' : 'people'} who opened a card, ${clicked} clicked Pesan and ${booked} booked (${pct(booked, opened)}% overall).`
            : `${clicked} clicked Pesan and ${booked} booked. Card opens aren't counted for some visits yet (the live site still has the old pricelist).`;

    // the best-converting service (opened → booked), if any has bookings
    const best = services
        .filter((s) => s.views > 0 && s.bookings > 0)
        .sort((a, b) => b.bookings / b.views - a.bookings / a.views)[0];

    return (
        <div className="p-5 space-y-6">
            {/* 1. STEPS */}
            <div className="grid sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
                {STEPS.map((step, i) => (
                    <React.Fragment key={step.key}>
                        {i > 0 && <Continue value={pct(totals[i], totals[i - 1])} />}
                        <div className="rounded-xl border border-adm-line px-4 py-4">
                            <div className="flex items-center gap-2">
                                <span className="grid place-items-center w-5 h-5 rounded-full bg-lilac text-white text-[11px] font-bold">{i + 1}</span>
                                <span className="text-sm font-medium text-text-light">{step.label}</span>
                            </div>
                            <p className="mt-3 text-3xl font-semibold tabular-nums text-text-light leading-none">{totals[i].toLocaleString()}</p>
                            <p className="mt-2 text-xs text-text-subtle">{step.hint}</p>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* 2. SUMMARY */}
            <p className="text-sm text-text-light">
                {summary}
                {best && <span className="text-text-subtle"> Best converting: <span className="text-text-light font-medium">{best.name}</span>.</span>}
            </p>

            {/* 3. PER SERVICE */}
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full min-w-[34rem] text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-text-subtle border-b border-adm-line">
                            <th className="py-2.5 font-semibold">Service</th>
                            <th className="py-2.5 font-semibold text-right">Opened</th>
                            <th className="py-2.5 font-semibold text-right">Clicked Pesan</th>
                            <th className="py-2.5 font-semibold text-right">Booked</th>
                            <th className="py-2.5 font-semibold text-right" title="Booked ÷ Opened a card">Opened → Booked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((s) => {
                            const conv = pct(s.bookings, s.views);
                            const cell = (n: number) => (
                                <td className={`py-3 text-right tabular-nums ${n ? 'text-text-light font-medium' : 'text-text-subtle'}`}>{n}</td>
                            );
                            return (
                                <tr key={s.name} className="border-b border-adm-line last:border-0">
                                    <td className="py-3 text-text-light">{s.name}</td>
                                    {cell(s.views)}
                                    {cell(s.clicks)}
                                    {cell(s.bookings)}
                                    <td className="py-3 text-right tabular-nums text-text-light">{conv === null ? <span className="text-text-subtle">—</span> : `${conv}%`}</td>
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
