// Mayar for the Indonesian bookings, used as a payment gateway only (no Mayar store
// or profile page): the same steps as Xendit (server/xendit.js) — checkout holds the
// slot and opens a Mayar payment request (QRIS, e-wallets, virtual accounts) on
// Mayar's own payment page; the booking becomes real once Mayar says it's paid.
//
// Env: MAYAR_API_KEY (Mayar dashboard → Integrasi → API Key) and MAYAR_ENV=sandbox
// for test mode (keys from web.mayar.io, payments on api.mayar.io); anything else is
// real money. The dashboard's Webhook URL should point at /api/mayar/notify.
// When it has its key, Mayar is used ahead of Xendit and Midtrans, unless ID_PAYMENTS
// names another gateway.

const PAY_WINDOW_MIN = 55; // as Xendit's: ends a little before the slot's hold does

// Mayar asks for an email and a phone on every payment; when the customer gave none
// (only some readings need an email), its receipt goes to the business instead.
const FALLBACK_EMAIL = process.env.OWNER_EMAIL || 'tarotreadingbymayanov@gmail.com';

const key = () => String(process.env.MAYAR_API_KEY || '').trim();
export const testMode = () => String(process.env.MAYAR_ENV || '').trim().toLowerCase() === 'sandbox';
const API = () => (testMode() ? 'https://api.mayar.io' : 'https://api.mayar.id');

export const configured = () => Boolean(key());
/** whether the Indonesian form pays with Mayar */
export const active = () => configured() && (!process.env.ID_PAYMENTS || process.env.ID_PAYMENTS === 'mayar');

async function call(method, path, body) {
    const res = await fetch(`${API()}${path}`, {
        method,
        headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s || '');
// Indonesian numbers as Mayar shows them (08…): +62 / 62 → 0
const localPhone = (s) => {
    const d = String(s || '').replace(/\D/g, '');
    if (!d) return '';
    return d.startsWith('62') ? `0${d.slice(2)}` : d.startsWith('0') ? d : `0${d}`;
};

/** opens a payment request; returns Mayar's id for it and the page the visitor pays on */
export async function createInvoice({ orderId, amount, item, customer, returnUrl }) {
    const { ok, status, data } = await call('POST', '/hl/v1/payment/create', {
        name: customer.name.slice(0, 100),
        email: isEmail(customer.email) ? customer.email : FALLBACK_EMAIL,
        mobile: localPhone(customer.phone) || '0',
        amount,
        // our order id rides along, so a payment can be traced from Mayar's dashboard
        description: `${item.name} · ${orderId}`.slice(0, 250),
        expiredAt: new Date(Date.now() + PAY_WINDOW_MIN * 60_000).toISOString(),
        // the docs spell it both ways
        ...(returnUrl ? { redirectUrl: returnUrl, redirectURL: returnUrl } : {}),
    });
    const d = data?.data || {};
    if (!ok || !d.id || !d.link) {
        throw new Error(`Mayar payment failed (${status}) ${data?.messages || ''}`.trim());
    }
    return {
        invoiceId: d.id,
        invoiceUrl: /^https?:\/\//.test(d.link) ? d.link : `https://${d.link}`,
        transactionId: d.transactionId || d.transaction_id || '',
    };
}

// Where a payment stands, straight from Mayar (never from the browser or a webhook).
export async function getStatus(invoiceId) {
    const { ok, status, data } = await call('GET', `/hl/v1/payment/${encodeURIComponent(invoiceId)}`);
    if (!ok) throw new Error(`Mayar status failed (${status})`);
    const d = data?.data || {};
    const s = String(d.status || '').toLowerCase();
    const tx = Array.isArray(d.transactions) ? d.transactions[0] || {} : {};
    return {
        state: s === 'paid' || s === 'settled' || s === 'success' ? 'paid'
            : s === 'closed' || s === 'expired' || s === 'failed' ? 'failed' : 'pending',
        amount: Math.round(Number(d.amount || 0)),
        method: tx.paymentMethod || tx.paymentType || tx.method || '',
        transactionId: tx.id || '',
    };
}

// Closes a payment request that hasn't been paid (the visitor went back or closed the
// form), so it can't be paid after its slot is freed. True when there's nothing left to pay.
export async function expire(invoiceId) {
    const { ok } = await call('GET', `/hl/v1/payment/close/${encodeURIComponent(invoiceId)}`);
    if (!ok) return false;
    const st = await getStatus(invoiceId).catch(() => null);
    return !!st && st.state !== 'paid';
}

/** every id a Mayar webhook mentions (its payload isn't documented closely, and it isn't
 *  signed: the ids only say which booking to look at; the status always comes from Mayar) */
export function idsIn(body) {
    const out = new Set();
    const walk = (v, depth) => {
        if (depth > 3 || v == null) return;
        if (typeof v === 'string') { if (/^[\w-]{8,64}$/.test(v)) out.add(v); return; }
        if (Array.isArray(v)) { v.slice(0, 10).forEach((x) => walk(x, depth + 1)); return; }
        if (typeof v === 'object') for (const [k, x] of Object.entries(v)) if (/id$/i.test(k) || typeof x === 'object') walk(x, depth + 1);
    };
    walk(body?.data ?? body, 0);
    return [...out].slice(0, 12);
}
