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
  durationMin: number; // session length in minutes (drives slot blocking)
  name: string;
  dob: string; // date of birth 'YYYY-MM-DD'
  contact: string;
  question: string;
  market: 'ID' | 'Global';
}

// The 30-min grid slots a booking occupies, from its start time and duration.
export const slotSpan = (start: string, durationMin: number): string[] => {
  if (!start) return [];
  const [h, m] = start.split(':').map(Number);
  const base = h * 60 + m;
  const dur = durationMin && durationMin > 0 ? durationMin : 30;
  const out: string[] = [];
  for (let t = base; t < base + dur; t += 30) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
};

export interface Booking extends BookingInput {
  id: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
}

export const SLOT_TIMES = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
];

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
    return [...new Set(
      readLocal().filter((b) => b.date === date && b.status !== 'cancelled')
        .flatMap((b) => slotSpan(b.time, b.durationMin)),
    )];
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
    const takenSet = new Set(
      all.filter((b) => b.date === input.date && b.status !== 'cancelled')
        .flatMap((b) => slotSpan(b.time, b.durationMin)),
    );
    if (input.date && input.time && slotSpan(input.time, input.durationMin).some((s) => takenSet.has(s))) {
      throw new Error('SLOT_TAKEN');
    }
    const booking: Booking = {
      ...input,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `bk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
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
