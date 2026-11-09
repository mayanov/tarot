import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Booking } from '../../../services/booking';

// Booking status and payment across the admin: a small coloured dot and a plain word,
// so a row reads calmly and colour only marks what needs attention.
export const STATUS_DOT: Record<Booking['status'], string> = {
    pending: 'bg-coral-deep',
    confirmed: 'bg-sage',
    done: 'bg-blue',
    cancelled: 'bg-mauve',
};
// kept for the calendar's tinted blocks and anything that wants the old tint
export const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/15 text-coral-deep border-coral/40',
    confirmed: 'bg-sage/15 text-sage border-sage/45',
    done: 'bg-blue/15 text-blue border-blue/45',
    cancelled: 'bg-mauve/15 text-mauve border-mauve/45',
};

export const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];
const NAME: Record<Booking['status'], string> = { pending: 'Pending', confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled' };

const Dot: React.FC<{ cls: string }> = ({ cls }) => <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cls}`} />;

/** the status as a dot and a word (read-only) */
export const StatusPill: React.FC<{ status: Booking['status']; className?: string }> = ({ status, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs text-text-light whitespace-nowrap ${className}`}>
        <Dot cls={STATUS_DOT[status]} />{NAME[status]}
    </span>
);

/** the status as a dot and a word; click it to pick another (a native menu, so it works everywhere) */
export const StatusSelect: React.FC<{ status: Booking['status']; onChange: (s: Booking['status']) => void; className?: string }> = ({ status, onChange, className = '' }) => (
    <span className={`relative inline-flex items-center ${className}`} onClick={(e) => e.stopPropagation()}>
        <Dot cls={`absolute left-2 pointer-events-none ${STATUS_DOT[status]}`} />
        <select
            value={status}
            onChange={(e) => onChange(e.target.value as Booking['status'])}
            aria-label="Status"
            className="appearance-none cursor-pointer bg-transparent pl-5 pr-6 py-1 rounded-md text-xs text-text-light hover:bg-adm-hover-2 focus:outline-none focus:ring-2 focus:ring-lilac/40"
        >
            {STATUSES.map((s) => <option key={s} value={s}>{NAME[s]}</option>)}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-1.5 text-text-subtle" />
    </span>
);

/** A sale's state in one word, for the Sales table: Unpaid (the one in colour, it needs
    her), Paid, Done (paid and the reading given), Pending. Click it to mark paid / unpaid. */
export const SaleStatus: React.FC<{ b: Booking; onToggle: () => void; busy?: boolean }> = ({ b, onToggle, busy }) => {
    const paid = b.paymentStatus === 'paid';
    const word = !paid ? 'Unpaid' : b.status === 'done' ? 'Done' : b.status === 'pending' ? 'Pending' : 'Paid';
    const dot = !paid ? 'bg-coral-deep' : b.status === 'done' ? 'bg-blue' : b.status === 'pending' ? 'bg-coral-deep' : 'bg-sage';
    const note = !paid && b.status === 'done' ? 'reading done' : '';
    return (
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} disabled={busy}
            title={paid ? 'Paid · click to mark unpaid' : 'Click to mark paid'}
            className={`inline-flex flex-col items-start px-2 py-1 -mx-2 rounded-md text-xs whitespace-nowrap transition-colors hover:bg-adm-hover-2 disabled:opacity-50 ${paid ? 'text-text-light' : 'text-coral-deep font-semibold'}`}>
            <span className="inline-flex items-center gap-1.5"><Dot cls={dot} />{word}</span>
            {note && <span className="pl-3 text-[11px] font-normal text-text-subtle">{note}</span>}
        </button>
    );
};

/** Paid / Unpaid; a button that flips it when `onToggle` is given. Unpaid is the one in colour. */
export const PaymentPill: React.FC<{ paid: boolean; onToggle?: () => void; busy?: boolean }> = ({ paid, onToggle, busy }) => {
    const cls = `inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors disabled:opacity-50 ${paid ? 'text-text-subtle' : 'text-coral-deep font-semibold'}`;
    const inner = <><Dot cls={paid ? 'bg-sage' : 'bg-coral-deep'} />{paid ? 'Paid' : 'Unpaid'}</>;
    return onToggle
        ? <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} disabled={busy} title={paid ? 'Mark unpaid' : 'Mark paid'} className={`${cls} hover:bg-adm-hover-2`}>{inner}</button>
        : <span className={cls}>{inner}</span>;
};
