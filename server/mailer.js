// Emails to customers, sent from Mayanov's own Gmail (tarotreadingbymayanov@gmail.com)
// through the Gmail API, signed in with the same owner OAuth as the calendar invites
// (GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN, scripts/google-calendar-auth.mjs,
// which asks for the gmail.send scope too). Free, sent as an ordinary Gmail message, so
// it lands in her Sent folder and the customer's reply comes back to her inbox.
//
// Today: the "payment received" note for an email reading (3-Card / 5-Card) paid with
// PayPal in the form.

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

/** "payment received" for an email reading (3-Card / 5-Card) paid with PayPal */
export function paidReadingEmail(booking, amount) {
  const to = emailOf(booking.contact);
  const first = (booking.name || '').trim().split(/\s+/)[0] || 'there';
  const reading = booking.serviceName || 'tarot reading';
  const when = WHEN[booking.serviceId] || 'soon';
  const question = String(booking.question || '').trim();
  const price = amount ? `$${amount}` : '';
  const subject = `Your ${reading} is booked ✨`;

  const text = [
    `Hi ${first},`,
    '',
    `Thank you, your payment${price ? ` of ${price}` : ''} has come through and your ${reading} is booked.`,
    '',
    `I'll sit down with the cards for your question and send your reading to this email ${when}.`,
    '',
    question ? `Your question:\n“${question}”\n` : null,
    `Order: ${reading}${price ? ` · ${price}` : ''} · paid with PayPal`,
    '',
    'If you’d like to add anything to your question, just reply to this email.',
    '',
    'Warmly,',
    'Mayanov',
    `Mayanov Tarot · ${SITE.replace('https://', '')}`,
  ].filter((l) => l !== null).join('\n');

  // set like the site: ink on cream paper, a serif for the words that matter
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#efe9dd;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9dd;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#f8f5ee;border-radius:6px;">
<tr><td style="padding:36px 36px 8px;font-family:${serif};color:#2B2426;">
  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6B3FA0;">Mayanov Tarot</div>
  <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#2B2426;">Your ${esc(reading)} is booked</h1>
</td></tr>
<tr><td style="padding:16px 36px 4px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
  <p style="margin:0 0 14px;">Hi ${esc(first)},</p>
  <p style="margin:0 0 14px;">Thank you, your payment${price ? ` of <strong>${esc(price)}</strong>` : ''} has come through and your ${esc(reading)} is booked.</p>
  <p style="margin:0 0 14px;">I’ll sit down with the cards for your question and send your reading to this email <strong>${esc(when)}</strong>.</p>
</td></tr>
${question ? `<tr><td style="padding:6px 36px 6px;">
  <div style="border-left:2px solid #b9a3d6;padding:4px 0 4px 16px;font-family:${serif};font-style:italic;font-size:17px;line-height:1.5;color:#2B2426;">“${esc(question).replace(/\n/g, '<br>')}”</div>
</td></tr>` : ''}
<tr><td style="padding:18px 36px 4px;font-family:${sans};font-size:13px;line-height:1.6;color:#7a6f70;">
  ${esc(reading)}${price ? ` · ${esc(price)}` : ''} · paid with PayPal
</td></tr>
<tr><td style="padding:18px 36px 34px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
  <p style="margin:0 0 14px;">If you’d like to add anything to your question, just reply to this email.</p>
  <p style="margin:0;font-family:${serif};font-size:17px;color:#2B2426;">Warmly,<br>Mayanov</p>
</td></tr>
</table>
<div style="padding:16px;font-family:${sans};font-size:12px;color:#8a7f80;"><a href="${SITE}" style="color:#8a7f80;text-decoration:none;">${SITE.replace('https://', '')}</a></div>
</td></tr></table></body></html>`;

  return { to, subject, text, html };
}

export async function sendPaidReading(booking, amount) {
  const msg = paidReadingEmail(booking, amount);
  if (!msg.to) { console.error('[mail] paid reading has no email:', booking.id); return false; }
  return send(msg);
}
