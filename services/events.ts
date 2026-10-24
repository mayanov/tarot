// Events & Collaborations — public list + admin editing (talks to the Express API).
import SEED from '../server/eventsSeed.js';

export interface EventItem {
  id?: string;
  year: string;
  title: string;
  loc: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

// The built-in list (newest first) — shown if the API can't be reached, so the
// section is never empty.
export const FALLBACK_EVENTS: EventItem[] = [...(SEED as EventItem[])]
  .map((e, i) => ({ ...e, i }))
  .sort((a, b) => (+b.year - +a.year) || (b.i - a.i))
  .map(({ i: _i, ...e }) => e);

// `fresh` skips the browser cache (the public list may be cached ~1 min) — the admin
// dashboard always wants the latest after an add/edit/delete.
export async function fetchEvents(fresh = false): Promise<EventItem[]> {
  const res = await fetch(`${API_BASE}/api/events`, fresh ? { cache: 'no-store' } : undefined);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.events) ? data.events : [];
}

// Admin calls carry the login token (as the other admin views do) plus the cookie.
const authHeader = (): Record<string, string> => {
  try { const t = localStorage.getItem('authToken'); return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
};

async function send(path: string, method: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...authHeader() },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`);
  return data;
}

export const createEvent = (e: Omit<EventItem, 'id'>): Promise<EventItem> => send('/api/admin/events', 'POST', e);
export const updateEvent = (id: string, e: Omit<EventItem, 'id'>): Promise<EventItem> => send(`/api/admin/events/${encodeURIComponent(id)}`, 'PUT', e);
export const deleteEvent = (id: string): Promise<{ ok: true }> => send(`/api/admin/events/${encodeURIComponent(id)}`, 'DELETE');
