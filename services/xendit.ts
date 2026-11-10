// Xendit for the Indonesian bookings — talks to the API's /api/xendit routes
// (server/xendit.js). Used instead of Midtrans when the server has Xendit's keys.
// No offline fallback: a payment goes through the server or not at all.

import type { PayState } from './midtrans';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export interface XenditConfig {
  enabled: boolean;
  test?: boolean;
}

let config: Promise<XenditConfig> | null = null;
/** whether the server pays Indonesian bookings with Xendit (asked once per visit) */
export const xenditConfig = (): Promise<XenditConfig> =>
  (config ??= fetch(`${API_BASE}/api/xendit/config`)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .catch(() => ({ enabled: false })));

/** holds the slot and opens an invoice; throws SLOT_TAKEN or CHECKOUT_FAILED */
export async function startXendit(input: unknown): Promise<{ orderId: string; invoiceUrl: string }> {
  const res = await fetch(`${API_BASE}/api/xendit/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error('SLOT_TAKEN');
  if (!res.ok) throw new Error('CHECKOUT_FAILED');
  return res.json();
}

/** where the payment stands (the server asks Xendit, and confirms the booking if paid) */
export async function xenditStatus(orderId: string): Promise<PayState> {
  try {
    const res = await fetch(`${API_BASE}/api/xendit/status/${encodeURIComponent(orderId)}`);
    if (!res.ok) return 'pending';
    return (await res.json()).state || 'pending';
  } catch {
    return 'pending';
  }
}

/** the visitor left before paying: expires that invoice and frees the slot (or reports it paid) */
export async function releaseXendit(orderId: string): Promise<PayState> {
  try {
    const res = await fetch(`${API_BASE}/api/xendit/release/${encodeURIComponent(orderId)}`, { method: 'POST', keepalive: true });
    return res.ok ? (await res.json()).state || 'pending' : 'pending';
  } catch {
    return 'pending';
  }
}
