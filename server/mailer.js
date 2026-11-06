// Emails to customers, sent from Mayanov's own Gmail (tarotreadingbymayanov@gmail.com)
// through the Gmail API, signed in with the same owner OAuth as the calendar invites
// (GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN, scripts/google-calendar-auth.mjs,
// which asks for the gmail.send scope too). Free, sent as an ordinary Gmail message, so
// it lands in her Sent folder and the customer's reply comes back to her inbox.
//
// Today: the "payment received" email, once a booking made on the site is paid: by
// PayPal or Midtrans in the form, or marked Paid in the dashboard. English for the
// global readings, Indonesian for the Indonesian services.

import { OAuth2Client } from 'google-auth-library';

const FROM_NAME = 'Mayanov Tarot';
const FROM = 'tarotreadingbymayanov@gmail.com';
const SITE = 'https://tarotreadingbymayanov.com';

let client = null;
function getClient() {
  if (client) return client;
  const { GOOGLE_OAUTH_CLIENT_ID: id, GOOGLE_OAUTH_CLIENT_SECRET: secret, GOOGLE_OAUTH_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return null;
  client = new OAuth2Client({ clientId: id, clientSecret: secret });
  client.setCredentials({ refresh_token: refresh });
  return client;
}

export const configured = () => !!getClient();

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const b64url = (s) => b64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// a header with emoji or accents in it (RFC 2047)
const word = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** an HTML + plain-text message, as Gmail's API wants it (base64url of the raw MIME) */
export function buildRaw({ to, subject, text, html }) {
  const boundary = `mt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const mime = [
    `From: ${word(FROM_NAME)} <${FROM}>`,
    `To: ${to}`,
    `Reply-To: ${FROM}`,
    `Subject: ${word(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64(text).replace(/.{76}/g, '$&\r\n'),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64(html).replace(/.{76}/g, '$&\r\n'),
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return b64url(mime);
}

async function send(message) {
  const c = getClient();
  if (!c) { console.log(`[mail] not set up (no owner sign-in); would have sent "${message.subject}" to ${message.to}`); return false; }
  try {
    await c.request({
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      method: 'POST',
      data: { raw: buildRaw(message) },
      timeout: 10000,
    });
    console.log(`[mail] sent "${message.subject}" to ${message.to}`);
    return true;
  } catch (e) {
    const why = e.response?.data?.error?.message || e.message;
    // the sign-in from before email was added only covers the calendar
    if (/insufficient|scope/i.test(why)) console.error('[mail] Gmail sending not allowed yet: run scripts/google-calendar-auth.mjs again (it now asks for gmail.send), then redeploy');
    else console.error('[mail] send failed:', why);
    return false;
  }
}

/** the customer's email from the booking's contact line ("WA: … · Email: …" or a bare address) */
export const emailOf = (contact = '') => (String(contact).match(/[^\s:·<>]+@[^\s·<>]+\.[a-z]{2,}/i) || [])[0] || '';
// when each email reading arrives, as the site promises it (Services, FAQ)
const WHEN = {
  '3card': 'within 24 hours',
  '5card': 'within 24 hours',
};

const WA = '6287786280310'; // business WhatsApp (same as the site's)
const ID_SERVICES = new Set(['chat', 'call', 'meetup', 'special']);
export const isIndonesian = (b) => b.market === 'ID' || ID_SERVICES.has(b.serviceId);

// how it was paid, from the booking's paymentMethod ("PayPal", "Midtrans · qris", …)
const MIDTRANS_METHOD = {
  qris: 'QRIS', gopay: 'GoPay', shopeepay: 'ShopeePay', bank_transfer: 'transfer bank',
  echannel: 'Mandiri Bill', permata: 'transfer bank', credit_card: 'kartu',
  cstore: 'minimarket', akulaku: 'Akulaku', kredivo: 'Kredivo', dana: 'DANA',
};
function methodOf(pm = '') {
  if (/^paypal/i.test(pm)) return 'PayPal';
  const m = String(pm).match(/^Midtrans · (.+)$/);
  return m ? MIDTRANS_METHOD[m[1]] || m[1] : '';
}

const money = (amount, currency) => {
  if (!amount) return '';
  return currency === 'IDR' ? `Rp ${Math.round(Number(amount)).toLocaleString('id-ID')}` : `$${amount}`;
};

// the session's day and time, in Jakarta time as booked
const ID_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ID_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function scheduleOf(b, id) {
  if (!b.date || !b.time) return '';
  const [y, mo, d] = b.date.split('-').map(Number);
  const [h, mi] = b.time.split(':').map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  const mins = b.durationMin ? (id ? ` (${b.durationMin} menit)` : ` · ${b.durationMin} minutes`) : '';
  if (id) return `${ID_DAYS[wd]}, ${d} ${ID_MONTHS[mo - 1]} ${y} · ${String(h).padStart(2, '0')}.${String(mi).padStart(2, '0')} WIB${mins}`;
  const t = `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${EN_DAYS[wd]}, ${d} ${EN_MONTHS[mo - 1]} ${y} · ${t} Jakarta time (WIB, UTC+7)${mins}`;
}

// what happens next, per service
const NEXT_ID = {
  call: 'Undangan kalender dan link Google Meet dikirim terpisah ke email ini. Saat jadwal tiba, tinggal klik link-nya.',
  meetup: 'Undangan kalender dengan detail tempatnya dikirim terpisah ke email ini. Aku juga akan menghubungimu via WhatsApp sebelum sesi.',
  chat: 'Aku akan menghubungimu via WhatsApp untuk memulai konsultasinya.',
};
const NEXT_EN = {
  live: 'A calendar invite with the Google Meet link comes in a separate email, showing the time in your own time zone. When it’s time, just join from the link.',
};

/** "payment received" for any paid booking: { to, subject, text, html } */
export function paidEmail(booking, { amount, currency } = {}) {
  const id = isIndonesian(booking);
  const to = emailOf(booking.contact);
  const first = (booking.name || '').trim().split(/\s+/)[0] || (id ? 'kamu' : 'there');
  const service = booking.serviceName || (id ? 'sesi tarot' : 'tarot reading');
  const price = money(amount, currency);
  const method = methodOf(booking.paymentMethod);
  const schedule = scheduleOf(booking, id);
  // the question is shown back for the readings answered in writing
  const question = WHEN[booking.serviceId] || booking.serviceId === 'chat' ? String(booking.question || '').trim() : '';

  let subject, heading, paras, rows, closing, signoff;
  if (id) {
    subject = 'Booking-mu terkonfirmasi ✨';
    heading = 'Pembayaranmu sudah masuk';
    paras = [
      `Hai ${first},`,
      `Terima kasih, pembayaranmu${price ? ` sebesar **${price}**` : ''} sudah kuterima dan booking-mu terkonfirmasi.`,
      NEXT_ID[booking.serviceId] || 'Aku akan menghubungimu via WhatsApp untuk langkah berikutnya.',
    ];
    rows = [['Layanan', service], ['Jadwal', schedule], ['Total', price], ['Dibayar via', method], ['Kode booking', booking.ref]];
    closing = 'Ada yang ingin ditanyakan? Balas email ini atau chat aku di WhatsApp.';
    signoff = 'Salam hangat,';
  } else if (WHEN[booking.serviceId]) {
    subject = `Your ${service} is booked ✨`;
    heading = `Your ${service} is booked`;
    paras = [
      `Hi ${first},`,
      `Thank you, your payment${price ? ` of **${price}**` : ''} has come through and your ${service} is booked.`,
      `I’ll sit down with the cards for your question and send your reading to this email **${WHEN[booking.serviceId]}**.`,
    ];
    rows = [['Reading', service], ['Total', price], ['Paid with', method], ['Booking code', booking.ref]];
    closing = 'If you’d like to add anything to your question, just reply to this email.';
    signoff = 'Warmly,';
  } else {
    subject = `Your ${service} is booked ✨`;
    heading = `Your ${service} is booked`;
    paras = [
      `Hi ${first},`,
      `Thank you, your payment${price ? ` of **${price}**` : ''} has come through and your ${service} is booked.`,
      NEXT_EN[booking.serviceId] || 'I’ll be in touch about the next step soon.',
    ];
    rows = [['Session', service], ['When', schedule], ['Total', price], ['Paid with', method], ['Booking code', booking.ref]];
    closing = 'Any questions before then? Just reply to this email.';
    signoff = 'Warmly,';
  }
  rows = rows.filter(([, v]) => v);
  const qLabel = id ? 'Pertanyaanmu' : 'Your question';

  const plain = (s) => s.replace(/\*\*/g, '');
  const text = [
    ...paras.map(plain).flatMap((p) => [p, '']),
    question ? `${qLabel}:\n“${question}”\n` : null,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    closing + (id ? ` https://wa.me/${WA}` : ''),
    '',
    signoff,
    'Mayanov',
    `Mayanov Tarot · ${SITE.replace('https://', '')}`,
  ].filter((l) => l !== null).join('\n');

  // set like the site: ink on cream paper, a serif for the words that matter
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const closingHtml = id
    ? esc(closing).replace('chat aku di WhatsApp', `chat aku di <a href="https://wa.me/${WA}" style="color:#6B3FA0;">WhatsApp</a>`)
    : esc(closing);
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#efe9dd;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9dd;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#f8f5ee;border-radius:6px;">
<tr><td style="padding:36px 36px 8px;font-family:${serif};color:#2B2426;">
  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6B3FA0;">Mayanov Tarot</div>
  <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#2B2426;">${esc(heading)}</h1>
</td></tr>
<tr><td style="padding:16px 36px 4px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
${paras.map((p) => `  <p style="margin:0 0 14px;">${rich(p)}</p>`).join('\n')}
</td></tr>
${question ? `<tr><td style="padding:6px 36px 6px;">
  <div style="font-family:${sans};font-size:12px;color:#7a6f70;margin:0 0 6px;">${esc(qLabel)}</div>
  <div style="border-left:2px solid #b9a3d6;padding:4px 0 4px 16px;font-family:${serif};font-style:italic;font-size:17px;line-height:1.5;color:#2B2426;">“${esc(question).replace(/\n/g, '<br>')}”</div>
</td></tr>` : ''}
<tr><td style="padding:18px 36px 4px;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${sans};font-size:13px;line-height:1.6;color:#3d3436;">
${rows.map(([k, v]) => `    <tr><td style="padding:2px 18px 2px 0;color:#7a6f70;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:2px 0;">${esc(v)}</td></tr>`).join('\n')}
  </table>
</td></tr>
<tr><td style="padding:22px 36px 34px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
  <p style="margin:0 0 14px;">${closingHtml}</p>
  <p style="margin:0;font-family:${serif};font-size:17px;color:#2B2426;">${esc(signoff)}<br>Mayanov</p>
</td></tr>
</table>
<div style="padding:16px;font-family:${sans};font-size:12px;color:#8a7f80;"><a href="${SITE}" style="color:#8a7f80;text-decoration:none;">${SITE.replace('https://', '')}</a></div>
</td></tr></table></body></html>`;

  return { to, subject, text, html };
}

/** sends the "payment received" email; false when there's no address or it didn't go */
export async function sendPaid(booking, paid) {
  const msg = paidEmail(booking, paid);
  if (!msg.to) { console.log('[mail] paid booking has no email, skipped:', booking.ref || booking.id); return false; }
  return send(msg);
}
