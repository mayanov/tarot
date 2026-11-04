// Reset an admin's dashboard password. Run from the project root:
//   node scripts/reset-admin-password.mjs            → localhost (server/admin_users.csv)
//   node scripts/reset-admin-password.mjs --staging  → staging/Vercel (Firestore admin_users)
// The new password is typed with hidden input and never printed.
import 'dotenv/config';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { execFileSync } from 'child_process';

const staging = process.argv.includes('--staging');
if (staging) {
  // Borrow the Firestore key from Vercel for this run only; the temp file is removed straight away.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-env-'));
  const file = path.join(dir, '.env');
  try {
    execFileSync('npx', ['vercel', 'env', 'pull', file, '--environment=production', '--yes'], { stdio: 'ignore' });
    const { parse } = await import('dotenv');
    const env = parse(fs.readFileSync(file));
    if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set on Vercel');
    process.env.FIREBASE_SERVICE_ACCOUNT = env.FIREBASE_SERVICE_ACCOUNT;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
} else {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
}
const { listUsers, setPassword } = await import('../server/userStore.js');

const ask = (q, hidden = false) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = (s) => { if (s.startsWith(q)) rl.output.write(q); };
  rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
});

const users = await listUsers();
console.log(`Admin accounts (${staging ? 'staging' : 'localhost'}):`);
users.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
const pick = await ask('Which one (number or email)? ');
const email = users[Number(pick) - 1] || pick;
if (!users.includes(email)) { console.log('No such admin.'); process.exit(1); }

const pw = await ask('New password: ', true);
if (pw.length < 8) { console.log('Use at least 8 characters.'); process.exit(1); }
const again = await ask('Again: ', true);
if (pw !== again) { console.log("Those didn't match."); process.exit(1); }

await setPassword(email, pw);
console.log(`Password updated for ${email} on ${staging ? 'staging' : 'localhost'}.`);
process.exit(0);
