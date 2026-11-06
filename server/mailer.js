// Emails to customers, sent from Mayanov's own Gmail (tarotreadingbymayanov@gmail.com)
// through the Gmail API, signed in with the same owner OAuth as the calendar invites
// (GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN, scripts/google-calendar-auth.mjs,
// which asks for the gmail.send scope too). Free, sent as an ordinary Gmail message, so
// it lands in her Sent folder and the customer's reply comes back to her inbox.
//
// Today: the "payment received" email for the global bookings, once paid: by PayPal in
// the form, or marked Paid in the dashboard. Indonesian customers get no email: they're
// looked after on WhatsApp.

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

const ID_SERVICES = new Set(['chat', 'call', 'meetup', 'special']);
/** Indonesian bookings are followed up on WhatsApp, never by email */
export const isIndonesian = (b) => b.market === 'ID' || ID_SERVICES.has(b.serviceId);

// the session's day and time, in Jakarta time as booked
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function scheduleOf(b) {
  if (!b.date || !b.time) return '';
  const [y, mo, d] = b.date.split('-').map(Number);
  const [h, mi] = b.time.split(':').map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  const t = `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${DAYS[wd]}, ${d} ${MONTHS[mo - 1]} ${y} · ${t} Jakarta time (WIB, UTC+7)${b.durationMin ? ` · ${b.durationMin} minutes` : ''}`;
}

// what happens next, for the sessions with a time
const NEXT = {
  live: 'A calendar invite with the Google Meet link comes in a separate email, showing the time in your own time zone. When it’s time, just join from the link.',
};

/** "payment received" for a paid global booking: { to, subject, text, html } */
export function paidEmail(booking, amount) {
  const to = emailOf(booking.contact);
  const first = (booking.name || '').trim().split(/\s+/)[0] || 'there';
  const service = booking.serviceName || 'tarot reading';
  const price = amount ? `$${amount}` : '';
  const method = /^paypal/i.test(booking.paymentMethod || '') ? 'PayPal' : '';
  const reading = WHEN[booking.serviceId]; // an email reading (3-Card / 5-Card)
  const question = reading ? String(booking.question || '').trim() : '';
  // an email reading without its question yet: the customer replies to this email with it
  const ask = reading && !question;
  // the booking code first, so every email (and every reply, "Re: …") is easy to find
  const subject = `${booking.ref ? `${booking.ref} · ` : ''}Your ${service} is booked${ask ? ': reply with your question' : ''} ✨`;

  const paras = [
    `Hi ${first},`,
    `Thank you, your payment${price ? ` of **${price}**` : ''} has come through and your ${service} is booked.`,
    ask
      ? null
      : reading
      ? `I’ll sit down with the cards for your question and send your reading to this email **${reading}**.`
      : NEXT[booking.serviceId] || 'I’ll be in touch about the next step soon.',
  ].filter(Boolean);
  // the one thing left to do: reply with the question and some context
  const askTitle = 'One more step: reply to this email';
  const askItems = [
    ['Your question', 'what you’d like the cards to look at.'],
    ['A little context', 'what’s going on, who’s involved, and what you’re hoping to understand. The more I know, the clearer your reading.'],
  ];
  const askAfter = `Once your reply is in, I’ll sit down with the cards and send your reading to this email **${reading}**.`;
  const rows = [
    [reading ? 'Reading' : 'Session', service],
    ['When', reading ? '' : scheduleOf(booking)],
    ['Total', price],
    ['Paid with', method],
    ['Booking code', booking.ref],
  ].filter(([, v]) => v);
  const closing = ask
    ? 'Just hit reply. Keep the subject as it is, so your question finds your booking.'
    : reading
    ? 'If you’d like to add anything to your question, just reply to this email.'
    : 'Any questions before then? Just reply to this email.';

  const text = [
    ...paras.map((p) => p.replace(/\*\*/g, '')).flatMap((p) => [p, '']),
    ...(ask ? [`${askTitle.toUpperCase()}`, ...askItems.map(([k, v]) => `- ${k}: ${v}`), '', askAfter.replace(/\*\*/g, ''), ''] : []),
    question ? `Your question:\n“${question}”\n` : null,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    closing,
    '',
    'Warmly,',
    'Mayanov',
    `Mayanov Tarot · ${SITE.replace('https://', '')}`,
  ].filter((l) => l !== null).join('\n');

  // set like the site: ink on cream paper, a serif for the words that matter
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#efe9dd;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9dd;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#f8f5ee;border-radius:6px;">
<tr><td style="padding:36px 36px 8px;font-family:${serif};color:#2B2426;">
  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6B3FA0;">Mayanov Tarot</div>
  <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#2B2426;">Your ${esc(service)} is booked</h1>
</td></tr>
<tr><td style="padding:16px 36px 4px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
${paras.map((p) => `  <p style="margin:0 0 14px;">${rich(p)}</p>`).join('\n')}
</td></tr>
${ask ? `<tr><td style="padding:4px 36px 6px;">
  <div style="background:#efe7f6;border-radius:6px;padding:18px 20px;font-family:${sans};font-size:15px;line-height:1.6;color:#3d3436;">
    <div style="font-family:${serif};font-size:19px;font-weight:600;color:#6B3FA0;margin:0 0 10px;">${esc(askTitle)}</div>
${askItems.map(([k, v]) => `    <p style="margin:0 0 8px;"><strong style="color:#2B2426;">${esc(k)}:</strong> ${esc(v)}</p>`).join('\n')}
    <p style="margin:12px 0 0;">${rich(askAfter)}</p>
  </div>
</td></tr>` : ''}
${question ? `<tr><td style="padding:6px 36px 6px;">
  <div style="border-left:2px solid #b9a3d6;padding:4px 0 4px 16px;font-family:${serif};font-style:italic;font-size:17px;line-height:1.5;color:#2B2426;">“${esc(question).replace(/\n/g, '<br>')}”</div>
</td></tr>` : ''}
<tr><td style="padding:18px 36px 4px;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${sans};font-size:13px;line-height:1.6;color:#3d3436;">
${rows.map(([k, v]) => `    <tr><td style="padding:2px 18px 2px 0;color:#7a6f70;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:2px 0;">${esc(v)}</td></tr>`).join('\n')}
  </table>
</td></tr>
<tr><td style="padding:22px 36px 34px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
  <p style="margin:0 0 14px;">${esc(closing)}</p>
  <p style="margin:0;font-family:${serif};font-size:17px;color:#2B2426;">Warmly,<br>Mayanov</p>
</td></tr>
</table>
<div style="padding:16px;font-family:${sans};font-size:12px;color:#8a7f80;"><a href="${SITE}" style="color:#8a7f80;text-decoration:none;">${SITE.replace('https://', '')}</a></div>
</td></tr></table></body></html>`;

  return { to, subject, text, html };
}

/** sends the "payment received" email; false for Indonesian bookings, no address, or a failed send */
export async function sendPaid(booking, amount) {
  if (isIndonesian(booking)) return false;
  const msg = paidEmail(booking, amount);
  if (!msg.to) { console.log('[mail] paid booking has no email, skipped:', booking.ref || booking.id); return false; }
  return send(msg);
}
