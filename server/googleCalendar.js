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

// 15-min buffer after a session so there's rest time before the next one.
const REST_BUFFER_MIN = 15;
// In-person (meetup) sessions need travel time blocked around them: an hour to get
// there before, half an hour to get back after. Created as their own calendar events.
const TRANSPORT_BEFORE_MIN = 60;
const TRANSPORT_AFTER_MIN = 30;
const isMeetup = (b) => (b?.serviceId || '') === 'meetup' || /tatap muka/i.test(b?.serviceName || '');
// Meetup gets travel blocks (1h before / 30m after) instead of the generic rest tail,
// so its main event stays exactly the session length.
const restBufferFor = (b) => (isMeetup(b) ? 0 : REST_BUFFER_MIN);
const offsetMinutes = () => { const m = OFFSET.match(/([+-])(\d{2}):(\d{2})/); if (!m) return 0; return (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]); };
// Convert an RFC3339 instant to business-local { date, time }.
const toLocal = (dateTime) => {
  const ms = Date.parse(dateTime);
  if (!Number.isFinite(ms)) return null;
  const loc = new Date(ms + offsetMinutes() * 60000);
  return { date: loc.toISOString().slice(0, 10), time: loc.toISOString().slice(11, 16) };
};

const descriptionFor = (booking) => [
  `Client: ${booking.name}`,
  `Contact: ${booking.contact}`,
  booking.dob ? `Date of birth: ${booking.dob}` : '',
  booking.question ? `Notes: ${booking.question}` : '',
  `Market: ${booking.market || 'Global'}`,
  `Booking ID: ${booking.id}`,
].filter(Boolean).join('\n');

// The event body for a timed (scheduled) booking, incl. the rest buffer.
const scheduledBody = (booking) => {
  const dur = booking.durationMin && booking.durationMin > 0 ? booking.durationMin : 60;
  const serviceLabel = (booking.serviceName || booking.serviceId || '').split(' · ')[0].trim();
  return {
    summary: `${serviceLabel} — ${booking.name}`,
    description: descriptionFor(booking),
    start: { dateTime: rfc3339(booking.date, booking.time), timeZone: TZ },
    end: { dateTime: rfc3339(booking.date, toHHMM(toMin(booking.time) + dur + restBufferFor(booking))), timeZone: TZ },
  };
};

// Create a calendar item for a booking. Returns the Google event id, or null.
// - Scheduled bookings (date + time) -> a timed event that blocks the slot.
// - Async bookings (chat/email/special, no time) -> an all-day reminder "task" on the
//   day it came in, marked free so it never blocks bookable slots.
export async function createEvent(booking) {
  const c = getClient();
  if (!c) return null;

  const serviceLabel = (booking.serviceName || booking.serviceId || '').split(' · ')[0].trim();
  const scheduled = Boolean(booking.date && booking.time);
  let body;
  if (scheduled) {
    body = scheduledBody(booking);
  } else {
    // Reminder task: all-day, on the booking's date if any, else the day it arrived.
    const day = booking.date || (booking.createdAt || '').slice(0, 10) || todayISO();
    body = {
      summary: `🔔 ${serviceLabel} — ${booking.name}`,
      description: `To fulfill (no fixed time).\n\n${descriptionFor(booking)}`,
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

// Insert a raw event body; returns the new event id or null.
async function insertEvent(body) {
  try {
    const r = await fetch(eventsUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { console.error('[gcal] insertEvent failed', r.status, await r.text()); return null; }
    const data = await r.json();
    return data.id || null;
  } catch (e) {
    console.error('[gcal] insertEvent error:', e.message);
    return null;
  }
}

// Transport blocks around a meetup: 1h before (travel to) and 30m after (travel back),
// as separate busy events so those times are unavailable for other bookings too.
function transportBodies(booking) {
  const dur = booking.durationMin && booking.durationMin > 0 ? booking.durationMin : 60;
  const start = toMin(booking.time);
  const end = start + dur;
  const label = (booking.serviceName || booking.serviceId || 'Sesi Tatap Muka').split(' · ')[0].trim();
  // Tagged so they can always be found and cleaned up by booking id, even if the
  // stored ids are lost or the session was cancelled from Google's side.
  const tag = { private: { mtTransport: '1', mtBookingId: String(booking.id) } };
  return [
    {
      summary: `🚗 Transport ke lokasi — ${booking.name}`,
      description: `Waktu perjalanan menuju ${label}.\nBooking ID: ${booking.id}`,
      start: { dateTime: rfc3339(booking.date, toHHMM(Math.max(0, start - TRANSPORT_BEFORE_MIN))), timeZone: TZ },
      end: { dateTime: rfc3339(booking.date, toHHMM(start)), timeZone: TZ },
      extendedProperties: tag,
    },
    {
      summary: `🚗 Transport pulang — ${booking.name}`,
      description: `Waktu perjalanan pulang dari ${label}.\nBooking ID: ${booking.id}`,
      start: { dateTime: rfc3339(booking.date, toHHMM(end)), timeZone: TZ },
      end: { dateTime: rfc3339(booking.date, toHHMM(end + TRANSPORT_AFTER_MIN)), timeZone: TZ },
      extendedProperties: tag,
    },
  ];
}

// For a meetup booking, create the two transport events. Returns their ids ([] otherwise).
export async function createTransportEvents(booking) {
  const c = getClient();
  if (!c) return [];
  if (!isMeetup(booking) || !booking.date || !booking.time) return [];
  const ids = [];
  for (const body of transportBodies(booking)) {
    const id = await insertEvent(body);
    if (id) ids.push(id);
  }
  return ids;
}

// Delete several events (e.g. a meetup's transport blocks).
export async function deleteEvents(ids) {
  for (const id of ids || []) await deleteEvent(id);
}

// Delete every transport event tagged with this booking id (robust cleanup that
// doesn't depend on stored ids).
export async function deleteTransportForBooking(bookingId) {
  const c = getClient();
  if (!c || !bookingId) return;
  try {
    const params = new URLSearchParams({ privateExtendedProperty: `mtBookingId=${bookingId}`, maxResults: '20' });
    const r = await fetch(`${eventsUrl()}?${params}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
    if (!r.ok) return;
    const data = await r.json();
    for (const ev of data.items || []) await deleteEvent(ev.id);
  } catch (e) {
    console.error('[gcal] deleteTransportForBooking error:', e.message);
  }
}

// Sweep the upcoming calendar for transport blocks whose booking is no longer
// active, and delete them. Matches both tagged events and older ones (by the 🚗
// summary + "Booking ID:" in the description). Returns how many were removed.
export async function sweepOrphanTransport(activeBookingIds) {
  const c = getClient();
  if (!c) return 0;
  const active = new Set((activeBookingIds || []).map(String));
  let removed = 0;
  try {
    const now = new Date();
    const params = new URLSearchParams({
      singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 120 * 24 * 3600 * 1000).toISOString(),
    });
    const r = await fetch(`${eventsUrl()}?${params}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
    if (!r.ok) return 0;
    const data = await r.json();
    for (const ev of data.items || []) {
      if (ev.status === 'cancelled') continue;
      const isTransport = ev.extendedProperties?.private?.mtTransport === '1' || /^🚗\s*Transport/.test(ev.summary || '');
      if (!isTransport) continue;
      const bid = ev.extendedProperties?.private?.mtBookingId
        || (ev.description && (ev.description.match(/Booking ID:\s*(\S+)/) || [])[1]);
      if (!bid) continue;
      if (!active.has(String(bid))) { await deleteEvent(ev.id); removed++; }
    }
  } catch (e) {
    console.error('[gcal] sweepOrphanTransport error:', e.message);
  }
  return removed;
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

// Whether a previously-created event still exists on the calendar.
// Returns 'exists' | 'deleted' | 'unknown' (unknown = don't touch the booking).
export async function eventStatus(eventId) {
  const c = getClient();
  if (!c || !eventId) return 'unknown';
  try {
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
    });
    if (r.status === 404 || r.status === 410) return 'deleted';
    if (!r.ok) return 'unknown';
    const ev = await r.json();
    return ev.status === 'cancelled' ? 'deleted' : 'exists';
  } catch (e) {
    console.error('[gcal] eventStatus error:', e.message);
    return 'unknown';
  }
}

// Push a booking's new time to its existing calendar event (used on admin reschedule).
export async function updateEvent(eventId, booking) {
  const c = getClient();
  if (!c || !eventId || !booking?.date || !booking?.time) return;
  try {
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduledBody(booking)),
    });
    if (!r.ok) console.error('[gcal] updateEvent failed', r.status, await r.text());
  } catch (e) {
    console.error('[gcal] updateEvent error:', e.message);
  }
}

// Read an event's current state: existence + (for timed events) its business-local
// start date/time and duration. Used to reverse-sync moves made in Google Calendar.
export async function eventInfo(eventId) {
  const c = getClient();
  if (!c || !eventId) return { status: 'unknown' };
  try {
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
    });
    if (r.status === 404 || r.status === 410) return { status: 'deleted' };
    if (!r.ok) return { status: 'unknown' };
    const ev = await r.json();
    if (ev.status === 'cancelled') return { status: 'deleted' };
    if (ev.start?.dateTime && ev.end?.dateTime) {
      const s = toLocal(ev.start.dateTime);
      const durTotal = Math.round((Date.parse(ev.end.dateTime) - Date.parse(ev.start.dateTime)) / 60000);
      // Meetup events carry no rest tail (travel blocks are separate), so don't subtract one.
      const buf = /tatap muka/i.test(ev.summary || '') ? 0 : REST_BUFFER_MIN;
      const durationMin = Math.max(30, durTotal - buf);
      return s ? { status: 'exists', scheduled: true, date: s.date, time: s.time, durationMin } : { status: 'exists', scheduled: true };
    }
    return { status: 'exists', scheduled: false };
  } catch (e) {
    console.error('[gcal] eventInfo error:', e.message);
    return { status: 'unknown' };
  }
}

// Diagnostic: try to create then delete a throwaway event, returning Google's raw
// response so setup problems (API disabled / not shared / wrong id) are visible.
export async function selfTest() {
  const c = getClient();
  if (!c) return { ok: false, stage: 'config', error: disabledReason };
  try {
    const day = todayISO();
    const r = await fetch(eventsUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: 'Mayanov sync self-test (auto-deleted)',
        start: { date: day },
        end: { date: nextDay(day) },
        transparency: 'transparent',
      }),
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, stage: 'insert', status: r.status, error: text.slice(0, 600) };
    const ev = JSON.parse(text);
    await deleteEvent(ev.id);
    return { ok: true, calendarId: CALENDAR_ID, createdAndDeletedEventId: ev.id };
  } catch (e) {
    return { ok: false, stage: 'exception', error: e.message };
  }
}

// List the owner's calendar events between two dates (inclusive), in business-local
// time, so the admin grid can show the real schedule around bookings.
export async function listEvents(startISO, endISO) {
  const c = getClient();
  if (!c) return [];
  try {
    const params = new URLSearchParams({
      singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
      timeMin: rfc3339(startISO, '00:00'),
      timeMax: rfc3339(nextDay(endISO), '00:00'),
    });
    const r = await fetch(`${eventsUrl()}?${params}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
    if (!r.ok) { console.error('[gcal] listEvents failed', r.status, await r.text()); return []; }
    const data = await r.json();
    return (data.items || [])
      .filter((ev) => ev.status !== 'cancelled')
      .map((ev) => {
        const busy = ev.transparency !== 'transparent';
        if (ev.start?.dateTime && ev.end?.dateTime) {
          const s = toLocal(ev.start.dateTime), e = toLocal(ev.end.dateTime);
          return { id: ev.id, title: ev.summary || '(busy)', allDay: false, busy, date: s?.date, time: s?.time, endDate: e?.date, endTime: e?.time };
        }
        return { id: ev.id, title: ev.summary || '(busy)', allDay: true, busy, date: ev.start?.date, endDate: ev.end?.date };
      });
  } catch (e) {
    console.error('[gcal] listEvents error:', e.message);
    return [];
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
