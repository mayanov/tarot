// PayPal Checkout (Orders v2) for the global readings and live sessions: the booking form shows
// PayPal's buttons, the order is created and captured here (never trusting a price
// from the browser), and only a completed capture becomes a booking — saved as paid.
//
// Env: PAYPAL_CLIENT_ID, PAYPAL_SECRET (a REST app on the PayPal developer dashboard)
// and PAYPAL_ENV = 'live' | 'sandbox' (default sandbox). Without the keys the form
// falls back to the plain payment links.

const LIVE = process.env.PAYPAL_ENV === 'live';
const API = LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

// What each reading costs — the only source of the amount charged. A session with a
// length (the live call) is booked for a time: its slot is held while the buyer pays.
export const READINGS = {
    '3card': { name: '3-Card Spread', value: '12.00' },
    '5card': { name: '5-Card Deep', value: '20.00' },
    live: { name: 'Live Session', value: '45.00', durationMin: 30 },
};
// How long a live session's slot is held while PayPal's window is open
export const HOLD_MIN = 20;
const CURRENCY = 'USD';

export const configured = () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
export const publicConfig = () => ({ clientId: process.env.PAYPAL_CLIENT_ID, env: LIVE ? 'live' : 'sandbox', currency: CURRENCY });

let token = null; // { value, expires }
async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    const res = await fetch(`${API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    const data = await res.json();
    token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
    return token.value;
}

async function call(method, path, body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`PayPal ${method} ${path} failed (${res.status})`);
        err.issue = data?.details?.[0]?.issue || data?.name;
        throw err;
    }
    return data;
}

export async function createOrder(serviceId) {
    const r = READINGS[serviceId];
    if (!r) throw new Error('UNKNOWN_SERVICE');
    const order = await call('POST', '/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: serviceId,
            description: `Mayanov Tarot · ${r.name}`,
            amount: { currency_code: CURRENCY, value: r.value },
        }],
        application_context: { brand_name: 'Mayanov Tarot', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
    });
    return order.id;
}

// Captures the order (or reads it back if it was already captured, e.g. a retried
// request) and returns what was actually paid, for the caller to check.
export async function captureOrder(orderId) {
    const path = `/v2/checkout/orders/${encodeURIComponent(orderId)}`;
    let order;
    try {
        order = await call('POST', `${path}/capture`, {});
    } catch (e) {
        if (e.issue !== 'ORDER_ALREADY_CAPTURED') throw e;
        order = await call('GET', path);
    }
    const unit = order.purchase_units?.[0] || {};
    const capture = unit.payments?.captures?.[0];
    return {
        completed: order.status === 'COMPLETED' && capture?.status === 'COMPLETED',
        serviceId: unit.reference_id,
        amount: capture?.amount?.value,
        currency: capture?.amount?.currency_code,
        captureId: capture?.id,
        payerEmail: order.payer?.email_address || '',
    };
}
