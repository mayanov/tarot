import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

// the two messages: the payment request and the confirmation (as it always was)
const KIND = {
  pay: { text: paymentRequestText, path: 'wa-pay-asked', field: 'waPayAskSentAt', label: 'Ask to pay', hint: 'Total, BCA and QRIS (copied to paste)' },
  confirm: { text: confirmationText, path: 'wa-confirmed', field: 'waConfirmSentAt', label: 'Send confirmation', hint: 'Booked, with the date and total' },
} as const;
type Kind = keyof typeof KIND;
export type WaField = (typeof KIND)[Kind]['field'];

/** One WhatsApp button: a click opens a little menu with the two messages, Ask to pay and
 *  Send confirmation (each says when it was last sent). Picking one opens Mayanov's
 *  WhatsApp on the customer's chat with it typed in, and remembers it was sent; Ask to pay
 *  also copies the QRIS picture to paste after it (onNote says whether that worked). The
 *  button itself shows the latest one sent. The menu is fixed to the screen, so a table
 *  that clips its rows doesn't cut it off. */
const WaConfirmButton: React.FC<{ b: Booking; onSent: (field: WaField, at: string) => void; onNote?: (text: string, kind: 'ok' | 'err') => void; compact?: boolean }> = ({ b, onSent, onNote }) => {
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const number = waNumberOf(b.contact);
  const paid = b.paymentStatus === 'paid';
  // have the QRIS ready before it's asked for
  useEffect(() => { if (menu && !paid) qrisPng().catch(() => { /* tried again on the click */ }); }, [menu, paid]);
  // closes on a click elsewhere, Escape, scrolling or resizing
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close); window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true);
    };
  }, [menu]);
  if (!number) return null;

  const send = async (kind: Kind) => {
    const k = KIND[kind];
    setMenu(null);
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
      if (r.ok && data[k.field]) onSent(k.field, data[k.field]);
    } catch { /* WhatsApp still opened; only the note is missing */ } finally { setBusy(false); }
  };

  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menu) { setMenu(null); return; }
    const r = btnRef.current!.getBoundingClientRect();
    const W = 256, H = 132;
    const up = r.bottom + H + 8 > window.innerHeight;
    setMenu({ top: up ? r.top - 6 : r.bottom + 6, left: Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)), up });
  };

  // the button shows the latest message sent: the confirmation, else the payment request
  const last = b.waConfirmSentAt ? `Confirmed ${sentLabel(b.waConfirmSentAt).split(',')[0]}`
    : b.waPayAskSentAt && !paid ? `Asked to pay ${sentLabel(b.waPayAskSentAt).split(',')[0]}` : '';
  const Item: React.FC<{ kind: Kind; disabled?: string }> = ({ kind, disabled }) => {
    const k = KIND[kind];
    const at = b[k.field];
    return (
      <button type="button" disabled={!!disabled} onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); send(kind); }}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-adm-hover disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text-light">{k.label}</span>
          {at && <span className="text-[0.7rem] text-text-subtle whitespace-nowrap">sent {sentLabel(at).split(',')[0]}</span>}
        </span>
        <span className="block text-xs text-text-subtle mt-0.5">{disabled || k.hint}</span>
      </button>
    );
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={open} onMouseDown={(e) => e.stopPropagation()} disabled={busy} aria-haspopup="menu" aria-expanded={!!menu}
        title={last ? `${last} · click to send a message` : 'Send a WhatsApp message: ask to pay, or the confirmation'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors disabled:opacity-50 ${last ? 'text-text-subtle hover:text-text-light hover:bg-adm-hover-2' : 'border border-adm-line-2 text-text-light font-medium hover:bg-adm-hover-2'}`}>
        <span className={last ? '' : 'text-[#1fae55]'}><FaWhatsapp size={13} /></span>
        {last || 'WhatsApp'}
        <ChevronDown size={12} className={`transition-transform ${menu ? 'rotate-180' : ''}`} />
      </button>
      {qrFailed && (
        <button type="button" title="Copy the QRIS picture, to paste it in the chat"
          onClick={(e) => { e.stopPropagation(); copyQris().then((ok) => { setQrFailed(!ok); onNote?.(ok ? 'QRIS copied: paste it in the chat.' : 'Couldn’t copy the QRIS on this browser.', ok ? 'ok' : 'err'); }); }}
          className="inline-flex items-center px-2.5 py-1 rounded-md border border-adm-line-2 text-xs font-medium text-text-light hover:bg-adm-hover-2 whitespace-nowrap">Copy QRIS</button>
      )}
      {menu && (
        <div role="menu" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          className="fixed z-[120] w-64 p-1.5 rounded-xl bg-surface-1 border border-adm-line-2 shadow-2xl"
          style={{ top: menu.top, left: menu.left, transform: menu.up ? 'translateY(-100%)' : undefined }}>
          <Item kind="pay" disabled={paid ? 'Already paid' : undefined} />
          <Item kind="confirm" />
        </div>
      )}
    </>
  );
};

export default WaConfirmButton;
