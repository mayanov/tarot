// The Indonesian bookings paid on a gateway's own page — Mayar or Xendit, whichever the
// server names — through the API's /api/<gateway> routes (server/mayar.js,
// server/xendit.js). Used instead of Midtrans when the server has such a gateway's keys.
// No offline fallback: a payment goes through the server or not at all.

import type { PayState } from './midtrans';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export interface XenditConfig {
  enabled: boolean;
  test?: boolean;
  /** which gateway: 'mayar' or 'xendit' (older servers didn't say: Xendit) */
  provider?: 'mayar' | 'xendit';
}

let provider: 'mayar' | 'xendit' = 'xendit';
const route = (path: string) => `${API_BASE}/api/${provider}/${path}`;
/** the gateway's name, as told to people (and analytics) */
export const gatewayLabel = () => (provider === 'mayar' ? 'Mayar' : 'Xendit');

let config: Promise<XenditConfig> | null = null;
/** whether the server pays Indonesian bookings with Xendit (asked once per visit) */
export const xenditConfig = (): Promise<XenditConfig> =>
  (config ??= fetch(`${API_BASE}/api/xendit/config`)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((c: XenditConfig) => { if (c.provider) provider = c.provider; return c; })
    .catch(() => ({ enabled: false })));

/** holds the slot and opens an invoice; throws SLOT_TAKEN or CHECKOUT_FAILED */
export async function startXendit(input: unknown): Promise<{ orderId: string; invoiceUrl: string }> {
  const res = await fetch(route('checkout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error('SLOT_TAKEN');
  if (!res.ok) throw new Error('CHECKOUT_FAILED');
  return res.json();
}

/** where the payment stands (the server asks Xendit, and confirms the booking if paid) */
export async function xenditStatus(orderId: string): Promise<{ state: PayState; ref?: string }> {
  try {
    const res = await fetch(route(`status/${encodeURIComponent(orderId)}`));
    if (!res.ok) return { state: 'pending' };
    const d = await res.json();
    return { state: d.state || 'pending', ref: d.ref }; // ref: the booking's code, once it's paid
  } catch {
    return { state: 'pending' };
  }
}

/** the visitor left before paying: expires that invoice and frees the slot (or reports it paid) */
export async function releaseXendit(orderId: string): Promise<PayState> {
  try {
    const res = await fetch(route(`release/${encodeURIComponent(orderId)}`), { method: 'POST', keepalive: true });
    return res.ok ? (await res.json()).state || 'pending' : 'pending';
  } catch {
    return 'pending';
  }
}
