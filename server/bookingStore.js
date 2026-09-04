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
  if (db) {
    const snap = await db.collection(COLLECTION).where('date', '==', date).get();
    return snap.docs.map((d) => d.data()).filter((b) => b.status !== 'cancelled').map((b) => b.time);
  }
  return readAll().filter((b) => b.date === date && b.status !== 'cancelled').map((b) => b.time);
}

export async function createBooking(input) {
  // Scheduled services reserve a unique slot; async ones (chat, email, special) don't.
  const hasSlot = Boolean(input.date && input.time);
  const id = hasSlot
    ? slotId(input.date, input.time)
    : 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const booking = { ...input, id, createdAt: new Date().toISOString(), status: 'pending' };

  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    if (hasSlot) {
      const existing = await ref.get();
      if (existing.exists && existing.data().status !== 'cancelled') {
        const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
      }
    }
    await ref.set(booking);
    return booking;
  }

  const all = readAll();
  if (hasSlot && all.some((b) => b.date === input.date && b.time === input.time && b.status !== 'cancelled')) {
    const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
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
