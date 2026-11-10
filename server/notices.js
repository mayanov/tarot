// The emails that keep things moving without anyone watching the dashboard, all sent
// from Mayanov's Gmail like the "payment received" one (server/mailer.js):
//
//  To Mayanov
//   - a booking has been paid on the site (PayPal or Midtrans), as it happens
//   - an email reading is due in 5 hours and isn't marked done yet
//  To the customer (global bookings with an email; Indonesian ones are looked after on
//  WhatsApp)
//   - a Live Session tomorrow, and starting in an hour, with the Meet link
//   - their session moved, or cancelled, in the dashboard
//
// The timed ones (due soon, reminders) are sent by runChecks(), which something has to
// call every few minutes (GET /api/cron/tick). Each notice goes out once per booking: a
// claim (bookingStore.claimOnce) so two checks landing together can't both send it, and
// a stamp on the booking (…SentAt) so it's visible in the data.

import * as mailer from './mailer.js';
import * as bookingStore from './bookingStore.js';
import * as gcal from './googleCalendar.js';
import { PROMISE, dueOf, ADMIN_URL, warnBeforeMs, promisedOnSite } from './promise.js';

export { dueOf };

const SITE = 'https://tarotreadingbymayanov.com';
const OWNER = process.env.OWNER_EMAIL || 'tarotreadingbymayanov@gmail.com';
const HOUR = 3_600_000;
const MIN = 60_000;

// ---- times: sessions are booked in Jakarta time (WIB, UTC+7) ----
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** the instant a session starts */
export const startOf = (b) => {
  if (!b?.date || !b?.time) return NaN;
  const [y, mo, d] = b.date.split('-').map(Number);
  const [h, mi] = b.time.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - 7 * HOUR;
};
/** "Friday, 20 November 2026 · 3:00 PM Jakarta time (WIB, UTC+7)" for an instant */
const jakarta = (ms, { year = true } = {}) => {
  const t = new Date(ms + 7 * HOUR);
  const h = t.getUTCHours(), mi = t.getUTCMinutes();
  const clock = `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return `${DAYS[t.getUTCDay()]}, ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}${year ? ` ${t.getUTCFullYear()}` : ''} · ${clock} Jakarta time (WIB, UTC+7)`;
};
const span = (ms) => {
  const m = Math.max(0, Math.round(ms / MIN));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r && h < 10 ? `${h} h ${r} min` : `${h} h`;
};

const money = (b, amount) => {
  const a = amount || b.amountDue || '';
  if (!a) return b.price || '';
  return b.market === 'ID' ? `Rp ${Number(a).toLocaleString('id-ID')}` : `$${a}`;
};
const firstName = (b) => (b.name || '').trim().split(/\s+/)[0] || 'there';
const serviceOf = (b) => (b.serviceName || b.serviceId || 'tarot reading').split(' · ')[0].trim();

// ---- the letter: set like the "payment received" email (ink on cream, a serif for the
// words that matter); paragraphs take **bold** ----
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
function letter({ to, subject, kicker = 'Mayanov Tarot', heading, paras = [], quote = '', rows = [], button = null, closing = '', sign = true }) {
  rows = rows.filter(([, v]) => v);
  const text = [
    ...paras.flatMap((p) => [p.replace(/\*\*/g, ''), '']),
    quote ? `“${quote}”\n` : null,
    button ? `${button.label}: ${button.href}\n` : null,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    rows.length ? '' : null,
    closing || null,
    closing ? '' : null,
    ...(sign ? ['Warmly,', 'Mayanov', `Mayanov Tarot · ${SITE.replace('https://', '')}`] : []),
  ].filter((l) => l !== null).join('\n');
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#efe9dd;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9dd;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#f8f5ee;border-radius:6px;">
<tr><td style="padding:36px 36px 8px;font-family:${serif};color:#2B2426;">
  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6B3FA0;">${esc(kicker)}</div>
  <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#2B2426;">${esc(heading)}</h1>
</td></tr>
<tr><td style="padding:16px 36px 4px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
${paras.map((p) => `  <p style="margin:0 0 14px;">${rich(p)}</p>`).join('\n')}
</td></tr>
${quote ? `<tr><td style="padding:6px 36px 6px;">
  <div style="border-left:2px solid #b9a3d6;padding:4px 0 4px 16px;font-family:${serif};font-style:italic;font-size:17px;line-height:1.5;color:#2B2426;">“${esc(quote).replace(/\n/g, '<br>')}”</div>
</td></tr>` : ''}
${button ? `<tr><td style="padding:10px 36px 6px;">
  <a href="${esc(button.href)}" style="display:inline-block;background:#6B3FA0;color:#ffffff;font-family:${sans};font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:6px;">${esc(button.label)}</a>
</td></tr>` : ''}
${rows.length ? `<tr><td style="padding:18px 36px 4px;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${sans};font-size:13px;line-height:1.6;color:#3d3436;">
${rows.map(([k, v]) => `    <tr><td style="padding:2px 18px 2px 0;color:#7a6f70;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:2px 0;">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('\n')}
  </table>
</td></tr>` : ''}
<tr><td style="padding:22px 36px 34px;font-family:${sans};font-size:15px;line-height:1.65;color:#3d3436;">
  ${closing ? `<p style="margin:0 0 14px;">${rich(closing)}</p>` : ''}
  ${sign ? `<p style="margin:0;font-family:${serif};font-size:17px;color:#2B2426;">Warmly,<br>Mayanov</p>` : ''}
</td></tr>
</table>
<div style="padding:16px;font-family:${sans};font-size:12px;color:#8a7f80;"><a href="${SITE}" style="color:#8a7f80;text-decoration:none;">${SITE.replace('https://', '')}</a></div>
</td></tr></table></body></html>`;
  return { to, subject, text, html };
}

const dashboard = { label: 'Open the dashboard', href: ADMIN_URL };
const tag = (b) => (b.ref ? `${b.ref} · ` : '');

// ---- to Mayanov ----

/** a booking just paid on the site: who, what, when */
export function newBookingEmail(b, amount) {
  const session = b.date && b.time;
  const when = session ? jakarta(startOf(b)) : '';
  const due = dueOf(b);
  return letter({
    to: OWNER,
    subject: `New booking: ${serviceOf(b)} · ${b.name || 'someone'}${session ? ` · ${b.date} ${b.time}` : ''}`,
    kicker: 'New booking',
    heading: `${b.name || 'Someone'} booked a ${serviceOf(b)}`,
    paras: [
      session
        ? `Paid and on your calendar for **${when}**.`
        : `Paid${Number.isFinite(due) ? `. The ${b.serviceId === 'chat' ? 'reply' : 'reading'} is due by **${jakarta(due)}**` : ''}.`,
      b.serviceId in PROMISE && !String(b.question || '').trim() && !mailer.isIndonesian(b)
        ? 'Their question comes as a reply to their confirmation email.'
        : null,
    ].filter(Boolean),
    quote: String(b.question || '').trim(),
    rows: [
      ['Service', b.serviceName || b.serviceId],
      ['Paid', [money(b, amount), b.paymentMethod].filter(Boolean).join(' · ')],
      ['Name', b.name],
      ['Contact', b.contact],
      ['Born', b.dob],
      ['Booking code', b.ref],
    ],
    button: dashboard,
    sign: false,
  });
}

/** an email reading close to (or past) what the site promised */
export function dueSoonEmail(b, now = Date.now()) {
  const due = dueOf(b);
  const left = due - now;
  const late = left <= 0;
  const question = String(b.question || '').trim();
  return letter({
    to: OWNER,
    subject: `${tag(b)}${late ? `Overdue by ${span(-left)}` : `Due in ${span(left)}`}: ${serviceOf(b)} for ${b.name || 'a customer'}`,
    kicker: `${b.serviceId === 'chat' ? 'Chat reply' : 'Reading'} ${late ? 'overdue' : 'due soon'}`,
    heading: `${b.name || 'A customer'}’s ${b.serviceId === 'chat' ? 'chat reply' : 'reading'} is ${late ? 'overdue' : `due in ${span(left)}`}`,
    paras: [
      `${promisedOnSite(b) ? 'The site promised it' : 'It’s due'} by **${jakarta(due)}**${late ? '' : ', and it isn’t marked done yet'}.`,
      question ? null : (mailer.isIndonesian(b) ? 'Their story and question are in your WhatsApp.' : 'Their question is in your inbox, as a reply to their confirmation email.'),
      'Once it’s sent, mark it done on the Orders screen.',
    ].filter(Boolean),
    quote: question,
    rows: [
      ['Service', b.serviceName || b.serviceId],
      ['Paid', b.paidAt ? jakarta(Date.parse(b.paidAt)) : ''],
      ['Name', b.name],
      ['Contact', b.contact],
      ['Booking code', b.ref],
    ],
    button: dashboard,
    sign: false,
  });
}

// ---- to the customer ----

const emailOf = (b) => mailer.emailOf(b.contact);
/** a global session with a time and an email address: its customer hears from us */
const customerSession = (b) => !!(b?.date && b?.time && !mailer.isIndonesian(b) && emailOf(b));

/** their Live Session is tomorrow (kind 'day') or in an hour (kind 'hour') */
export function reminderEmail(b, kind, meet = '') {
  const service = serviceOf(b);
  const when = jakarta(startOf(b));
  const day = kind === 'day';
  return letter({
    to: emailOf(b),
    subject: `${tag(b)}${day ? `Your ${service} is tomorrow` : `Your ${service} starts in an hour`} ✨`,
    heading: day ? `See you tomorrow` : `See you in an hour`,
    paras: [
      `Hi ${firstName(b)},`,
      day
        ? `A little reminder: your ${service} is **${when}**. Your calendar invite shows it in your own time zone.`
        : `Your ${service} starts in about an hour, at **${when}**.`,
      meet ? 'When it’s time, join from the link below (it’s in your calendar invite too).' : 'When it’s time, join from the Google Meet link in your calendar invite.',
      day
        ? 'To make the most of it, have your questions ready, and a quiet spot where you can talk freely.'
        : 'Find a quiet spot, and have your questions to hand.',
    ],
    button: meet ? { label: 'Join on Google Meet', href: meet } : null,
    rows: [['Session', b.serviceName || service], ['When', when], ['Booking code', b.ref]],
    closing: day ? 'If something’s come up, just reply to this email.' : 'Running late, or a problem with the link? Just reply to this email.',
  });
}

/** their session was moved (from: the time it had) */
export function movedEmail(b, from) {
  const service = serviceOf(b);
  return letter({
    to: emailOf(b),
    subject: `${tag(b)}Your ${service} has a new time`,
    heading: 'Your session has a new time',
    paras: [
      `Hi ${firstName(b)},`,
      `Your ${service} has moved to **${jakarta(startOf(b))}**.`,
      'Your calendar invite has been updated too, showing the new time in your own time zone, with the same Google Meet link.',
    ],
    rows: [['New time', jakarta(startOf(b))], ['Was', Number.isFinite(from) ? jakarta(from) : ''], ['Booking code', b.ref]],
    closing: 'If the new time doesn’t work for you, just reply to this email and we’ll find another.',
  });
}

/** their session was cancelled */
export function cancelledEmail(b) {
  const service = serviceOf(b);
  const when = jakarta(startOf(b));
  return letter({
    to: emailOf(b),
    subject: `${tag(b)}Your ${service} has been cancelled`,
    heading: 'Your session has been cancelled',
    paras: [
      `Hi ${firstName(b)},`,
      `Your ${service} on **${when}** has been cancelled, and taken off your calendar.`,
    ],
    rows: [['Was', when], ['Booking code', b.ref]],
    closing: 'If you’d like a new time, just reply to this email and we’ll find one.',
  });
}

// ---- sending, once each ----

/** sends a notice once per booking: claimed first (two callers can't both send it), then
    stamped on the booking. Never throws: a notice must never undo what it reports. */
async function once(b, key, field, build) {
  try {
    if (!b?.id || b[field]) return false;
    const claim = `${key}_${b.ref || b.id}`;
    if (!(await bookingStore.claimOnce(claim))) return false;
    let msg = null, sent = false;
    try { msg = await build(); sent = !!msg?.to && await mailer.send(msg); } catch (e) { console.error(`[notices] ${key} failed:`, b.id, e.message); }
    // not sent (Gmail not connected yet, a hiccup): free to be tried again on the next check
    if (!sent) { await bookingStore.releaseClaim(claim); return false; }
    await bookingStore.markSent(b.id, field);
    return true;
  } catch (e) {
    console.error(`[notices] ${key} failed:`, b?.id, e.message);
    return false;
  }
}

/** tell Mayanov a booking has just been paid on the site */
export const notifyNewBooking = (b, amount) => once(b, 'ownernew', 'ownerNotifiedAt', () => newBookingEmail(b, amount));

/** tell the customer their session moved (before: the booking as it was) */
export async function notifyMoved(before, after) {
  if (!customerSession(after) || !['confirmed', 'done'].includes(after.status)) return false;
  const from = startOf(before), to = startOf(after);
  if (from === to || to <= Date.now()) return false;
  try { return await mailer.send(movedEmail(after, from)); } catch (e) { console.error('[notices] moved failed:', after.id, e.message); return false; }
}

/** tell the customer their session was cancelled (before: the booking as it was) */
export async function notifyCancelled(before) {
  // only a real, upcoming session: not an unpaid hold or one already over
  if (!customerSession(before) || before.status !== 'confirmed' || startOf(before) <= Date.now()) return false;
  try { return await mailer.send(cancelledEmail(before)); } catch (e) { console.error('[notices] cancelled failed:', before.id, e.message); return false; }
}

// ---- the timed checks ----
export const DUE_WARN_MS = 5 * HOUR;        // Mayanov hears this long before a reading is due
const DAY_REMINDER_MS = 24 * HOUR;          // the customer's "tomorrow" reminder…
const HOUR_REMINDER_MS = 65 * MIN;          // …and "in an hour" (a check every 10 minutes lands in time)

/** what each booking is owed right now: [field, send] pairs (pure, so it can be tested) */
export function dueNotices(b, now = Date.now()) {
  const out = [];
  if (b.status === 'cancelled' || b.status === 'done' || b.holdOnly) return out;
  // a reading due in 5 hours or less, not done; one more than 6 hours past due is left
  // alone (an old order nobody marked done shouldn't set off a pile of emails)
  const due = dueOf(b);
  if (Number.isFinite(due) && due - now <= warnBeforeMs(b) && due - now > -6 * HOUR && !b.dueWarnSentAt) out.push('dueWarnSentAt');
  // a global Live Session: tomorrow, and in an hour
  if (b.status === 'confirmed' && customerSession(b)) {
    const left = startOf(b) - now;
    const bookedAt = Date.parse(b.paidAt || b.createdAt || '') || 0;
    // (booked less than a day and a half ahead: their confirmation is still fresh, no
    // "tomorrow" email on top of it)
    if (left > 2 * HOUR && left <= DAY_REMINDER_MS && bookedAt < startOf(b) - 36 * HOUR && !b.remindDaySentAt) out.push('remindDaySentAt');
    if (left > 0 && left <= HOUR_REMINDER_MS && bookedAt < now - 10 * MIN && !b.remindHourSentAt) out.push('remindHourSentAt');
  }
  return out;
}

/** runs every check once; returns what was sent */
export async function runChecks(now = Date.now()) {
  const sent = [];
  for (const b of await bookingStore.bookingsToWatch(now)) {
    for (const field of dueNotices(b, now)) {
      const ok = field === 'dueWarnSentAt'
        ? await once(b, 'duewarn', field, () => dueSoonEmail(b, now))
        : await once(b, field === 'remindDaySentAt' ? 'remindday' : 'remindhour', field, async () =>
          reminderEmail(b, field === 'remindDaySentAt' ? 'day' : 'hour', await gcal.meetLink(b.gcalEventId)));
      if (ok) sent.push(`${field.replace('SentAt', '')} ${b.ref || b.id}`);
    }
  }
  return sent;
}
