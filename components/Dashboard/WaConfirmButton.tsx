import React, { useEffect, useState } from 'react';
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
  // "+81 90…" (global form: country code first) is kept as it is; a local number is Indonesian
  if (raw.trim().startsWith('+')) { /* already international */ }
  else if (d.startsWith('0')) d = '62' + d.slice(1);
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

// "Ask to pay": the total and how to pay it (BCA transfer, or the QRIS picture Mayanov
// sends right after, since a link can't carry an image), and to send the proof here
const BANK = { name: 'BCA', number: '2671708182', holder: 'Maya Noviana' };
export const paymentRequestText = (b: Booking) => {
  const id = b.market === 'ID';
  const first = (b.name || '').trim().split(/\s+/)[0] || (id ? 'kamu' : 'there');
  const service = (b.serviceName || '').split(' · ').filter((p) => !/^(Rp|\$)/i.test(p.trim())).join(' · ');
  const total = totalOf(b);
  const timed = !!(b.date && b.time);
  return id
    ? [
        `Halo ${first}, terima kasih sudah booking di Mayanov Tarot ✨`,
        '',
        `Layanan: ${service}`,
        timed ? `Jadwal: ${scheduleOf(b, true)}` : null,
        total ? `Total: ${total}` : null,
        '',
        'Pembayarannya bisa lewat:',
        `• Transfer ${BANK.name} ${BANK.number} a.n. ${BANK.holder}`,
        '• QRIS (gambarnya aku kirim di bawah ini)',
        '',
        'Kalau sudah, kirim bukti bayarnya di sini ya. Terima kasih! ☺️',
      ].filter((l) => l !== null).join('\n')
    : [
        `Hi ${first}, thank you for booking with Mayanov Tarot ✨`,
        '',
        `Service: ${service}`,
        timed ? `When: ${scheduleOf(b, false)}` : null,
        total ? `Total: ${total}` : null,
        '',
        'I’ll send the payment link right here. Once it’s paid, you’re all set! ☺️',
      ].filter((l) => l !== null).join('\n');
};

const sentLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

// The QRIS sticker (public/payment-qris-full.jpg) as a PNG, the one picture type every
// browser can put on the clipboard. Made once, ahead of the click, so copying it is instant.
let qrisPromise: Promise<Blob> | null = null;
const qrisPng = (): Promise<Blob> => (qrisPromise ||= fetch('/payment-qris-full.jpg')
  .then((r) => { if (!r.ok) throw new Error('QRIS image'); return r.blob(); })
  .then((blob) => createImageBitmap(blob))
  .then((bmp) => new Promise<Blob>((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    c.toBlob((png) => (png ? resolve(png) : reject(new Error('QRIS png'))), 'image/png');
  }))
  .catch((e) => { qrisPromise = null; throw e; }));
/** puts the QRIS picture on the clipboard, to paste into the chat; true when it worked.
 *  Called straight from the click (browsers only allow it then), before WhatsApp opens. */
export const copyQris = (): Promise<boolean> => {
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return Promise.resolve(false);
    return navigator.clipboard.write([new ClipboardItem({ 'image/png': qrisPng() })]).then(() => true, () => false);
  } catch { return Promise.resolve(false); }
};

// the two messages: the confirmation (as it always was) and the payment request
const KIND = {
  confirm: { text: confirmationText, path: 'wa-confirmed', field: 'waConfirmSentAt', label: 'Confirm', what: 'Confirmation' },
  pay: { text: paymentRequestText, path: 'wa-pay-asked', field: 'waPayAskSentAt', label: 'Ask to pay', what: 'Payment request' },
} as const;

/** a small pill: opens WhatsApp with the message typed in, then remembers it was sent.
 *  kind 'confirm' (default) is the confirmation, 'pay' asks for the payment: it also copies
 *  the QRIS picture, to paste into the chat (onNote says whether that worked; when it
 *  didn't, a "Copy QRIS" button appears beside it to try again) */
const WaConfirmButton: React.FC<{ b: Booking; onSent: (at: string) => void; compact?: boolean; kind?: 'confirm' | 'pay'; onNote?: (text: string, kind: 'ok' | 'err') => void }> = ({ b, onSent, kind = 'confirm', onNote }) => {
  const [busy, setBusy] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  // have the QRIS ready before the click
  useEffect(() => { if (kind === 'pay') qrisPng().catch(() => { /* tried again on the click */ }); }, [kind]);
  const number = waNumberOf(b.contact);
  if (!number) return null;
  const k = KIND[kind];
  const sentAt = b[k.field];
  const send = async () => {
    // the QRIS on the clipboard first (it has to start in the click, while this page has focus)
    if (kind === 'pay') {
      copyQris().then((ok) => {
        setQrFailed(!ok);
        onNote?.(ok ? 'QRIS copied: paste it in the chat after the message.' : 'Couldn’t copy the QRIS. Use “Copy QRIS”, then paste it in the chat.', ok ? 'ok' : 'err');
      });
    }
    // open WhatsApp first (in the click, so it isn't blocked as a pop-up), then record it
    // api.whatsapp.com rather than wa.me: wa.me's redirect garbles emoji into "�" on
    // WhatsApp Web and the desktop app
    window.open(`https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(k.text(b))}`, '_blank', 'noopener');
    setBusy(true);
    try {
      const token = localStorage.getItem('authToken');
      const r = await fetch(`/api/admin/bookings/${encodeURIComponent(b.id)}/${k.path}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data[k.field]) onSent(data[k.field]);
    } catch { /* WhatsApp still opened; only the note is missing */ } finally { setBusy(false); }
  };
  const pill = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); send(); }}
      disabled={busy}
      title={sentAt ? `${k.what} sent ${sentLabel(sentAt)} · click to send again` : `Send the ${k.what.toLowerCase()} on WhatsApp`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors disabled:opacity-50 ${sentAt ? 'text-text-subtle hover:text-text-light hover:bg-adm-hover-2' : 'border border-adm-line-2 text-text-light font-medium hover:bg-adm-hover-2'}`}
    >
      <span className={sentAt ? '' : 'text-[#1fae55]'}><FaWhatsapp size={13} /></span>
      {sentAt ? `${kind === 'pay' ? 'Asked' : 'Sent'} ${sentLabel(sentAt).split(',')[0]}` : k.label}
    </button>
  );
  if (!qrFailed) return pill;
  return (
    <>
      {pill}
      <button type="button" title="Copy the QRIS picture, to paste it in the chat"
        onClick={(e) => { e.stopPropagation(); copyQris().then((ok) => { setQrFailed(!ok); onNote?.(ok ? 'QRIS copied: paste it in the chat.' : 'Couldn’t copy the QRIS on this browser.', ok ? 'ok' : 'err'); }); }}
        className="inline-flex items-center px-2.5 py-1 rounded-md border border-adm-line-2 text-xs font-medium text-text-light hover:bg-adm-hover-2 whitespace-nowrap">Copy QRIS</button>
    </>
  );
};

export default WaConfirmButton;
