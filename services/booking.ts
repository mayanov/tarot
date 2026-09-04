// Booking data layer — talks to the Express API (real, shared, server-side store).
//
// In dev, Vite proxies /api → http://localhost:3001. In production set
// VITE_API_BASE to your deployed API origin (e.g. https://mayanov-tarot.onrender.com).
// If the API is unreachable it falls back to localStorage so the UI still works,
// but those bookings are local-only (a console warning is logged).

export interface BookingInput {
  serviceId: string;
  serviceName: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  name: string;
  contact: string;
  question: string;
  market: 'ID' | 'Global';
}

export interface Booking extends BookingInput {
  id: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
}

export const SLOT_TIMES = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

// ---- localStorage fallback (only used if the API is unreachable) ----
const STORAGE_KEY = 'mayanov_bookings';
const readLocal = (): Booking[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const writeLocal = (b: Booking[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch { /* ignore */ }
};

export async function getTakenSlots(date: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/availability?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return Array.isArray(data.taken) ? data.taken : [];
  } catch (e) {
    console.warn('[booking] availability API unavailable, using local fallback', e);
    return readLocal().filter((b) => b.date === date && b.status !== 'cancelled').map((b) => b.time);
  }
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.status === 409) throw new Error('SLOT_TAKEN');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } catch (e) {
    if (e instanceof Error && e.message === 'SLOT_TAKEN') throw e;
    // network/other error → local fallback
    console.warn('[booking] create API unavailable, using local fallback', e);
    const all = readLocal();
    if (all.some((b) => b.date === input.date && b.time === input.time && b.status !== 'cancelled')) {
      throw new Error('SLOT_TAKEN');
    }
    const booking: Booking = {
      ...input,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `bk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    all.push(booking);
    writeLocal(all);
    return booking;
  }
}

// Admin — requires the admin JWT (same token the dashboard uses).
export async function getAllBookings(token?: string): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/api/admin/bookings`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return await res.json();
}
