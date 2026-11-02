// Midtrans Snap for the Indonesian bookings — talks to the API's /api/midtrans routes
// (server/midtrans.js). No offline fallback: a payment goes through the server or not at all.

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export interface MidtransConfig {
  enabled: boolean;
  clientKey?: string;
  snapJs?: string;
}

export type PayState = 'paid' | 'pending' | 'failed';

let config: Promise<MidtransConfig> | null = null;
/** whether the server has Midtrans keys (asked once per visit) */
export const midtransConfig = (): Promise<MidtransConfig> =>
  (config ??= fetch(`${API_BASE}/api/midtrans/config`)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .catch(() => ({ enabled: false })));

let snap: Promise<any> | null = null;
/** Midtrans's payment window script, loaded only when the review step needs it */
export const loadSnap = (c: MidtransConfig): Promise<any> =>
  (snap ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = c.snapJs || '';
    s.setAttribute('data-client-key', c.clientKey || '');
    s.onload = () => resolve((window as any).snap);
    s.onerror = () => { snap = null; s.remove(); reject(new Error('SNAP_JS')); };
    document.head.appendChild(s);
  }));

export interface MidtransCheckoutInput {
  serviceId: string;
  pkg: string; // the package's own label ('30 Menit'), '' when there are none
  date: string;
  time: string;
  name: string;
  dob: string;
  contact: string;
  question: string;
  phone: string;
  email: string;
}

/** holds the slot and opens a payment; throws SLOT_TAKEN or CHECKOUT_FAILED */
export async function startMidtrans(input: MidtransCheckoutInput): Promise<{ token: string; orderId: string }> {
  const res = await fetch(`${API_BASE}/api/midtrans/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error('SLOT_TAKEN');
  if (!res.ok) throw new Error('CHECKOUT_FAILED');
  return res.json();
}

/** where the payment stands (the server asks Midtrans, and confirms the booking if paid) */
export async function midtransStatus(orderId: string): Promise<PayState> {
  try {
    const res = await fetch(`${API_BASE}/api/midtrans/status/${encodeURIComponent(orderId)}`);
    if (!res.ok) return 'pending';
    return (await res.json()).state || 'pending';
  } catch {
    return 'pending';
  }
}

/** the visitor left before paying: cancels that payment and frees the slot (or reports it paid) */
export async function releaseMidtrans(orderId: string): Promise<PayState> {
  try {
    const res = await fetch(`${API_BASE}/api/midtrans/release/${encodeURIComponent(orderId)}`, { method: 'POST', keepalive: true });
    return res.ok ? (await res.json()).state || 'pending' : 'pending';
  } catch {
    return 'pending';
  }
}
