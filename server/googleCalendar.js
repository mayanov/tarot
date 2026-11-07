// Google Calendar two-way sync for bookings.
//
// - Pushes a calendar event when a scheduled booking is created (and removes it on cancel).
// - Reads the owner's busy times so those slots disappear from the booking form.
//
// Auth: signed in as the calendar's owner when GOOGLE_OAUTH_CLIENT_ID / _SECRET /
// _REFRESH_TOKEN are set (scripts/google-calendar-auth.mjs) — then calls and live
// sessions invite the customer with a Google Meet link. Otherwise the Firebase service
// account (FIREBASE_SERVICE_ACCOUNT), which the owner shares the calendar with ("Make
// changes to events"); events then carry no guests. GOOGLE_CALENDAR_ID either way.
//
// Everything here fails soft: if the calendar isn't configured or an API call errors,
// bookings still work — they just don't sync.

import { JWT, OAuth2Client } from 'google-auth-library';

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
// 'owner': signed in as the calendar's owner (OAuth, scripts/google-calendar-auth.mjs),
// which is what lets an event invite the customer and carry a Google Meet link — a
// service account can't invite guests to a personal Gmail calendar. 'service': the
// Firebase service account the calendar is shared with (events without guests).
let authMode = null;

function getClient() {
  if (jwtClient) return jwtClient;
  if (disabledReason) return null;
  const { GOOGLE_OAUTH_CLIENT_ID: oid, GOOGLE_OAUTH_CLIENT_SECRET: osecret, GOOGLE_OAUTH_REFRESH_TOKEN: orefresh } = process.env;
  if (oid && osecret && orefresh && CALENDAR_ID) {
    jwtClient = new OAuth2Client({ clientId: oid, clientSecret: osecret });
    jwtClient.setCredentials({ refresh_token: orefresh });
    authMode = 'owner';
    console.log(`[gcal] Calendar sync enabled as the owner (calendar: ${CALENDAR_ID}); sessions invite their customer`);
    return jwtClient;
  }
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) { disabledReason = 'no service-account credentials'; return null; }
  if (!CALENDAR_ID) { disabledReason = 'GOOGLE_CALENDAR_ID not set'; return null; }
  try {
    if (!raw.trim().startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(raw);
    jwtClient = new JWT({ email: sa.client_email, key: sa.private_key, scopes: SCOPES });
    authMode = 'service';
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
  return { enabled, calendarId: enabled ? CALENDAR_ID : null, reason: enabled ? null : disabledReason, invitesCustomers: enabled && authMode === 'owner' };
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

// The customer's email, from the contact line the form builds ("WA: … · Email: …").
const emailOf = (booking) => ((booking?.contact || '').match(/Email:\s*([^\s@·]+@[^\s·]+)/) || [])[1] || '';
// Calls (Panggilan Online), Live Sessions and meetups (Sesi Tatap Muka) become a real
// invite to the customer — calls with a Google Meet link — only possible when signed
// in as the calendar's owner.
const INVITE_SERVICES = new Set(['call', 'live', 'meetup']);
// A booking still waiting for its payment (inviteOnPay) gets a plain event on Mayanov's
// calendar instead, holding the time; the invite goes out once it's marked paid.
const invites = (booking) => authMode === 'owner' && INVITE_SERVICES.has(booking?.serviceId) && Boolean(emailOf(booking)) && !booking?.inviteOnPay;
const isIndonesian = (booking) => booking?.market === 'ID';

// What the customer reads: the invite's title and its note, in their language. The
// title is shared with Mayanov's own calendar, so it names both of them. The note is
// HTML (Google shows it formatted, in the calendar and in the invitation email).
const WHATSAPP = 'https://wa.me/6287786280310';
const SITE = 'https://tarotreadingbymayanov.com';
// the meetup's area and the recommended spot (as on the site's Tatap Muka card)
const MEETUP_AREA = 'Jakarta Selatan';
const MEETUP_MAP = 'https://maps.app.goo.gl/LE2YwZiM2exhqunh8';
const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const minutesOf = (booking) => (booking.durationMin > 0 ? booking.durationMin : 60);

// (the meetup's title keeps "Tatap Muka": reading an event back relies on it)
const inviteTitle = (booking) =>
  `🔮 ${isMeetup(booking) ? 'Sesi Tarot Tatap Muka' : isIndonesian(booking) ? 'Sesi Tarot Online' : 'Live Tarot Reading'} · Mayanov × ${String(booking.name || '').trim().slice(0, 40)}`;

const durationText = (min) => (min % 60 === 0 ? `${min / 60} jam` : `${min} menit`);

const inviteDescription = (booking) => {
  const min = minutesOf(booking);
  const q = String(booking.question || '').trim();
  const lines = isMeetup(booking)
    ? [
        `<b>Sesi tarot tatap muka kamu bersama Mayanov</b> · ${durationText(min)}, di ${MEETUP_AREA}`,
        '',
        '<b>Tempat</b>',
        `Tempat persisnya dikonfirmasi lewat WhatsApp sebelum sesi. Rekomendasi tempat Mayanov: <a href="${MEETUP_MAP}">lihat di Google Maps</a>.`,
        'Datang 5–10 menit lebih awal ya, biar bisa mulai tepat waktu.',
        '',
        '<b>Sebelum sesi</b>',
        'Siapkan satu atau dua hal yang paling ingin kamu tanyakan saat ini.',
        q ? `Yang sudah kamu tulis: <i>“${esc(q)}”</i>` : '',
        '',
        '<b>Perlu ganti jadwal?</b>',
        `Kabari Mayanov lewat <a href="${WHATSAPP}">WhatsApp</a> paling lambat 24 jam sebelumnya, nanti dicarikan waktu lain.`,
        '',
        `Sampai ketemu ✨`,
        `<a href="${SITE}">Mayanov Tarot</a> · Booking ${esc(booking.id)}`,
      ]
    : isIndonesian(booking)
    ? [
        `<b>Sesi tarot online kamu bersama Mayanov</b> · ${min} menit`,
        '',
        '<b>Cara bergabung</b>',
        'Klik <i>Gabung dengan Google Meet</i> di undangan ini, 1–2 menit sebelum mulai. Kamera boleh dimatikan; cari tempat yang tenang dan pakai earphone kalau bisa.',
        'Kalau sudah sepakat lewat WhatsApp Call, Mayanov yang akan menelepon kamu di jam ini.',
        '',
        '<b>Sebelum sesi</b>',
        'Siapkan satu atau dua hal yang paling ingin kamu tanyakan saat ini.',
        q ? `Yang sudah kamu tulis: <i>“${esc(q)}”</i>` : '',
        '',
        '<b>Perlu ganti jadwal?</b>',
        `Kabari Mayanov lewat <a href="${WHATSAPP}">WhatsApp</a> paling lambat 24 jam sebelumnya, nanti dicarikan waktu lain.`,
        '',
        `Sampai ketemu ✨`,
        `<a href="${SITE}">Mayanov Tarot</a> · Booking ${esc(booking.id)}`,
      ]
    : [
        `<b>Your live tarot reading with Mayanov</b> · ${min} minutes on Google Meet`,
        '',
        '<b>Joining</b>',
        'Click <i>Join with Google Meet</i> in this invitation a minute or two before we start. Camera is optional; a quiet spot and headphones help.',
        '',
        '<b>Before we meet</b>',
        'Have the one or two questions that matter most to you right now in mind.',
        q ? `What you wrote: <i>“${esc(q)}”</i>` : '',
        '',
        '<b>Need another time?</b>',
        `Message Mayanov on <a href="${WHATSAPP}">WhatsApp</a> at least 24 hours before and we’ll find a new slot.`,
        '',
        `See you soon ✨`,
        `<a href="${SITE}">Mayanov Tarot</a> · Booking ${esc(booking.id)}`,
      ];
  // (no doubled blank line where there's no question)
  return lines.filter((l, i, all) => l !== '' || all[i - 1] !== '').join('<br>');
};

// The event body for a timed (scheduled) booking: the owner's own events carry the
// rest buffer; an invite is exactly the session, since the customer sees it.
const scheduledBody = (booking, invite = invites(booking)) => {
  const dur = booking.durationMin && booking.durationMin > 0 ? booking.durationMin : 60;
  const serviceLabel = (booking.serviceName || booking.serviceId || '').split(' · ')[0].trim();
  return {
    summary: invite ? inviteTitle(booking) : `${serviceLabel} — ${booking.name}`,
    ...(invite && isMeetup(booking) ? { location: `${MEETUP_AREA} (tempat dikonfirmasi lewat WhatsApp)` } : {}),
    description: invite ? inviteDescription(booking) : descriptionFor(booking),
    start: { dateTime: rfc3339(booking.date, booking.time), timeZone: TZ },
    end: { dateTime: rfc3339(booking.date, toHHMM(toMin(booking.time) + dur + (invite ? 0 : restBufferFor(booking)))), timeZone: TZ },
  };
};

// An invite is only the session, so Mayanov's rest after it is its own private event
// (no guests: the customer never sees it), linked from the invite (mtRestId) so it
// moves and goes with it. Kept busy, so the calendar shows the time as taken.
const restBody = (endDateTime, booking) => {
  const end = Date.parse(endDateTime);
  return {
    summary: `☕ Jeda setelah sesi${booking?.name ? ` ${booking.name}` : ''}`,
    description: 'Jeda 15 menit setelah sesi (dibuat otomatis oleh situs booking).',
    start: { dateTime: new Date(end).toISOString(), timeZone: TZ },
    end: { dateTime: new Date(end + REST_BUFFER_MIN * 60000).toISOString(), timeZone: TZ },
    reminders: { useDefault: false, overrides: [] },
    extendedProperties: { private: { mtRest: '1' } },
  };
};

/** an invite's Google Meet link, or '' */
export async function meetLink(eventId) {
  if (!getClient() || !eventId) return '';
  try { return (await getEvent(eventId))?.hangoutLink || ''; } catch { return ''; }
}

// Fetch an event (null if it can't be read).
async function getEvent(eventId) {
  const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  return r.ok ? r.json() : null;
}

// Put an invite's rest right after it again (after a move here or in Google Calendar).
async function placeRest(invite) {
  const restId = invite?.extendedProperties?.private?.mtRestId;
  if (!restId || !invite.end?.dateTime) return;
  const { start, end } = restBody(invite.end.dateTime);
  const r = await fetch(`${eventsUrl()}/${encodeURIComponent(restId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end }),
  });
  if (!r.ok) console.error('[gcal] rest move failed', r.status, await r.text());
}

// After a session was moved in Google Calendar (read back by the reconcile): its rest follows.
export async function alignRest(eventId) {
  const c = getClient();
  if (!c || !eventId || authMode !== 'owner') return;
  try { await placeRest(await getEvent(eventId)); } catch (e) { console.error('[gcal] alignRest error:', e.message); }
}

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

  // An invite: the customer as a guest (Google emails them), a Meet link, and a tag so
  // reading it back knows there's no rest tail on it.
  let url = eventsUrl();
  let restId = null;
  if (scheduled && invites(booking)) {
    // a meetup has its travel blocks instead of a rest, and no Meet link
    if (!isMeetup(booking)) restId = await insertEvent(restBody(body.end.dateTime, booking));
    body.attendees = [{ email: emailOf(booking), displayName: booking.name }];
    if (!isMeetup(booking)) body.conferenceData = { createRequest: { requestId: `${booking.id}-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } };
    body.guestsCanModify = false;
    body.guestsCanInviteOthers = false;
    body.reminders = { useDefault: true };
    body.extendedProperties = { private: { mtInvite: '1', mtBookingId: String(booking.id), ...(restId ? { mtRestId: restId } : {}) } };
    url += isMeetup(booking) ? '?sendUpdates=all' : '?conferenceDataVersion=1&sendUpdates=all';
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { console.error('[gcal] createEvent failed', r.status, await r.text()); if (restId) await deleteEvent(restId); return null; }
    const data = await r.json();
    return data.id || null;
  } catch (e) {
    console.error('[gcal] createEvent error:', e.message);
    if (restId) await deleteEvent(restId);
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
    // rest events whose session is gone (cancelled in Google Calendar, say)
    const live = (data.items || []).filter((ev) => ev.status !== 'cancelled');
    const restOf = new Set(live.map((ev) => ev.extendedProperties?.private?.mtRestId).filter(Boolean));
    for (const ev of live) {
      if (ev.extendedProperties?.private?.mtRest === '1' && !restOf.has(ev.id) && Date.parse(ev.start?.dateTime) > now.getTime()) { await deleteEvent(ev.id); removed++; }
    }
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
    // an invite's rest goes with it
    if (authMode === 'owner') {
      const restId = (await getEvent(eventId).catch(() => null))?.extendedProperties?.private?.mtRestId;
      if (restId && restId !== eventId) await deleteEvent(restId);
    }
    // sendUpdates: an invited customer gets Google's cancellation email (no-op otherwise)
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}?sendUpdates=all`, {
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
    // Kept as it was made: an invite stays an invite (and the move emails the customer;
    // their guest entry and Meet link stay as they are), an event without guests stays one.
    const cur = await getEvent(eventId);
    const invite = cur ? cur.extendedProperties?.private?.mtInvite === '1' : invites(booking);
    const r = await fetch(`${eventsUrl()}/${encodeURIComponent(eventId)}?sendUpdates=all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduledBody(booking, invite)),
    });
    if (!r.ok) console.error('[gcal] updateEvent failed', r.status, await r.text());
    else if (invite) await placeRest(await r.json());
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
      // Invites are exactly the session too.
      const buf = /tatap muka/i.test(ev.summary || '') || ev.extendedProperties?.private?.mtInvite === '1' ? 0 : REST_BUFFER_MIN;
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
