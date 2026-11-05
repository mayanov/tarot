// WhatsApp booking confirmation for the Indonesian site, through WhatsApp's official
// API (WhatsApp Business Platform / Cloud API, from Meta). A business may only start a
// conversation with a template Meta has approved, so the message's wording lives in
// WhatsApp Manager (template "booking_terkonfirmasi", language Indonesian — the exact
// text is in docs/whatsapp-setup.md) and this only fills in its five blanks.
//
// Env: WHATSAPP_TOKEN (a permanent System User token with whatsapp_business_messaging),
// WHATSAPP_PHONE_NUMBER_ID (WhatsApp Manager → Phone numbers), optionally
// WHATSAPP_TEMPLATE / WHATSAPP_TEMPLATE_LANG / WHATSAPP_API_VERSION. Without the token
// and number id nothing is sent and bookings work as before.

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const TEMPLATE = process.env.WHATSAPP_TEMPLATE || 'booking_terkonfirmasi';
const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'id';

export const configured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** The customer's WhatsApp number from the contact line ("WA: 0812 3456 7890 · Email: …"),
 *  as WhatsApp wants it: country code, digits only (0812… → 62812…). '' if there's none. */
export function waNumberOf(contact) {
  const raw = (String(contact || '').match(/WA:\s*([^·]+)/) || [])[1] || '';
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 10 && d.length <= 15 ? d : '';
}

// Template blanks can't be empty or hold line breaks, tabs or long runs of spaces.
const blank = (s, fallback = '-') => String(s || '').replace(/[\n\t]+/g, ' ').replace(/ {4,}/g, ' ').trim().slice(0, 200) || fallback;

const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** "Jumat, 13 Nov 2026 · 14:00–16:00 WIB", or how a reading without a time goes ahead */
export function scheduleText(b) {
  if (!b.date || !b.time) return 'Tanpa jadwal tetap, Mayanov akan menghubungimu di sini';
  const day = new Date(`${b.date}T12:00:00+07:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const [h, m] = b.time.split(':').map(Number);
  const end = hhmm(h * 60 + m + (b.durationMin > 0 ? b.durationMin : 60));
  return `${day} · ${b.time}–${end} WIB`;
}

const rupiah = (n) => (Number(n) > 0 ? `Rp ${Math.round(Number(n)).toLocaleString('id-ID')}` : '');

/** The five blanks of the template, in order: name, service, schedule, total, booking code */
export const confirmationParams = (b) => [
  blank(String(b.name || '').split(/\s+/)[0], 'kamu'),
  blank(b.serviceName),
  blank(scheduleText(b)),
  blank(rupiah(b.amountDue ?? b.amount), 'Lunas'),
  blank(b.ref || b.id),
];

/** Sends the confirmation; returns WhatsApp's message id. Throws with WhatsApp's reason. */
export async function sendBookingConfirmation(booking) {
  const to = waNumberOf(booking.contact);
  if (!to) throw new Error('no WhatsApp number on the booking');
  const r = await fetch(`https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: TEMPLATE,
        language: { code: TEMPLATE_LANG },
        components: [{ type: 'body', parameters: confirmationParams(booking).map((text) => ({ type: 'text', text })) }],
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${data.error?.message || 'send failed'}${data.error?.error_data?.details ? ` (${data.error.error_data.details})` : ''}`);
  return data.messages?.[0]?.id || '';
}
