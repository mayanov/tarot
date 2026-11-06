// Midtrans Snap for the Indonesian bookings: the form opens Midtrans's payment window
// (QRIS, e-wallets, bank transfer, cards) and the booking only becomes real once
// Midtrans says the money is in. While someone pays, their slot is held for them
// (bookingStore: status 'pending', unpaid, holdOnly) so nobody else can take it.
//
// Env: MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY (Midtrans dashboard → Settings → Access
// Keys) and MIDTRANS_ENV = 'production' | 'sandbox' (default sandbox). The dashboard's
// Payment Notification URL should point at /api/midtrans/notify. Without the keys the
// form falls back to paying by QRIS/transfer and sending proof on WhatsApp.

import crypto from 'node:crypto';

const LIVE = process.env.MIDTRANS_ENV === 'production';
const SNAP = LIVE ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
const API = LIVE ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

// How long a slot is held while someone pays; Midtrans's own payment window closes a
// little earlier, so a late payment can never land on a slot that's been freed.
// (the booking's hour to pay: bookingStore.PAY_WITHIN_MIN)
const PAY_WINDOW_MIN = 55;

// What each service costs (rupiah) and how long it runs — the only source of the
// amount charged. Keys match the booking form's packages (the part before ' · ').
export const SERVICES = {
    chat: { name: 'Konsultasi via Chat', scheduled: false, packages: { '1 Pertanyaan': [140000, 0], '3 Pertanyaan': [315000, 0] } },
    call: { name: 'Panggilan Suara & Video', scheduled: true, packages: { '30 Menit': [220000, 30], '60 Menit': [360000, 60] } },
    meetup: { name: 'Sesi Tatap Muka', scheduled: true, packages: { '1 Jam': [450000, 60], '2 Jam': [810000, 120], '3 Jam': [1170000, 180] } },
    special: { name: 'Edisi Spesial', scheduled: false, packages: { '': [250000, 0] } },
};

/** price and length for a service + package, or null if there's no such thing */
export function quote(serviceId, pkg = '') {
    const s = SERVICES[serviceId];
    const p = s?.packages[pkg];
    if (!p) return null;
    return { name: pkg ? `${s.name} · ${pkg}` : s.name, amount: p[0], durationMin: p[1], scheduled: s.scheduled };
}

export const configured = () => Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
export const publicConfig = () => ({ clientKey: process.env.MIDTRANS_CLIENT_KEY, snapJs: `${SNAP}/snap/snap.js` });

const auth = () => `Basic ${Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString('base64')}`;

export async function createTransaction({ orderId, amount, item, customer }) {
    const res = await fetch(`${SNAP}/snap/v1/transactions`, {
        method: 'POST',
        headers: { Authorization: auth(), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            transaction_details: { order_id: orderId, gross_amount: amount },
            item_details: [{ id: item.id, name: item.name.slice(0, 50), price: amount, quantity: 1 }],
            customer_details: customer,
            expiry: { unit: 'minutes', duration: PAY_WINDOW_MIN },
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) throw new Error(`Midtrans transaction failed (${res.status}) ${(data.error_messages || []).join('; ')}`);
    return data.token;
}

// Where a payment stands, straight from Midtrans (never from the browser).
export async function getStatus(orderId) {
    const res = await fetch(`${API}/v2/${encodeURIComponent(orderId)}/status`, {
        headers: { Authorization: auth(), Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Midtrans status failed (${res.status})`);
    const s = data.transaction_status;
    // 404 in the body: no payment started yet (the window was closed before choosing)
    const state = data.status_code === '404' ? 'pending'
        : s === 'settlement' || (s === 'capture' && data.fraud_status === 'accept') ? 'paid'
        : ['deny', 'cancel', 'expire', 'failure'].includes(s) ? 'failed'
        : 'pending';
    return { state, amount: Math.round(Number(data.gross_amount || 0)), method: data.payment_type || '', transactionId: data.transaction_id || '' };
}

// A notification is Midtrans's only if its signature matches our server key.
export function validNotification(n) {
    if (!n?.order_id || !n.signature_key) return false;
    const expected = crypto.createHash('sha512')
        .update(`${n.order_id}${n.status_code}${n.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
        .digest('hex');
    return expected.length === n.signature_key.length
        && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(n.signature_key));
}

// Cancels a payment that hasn't been made yet (the visitor went back or closed the
// form), so it can't be paid after its slot is freed. True when there's nothing left
// to pay: cancelled now, or never started (404).
export async function cancel(orderId) {
    const res = await fetch(`${API}/v2/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        headers: { Authorization: auth(), Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    // (412: can't be cancelled — it stays held until its window runs out)
    return ['200', '404'].includes(String(data.status_code)) && data.transaction_status !== 'settlement';
}
