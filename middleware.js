// Vercel Routing Middleware — puts a password in front of the whole Vercel site
// (pages, assets and API) while it's a private staging copy.
//
// Turned on by the SITE_PASSWORD env var on Vercel; when it isn't set, everyone
// passes (so removing the variable and redeploying opens the site again).
// Visitors get a small password page; the right password sets a cookie (a hash
// of the password, so changing SITE_PASSWORD signs everyone out). A cookie is
// used rather than browser Basic auth because the admin API already uses the
// Authorization header for its own login.
// The daily cron is left open — it has its own CRON_SECRET check.

export const config = {
  matcher: '/((?!api/cron/).*)',
};

const COOKIE = 'site_pass';
const UNLOCK_PATH = '/__unlock';

async function hash(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`mayanov:${text}`)));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const readCookie = (request, name) => {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : '';
};

const page = (wrong, next) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Mayanov Tarot — private</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1b1530;color:#f3eefc;font:16px/1.5 system-ui,-apple-system,sans-serif}
  form{width:min(320px,calc(100vw - 32px));display:grid;gap:12px}
  h1{margin:0 0 4px;font:600 22px Georgia,serif;letter-spacing:.01em}
  p{margin:0;color:#b9add6;font-size:14px}
  input{padding:12px 14px;border-radius:10px;border:1px solid #4a3f6b;background:#251d40;color:inherit;font:inherit}
  input:focus{outline:2px solid #8b63c6;outline-offset:1px}
  button{padding:12px;border:0;border-radius:999px;background:#6B3FA0;color:#fff;font:600 15px system-ui,sans-serif;cursor:pointer}
  .err{color:#ff9d8a}
</style></head><body>
<form method="post" action="${UNLOCK_PATH}">
  <h1>Mayanov Tarot</h1>
  <p>This preview is private. Enter the password to continue.</p>
  ${wrong ? '<p class="err">Wrong password — try again.</p>' : ''}
  <input type="password" name="password" placeholder="Password" autofocus required autocomplete="current-password">
  <input type="hidden" name="next" value="${next.replace(/"/g, '&quot;')}">
  <button type="submit">Enter</button>
</form></body></html>`;

const html = (body, status) => new Response(body, {
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
});

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return;

  const url = new URL(request.url);
  const expected = await hash(password);

  // password form submitted
  if (url.pathname === UNLOCK_PATH && request.method === 'POST') {
    const form = await request.formData();
    const next = String(form.get('next') || '/');
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
    if (String(form.get('password') || '') !== password) return html(page(true, safeNext), 401);
    return new Response(null, {
      status: 303,
      headers: {
        Location: safeNext,
        'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (readCookie(request, COOKIE) === expected) return;

  // API calls get a plain 401; pages get the password form
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Site is private' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  return html(page(false, url.pathname + url.search), 401);
}
