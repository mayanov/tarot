#!/usr/bin/env node
// One-time sign-in that lets the booking site send calendar invites (with a Google
// Meet link) to customers of calls and live sessions, and email customers from
// Mayanov's Gmail (e.g. "payment received" for an email reading, server/mailer.js). Run it yourself from the repo
// root, signing in as tarotreadingbymayanov@gmail.com:
//
//   node scripts/google-calendar-auth.mjs
//
// Before running, in Google Cloud (project mayanov-tarot, signed in as
// tarotreadingbymayanov@gmail.com):
//   1. APIs & Services → OAuth consent screen: External, app name "Mayanov Tarot",
//      add the scopes .../auth/calendar and .../auth/gmail.send (Data Access → Add or
//      remove scopes), then "Publish app" (In production). Left in
//      "Testing", Google expires the sign-in after 7 days.
//   2. Credentials → Create credentials → OAuth client ID → "Desktop app".
//      Keep its client ID and secret at hand; the script asks for them.
//
// The script opens Google's sign-in page, catches the answer on 127.0.0.1, and stores
// GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN in
// the Vercel project's Production environment. Nothing secret is printed. Deploy
// again afterwards so the site picks them up.

import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import readline from 'node:readline';
import { OAuth2Client } from 'google-auth-library';

const OWNER = 'tarotreadingbymayanov@gmail.com';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send', // send only: it can't read the inbox
];

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // echo nothing while the secret is typed or pasted
      rl._writeToOutput = (s) => { if (s.startsWith(question)) rl.output.write(question); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

function setVercelEnv(name, value) {
  // replace any earlier value; the value goes over stdin, never on the command line
  spawnSync('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], { stdio: 'ignore' });
  const r = spawnSync('npx', ['vercel', 'env', 'add', name, 'production'], { input: value, stdio: ['pipe', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error(`vercel env add ${name} failed: ${String(r.stderr).trim().split('\n').pop()}`);
}

const clientId = await ask('OAuth client ID (Desktop app): ');
const clientSecret = await ask('OAuth client secret (hidden): ', { hidden: true });
if (!clientId || !clientSecret) { console.error('Both are needed.'); process.exit(1); }

// a loopback redirect on a free port, as Google expects for desktop clients
const server = http.createServer();
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const redirectUri = `http://127.0.0.1:${server.address().port}`;
const client = new OAuth2Client({ clientId, clientSecret, redirectUri });
const authUrl = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES, login_hint: OWNER });

const code = await new Promise((resolve, reject) => {
  server.on('request', (req, res) => {
    const u = new URL(req.url, redirectUri);
    const c = u.searchParams.get('code');
    const err = u.searchParams.get('error');
    if (!c && !err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(err ? `<p>Sign-in cancelled (${err}). You can close this tab.</p>` : '<p>Signed in. You can close this tab and go back to the terminal.</p>');
    server.close();
    err ? reject(new Error(err)) : resolve(c);
  });
  console.log(`\nOpening Google sign-in. Sign in as ${OWNER} and allow calendar access and sending email.`);
  console.log(`If no browser opens, visit:\n${authUrl}\n`);
  spawn('open', [authUrl], { stdio: 'ignore' }).on('error', () => {});
});

const { tokens } = await client.getToken(code);
if (!String(tokens.scope || '').includes('gmail.send')) {
  console.error('Sending email wasn\'t allowed (its box on Google\'s page was left unticked, or gmail.send isn\'t added to the consent screen). Nothing was saved; run it again.');
  process.exit(1);
}
if (!tokens.refresh_token) {
  console.error('Google sent no lasting access (refresh token). Remove "Mayanov Tarot" at https://myaccount.google.com/permissions and run this again.');
  process.exit(1);
}

// make sure it's the right account: the calendar's own primary id is its owner's email
client.setCredentials(tokens);
const me = await client.request({ url: 'https://www.googleapis.com/calendar/v3/calendars/primary' }).then((r) => r.data.id).catch(() => '');
if (me && me.toLowerCase() !== OWNER) {
  console.error(`Signed in as ${me}, not ${OWNER}. Nothing was saved; run it again with the right account.`);
  process.exit(1);
}

setVercelEnv('GOOGLE_OAUTH_CLIENT_ID', clientId);
setVercelEnv('GOOGLE_OAUTH_CLIENT_SECRET', clientSecret);
setVercelEnv('GOOGLE_OAUTH_REFRESH_TOKEN', tokens.refresh_token);
console.log(`Saved to Vercel (Production) for ${me || OWNER}. Deploy again, then calls and live sessions send invites and paid email readings get their email.`);
