// Entries Mayanov puts in her Google Calendar herself ("Call tarot ika", "gymbrow").
// The dashboard reads their titles to tell a session from a personal entry, and to
// guess the booking a session would be (service, customer name, length).
import type { CalEvent } from '../../../services/booking';

const SESSION_WORDS = /\b(call|calls|tarot|telp|telpon|telepon|vc|video ?call|meet|meetup|meet ?up|tatap|ketemu|consult\w*|konsul\w*|session|sesi|reading|baca|live|klien|client)\b/i;

/** the entry looks like a tarot session, not a personal thing */
export const isSessionTitle = (title: string) => SESSION_WORDS.test(title || '');

const STRIP = /\b(call|calls|tarot|telp|telpon|telepon|vc|video|meet|meetup|meet ?up|tatap|muka|ketemu|consult\w*|konsul\w*|session|sesi|reading|baca|live|klien|client|with|dengan|sama|bareng|w)\b/gi;

/** the customer's name in the title, if there is one ("Call tarot ika" → "Ika") */
export const nameFromTitle = (title: string) => {
    const rest = (title || '')
        .replace(/[\p{Extended_Pictographic}]/gu, ' ')
        .replace(STRIP, ' ')
        .replace(/[-–—:·|/,()[\]]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return rest ? rest.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase()) : '';
};

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };

/** the entry's length in minutes (to its end, on the same day) */
export const entryMinutes = (e: CalEvent) => {
    if (!e.time) return 60;
    if (e.endTime && (!e.endDate || e.endDate === e.date)) return Math.max(15, toMin(e.endTime) - toMin(e.time));
    return 60;
};

/** the service it most likely is */
export const serviceFromTitle = (title: string): 'call' | 'meetup' | 'live' => {
    // (a bare "meet" is more often Google Meet, so a call)
    if (/\b(meetup|meet ?up|tatap|ketemu|offline)\b/i.test(title)) return 'meetup';
    if (/\blive\b/i.test(title)) return 'live';
    return 'call';
};
