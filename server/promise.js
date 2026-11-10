// When an order's reading is due, as the site promises it (Services, FAQ; the dashboard's
// lib/format orderClock works it out the same way): 3-Card / 5-Card within 24 hours,
// Edisi Spesial in 2 working days (Jakarta), a chat answered within 6 hours (Mayanov's own
// target, not on the site), counted from when it's paid. Used by the
// calendar entry for each reading (server/googleCalendar.js, alerting 5 hours before) and
// the "due soon" email (server/notices.js).

const HOUR = 3_600_000;
// warnHours: how long before it's due Mayanov is warned (5 hours unless it says otherwise)
export const PROMISE = { '3card': { hours: 24 }, '5card': { hours: 24 }, special: { workDays: 2 }, chat: { hours: 6, warnHours: 2 } };
export const warnBeforeMs = (b) => (PROMISE[b?.serviceId]?.warnHours ?? 5) * HOUR;
// a chat's 6 hours is Mayanov's own target; the readings' times are promised on the site
export const promisedOnSite = (b) => b?.serviceId !== 'chat';
// Jakarta weekday (0 Sun … 6 Sat) of an instant
const jktDay = (ms) => new Date(ms + 7 * HOUR).getUTCDay();
const addWorkDays = (from, n) => {
  let t = from;
  while (n > 0) { t += 24 * HOUR; const d = jktDay(t); if (d !== 0 && d !== 6) n--; }
  return t;
};
/** the instant a paid order's reading is due, or NaN (unpaid, or no promised time) */
export const dueOf = (b) => {
  const p = PROMISE[b?.serviceId];
  if (!p || b.paymentStatus !== 'paid') return NaN;
  const since = Date.parse(b.paidAt || b.createdAt || '');
  if (!since) return NaN;
  return p.workDays ? addWorkDays(since, p.workDays) : since + (p.hours || 24) * HOUR;
};

// where Mayanov's dashboard is (linked from her alerts): the live site is static, so it
// runs on the Vercel site; ADMIN_URL moves it if the domain ever does
export const ADMIN_URL = process.env.ADMIN_URL || 'https://mayanov-tarot.vercel.app/admin';
