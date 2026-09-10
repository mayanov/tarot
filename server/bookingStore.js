// Server-side booking store.
//
// Uses Firestore when FIREBASE_SERVICE_ACCOUNT is set (durable, cloud, shared);
// otherwise falls back to a local JSON file so dev works with zero setup.
// One document per slot (id = `${date}_${time}`) guarantees no double-booking.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as gcal from './googleCalendar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'bookings.json');
const COLLECTION = 'bookings';

const slotId = (date, time) => `${date}_${time}`;

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
  rows.filter((b) => b.status !== 'cancelled')
    .forEach((b) => occupiedSlots(b.time, b.durationMin).forEach((s) => set.add(s)));
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
  const wanted = occupiedSlots(time, dur);

  // Availability from our store, minus this booking's current footprint.
  const taken = await dbTakenSlots(date);
  if (booking.date === date) occupiedSlots(booking.time, booking.durationMin || 30).forEach((s) => taken.delete(s));
  if (wanted.some((s) => taken.has(s))) { const e = new Error('SLOT_TAKEN'); e.code = 'SLOT_TAKEN'; throw e; }

  const updated = { ...booking, id: newId, date, time, durationMin: dur };

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
  }
  return updated;
}

export async function createBooking(input) {
  // Scheduled services reserve a unique slot; async ones (chat, email, special) don't.
  const hasSlot = Boolean(input.date && input.time);
  const id = hasSlot
    ? slotId(input.date, input.time)
    : 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const booking = { ...input, id, createdAt: new Date().toISOString(), status: 'confirmed' };

  // A scheduled booking blocks every 30-min slot it spans; reject if any overlap.
  const wanted = hasSlot ? occupiedSlots(input.time, input.durationMin) : [];

  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    if (hasSlot) {
      const taken = new Set(await getTakenSlots(input.date));
      if (wanted.some((s) => taken.has(s))) {
        const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
      }
    }
    await ref.set(booking);
    const eventId = await gcal.createEvent(booking);
    if (eventId) { booking.gcalEventId = eventId; await ref.update({ gcalEventId: eventId }); }
    return booking;
  }

  const all = readAll();
  if (hasSlot) {
    const taken = new Set(
      all.filter((b) => b.date === input.date && b.status !== 'cancelled')
        .flatMap((b) => occupiedSlots(b.time, b.durationMin)),
    );
    if (wanted.some((s) => taken.has(s))) {
      const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
    }
  }
  const cleaned = hasSlot ? all.filter((b) => b.id !== id) : all;
  cleaned.push(booking);
  writeAll(cleaned);
  const eventId = await gcal.createEvent(booking);
  if (eventId) { booking.gcalEventId = eventId; writeAll(cleaned); }
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
  for (const b of all) {
    if (!b.gcalEventId) continue;
    if (b.status !== 'confirmed' && b.status !== 'pending') continue;
    const info = await gcal.eventInfo(b.gcalEventId);
    if (info.status === 'deleted') {
      // Deleting a timed session cancels it; async reminders are managed in admin.
      if (b.date && b.time) { await updateStatus(b.id, 'cancelled'); changed++; }
    } else if (info.status === 'exists' && info.scheduled && b.date && b.time) {
      const movedTime = info.date !== b.date || info.time !== b.time;
      const movedDur = info.durationMin && Math.abs(info.durationMin - (b.durationMin || 0)) >= 5;
      if (movedTime || movedDur) {
        try {
          await rescheduleBooking(b.id, { date: info.date, time: info.time, durationMin: info.durationMin || b.durationMin }, { skipCalendar: true });
          changed++;
        } catch (e) { console.error('[bookings] reverse reschedule skipped:', e.message); }
      }
    }
  }
  return changed;
}

export async function getAllBookings() {
  if (db) {
    const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => d.data());
  }
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function updateStatus(id, status) {
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const prev = snap.data();
    await ref.update({ status });
    // Cancelling frees the slot — remove the Google Calendar event too.
    if (status === 'cancelled' && prev.gcalEventId) {
      await gcal.deleteEvent(prev.gcalEventId);
      await ref.update({ gcalEventId: null });
    }
    return { ...prev, status };
  }
  const all = readAll();
  const b = all.find((x) => x.id === id);
  if (!b) return null;
  b.status = status;
  if (status === 'cancelled' && b.gcalEventId) {
    await gcal.deleteEvent(b.gcalEventId);
    b.gcalEventId = null;
  }
  writeAll(all);
  return b;
}
