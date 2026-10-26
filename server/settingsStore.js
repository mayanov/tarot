// Small admin settings kept on the server (currently: the analytics "reset" date).
//
// Same setup as eventStore: Firestore when FIREBASE_SERVICE_ACCOUNT is set,
// otherwise a local JSON file so dev works with zero setup.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'settings.json');
const DOC = { collection: 'meta', doc: 'settings' };

// ---- Firestore (shares the app initialised by the other stores, if any) ----
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
  console.error('[settings] Firestore init failed, falling back to JSON file:', e.message);
  db = null;
}

async function read() {
  if (db) {
    const snap = await db.collection(DOC.collection).doc(DOC.doc).get();
    return snap.exists ? snap.data() : {};
  }
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8') || '{}'); } catch { return {}; }
}

async function write(patch) {
  if (db) {
    await db.collection(DOC.collection).doc(DOC.doc).set(patch, { merge: true });
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ ...(await read()), ...patch }, null, 2));
}

// Analytics reset: the dashboard only counts data from this date (YYYY-MM-DD)
// onward. Nothing is deleted in Google Analytics, so clearing it brings the full
// history back. null = no reset.
export async function getAnalyticsSince() {
  return (await read()).analyticsSince || null;
}

export async function setAnalyticsSince(date) {
  await write({ analyticsSince: date || null });
  return date || null;
}
