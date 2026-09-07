// Server-side booking store.
//
// Uses Firestore when FIREBASE_SERVICE_ACCOUNT is set (durable, cloud, shared);
// otherwise falls back to a local JSON file so dev works with zero setup.
// One document per slot (id = `${date}_${time}`) guarantees no double-booking.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export async function getTakenSlots(date) {
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
  return [...set];
}

export async function createBooking(input) {
  // Scheduled services reserve a unique slot; async ones (chat, email, special) don't.
  const hasSlot = Boolean(input.date && input.time);
  const id = hasSlot
    ? slotId(input.date, input.time)
    : 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const booking = { ...input, id, createdAt: new Date().toISOString(), status: 'pending' };

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
  return booking;
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
    await ref.update({ status });
    return { ...snap.data(), status };
  }
  const all = readAll();
  const b = all.find((x) => x.id === id);
  if (!b) return null;
  b.status = status;
  writeAll(all);
  return b;
}
