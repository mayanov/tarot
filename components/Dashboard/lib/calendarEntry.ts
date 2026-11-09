// Entries Mayanov puts in her Google Calendar herself ("Call tarot ika", "gymbrow").
// The dashboard reads their titles to tell a session from a personal entry, and to
// guess the booking a session would be (service, customer name, length).
import type { CalEvent } from '../../../services/booking';

const SESSION_WORDS = /\b(call|calls|tarot|telp|telpon|telepon|vc|video ?call|meet|meetup|meet ?up|tatap|ketemu|consult\w*|konsul\w*|session|sesi|reading|baca|live|klien|client)\b/i;

/** the entry looks like a tarot session, not a personal thing */
export const isSessionTitle = (title: string) => SESSION_WORDS.test(title || '');

const STRIP = /\b(call|calls|tarot|telp|telpon|telepon|vc|video|meet|meetup|meet ?up|tatap|muka|ketemu|consult\w*|konsul\w*|session|sesi|reading|baca|live|klien|client|with|dengan|sama|bareng|w)\b/gi;

// how she may address someone in a title ("te niniek", "kak ika"): not part of the name
const ADDRESS = /\b(te|tante|om|kak|ka|kakak|mbak|mba|mas|bu|ibu|pak|bapak|bang|abang|cik|ci|cici|ko|koh|sis|bro|mr|mrs|ms|miss|dr)\b\.?/gi;
// lengths, times and counts ("60min", "1h", "14:00", "2nd", "#3", "x2"): not part of the name either
const NUMBERS = /\b\d+\s*(min|mins|menit|mnt|m|h|hr|hrs|jam|x|st|nd|rd|th|pm|am)?\b|\b[x#]\d+\b|\d+[:.]\d+/gi;

const titleCase = (s: string) => s.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

/** the customer's name in the title, if there is one ("Call tarot ika" → "Ika",
    "Meetup te niniek 60min" → "Niniek") */
export const nameFromTitle = (title: string) => {
    const words = (title || '')
        .replace(/[\p{Extended_Pictographic}]/gu, ' ')
        .replace(STRIP, ' ')
        .replace(NUMBERS, ' ')
        .replace(/[-–—:·|/,()[\]#+&]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    // drop a form of address, unless that's all there is ("Call om" → "Om")
    const bare = words.replace(ADDRESS, ' ').replace(/\s+/g, ' ').trim();
    return titleCase(bare || words);
};

/** a name made comparable: lower case, no form of address, single spaces */
const normName = (s: string) => (s || '').toLowerCase().replace(ADDRESS, ' ').replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
/** a name's first word, the way people are told apart: "Kak Dewi L." → "dewi" */
export const firstNameKey = (s?: string) => normName(s || '').split(' ')[0] || '';

/** the people already in the dashboard this name may be, best first: the same name,
    then the same first name ("Ika" → "Ika Putri"), then a name with that word in it */
export const matchCustomers = <T extends { name: string }>(guess: string, people: T[], max = 4): T[] => {
    const g = normName(guess);
    if (g.length < 2) return [];
    const gFirst = g.split(' ')[0];
    const scored = people.map((p) => {
        const n = normName(p.name);
        if (!n) return { p, s: 0 };
        const words = n.split(' ');
        if (n === g) return { p, s: 4 };
        if (n.startsWith(g + ' ') || g.startsWith(n + ' ')) return { p, s: 3 };
        if (words[0] === gFirst) return { p, s: 2 };
        if (gFirst.length >= 3 && words.some((w) => w.startsWith(gFirst))) return { p, s: 1 };
        return { p, s: 0 };
    }).filter((x) => x.s > 0);
    return scored.sort((a, b) => b.s - a.s).slice(0, max).map((x) => x.p);
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
