// PayPal Checkout for the global readings — talks to the API's /api/paypal routes
// (server/paypal.js). Unlike createBooking there's no offline fallback: a payment
// either goes through the server or doesn't happen.
import type { Booking, BookingInput } from './booking';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export interface PayPalConfig {
  enabled: boolean;
  clientId?: string;
  currency?: string;
  /** local development with PAYPAL_SIMULATE=1: a stand-in for PayPal (services/paypalSim.ts) */
  simulate?: boolean;
}

let config: Promise<PayPalConfig> | null = null;
/** whether the server has PayPal keys (asked once per visit) */
export const paypalConfig = (): Promise<PayPalConfig> =>
  (config ??= fetch(`${API_BASE}/api/paypal/config`)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .catch(() => ({ enabled: false })));

let sdk: Promise<any> | null = null;
/** PayPal's own script (buttons + card form), loaded only when the review step needs it */
export const loadPayPal = (c: PayPalConfig, serviceIdOf: () => string = () => ''): Promise<any> =>
  c.simulate
    ? import('./paypalSim').then((m) => m.simulatedPayPal(serviceIdOf))
    : (sdk ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(c.clientId || '')}&currency=${c.currency || 'USD'}&intent=capture&components=buttons&disable-funding=paylater,credit`;
    s.onload = () => resolve((window as any).paypal);
    s.onerror = () => { sdk = null; s.remove(); reject(new Error('PAYPAL_SDK')); };
    document.head.appendChild(s);
  }));

/** Starts a payment (a live session's slot is held meanwhile); throws SLOT_TAKEN or ORDER_FAILED */
export async function createPayPalOrder(input: BookingInput): Promise<string> {
  const res = await fetch(`${API_BASE}/api/paypal/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error('SLOT_TAKEN');
  if (!res.ok) throw new Error('ORDER_FAILED');
  return (await res.json()).id;
}

/** PayPal's window was closed without paying: let a held slot go again */
export function releasePayPalOrder(orderId: string): void {
  fetch(`${API_BASE}/api/paypal/orders/${encodeURIComponent(orderId)}/release`, { method: 'POST', keepalive: true }).catch(() => {});
}

/** Takes the payment and saves the booking (as paid); throws DECLINED, CAPTURE_FAILED, SLOT_TAKEN or SAVE_FAILED */
export async function capturePayPalOrder(orderId: string, input: BookingInput): Promise<Booking> {
  const res = await fetch(`${API_BASE}/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'CAPTURE_FAILED');
  return data;
}
