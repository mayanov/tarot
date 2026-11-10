// PayPal Checkout (Orders v2) for the global readings and live sessions: the booking form shows
// PayPal's buttons, the order is created and captured here (never trusting a price
// from the browser), and only a completed capture becomes a booking — saved as paid.
//
// Env: PAYPAL_CLIENT_ID, PAYPAL_SECRET (a REST app on the PayPal developer dashboard)
// and PAYPAL_ENV = 'live' | 'sandbox' (default sandbox). Without the keys the form
// falls back to the plain payment links.

// the keys as pasted into Vercel, without the spaces or line breaks a copy can bring along
const env = (k) => String(process.env[k] || '').trim();
const LIVE = env('PAYPAL_ENV').toLowerCase() === 'live';
const API = LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

// What each reading costs — the only source of the amount charged. A session with a
// length (the live call) is booked for a time: its slot is held while the buyer pays.
export const READINGS = {
    '3card': { name: '3-Card Spread', value: '12.00' },
    '5card': { name: '5-Card Deep', value: '20.00' },
    live: { name: 'Live Session', value: '45.00', durationMin: 30 },
};
const CURRENCY = 'USD';

// PAYPAL_SIMULATE=1 (local development only, never on Vercel): no PayPal at all — the
// form shows a stand-in PayPal window and these orders are made up, so the whole flow
// (the slot hold, the booking, the thank-you page) can be tried without keys.
export const SIMULATE = process.env.PAYPAL_SIMULATE === '1' && !process.env.VERCEL;
const simOrders = new Map(); // made-up order id → service

export const configured = () => SIMULATE || Boolean(env('PAYPAL_CLIENT_ID') && env('PAYPAL_SECRET'));
export const publicConfig = () => SIMULATE
    ? { simulate: true, clientId: 'simulated', env: 'sandbox', currency: CURRENCY }
    : { clientId: env('PAYPAL_CLIENT_ID'), env: LIVE ? 'live' : 'sandbox', currency: CURRENCY };

let token = null; // { value, expires }
async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const id = env('PAYPAL_CLIENT_ID'), secret = env('PAYPAL_SECRET');
    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    const res = await fetch(`${API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
        // what's likely wrong, never the keys themselves
        const hint = secret === id ? 'the secret is the client ID pasted twice'
            : res.status === 401 ? `the client ID and secret don't match a ${LIVE ? 'live' : 'sandbox'} app (a secret from another app, or ${LIVE ? 'sandbox' : 'live'} keys?)`
            : 'PayPal refused';
        throw new Error(`PayPal auth failed (${res.status}): ${hint}`);
    }
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
    if (SIMULATE) {
        const id = `SIM-${Date.now().toString(36).toUpperCase()}`;
        simOrders.set(id, serviceId);
        return id;
    }
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
    if (SIMULATE) {
        const serviceId = simOrders.get(orderId);
        if (!serviceId) throw new Error('UNKNOWN_ORDER');
        return { completed: true, serviceId, amount: READINGS[serviceId].value, currency: CURRENCY, captureId: `${orderId}-CAPTURE`, payerEmail: 'simulated-buyer@example.com' };
    }
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
