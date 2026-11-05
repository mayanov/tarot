import React from 'react';
import { ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Booking } from '../../../services/booking';

// Canonical booking-status colours for the admin dashboard — brand jewel palette,
// dark text on a light tint, with a matching border (light theme).
export const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/15 text-coral-deep border-coral/40',
    confirmed: 'bg-sage/15 text-sage border-sage/45',
    done: 'bg-blue/15 text-blue border-blue/45',
    cancelled: 'bg-mauve/15 text-mauve border-mauve/45',
};

export const STATUSES: Booking['status'][] = ['pending', 'confirmed', 'done', 'cancelled'];

// Standard status pill used across the dashboard tables.
export const StatusPill: React.FC<{ status: Booking['status']; className?: string }> = ({ status, className = '' }) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.6rem] uppercase tracking-wider font-semibold border ${STATUS_STYLE[status]} ${className}`}>
        {status}
    </span>
);

/** the status as one pill; click it to pick another (a native menu, so it works everywhere) */
export const StatusSelect: React.FC<{ status: Booking['status']; onChange: (s: Booking['status']) => void; className?: string }> = ({ status, onChange, className = '' }) => (
    <span className={`relative inline-flex ${className}`}>
        <select
            value={status}
            onChange={(e) => onChange(e.target.value as Booking['status'])}
            aria-label="Status"
            className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-full text-[0.65rem] uppercase tracking-wider font-semibold border focus:outline-none focus:ring-2 focus:ring-lilac/40 ${STATUS_STYLE[status]}`}
        >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
    </span>
);

/** Paid / Unpaid; a button that flips it when `onToggle` is given */
export const PaymentPill: React.FC<{ paid: boolean; onToggle?: () => void; busy?: boolean }> = ({ paid, onToggle, busy }) => {
    const cls = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors disabled:opacity-50 ${paid
        ? 'bg-sage/15 text-sage border-sage/40'
        : 'bg-coral/15 text-coral-deep border-coral/40'}`;
    const inner = <>{paid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{paid ? 'Paid' : 'Unpaid'}</>;
    return onToggle
        ? <button type="button" onClick={onToggle} disabled={busy} title={paid ? 'Mark unpaid' : 'Mark paid'} className={`${cls} ${paid ? 'hover:bg-sage/25' : 'hover:bg-coral/25'}`}>{inner}</button>
        : <span className={cls}>{inner}</span>;
};
