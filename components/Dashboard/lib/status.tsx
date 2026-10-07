import React from 'react';
import { Booking } from '../../../services/booking';

// Canonical booking-status colours for the admin dashboard — brand jewel palette,
// dark text on a light tint, with a matching border (light theme).
export const STATUS_STYLE: Record<Booking['status'], string> = {
    pending: 'bg-coral/15 text-coral-deep border-coral/40',
    confirmed: 'bg-sage/15 text-sage border-sage/45',
    done: 'bg-blue/15 text-blue border-blue/45',
    cancelled: 'bg-mauve/15 text-mauve border-mauve/45',
};

// Standard status pill used across the dashboard tables.
export const StatusPill: React.FC<{ status: Booking['status']; className?: string }> = ({ status, className = '' }) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.6rem] uppercase tracking-wider font-semibold border ${STATUS_STYLE[status]} ${className}`}>
        {status}
    </span>
);
