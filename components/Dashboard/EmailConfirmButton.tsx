import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import type { Booking } from '../../services/booking';
import { emailOf } from './lib/format';

// Global customers are confirmed by email, not WhatsApp: the "your … is booked" email a
// PayPal payment sends by itself (paidEmailSentAt). This shows whether it went out, and
// sends it for a paid booking that never got it (POST /api/admin/bookings/:id/email-confirm).

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
const fullLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

const ERRORS: Record<string, string> = {
  NOT_PAID: 'It goes out once the order is paid.',
  NO_EMAIL: 'This customer has no email address.',
  NOT_SENT: 'The email could not be sent. Try again later.',
};

const EmailConfirmButton: React.FC<{ b: Booking; onSent: (at: string) => void }> = ({ b, onSent }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const quiet = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-subtle whitespace-nowrap';
  if (b.paidEmailSentAt) {
    return <span className={quiet} title={`Confirmation emailed ${fullLabel(b.paidEmailSentAt)}`}><Mail size={13} />Emailed {dayLabel(b.paidEmailSentAt)}</span>;
  }
  const email = emailOf(b.contact);
  if (!email) return <span className={quiet} title="No email address on this booking">No email</span>;
  if (b.paymentStatus !== 'paid') return <span className={quiet} title="The confirmation email goes out once it's paid">After payment</span>;
  const send = async () => {
    if (!window.confirm(`Email the booking confirmation to ${email}?`)) return;
    setBusy(true);
    setErr('');
    try {
      const token = localStorage.getItem('authToken');
      const r = await fetch(`/api/admin/bookings/${encodeURIComponent(b.id)}/email-confirm`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.paidEmailSentAt) onSent(data.paidEmailSentAt);
      else setErr(ERRORS[data.error] || 'Could not send. Try again.');
    } catch { setErr('Could not send. Try again.'); } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); send(); }} disabled={busy}
      title={err || `Email the booking confirmation to ${email}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors disabled:opacity-50 border font-medium hover:bg-adm-hover-2 ${err ? 'border-coral-deep/60 text-coral-deep' : 'border-adm-line-2 text-text-light'}`}>
      <Mail size={13} className={err ? '' : 'text-lilac'} />{busy ? 'Sending…' : err ? 'Try again' : 'Confirm'}
    </button>
  );
};

export default EmailConfirmButton;
