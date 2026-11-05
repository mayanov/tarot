import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import type { Booking } from '../../services/booking';
import { amountForBooking, fmtMoney } from './lib/format';

// "Send confirmation" for a booking: opens Mayanov's own WhatsApp (app or web) on the
// customer's chat with the confirmation already typed, to send with one tap. An
// ordinary WhatsApp message, so it costs nothing and needs no Meta setup. The dashboard
// remembers when it was sent (POST /api/admin/bookings/:id/wa-confirmed).

/** The customer's number as WhatsApp links want it (0812… → 62812…), or '' */
export const waNumberOf = (contact?: string) => {
  const c = contact || '';
  // "WA: 0812…" from the form, or a bare number on an order typed in by hand
  const raw = (c.match(/WA:\s*([^·]+)/i) || [])[1] || (c.replace(/[^\s:·]+@[^\s·]+/g, '').match(/\+?\d[\d\s-]{7,}/) || [])[0] || '';
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 10 && d.length <= 15 ? d : '';
};

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const scheduleOf = (b: Booking, id: boolean) => {
  if (!b.date || !b.time) return id ? 'Tanpa jadwal tetap, aku akan menghubungimu di sini' : 'No fixed time, I’ll message you here';
  const day = new Date(`${b.date}T12:00:00+07:00`).toLocaleDateString(id ? 'id-ID' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const [h, m] = b.time.split(':').map(Number);
  return `${day} · ${b.time}–${hhmm(h * 60 + m + (b.durationMin > 0 ? b.durationMin : 60))} ${id ? 'WIB' : '(Jakarta time)'}`;
};

// the same amount the Sales and Revenue pages count (paid online → the exact charge)
const totalOf = (b: Booking) => { const a = amountForBooking(b); return a ? fmtMoney(a.amount, a.currency) : ''; };

export const confirmationText = (b: Booking) => {
  const id = b.market === 'ID';
  const first = (b.name || '').trim().split(/\s+/)[0] || (id ? 'kamu' : 'there');
  const service = (b.serviceName || '').split(' · ').filter((p) => !/^(Rp|\$)/i.test(p.trim())).join(' · ');
  const total = totalOf(b);
  const paid = b.paymentStatus === 'paid';
  // Konsultasi via Chat has no time: the customer sends their question and gets a voice note back
  const chat = b.serviceId === 'chat' || /via chat/i.test(b.serviceName || '');
  return id
    ? [
        `Halo ${first}, booking kamu di Mayanov Tarot sudah terkonfirmasi ✨`,
        '',
        `Layanan: ${service}`,
        chat ? null : `Jadwal: ${scheduleOf(b, true)}`,
        total ? `Total: ${total}${paid ? ' (lunas)' : ''}` : null,
        '',
        chat
          ? 'Silahkan drop konteks dan pertanyaannya, hasil akan aku jawab segera melalui voice note. Terima kasih! ☺️'
          : 'Kalo ada yang mau ditanya bisa langsung chat aja yaa. See you! ☺️',
      ].filter((l) => l !== null).join('\n')
    : [
        `Hi ${first}, your booking with Mayanov Tarot is confirmed ✨`,
        '',
        `Service: ${service}`,
        `When: ${scheduleOf(b, false)}`,
        total ? `Total: ${total}${paid ? ' (paid)' : ''}` : null,
        '',
        'If there’s anything you’d like to ask, just message me here. See you! ☺️',
      ].filter((l) => l !== null).join('\n');
};

const sentLabel = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

/** `compact`: a small pill for table rows (the Sales table) */
const WaConfirmButton: React.FC<{ b: Booking; onSent: (at: string) => void; compact?: boolean }> = ({ b, onSent, compact }) => {
  const [busy, setBusy] = useState(false);
  const number = waNumberOf(b.contact);
  if (!number) return null;
  const send = async () => {
    // open WhatsApp first (in the click, so it isn't blocked as a pop-up), then record it
    // api.whatsapp.com rather than wa.me: wa.me's redirect garbles emoji into "�" on
    // WhatsApp Web and the desktop app
    window.open(`https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(confirmationText(b))}`, '_blank', 'noopener');
    setBusy(true);
    try {
      const token = localStorage.getItem('authToken');
      const r = await fetch(`/api/admin/bookings/${encodeURIComponent(b.id)}/wa-confirmed`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.waConfirmSentAt) onSent(data.waConfirmSentAt);
    } catch { /* WhatsApp still opened; only the note is missing */ } finally { setBusy(false); }
  };
  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); send(); }}
        disabled={busy}
        title={b.waConfirmSentAt ? `Konfirmasi dikirim ${sentLabel(b.waConfirmSentAt)} · klik untuk kirim lagi` : 'Kirim konfirmasi WhatsApp'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors disabled:opacity-50 ${b.waConfirmSentAt ? 'text-text-subtle hover:text-text-light hover:bg-adm-hover-2' : 'border border-adm-line-2 text-text-light font-medium hover:bg-adm-hover-2'}`}
      >
        <span className={b.waConfirmSentAt ? '' : 'text-[#1fae55]'}><FaWhatsapp size={13} /></span>
        {b.waConfirmSentAt ? `Dikirim ${sentLabel(b.waConfirmSentAt).split(',')[0]}` : 'Konfirmasi'}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${b.waConfirmSentAt ? 'bg-adm-hover-2 text-text-light hover:bg-adm-hover-3' : 'bg-[#25D366] text-[#0b2e17] hover:bg-[#1fbe5b]'}`}
      >
        <FaWhatsapp size={15} />
        {b.waConfirmSentAt ? 'Kirim lagi' : 'Kirim konfirmasi WhatsApp'}
      </button>
      {b.waConfirmSentAt && <span className="text-xs text-text-subtle">✓ Konfirmasi dikirim {sentLabel(b.waConfirmSentAt)}</span>}
    </div>
  );
};

export default WaConfirmButton;
