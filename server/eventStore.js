// Server-side store for the "Events & Collaborations" list (edited from the admin
// dashboard, shown on the public site).
//
// Same setup as bookingStore: Firestore when FIREBASE_SERVICE_ACCOUNT is set,
// otherwise a local JSON file so dev works with zero setup. The first time the store
// is read it's filled with the events that used to be hard-coded on the site
// (eventsSeed.js), so nothing disappears when switching over.

import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import SEED from './eventsSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'events.json');
const COLLECTION = 'events';
const META = { collection: 'meta', doc: 'events' }; // remembers that the seed was applied

// ---- Firestore (shares the app initialised by bookingStore, if any) ----
let db = null;
try {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    if (!raw.trim().startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    if (!getApps().length) initializeApp({ credential: cert(JSON.parse(raw)) });
    db = getFirestore();
  }
} catch (e) {
  console.error('[events] Firestore init failed, falling back to JSON file:', e.message);
  db = null;
}

// ---- validation ----
const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export function validate(input) {
  const year = clean(input?.year, 4);
  const title = clean(input?.title, 140);
  const loc = clean(input?.loc, 140);
  if (!/^\d{4}$/.test(year) || +year < 2000 || +year > 2100) return { error: 'Year must be a 4-digit year' };
  if (!title) return { error: 'Title is required' };
  return { value: { year, title, loc } };
}

// Newest year first; within a year, the most recently added first.
const sortEvents = (list) => [...list].sort((a, b) => (b.year - a.year) || ((b.order ?? 0) - (a.order ?? 0)));
const newId = () => crypto.randomBytes(8).toString('hex');
// Seed order keeps the old on-site order (later in the old list = shown first in its year).
const seeded = () => SEED.map((e, i) => ({ id: newId(), ...e, order: i, createdAt: new Date(0).toISOString() }));

// ---- JSON fallback ----
function readFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(seeded(), null, 2));
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8') || '[]'); } catch { return []; }
}
const writeFile = (list) => fs.writeFileSync(FILE, JSON.stringify(list, null, 2));

// ---- Firestore seed (once) ----
// In a transaction, with fixed ids (seed-0 … seed-N), so two requests arriving at the
// same moment on a fresh deploy can't both seed it.
const SEED_EPOCH = new Date(0).toISOString();
let seedChecked = false;
async function ensureSeeded() {
  if (seedChecked) return;
  const metaRef = db.collection(META.collection).doc(META.doc);
  await db.runTransaction(async (tx) => {
    const meta = await tx.get(metaRef);
    if (meta.exists && meta.data()?.seeded) return;
    const existing = await tx.get(db.collection(COLLECTION).limit(1));
    if (existing.empty) {
      SEED.forEach((e, i) => tx.set(db.collection(COLLECTION).doc(`seed-${i}`), { id: `seed-${i}`, ...e, order: i, createdAt: SEED_EPOCH }));
    }
    tx.set(metaRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
  });
  seedChecked = true;
}

// Self-heal: remove duplicate copies of seeded events (same year/title/venue/order,
// seeded timestamp) — e.g. from a double seed — keeping one of each.
async function removeSeedDuplicates(docs) {
  const seen = new Set();
  const dupes = [];
  for (const d of docs) {
    if (d.createdAt !== SEED_EPOCH) continue;
    const key = `${d.year}|${d.title}|${d.loc}|${d.order}`;
    if (seen.has(key)) dupes.push(d.id); else seen.add(key);
  }
  if (!dupes.length) return docs;
  const batch = db.batch();
  dupes.forEach((id) => batch.delete(db.collection(COLLECTION).doc(id)));
  await batch.commit();
  console.log(`[events] removed ${dupes.length} duplicate seeded events`);
  const gone = new Set(dupes);
  return docs.filter((d) => !gone.has(d.id));
}

// ---- public API ----
export async function listEvents() {
  if (db) {
    await ensureSeeded();
    const snap = await db.collection(COLLECTION).get();
    return sortEvents(await removeSeedDuplicates(snap.docs.map((d) => d.data())));
  }
  return sortEvents(readFile());
}

export async function createEvent(value) {
  const ev = { id: newId(), ...value, order: Date.now(), createdAt: new Date().toISOString() };
  if (db) {
    await ensureSeeded();
    await db.collection(COLLECTION).doc(ev.id).set(ev);
  } else {
    writeFile([...readFile(), ev]);
  }
  return ev;
}

export async function updateEvent(id, value) {
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const ev = { ...doc.data(), ...value, updatedAt: new Date().toISOString() };
    await ref.set(ev);
    return ev;
  }
  const list = readFile();
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...value, updatedAt: new Date().toISOString() };
  writeFile(list);
  return list[i];
}

export async function deleteEvent(id) {
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  }
  const list = readFile();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return false;
  writeFile(next);
  return true;
}
