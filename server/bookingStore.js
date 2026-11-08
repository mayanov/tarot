// Server-side booking store.
//
// Uses Firestore when FIREBASE_SERVICE_ACCOUNT is set (durable, cloud, shared);
// otherwise falls back to a local JSON file so dev works with zero setup.
// One document per slot (id = `${date}_${time}`) guarantees no double-booking.

import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import * as gcal from './googleCalendar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'bookings.json');
const COLLECTION = 'bookings';

const slotId = (date, time) => `${date}_${time}`;
// Stable, opaque public reference for a booking — random (not derived from date/time),
// so it never leaks schedule info and survives reschedules. e.g. "MYV-3F9A2C7B1D".
const genRef = () => 'MYV-' + crypto.randomBytes(5).toString('hex').toUpperCase();

// The 30-min grid slots a booking occupies, from its start time + duration.
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const occupiedSlots = (time, durationMin) => {
  if (!time) return [];
  const start = toMin(time);
  const dur = durationMin && durationMin > 0 ? durationMin : 30;
  const out = [];
  for (let t = start; t < start + dur; t += 30) out.push(toHHMM(t));
  return out;
};

// Extra breathing time (minutes) reserved AFTER a session, per service. Those slots
// become unavailable for the next booking too, so sessions aren't back-to-back.
const SESSION_BUFFER_MIN = { call: 15, live: 15 };
const bufferFor = (b) => SESSION_BUFFER_MIN[b?.serviceId] || 0;
// A meetup also needs the travel there and back (the same 1 h before / 30 min after as its
// travel blocks on the calendar, server/googleCalendar.js), so that time has to be free
// when it's booked, and stays blocked for others once it is.
const TRAVEL_BEFORE_MIN = 60;
const TRAVEL_AFTER_MIN = 30;
const isMeetup = (b) => (b?.serviceId || '') === 'meetup' || /tatap muka/i.test(b?.serviceName || '');
// The grid slots a booking needs at a given start: its length + rest, or with travel round a meetup.
const footprintAt = (b, time, durationMin) => {
  if (!time) return [];
  const dur = durationMin && durationMin > 0 ? durationMin : 30;
  if (!isMeetup(b)) return occupiedSlots(time, dur + bufferFor(b));
  return occupiedSlots(toHHMM(Math.max(0, toMin(time) - TRAVEL_BEFORE_MIN)), TRAVEL_BEFORE_MIN + dur + TRAVEL_AFTER_MIN);
};
// A booking's full footprint on the grid.
const footprintSlots = (b) => footprintAt(b, b.time, b.durationMin);

// A booking being paid for is pending + unpaid, with an hour to pay (holdUntil). Paid in
// time, it's confirmed; not paid by then, it's cancelled (expireUnpaid) and its slot freed.
// ('awaiting_payment' is how older holds were saved.)
export const PAY_WITHIN_MIN = 60;
export const payBy = () => new Date(Date.now() + PAY_WITHIN_MIN * 60_000).toISOString();
const unpaidExpired = (b) => b.paymentStatus !== 'paid'
  && (b.status === 'pending' || b.status === 'awaiting_payment')
  && !!b.holdUntil && Date.parse(b.holdUntil) < Date.now();
const blocksSlot = (b) => b.status !== 'cancelled' && !unpaidExpired(b);

// ---- Firestore init (only if a service account is provided) ----
let db = null;
try {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    // Accept the JSON directly, or base64-encoded JSON (easier to store in env vars).
    if (!raw.trim().startsWith('{')) {
      raw = Buffer.from(raw, 'base64').toString('utf8');
    }
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const serviceAccount = JSON.parse(raw);
    if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
    // Async bookings (chat/email/special) have no date/time — let Firestore skip
    // undefined fields instead of throwing.
    db.settings({ ignoreUndefinedProperties: true });
    console.log('[bookings] Using Firestore');
  } else {
    console.log('[bookings] FIREBASE_SERVICE_ACCOUNT not set — using local JSON file store');
  }
} catch (e) {
  console.error('[bookings] Firestore init failed, falling back to JSON file:', e.message);
  db = null;
}

// ---- JSON fallback helpers ----
function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}
function readAll() {
  ensure();
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8') || '[]'); } catch { return []; }
}
function writeAll(list) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

// Slots occupied by bookings in our own store (no Google Calendar).
export async function dbTakenSlots(date) {
  let rows;
  if (db) {
    const snap = await db.collection(COLLECTION).where('date', '==', date).get();
    rows = snap.docs.map((d) => d.data());
  } else {
    rows = readAll().filter((b) => b.date === date);
  }
  const set = new Set();
  rows.filter(blocksSlot)
    .forEach((b) => footprintSlots(b).forEach((s) => set.add(s)));
  return set;
}

export async function getTakenSlots(date) {
  const set = await dbTakenSlots(date);
  // Two-way sync: also block slots the owner is busy in Google Calendar.
  try {
    (await gcal.getBusySlots(date)).forEach((s) => set.add(s));
  } catch (e) {
    console.error('[bookings] calendar busy merge failed:', e.message);
  }
  return [...set];
}

// Move a scheduled booking to a new date/time (and optionally duration).
// Availability is checked against our own store only (excluding this booking),
// so the owner can freely rearrange even over their own calendar event.
// opts.skipCalendar avoids pushing back to Google (used when the change CAME from Google).
export async function rescheduleBooking(id, { date, time, durationMin }, opts = {}) {
  const all = await getAllBookings();
  const booking = all.find((b) => b.id === id);
  if (!booking) return null;
  if (!date || !time) { const e = new Error('BAD_TARGET'); e.code = 'BAD_TARGET'; throw e; }

  const dur = durationMin && durationMin > 0 ? Math.round(durationMin) : (booking.durationMin || 30);
  const newId = slotId(date, time);
  const wanted = footprintAt(booking, time, dur);

  // Availability from our store, minus this booking's current footprint.
  const taken = await dbTakenSlots(date);
  // (a cancelled booking holds nothing, so there's nothing of its own to take off)
  if (booking.date === date && blocksSlot(booking)) footprintSlots(booking).forEach((s) => taken.delete(s));
  if (wanted.some((s) => taken.has(s))) { const e = new Error('SLOT_TAKEN'); e.code = 'SLOT_TAKEN'; throw e; }

  const updated = { ...booking, id: newId, date, time, durationMin: dur };
  if (newId !== booking.id) await keepAside(newId);

  if (db) {
    if (newId !== booking.id) {
      await db.collection(COLLECTION).doc(newId).set(updated);
      await db.collection(COLLECTION).doc(booking.id).delete();
    } else {
      await db.collection(COLLECTION).doc(newId).update({ date, time, durationMin: dur });
    }
  } else {
    const list = readAll().filter((b) => b.id !== booking.id && b.id !== newId);
    list.push(updated);
    writeAll(list);
  }

  if (!opts.skipCalendar && updated.gcalEventId) {
    try { await gcal.updateEvent(updated.gcalEventId, updated); } catch (e) { console.error('[bookings] calendar update failed:', e.message); }
    // Meetup travel blocks move with the session: drop the old ones, recreate at the new time.
    try {
      if (booking.gcalTransportIds?.length) await gcal.deleteEvents(booking.gcalTransportIds);
      const transportIds = await gcal.createTransportEvents(updated);
      updated.gcalTransportIds = transportIds.length ? transportIds : null;
      if (db) {
        await db.collection(COLLECTION).doc(newId).update({ gcalTransportIds: updated.gcalTransportIds });
      } else {
        const list = readAll();
        const row = list.find((r) => r.id === newId);
        if (row) { row.gcalTransportIds = updated.gcalTransportIds; writeAll(list); }
      }
    } catch (e) { console.error('[bookings] transport reschedule failed:', e.message); }
  }
  return updated;
}

// A session's id is its date and time, so a new booking (or one moved) at a time an
// old cancelled booking had would overwrite it. The old one is kept instead, under an
// id of its own, so cancelled bookings are never lost. (Only called once the time has
// been checked free, so whatever is there no longer holds it.)
async function keepAside(id) {
  const old = db ? (await db.collection(COLLECTION).doc(id).get()).data() : readAll().find((b) => b.id === id);
  if (!old) return;
  const moved = {
    ...old,
    id: `${id}~${crypto.randomBytes(3).toString('hex')}`,
    // (an unpaid booking past its hour that hadn't been marked cancelled yet)
    ...(old.status !== 'cancelled' ? { status: 'cancelled', cancelReason: old.cancelReason || 'unpaid' } : {}),
  };
  if (db) {
    await db.collection(COLLECTION).doc(moved.id).set(moved);
    await db.collection(COLLECTION).doc(id).delete();
  } else {
    const all = readAll().filter((b) => b.id !== id);
    all.push(moved);
    writeAll(all);
  }
}

export async function createBooking(input) {
  // `skipCalendar` (admin manual records) and any overrides are pulled out;
  // the rest is stored as-is. createdAt/status may be supplied (manual back-dated
  // orders); otherwise they default to now / confirmed.
  // `linkEventId`: an entry already on Mayanov's Google Calendar (a session she put in
  // herself) becomes this booking's entry, so nothing new is added to her calendar.
  const { skipCalendar: skip = false, linkEventId, ...data } = input;
  const skipCalendar = skip || Boolean(linkEventId);
  if (linkEventId) { data.gcalEventId = linkEventId; data.gcalLinked = true; }
  // Scheduled services reserve a unique slot; async ones (chat, email, special) don't.
  const hasSlot = Boolean(data.date && data.time);
  const id = hasSlot
    ? slotId(data.date, data.time)
    : 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const booking = {
    ...data,
    id,
    ref: genRef(),
    createdAt: data.createdAt || new Date().toISOString(),
    status: data.status || 'confirmed',
    paymentStatus: data.paymentStatus === 'paid' ? 'paid' : 'unpaid',
  };

  // A scheduled booking blocks every 30-min slot it spans; reject if any overlap.
  const wanted = hasSlot ? footprintAt(data, data.time, data.durationMin) : [];

  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    if (linkEventId) {
      const dup = await db.collection(COLLECTION).where('gcalEventId', '==', linkEventId).get();
      if (dup.docs.some((d) => d.data().status !== 'cancelled')) { const err = new Error('LINKED'); err.code = 'LINKED'; throw err; }
    }
    if (hasSlot) {
      // (a linked entry is itself busy on her calendar, so only bookings count then)
      const taken = new Set(linkEventId ? await dbTakenSlots(data.date) : await getTakenSlots(data.date));
      if (wanted.some((s) => taken.has(s))) {
        const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
      }
    }
    if (hasSlot) await keepAside(id);
    await ref.set(booking);
    if (!skipCalendar) {
      const eventId = await gcal.createEvent(booking);
      if (eventId) { booking.gcalEventId = eventId; await ref.update({ gcalEventId: eventId }); }
      const transportIds = await gcal.createTransportEvents(booking);
      if (transportIds.length) { booking.gcalTransportIds = transportIds; await ref.update({ gcalTransportIds: transportIds }); }
    }
    return booking;
  }

  const all = readAll();
  if (linkEventId && all.some((b) => b.gcalEventId === linkEventId && b.status !== 'cancelled')) {
    const err = new Error('LINKED'); err.code = 'LINKED'; throw err;
  }
  if (hasSlot) {
    const taken = new Set(
      all.filter((b) => b.date === data.date && blocksSlot(b))
        .flatMap((b) => footprintSlots(b)),
    );
    if (wanted.some((s) => taken.has(s))) {
      const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
    }
  }
  if (hasSlot) await keepAside(id);
  const cleaned = hasSlot ? readAll() : all;
  cleaned.push(booking);
  writeAll(cleaned);
  if (!skipCalendar) {
    const eventId = await gcal.createEvent(booking);
    if (eventId) booking.gcalEventId = eventId;
    const transportIds = await gcal.createTransportEvents(booking);
    if (transportIds.length) booking.gcalTransportIds = transportIds;
    if (eventId || transportIds.length) writeAll(cleaned);
  }
  return booking;
}

// Reverse sync from Google Calendar (runs on admin dashboard load). For each active
// booking that carries a Google event id:
//   - event deleted  -> cancel the booking (timed sessions only)
//   - event moved     -> reschedule the booking to the event's new time
// Returns the number of bookings changed.
export async function reconcileWithCalendar() {
  if (!gcal.calendarStatus().enabled) return 0;
  const all = await getAllBookings();
  let changed = 0;

  // Only active bookings that carry an event id need checking — fetch their current
  // calendar state in PARALLEL (was sequential, one slow round-trip per booking).
  const candidates = all.filter((b) => b.gcalEventId && (b.status === 'confirmed' || b.status === 'pending'));
  const infos = await Promise.all(
    candidates.map((b) => gcal.eventInfo(b.gcalEventId).catch(() => ({ status: 'unknown' }))),
  );

  for (let i = 0; i < candidates.length; i++) {
    const b = candidates[i];
    const info = infos[i];
    if (info.status === 'deleted') {
      // Deleting a timed session cancels it; async reminders are managed in admin.
      if (b.date && b.time) { await updateStatus(b.id, 'cancelled'); changed++; }
    } else if (info.status === 'exists' && info.scheduled && b.date && b.time) {
      const movedTime = info.date !== b.date || info.time !== b.time;
      const dur = b.gcalLinked ? info.durTotal : info.durationMin;
      const movedDur = dur && Math.abs(dur - (b.durationMin || 0)) >= 5;
      if (movedTime || movedDur) {
        try {
          await rescheduleBooking(b.id, { date: info.date, time: info.time, durationMin: dur || b.durationMin }, { skipCalendar: true });
          await gcal.alignRest(b.gcalEventId); // an invite's rest follows it
          changed++;
        } catch (e) { console.error('[bookings] reverse reschedule skipped:', e.message); }
      }
    }
  }
  // Clean up any transport blocks whose meetup is no longer active (cancelled,
  // done, or gone) so stale travel times don't keep slots blocked. Re-read only if
  // something changed; otherwise reuse the list we already have.
  try {
    const fresh = changed > 0 ? await getAllBookings() : all;
    const activeIds = fresh
      .filter((b) => (b.status === 'confirmed' || b.status === 'pending') && b.date && b.time)
      .map((b) => b.id);
    await gcal.sweepOrphanTransport(activeIds);
  } catch (e) { console.error('[bookings] transport sweep failed:', e.message); }
  return changed;
}

// Give any legacy booking that predates the ref field a stable ref (persisted once).
async function backfillRefs(rows) {
  const missing = rows.filter((r) => !r.ref);
  if (!missing.length) return rows;
  missing.forEach((r) => { r.ref = genRef(); });
  try {
    if (db) {
      const batch = db.batch();
      missing.forEach((r) => batch.update(db.collection(COLLECTION).doc(r.id), { ref: r.ref }));
      await batch.commit();
    } else {
      const all = readAll();
      const byId = new Map(missing.map((r) => [r.id, r.ref]));
      all.forEach((b) => { if (byId.has(b.id)) b.ref = byId.get(b.id); });
      writeAll(all);
    }
  } catch (e) { console.error('[bookings] ref backfill failed:', e.message); }
  return rows;
}

export async function getAllBookings() {
  let rows;
  if (db) {
    const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    rows = snap.docs.map((d) => d.data());
  } else {
    rows = readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  return backfillRefs(rows);
}

// Set a booking's payment status ('unpaid' | 'paid'). Reporting-only — no calendar side effects.
// Marking a call / meetup / live session paid also sends its held-back invite (below).
export async function updatePayment(id, paymentStatus) {
  const ps = paymentStatus === 'paid' ? 'paid' : 'unpaid';
  let b;
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    // when it was first marked paid: an order's delivery clock starts there
    const paidAt = ps === 'paid' && !snap.data().paidAt ? { paidAt: new Date().toISOString() } : {};
    await ref.update({ paymentStatus: ps, ...paidAt });
    b = { ...snap.data(), paymentStatus: ps, ...paidAt };
  } else {
    const all = readAll();
    b = all.find((x) => x.id === id);
    if (!b) return null;
    b.paymentStatus = ps;
    if (ps === 'paid' && !b.paidAt) b.paidAt = new Date().toISOString();
    writeAll(all);
  }
  if (ps !== 'paid') return b;
  // an order paid by hand: its calendar entry moves to when the reading is due, with its alert
  if (!b.holdOnly) await gcal.syncReading(b.gcalEventId, b);
  // a booking still in its payment step, marked paid by hand: confirmed like a paid one
  if (b.holdOnly && await holdStillFree(b)) return confirmPaidHold(b, {});
  // a global booking waits for its payment (confirmOnPay): paid → confirmed. A reading
  // cancelled for not being paid within the hour comes back once it's marked paid.
  const lateReading = b.status === 'cancelled' && b.cancelReason === 'unpaid' && !b.date;
  if (b.confirmOnPay && (b.status === 'pending' || lateReading) && !b.inviteOnPay) {
    const fields = { status: 'confirmed', confirmOnPay: false, cancelReason: null };
    await patch(b.id, fields);
    return { ...b, ...fields };
  }
  return sendHeldInvite(b);
}

// A call, meetup or live session booked on the site waits for its payment before the
// customer is invited (inviteOnPay, set by POST /api/bookings): until then it's pending,
// with a plain event on Mayanov's calendar holding the time. Once paid, that event is
// swapped for the real invite (Meet link for calls and live), and the booking confirmed.
// The new event is made before the old one goes, so the calendar sync never sees the
// session vanish and cancels it. Once per booking.
async function sendHeldInvite(b) {
  if (!b?.inviteOnPay || b.paymentStatus !== 'paid' || b.status === 'cancelled' || !b.date || !b.time) return b;
  if (!(await claimOnce(`invite_${b.ref || b.id}`))) return b;
  const fields = { inviteOnPay: false, ...(b.status === 'pending' ? { status: 'confirmed' } : {}) };
  const oldEventId = b.gcalEventId;
  try {
    const eventId = await gcal.createEvent({ ...b, ...fields });
    if (eventId) fields.gcalEventId = eventId;
    await patch(b.id, fields);
    if (eventId && oldEventId) await gcal.deleteEvent(oldEventId);
  } catch (e) {
    console.error('[bookings] invite after payment failed:', b.id, e.message);
    await patch(b.id, fields);
  }
  return { ...b, ...fields };
}

export async function updateStatus(id, status) {
  const current = db ? (await db.collection(COLLECTION).doc(id).get()).data() : readAll().find((x) => x.id === id);
  if (current?.status === 'cancelled' && status !== 'cancelled') return restoreBooking(current, status);
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const prev = snap.data();
    await ref.update({ status });
    // Cancelling frees the slot — remove the Google Calendar event(s) too.
    // (an entry she made herself and linked stays on her calendar: she removes it if she wants)
    if (status === 'cancelled') {
      if (prev.gcalEventId && !prev.gcalLinked) await gcal.deleteEvent(prev.gcalEventId);
      if (prev.gcalTransportIds?.length) await gcal.deleteEvents(prev.gcalTransportIds);
      await gcal.deleteTransportForBooking(id); // catch any not in the stored ids
      await ref.update({ gcalEventId: prev.gcalLinked ? prev.gcalEventId : null, gcalTransportIds: null });
    }
    if (status !== 'cancelled' && (status === 'done') !== (prev.status === 'done')) await gcal.syncReading(prev.gcalEventId, { ...prev, status });
    return { ...prev, status };
  }
  const all = readAll();
  const b = all.find((x) => x.id === id);
  if (!b) return null;
  const wasDone = b.status === 'done';
  b.status = status;
  // an order's calendar entry: done switches its alert off, un-done puts it back
  if (status !== 'cancelled' && (status === 'done') !== wasDone) await gcal.syncReading(b.gcalEventId, b);
  if (status === 'cancelled') {
    if (b.gcalEventId && !b.gcalLinked) await gcal.deleteEvent(b.gcalEventId);
    if (b.gcalTransportIds?.length) await gcal.deleteEvents(b.gcalTransportIds);
    await gcal.deleteTransportForBooking(b.id); // catch any not in the stored ids
    if (!b.gcalLinked) b.gcalEventId = null;
    b.gcalTransportIds = null;
  }
  writeAll(all);
  return b;
}

// A cancelled booking brought back (its status changed in the dashboard): only if its
// time is still free, so nothing is double-booked; then it's a normal booking again,
// back on the calendar.
async function restoreBooking(b, status) {
  if (b.date && b.time) {
    const taken = await dbTakenSlots(b.date); // (a cancelled booking isn't counted)
    if (footprintSlots(b).some((s) => taken.has(s))) { const e = new Error('SLOT_TAKEN'); e.code = 'SLOT_TAKEN'; throw e; }
  }
  const fields = { status, cancelReason: null, holdUntil: null, holdOnly: false };
  await patch(b.id, fields);
  const restored = { ...b, ...fields };
  if (b.date && b.time && !b.gcalEventId) {
    try {
      const eventId = await gcal.createEvent(restored);
      const transportIds = await gcal.createTransportEvents(restored);
      const cal = { ...(eventId ? { gcalEventId: eventId } : {}), ...(transportIds.length ? { gcalTransportIds: transportIds } : {}) };
      if (Object.keys(cal).length) { await patch(b.id, cal); Object.assign(restored, cal); }
    } catch (e) { console.error('[bookings] calendar for restored booking failed:', e.message); }
  }
  return restored;
}

async function findBy(field, value) {
  if (db) {
    const snap = await db.collection(COLLECTION).where(field, '==', value).limit(1).get();
    return snap.empty ? null : snap.docs[0].data();
  }
  return readAll().find((b) => b[field] === value) || null;
}

async function patch(id, fields) {
  if (db) {
    await db.collection(COLLECTION).doc(id).update(fields);
    return;
  }
  const all = readAll();
  const b = all.find((x) => x.id === id);
  if (b) { Object.assign(b, fields); writeAll(all); }
}

/** the booking a Midtrans payment belongs to (its hold), or null */
export const findByMidtransOrder = (orderId) => findBy('midtransOrderId', orderId);
/** the booking (or hold) a PayPal order belongs to, or null */
export const findByPayPalOrder = (orderId) => findBy('paypalOrderId', orderId);

/** whether a hold's slot is still its own: unexpired, or expired with nobody in it since
 *  (a payment landing just after the hour, even once it's been cancelled for it, still counts) */
export async function holdStillFree(hold) {
  if (!hold) return false;
  if (hold.status === 'cancelled' && hold.cancelReason !== 'unpaid') return false;
  if (hold.status !== 'cancelled' && (!hold.holdUntil || Date.parse(hold.holdUntil) >= Date.now())) return true;
  if (!hold.date || !hold.time) return true; // an email reading holds no time
  const taken = new Set(await getTakenSlots(hold.date)); // (an expired hold isn't counted)
  return !footprintSlots(hold).some((s) => taken.has(s));
}

// A held booking whose payment has gone through: it becomes a real one — confirmed,
// paid, shown in the dashboard, and on the calendar (holds stay off it). Safe to call
// twice (the webhook and the visitor's own check can both land).
// Claims a one-time step (e.g. confirming one payment): true for the first caller only,
// even when two arrive together (Midtrans's notice and the visitor's own status check).
const claimedLocally = new Set();
export async function claimOnce(key) {
  if (db) {
    try { await db.collection('once').doc(key).create({ at: new Date().toISOString() }); return true; }
    catch (e) { if (e.code === 6 || /already exists/i.test(e.message)) return false; throw e; }
  }
  if (claimedLocally.has(key)) return false;
  claimedLocally.add(key);
  return true;
}

export async function confirmPaidHold(booking, payment) {
  if (!booking.holdOnly) return booking;
  const fields = { status: 'confirmed', paymentStatus: 'paid', holdOnly: false, holdUntil: null, cancelReason: null, ...payment };
  // the other caller is confirming it right now: same result, without a second invite/message
  if (!(await claimOnce(`confirm_${booking.id}_${booking.midtransOrderId || booking.paypalOrderId || ''}`))) return { ...booking, ...fields };
  await patch(booking.id, fields);
  const confirmed = { ...booking, ...fields };
  try {
    const eventId = await gcal.createEvent(confirmed);
    const transportIds = await gcal.createTransportEvents(confirmed);
    const cal = { ...(eventId ? { gcalEventId: eventId } : {}), ...(transportIds.length ? { gcalTransportIds: transportIds } : {}) };
    if (Object.keys(cal).length) { await patch(booking.id, cal); Object.assign(confirmed, cal); }
  } catch (e) { console.error('[bookings] calendar for paid booking failed:', e.message); }
  return confirmed;
}

// notes when something was sent for a booking (field → now)
async function stamp(id, field) {
  const at = new Date().toISOString();
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update({ [field]: at });
    return { id, [field]: at };
  }
  const all = readAll();
  const b = all.find((x) => x.id === id);
  if (!b) return null;
  b[field] = at;
  writeAll(all);
  return { id, [field]: at };
}

/** Admin sent the booking confirmation from their own WhatsApp (the dashboard's button) */
export const markWhatsAppConfirmed = (id) => stamp(id, 'waConfirmSentAt');

/** The customer was emailed that their payment came through (server/mailer.js) */
export const markPaidEmailSent = (id) => stamp(id, 'paidEmailSentAt');

/** an unpaid hold whose payment window was closed or failed: the slot is free again
 *  (these are left out of the dashboard; the customer usually just tries again) */
export async function releaseHold(booking, reason = 'closed') {
  if (!booking.holdOnly || booking.status === 'cancelled') return;
  await patch(booking.id, { status: 'cancelled', cancelReason: reason });
}

/** Cancels every booking still unpaid an hour after it was made (its holdUntil).
 *  Run before the dashboard lists bookings; returns how many were cancelled. */
export async function expireUnpaid() {
  const rows = db
    ? (await db.collection(COLLECTION).where('status', 'in', ['pending', 'awaiting_payment']).get()).docs.map((d) => d.data())
    : readAll();
  let n = 0;
  for (const b of rows.filter(unpaidExpired)) {
    try {
      // a booking that put a hold on the calendar (a live session on a payment link) loses it too
      if (!b.holdOnly) await updateStatus(b.id, 'cancelled');
      await patch(b.id, { status: 'cancelled', cancelReason: 'unpaid' });
      n++;
    } catch (e) { console.error('[bookings] cancelling unpaid booking failed:', b.id, e.message); }
  }
  return n;
}

/** Records that a notice went out for a booking (field → now): reminders, the owner's alerts */
export const markSent = (id, field) => stamp(id, field);

/** The bookings the timed checks look at (server/notices.js): sessions today or tomorrow
 *  (Jakarta dates) and orders from the last week. Two small queries, so a check every
 *  few minutes stays cheap however many bookings pile up over the years. */
export async function bookingsToWatch(now = Date.now()) {
  const day = (ms) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10); // Jakarta date
  const days = [day(now), day(now + 86_400_000)];
  const since = new Date(now - 7 * 86_400_000).toISOString();
  let rows;
  if (db) {
    const [a, b] = await Promise.all([
      db.collection(COLLECTION).where('date', 'in', days).get(),
      db.collection(COLLECTION).where('createdAt', '>=', since).get(),
    ]);
    rows = [...a.docs, ...b.docs].map((d) => d.data());
  } else {
    rows = readAll().filter((b) => days.includes(b.date) || (b.createdAt || '') >= since);
  }
  return [...new Map(rows.map((b) => [b.id, b])).values()];
}

/** Lets go of a claim (claimOnce) whose step didn't happen, so it can be tried again */
export async function releaseClaim(key) {
  if (db) { try { await db.collection('once').doc(key).delete(); } catch (e) { console.error('[bookings] release claim failed:', key, e.message); } return; }
  claimedLocally.delete(key);
}

/** one booking by id, or null */
export async function getBooking(id) {
  if (db) { const snap = await db.collection(COLLECTION).doc(id).get(); return snap.exists ? snap.data() : null; }
  return readAll().find((b) => b.id === id) || null;
}
