// Google Calendar two-way sync for bookings.
//
// - Pushes a calendar event when a scheduled booking is created (and removes it on cancel).
// - Reads the owner's busy times so those slots disappear from the booking form.
//
// Auth reuses the Firebase service account (FIREBASE_SERVICE_ACCOUNT) with the Calendar
// scope. The owner must share their Google Calendar with the service account's
// client_email ("Make changes to events") and set GOOGLE_CALENDAR_ID.
//
// Everything here fails soft: if the calendar isn't configured or an API call errors,
// bookings still work — they just don't sync.

import { JWT } from 'google-auth-library';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';
const TZ = process.env.BOOKING_TIMEZONE || 'Asia/Jakarta';
// Fixed UTC offset for the business timezone (WIB = +07:00, no DST).
const OFFSET = process.env.BOOKING_TZ_OFFSET || '+07:00';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// 30-min grid we care about (mirrors SLOT_TIMES on the client, one extra half-hour
// so the last slot's end is representable).
const GRID = [];
for (let m = 11 * 60; m <= 20 * 60; m += 30) GRID.push(m);

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const rfc3339 = (date, hhmm) => `${date}T${hhmm}:00${OFFSET}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const nextDay = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

let jwtClient = null;
let disabledReason = null;

function getClient() {
  if (jwtClient) return jwtClient;
  if (disabledReason) return null;
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) { disabledReason = 'no service-account credentials'; return null; }
  if (!CALENDAR_ID) { disabledReason = 'GOOGLE_CALENDAR_ID not set'; return null; }
  try {
    if (!raw.trim().startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(raw);
    jwtClient = new JWT({ email: sa.client_email, key: sa.private_key, scopes: SCOPES });
    console.log(`[gcal] Calendar sync enabled (calendar: ${CALENDAR_ID}, sa: ${sa.client_email})`);
    return jwtClient;
  } catch (e) {
    disabledReason = 'failed to parse service account: ' + e.message;
    console.error('[gcal] init failed:', e.message);
    return null;
  }
}

export function calendarStatus() {
  const enabled = Boolean(getClient());
  return { enabled, calendarId: enabled ? CALENDAR_ID : null, reason: enabled ? null : disabledReason };
}

async function accessToken() {
  const c = getClient();
  const { token } = await c.getAccessToken();
  return token;
}

const eventsUrl = () =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`;

// Create a calendar item for a booking. Returns the Google event id, or null.
// - Scheduled bookings (date + time) -> a timed event that blocks the slot.
// - Async bookings (chat/email/special, no time) -> an all-day reminder "task" on the
//   day it came in, marked free so it never blocks bookable slots.
export async function createEvent(booking) {
  const c = getClient();
  if (!c) return null;

  const description = [
    `Client: ${booking.name}`,
    `Contact: ${booking.contact}`,
    booking.dob ? `Date of birth: ${booking.dob}` : '',
    booking.question ? `Notes: ${booking.question}` : '',
    `Market: ${booking.market || 'Global'}`,
    `Booking ID: ${booking.id}`,
  ].filter(Boolean).join('\n');

  const scheduled = Boolean(booking.date && booking.time);
  let body;
  if (scheduled) {
    const dur = booking.durationMin && booking.durationMin > 0 ? booking.durationMin : 60;
    body = {
      summary: `${booking.serviceName || booking.serviceId} — ${booking.name}`,
      description,
      start: { dateTime: rfc3339(booking.date, booking.time), timeZone: TZ },
      end: { dateTime: rfc3339(booking.date, toHHMM(toMin(booking.time) + dur)), timeZone: TZ },
    };
  } else {
    // Reminder task: all-day, on the booking's date if any, else the day it arrived.
    const day = booking.date || (booking.createdAt || '').slice(0, 10) || todayISO();
    body = {
      summary: `🔔 ${booking.serviceName || booking.serviceId} — ${booking.name}`,
      description: `To fulfill (no fixed time)\n\n${description}`,
      start: { date: day },
      end: { date: nextDay(day) },
      transparency: 'transparent', // shows as Free -> won't block bookable slots
    };
  }

  try {
    const r = await fetch(eventsUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { console.error('[gcal] createEvent failed', r.status, await r.text()); return null; }
    const data = await r.json();
    return data.id || null;
  } catch (e) {
    console.error('[gcal] createEvent error:', e.message);
    return null;
  }
}

// Remove a previously created event (used when a booking is cancelled).
export async function deleteEvent(eventId) {
  const c = getClient();
  if (!c || !eventId) return;
  try {
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await accessToken()}` },
    });
    // 410/404 = already gone; treat as success.
    if (!r.ok && r.status !== 410 && r.status !== 404) {
      console.error('[gcal] deleteEvent failed', r.status, await r.text());
    }
  } catch (e) {
    console.error('[gcal] deleteEvent error:', e.message);
  }
}

// The 30-min booking-grid slots that are busy on `date` according to Google Calendar.
export async function getBusySlots(date) {
  const c = getClient();
  if (!c) return [];
  try {
    const r = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin: rfc3339(date, '00:00'),
        timeMax: rfc3339(date, '23:59'),
        timeZone: TZ,
        items: [{ id: CALENDAR_ID }],
      }),
    });
    if (!r.ok) { console.error('[gcal] freeBusy failed', r.status, await r.text()); return []; }
    const data = await r.json();
    const busy = data?.calendars?.[CALENDAR_ID]?.busy || [];
    if (!busy.length) return [];
    const intervals = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)]);
    const out = [];
    for (const startMin of GRID) {
      const slotStart = Date.parse(rfc3339(date, toHHMM(startMin)));
      const slotEnd = slotStart + 30 * 60 * 1000;
      if (intervals.some(([bs, be]) => slotStart < be && slotEnd > bs)) {
        out.push(toHHMM(startMin));
      }
    }
    return out;
  } catch (e) {
    console.error('[gcal] getBusySlots error:', e.message);
    return [];
  }
}
