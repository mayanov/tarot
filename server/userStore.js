// Admin user store.
//
// Uses Firestore when FIREBASE_SERVICE_ACCOUNT is set (durable + writable in prod);
// otherwise falls back to the local admin_users.csv so dev works with zero setup.
// On first use with an empty Firestore collection, it seeds from the bundled CSV so
// existing admins keep their access. Doc id = email; field = passwordHash (scrypt).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword, verifyPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, 'admin_users.csv');
const COLLECTION = 'admin_users';

// ---- Firestore init (mirrors bookingStore.js) ----
let db = null;
try {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    if (!raw.trim().startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const serviceAccount = JSON.parse(raw);
    if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
    console.log('[users] Using Firestore');
  } else {
    console.log('[users] FIREBASE_SERVICE_ACCOUNT not set — using local admin_users.csv');
  }
} catch (e) {
  console.error('[users] Firestore init failed, falling back to CSV:', e.message);
  db = null;
}

// ---- CSV helpers (fallback store + seed source) ----
function readCsv() {
  if (!fs.existsSync(CSV_PATH)) return [];
  return fs.readFileSync(CSV_PATH, 'utf8')
    .split('\n').slice(1) // skip header
    .map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [email, hash] = l.split(','); return { email: (email || '').trim(), passwordHash: (hash || '').trim() }; })
    .filter((u) => u.email && u.passwordHash);
}
function writeCsv(users) {
  const lines = ['email,password_hash', ...users.map((u) => `${u.email},${u.passwordHash}`)];
  fs.writeFileSync(CSV_PATH, lines.join('\n'));
}

// ---- One-time seed: copy CSV users into an empty Firestore collection ----
let seeded = false;
async function ensureSeeded() {
  if (!db || seeded) return;
  const snap = await db.collection(COLLECTION).limit(1).get();
  if (snap.empty) {
    const csvUsers = readCsv();
    if (csvUsers.length) {
      const batch = db.batch();
      for (const u of csvUsers) batch.set(db.collection(COLLECTION).doc(u.email), { email: u.email, passwordHash: u.passwordHash });
      await batch.commit();
      console.log(`[users] Seeded ${csvUsers.length} admin user(s) into Firestore from CSV`);
    }
  }
  seeded = true;
}

// ---- Public API ----
export async function listUsers() {
  if (db) { await ensureSeeded(); const snap = await db.collection(COLLECTION).get(); return snap.docs.map((d) => d.id); }
  return readCsv().map((u) => u.email);
}

export async function getUser(email) {
  if (db) {
    await ensureSeeded();
    const doc = await db.collection(COLLECTION).doc(email).get();
    return doc.exists ? doc.data() : null;
  }
  return readCsv().find((u) => u.email === email) || null;
}

export async function userCount() {
  if (db) { await ensureSeeded(); const snap = await db.collection(COLLECTION).get(); return snap.size; }
  return readCsv().length;
}

export async function addUser(email, password) {
  if (await getUser(email)) { const err = new Error('User already exists'); err.code = 'EXISTS'; throw err; }
  const passwordHash = hashPassword(password);
  if (db) { await db.collection(COLLECTION).doc(email).set({ email, passwordHash }); return; }
  const users = readCsv(); users.push({ email, passwordHash }); writeCsv(users);
}

export async function setPassword(email, password) {
  if (!(await getUser(email))) { const err = new Error('User not found'); err.code = 'NOT_FOUND'; throw err; }
  const passwordHash = hashPassword(password);
  if (db) { await db.collection(COLLECTION).doc(email).set({ email, passwordHash }, { merge: true }); return; }
  const users = readCsv().map((u) => (u.email === email ? { ...u, passwordHash } : u)); writeCsv(users);
}

export async function deleteUser(email) {
  if (!(await getUser(email))) { const err = new Error('User not found'); err.code = 'NOT_FOUND'; throw err; }
  if (db) { await db.collection(COLLECTION).doc(email).delete(); return; }
  writeCsv(readCsv().filter((u) => u.email !== email));
}

// Verify a login attempt against the stored hash.
export async function verifyLogin(email, password) {
  const user = await getUser(email);
  if (!user || !user.passwordHash) return false;
  return verifyPassword(password, user.passwordHash);
}
