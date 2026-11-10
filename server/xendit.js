// Xendit for the Indonesian bookings — the alternative to Midtrans (server/midtrans.js),
// working the same way: checkout holds the slot (bookingStore: 'pending', unpaid,
// holdOnly) and opens a Xendit invoice (QRIS, e-wallets, virtual accounts, cards) on
// Xendit's own payment page; the booking becomes real once Xendit says it's paid.
//
// Env: XENDIT_SECRET_KEY (Xendit dashboard → Settings → API Keys; a xnd_development_…
// key is test mode, xnd_production_… is real money) and XENDIT_CALLBACK_TOKEN
// (Settings → Webhooks → "Webhook verification token"). The dashboard's "Invoices paid"
// webhook URL should point at /api/xendit/notify.
// When both Xendit and Midtrans have keys, Xendit is used, unless ID_PAYMENTS=midtrans.

import crypto from 'node:crypto';

const API = 'https://api.xendit.co';

// Same window as Midtrans's: the invoice expires a little before the slot's hold
// (bookingStore.PAY_WITHIN_MIN), so a late payment can't land on a freed slot.
const PAY_WINDOW_MIN = 55;

export const configured = () => Boolean(process.env.XENDIT_SECRET_KEY && process.env.XENDIT_CALLBACK_TOKEN);
/** whether the Indonesian form pays with Xendit (rather than Midtrans) */
export const active = () => configured() && process.env.ID_PAYMENTS !== 'midtrans';
export const testMode = () => !String(process.env.XENDIT_SECRET_KEY || '').startsWith('xnd_production_');

const auth = () => `Basic ${Buffer.from(`${String(process.env.XENDIT_SECRET_KEY || '').trim()}:`).toString('base64')}`;

async function call(method, path, body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: auth(), 'Content-Type': 'application/json', Accept: 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

/** opens an invoice; returns Xendit's id for it and the page the visitor pays on */
export async function createInvoice({ orderId, amount, item, customer, returnUrl }) {
    const email = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(customer.email || '') ? customer.email : undefined;
    const { ok, status, data } = await call('POST', '/v2/invoices', {
        external_id: orderId,
        amount,
        currency: 'IDR',
        description: item.name,
        invoice_duration: PAY_WINDOW_MIN * 60,
        items: [{ name: item.name.slice(0, 255), quantity: 1, price: amount }],
        customer: { given_names: customer.name.slice(0, 50), ...(email ? { email } : {}) },
        ...(email ? { payer_email: email } : {}),
        locale: 'id',
        ...(returnUrl ? { success_redirect_url: returnUrl, failure_redirect_url: returnUrl } : {}),
    });
    if (!ok || !data.id || !data.invoice_url) {
        throw new Error(`Xendit invoice failed (${status}) ${data.error_code || ''} ${data.message || ''}`.trim());
    }
    return { invoiceId: data.id, invoiceUrl: data.invoice_url };
}

// Where a payment stands, straight from Xendit (never from the browser).
export async function getStatus(invoiceId) {
    const { ok, status, data } = await call('GET', `/v2/invoices/${encodeURIComponent(invoiceId)}`);
    if (!ok) throw new Error(`Xendit status failed (${status})`);
    const s = data.status;
    const state = s === 'PAID' || s === 'SETTLED' ? 'paid' : s === 'EXPIRED' ? 'failed' : 'pending';
    return {
        state,
        amount: Math.round(Number(data.paid_amount || data.amount || 0)),
        // e.g. "QRIS", "OVO", "BCA" (the channel), else the kind ("EWALLET")
        method: data.payment_channel || data.payment_method || '',
        transactionId: data.payment_id || data.id || '',
    };
}

// A webhook is Xendit's only if it carries our verification token.
export function validCallback(token) {
    const expected = String(process.env.XENDIT_CALLBACK_TOKEN || '').trim();
    const got = String(token || '');
    return !!expected && got.length === expected.length
        && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

// Closes an invoice that hasn't been paid (the visitor went back or closed the form),
// so it can't be paid after its slot is freed. True when there's nothing left to pay.
export async function expire(invoiceId) {
    const { ok, data } = await call('POST', `/invoices/${encodeURIComponent(invoiceId)}/expire!`);
    return ok && data.status === 'EXPIRED';
}
