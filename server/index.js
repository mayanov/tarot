
import express from 'express';
import cors from 'cors';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as bookingStore from './bookingStore.js';
import * as eventStore from './eventStore.js';
import * as settingsStore from './settingsStore.js';
import * as userStore from './userStore.js';
import * as gcal from './googleCalendar.js';
import * as paypal from './paypal.js';
import * as midtrans from './midtrans.js';
import * as mailer from './mailer.js';
import * as notices from './notices.js';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3100',
        'http://127.0.0.1:3100',
        'https://tarotreadingbymayanov.com',
        'https://www.tarotreadingbymayanov.com',
        'https://mayanov-tarot.onrender.com',
        'https://mayanov-tarot.vercel.app',
        // this project's own preview addresses only (mayanov-tarot-abc123-cptxs-projects),
        // not every site on vercel.app
        /^https:\/\/mayanov-tarot-[a-z0-9]+-cptxs-projects\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization', 'Authorization-Token']
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Analytics Client
let analyticsDataClient;

try {
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (credentialsJson) {
        // Vercel / Cloud Environment
        const credentials = JSON.parse(credentialsJson);
        analyticsDataClient = new BetaAnalyticsDataClient({
            credentials
        });
        console.log('[Server] Analytics Client initialized with ENV credentials');
    } else {
        // Local / File-based Environment
        analyticsDataClient = new BetaAnalyticsDataClient();
        console.log('[Server] Analytics Client initialized with FILE credentials');
    }
} catch (error) {
    console.error('[Server] Failed to initialize Analytics Client:', error);
}

// The secret admin passes are signed with. On a hosted server it must be set (JWT_SECRET):
// a default written in this (public) code would let anyone make themselves a pass, so
// without it nobody can sign in. Only a local dev server gets a throwaway one.
const HOSTED = Boolean(process.env.VERCEL || process.env.RENDER || process.env.NODE_ENV === 'production');
const JWT_SECRET = process.env.JWT_SECRET || (HOSTED ? '' : `dev-only-${crypto.randomBytes(16).toString('hex')}`);
if (!JWT_SECRET) console.error('[Server] JWT_SECRET is not set: admin sign-in is switched off');

// Security Middleware: Verify Token
const verifyToken = (req, res, next) => {
    // Check cookie first, then auth header
    const token = req.cookies.admin_token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }
    if (!JWT_SECRET) return res.status(503).json({ error: 'Admin sign-in is not set up on this server' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or Expired Token' });
    }
};

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!JWT_SECRET) return res.status(503).json({ error: 'Admin sign-in is not set up on this server' });

    try {
        // 5 wrong passwords in a row lock the email for 15 minutes
        const wait = await userStore.lockedFor(email);
        if (wait > 0) {
            const min = Math.ceil(wait / 60_000);
            return res.status(429).json({ error: `Too many wrong passwords. Try again in ${min} minute${min === 1 ? '' : 's'}.` });
        }

        const isValid = await userStore.verifyLogin(email, password);

        if (isValid) {
            await userStore.clearFailures(email);
            // Generate JWT
            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });

            // Set HttpOnly Cookie
            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            return res.json({ success: true, token });
        } else {
            await userStore.recordFailure(email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('[Server] Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});



app.post('/api/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
});

// Admin User Management (backed by userStore — Firestore in prod, CSV in dev)

app.post('/api/users/add', verifyToken, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        await userStore.addUser(email.trim(), password);
        console.log(`[Server] New admin user added: ${email}`);
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'EXISTS') return res.status(400).json({ error: 'User already exists' });
        console.error('[Server] Add User Error:', e);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

app.get('/api/users', verifyToken, async (req, res) => {
    try {
        res.json(await userStore.listUsers());
    } catch (e) {
        console.error('[Server] List Users Error:', e);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// Reset / change a user's password.
app.post('/api/users/reset-password', verifyToken, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        await userStore.setPassword(email.trim(), password);
        console.log(`[Server] Password reset for ${email} by ${req.user.email}`);
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
        console.error('[Server] Reset Password Error:', e);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.delete('/api/users', verifyToken, async (req, res) => {
    const { email } = req.body;
    const currentUser = req.user.email; // Extracted safely from JWT by verifyToken middleware

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (email === currentUser) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        // Ensure at least one admin remains.
        if (await userStore.userCount() <= 1) {
            return res.status(400).json({ error: 'Cannot delete the only admin user' });
        }

        await userStore.deleteUser(email);
        console.log(`[Server] Admin user deleted: ${email} by ${currentUser}`);
        res.json({ success: true });

    } catch (e) {
        if (e.code === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
        console.error('[Server] Delete User Error:', e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// Which website's traffic the dashboard shows: the real site, or the private
// staging copy on Vercel. Anything else (localhost, Picktime pages that share the
// tag) is left out.
const SITE_HOSTS = {
    live: ['tarotreadingbymayanov.com', 'www.tarotreadingbymayanov.com'],
    staging: ['mayanov-tarot.vercel.app'],
};

app.get('/api/analytics', verifyToken, async (req, res) => {
    try {
        // not a secret (the dashboard ships it too) — default it so the server works
        // without the env var
        const propertyId = process.env.GA4_PROPERTY_ID || '386315459';
        const { endDate } = req.query;
        const site = req.query.site === 'staging' ? 'staging' : 'live';
        // Analytics reset: never count anything before the reset date
        const since = await settingsStore.getAnalyticsSince();
        const startDate = since && since > req.query.startDate ? since : req.query.startDate;
        if (since && endDate && since > endDate) {
            // the whole range is before the reset — nothing to count
            return res.json({ reports: Array.from({ length: 5 }, () => ({ rows: [] })), whatsapp: [{ rows: [] }, { rows: [] }], form: [{ rows: [] }], journey: Array.from({ length: 5 }, () => ({ rows: [] })), since, site });
        }

        if (!propertyId) {
            return res.status(500).json({ error: "Server missing 'GA4_PROPERTY_ID' configuration." });
        }

        console.log(`[Server] Fetching GA4 data for Property: ${propertyId} (${startDate} to ${endDate})`);

        console.log(`[Server] Fetching GA4 Batch Data for Property: ${propertyId} (${startDate} to ${endDate})`);

        const requestBody = {
            property: `properties/${propertyId}`,
            requests: [
                // 0: Daily Visits Trend
                {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'date' }, { name: 'country' }],
                    metrics: [{ name: 'sessions' }],
                    orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }]
                },
                // 1: Locations
                {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'country' }, { name: 'city' }],
                    metrics: [{ name: 'activeUsers' }],
                    limit: 10,
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
                },
                // 2: Device Categories
                {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'deviceCategory' }],
                    metrics: [{ name: 'activeUsers' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
                },
                // 3: Summary Totals
                {
                    dateRanges: [{ startDate, endDate }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'userEngagementDuration' },
                        { name: 'bounceRate' },
                        { name: 'activeUsers' }
                    ]
                },
                // 4: Service engagement per service (item-scoped metrics, since itemName
                // can't be combined with eventCount): card views, "Pesan" clicks, bookings
                {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'itemName' }],
                    metrics: [{ name: 'itemsViewed' }, { name: 'itemsCheckedOut' }, { name: 'itemsPurchased' }]
                }
            ]
        };

        // Only count the chosen site (localhost and other test hosts are never counted).
        // Every report gets the same hostName filter.
        const hostFilter = { filter: { fieldName: 'hostName', inListFilter: { values: SITE_HOSTS[site] } } };
        requestBody.requests.forEach((r) => { r.dimensionFilter = hostFilter; });

        // WhatsApp clicks (the 'contact' event, see trackWhatsApp): per place (sent as
        // link_text, a built-in dimension) and the total, with how many people clicked.
        // Its own batch (a batch holds at most 5 reports), and allowed to fail without
        // taking the rest of the dashboard down.
        const contactOnly = { andGroup: { expressions: [hostFilter, { filter: { fieldName: 'eventName', stringFilter: { value: 'contact' } } }] } };
        const whatsappBody = {
            property: `properties/${propertyId}`,
            requests: [
                { dateRanges: [{ startDate, endDate }], dimensions: [{ name: 'linkText' }], metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }], dimensionFilter: contactOnly },
                { dateRanges: [{ startDate, endDate }], metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }], dimensionFilter: contactOnly },
            ],
        };

        // The booking form, step by step (form_open … form_done, see trackFormStep) and
        // the payments that didn't go through (payment_issue): counts per event and
        // link_text (the market, or "market:reason"). Also its own batch, allowed to fail.
        const formEvents = ['form_open', 'form_schedule', 'form_details', 'form_review', 'form_done', 'payment_issue'];
        const formBody = {
            property: `properties/${propertyId}`,
            requests: [{
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'eventName' }, { name: 'linkText' }],
                metrics: [{ name: 'eventCount' }],
                dimensionFilter: { andGroup: { expressions: [hostFilter, { filter: { fieldName: 'eventName', inListFilter: { values: formEvents } } }] } },
            }],
        };

        // The visit beyond the form: which "Book" buttons get pressed (book_click) and
        // where the visitors who booked first pressed one (booked_via), FAQ questions
        // opened, site-version switches (with the visitor's country) and how far down
        // the page people get (section_view). All per link_text, like above; its own
        // batch, allowed to fail.
        const only = (name) => ({ andGroup: { expressions: [hostFilter, { filter: { fieldName: 'eventName', stringFilter: { value: name } } }] } });
        const range = [{ startDate, endDate }];
        const journeyBody = {
            property: `properties/${propertyId}`,
            requests: [
                { dateRanges: range, dimensions: [{ name: 'linkText' }], metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }], dimensionFilter: only('book_click') },
                { dateRanges: range, dimensions: [{ name: 'linkText' }], metrics: [{ name: 'eventCount' }], dimensionFilter: only('booked_via') },
                { dateRanges: range, dimensions: [{ name: 'linkText' }], metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }], dimensionFilter: only('faq_open'), limit: 50, orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }] },
                { dateRanges: range, dimensions: [{ name: 'linkText' }, { name: 'country' }], metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }], dimensionFilter: only('region_switch') },
                { dateRanges: range, dimensions: [{ name: 'linkText' }], metrics: [{ name: 'totalUsers' }], dimensionFilter: only('section_view') },
            ],
        };

        // Run the Batch Reports
        const [[response], whatsapp, form, journey] = await Promise.all([
            analyticsDataClient.batchRunReports(requestBody),
            analyticsDataClient.batchRunReports(whatsappBody).then(([r]) => r.reports, (e) => {
                console.error('[Server] WhatsApp clicks report failed:', e.message);
                return null;
            }),
            analyticsDataClient.batchRunReports(formBody).then(([r]) => r.reports, (e) => {
                console.error('[Server] Booking form report failed:', e.message);
                return null;
            }),
            analyticsDataClient.batchRunReports(journeyBody).then(([r]) => r.reports, (e) => {
                console.error('[Server] Visit journey report failed:', e.message);
                return null;
            }),
        ]);

        console.log("[Server] Data fetched successfully.");
        // The Node.js client returns an array [response, request, raw].
        // The response object contains { reports: [...] }
        res.json({ ...response, whatsapp, form, journey, since, site });

    } catch (error) {
        console.error("[Server] Error fetching analytics:", error);
        res.status(500).json({
            error: "Failed to fetch analytics data",
            details: error.message
        });
    }
});

// Analytics reset (dashboard counts only from that date; GA data isn't deleted).
app.get('/api/admin/analytics/reset', verifyToken, async (req, res) => {
    try { res.json({ since: await settingsStore.getAnalyticsSince() }); }
    catch (e) { res.status(500).json({ error: 'Failed to read reset date' }); }
});
app.post('/api/admin/analytics/reset', verifyToken, async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        res.json({ since: await settingsStore.setAnalyticsSince(today) });
    } catch (e) {
        console.error('analytics reset failed:', e);
        res.status(500).json({ error: 'Failed to reset analytics' });
    }
});
app.delete('/api/admin/analytics/reset', verifyToken, async (req, res) => {
    try { res.json({ since: await settingsStore.setAnalyticsSince(null) }); }
    catch (e) { res.status(500).json({ error: 'Failed to undo reset' }); }
});

// ------------------------------------------------------------------
// BOOKINGS
// ------------------------------------------------------------------

// ---- Events & Collaborations (public list + admin editing) ----
app.get('/api/events', async (req, res) => {
    try {
        // The public site may use a ~1 min cached copy; the admin dashboard asks with
        // ?fresh=… and must always get the live list (no browser or CDN cache).
        res.set('Cache-Control', req.query.fresh ? 'no-store' : 'public, max-age=60');
        res.json({ events: await eventStore.listEvents() });
    } catch (e) {
        console.error('events list failed:', e);
        res.status(500).json({ error: 'Failed to load events' });
    }
});

app.post('/api/admin/events', verifyToken, async (req, res) => {
    const { value, error } = eventStore.validate(req.body);
    if (error) return res.status(400).json({ error });
    try {
        res.status(201).json(await eventStore.createEvent(value));
    } catch (e) {
        console.error('event create failed:', e);
        res.status(500).json({ error: 'Failed to add event' });
    }
});

app.put('/api/admin/events/:id', verifyToken, async (req, res) => {
    const { value, error } = eventStore.validate(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const ev = await eventStore.updateEvent(req.params.id, value);
        if (!ev) return res.status(404).json({ error: 'Event not found' });
        res.json(ev);
    } catch (e) {
        console.error('event update failed:', e);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Reorder within a year: { dir: 'up' | 'down' } → the full, re-sorted list.
app.post('/api/admin/events/:id/move', verifyToken, async (req, res) => {
    const dir = req.body?.dir;
    if (dir !== 'up' && dir !== 'down') return res.status(400).json({ error: "dir must be 'up' or 'down'" });
    try {
        const events = await eventStore.moveEvent(req.params.id, dir);
        if (!events) return res.status(404).json({ error: 'Event not found' });
        res.json({ events });
    } catch (e) {
        console.error('event move failed:', e);
        res.status(500).json({ error: 'Failed to move event' });
    }
});

app.delete('/api/admin/events/:id', verifyToken, async (req, res) => {
    try {
        if (!(await eventStore.deleteEvent(req.params.id))) return res.status(404).json({ error: 'Event not found' });
        res.json({ ok: true });
    } catch (e) {
        console.error('event delete failed:', e);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Public: which time slots are already taken on a date (no personal data).
app.get('/api/availability', async (req, res) => {
    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date' });
    }
    try {
        res.json({ date, taken: await bookingStore.getTakenSlots(date) });
    } catch (e) {
        console.error('availability failed:', e);
        res.status(500).json({ error: 'Failed to load availability' });
    }
});

// Calls, live sessions and meetups are sent a calendar invite (server/googleCalendar.js),
// so their booking must carry an email ("Email: …" in the contact line the form builds).
const INVITED_SERVICES = new Set(['call', 'live', 'meetup']);
const missingEmail = (serviceId, contact) =>
    INVITED_SERVICES.has(String(serviceId)) && !/Email:\s*[^\s@·]+@[^\s@·]+\.[^\s@·]{2,}/.test(String(contact || ''));

// Bookings are for ages 18 and over (the form checks too; this catches anything else).
const underAge = (dob) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
    return !!m && new Date(+m[1] + 18, +m[2] - 1, +m[3]) > new Date();
};

// Public: create a booking.
app.post('/api/bookings', async (req, res) => {
    const { serviceId, serviceName, date, time, durationMin, name, dob, contact, question, market } = req.body || {};
    if (!serviceId || !name || !contact) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (missingEmail(serviceId, contact)) return res.status(400).json({ error: 'EMAIL_REQUIRED' });
    if (underAge(req.body?.dob)) return res.status(400).json({ error: 'UNDER_18' });
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date' });
    }
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: 'Invalid time' });
    }
    try {
        const booking = await bookingStore.createBooking({
            serviceId: String(serviceId).slice(0, 60),
            serviceName: String(serviceName || '').slice(0, 120),
            date,
            time,
            durationMin: Number.isFinite(+durationMin) ? Math.max(0, Math.min(600, Math.round(+durationMin))) : 0,
            name: String(name).slice(0, 120),
            dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
            contact: String(contact).slice(0, 160),
            question: String(question || '').slice(0, 2000),
            market: market === 'ID' ? 'ID' : 'Global',
            // a call / meetup / live session isn't paid yet: it holds its time (pending)
            // and the customer's invite waits until it's marked paid (bookingStore.updatePayment)
            ...(INVITED_SERVICES.has(String(serviceId)) && date && time ? { status: 'pending', inviteOnPay: true } : {}),
            // a global booking (paid on a PayPal link or as arranged) stays pending + unpaid
            // until it's marked paid, then it's confirmed; unpaid after an hour, it's cancelled
            ...(market !== 'ID' ? { status: 'pending', confirmOnPay: true, holdUntil: bookingStore.payBy() } : {}),
        });
        res.status(201).json(booking);
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('Booking create failed:', e);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Public: PayPal Checkout for the global readings (server/paypal.js). The form asks
// for the client id, has the order made here, and hands it back once the visitor has
// approved it; the capture is checked and only then saved, as a paid booking.
app.get('/api/paypal/config', (req, res) => {
    if (!paypal.configured()) return res.json({ enabled: false });
    res.json({ enabled: true, ...paypal.publicConfig() });
});

app.post('/api/paypal/orders', async (req, res) => {
    if (!paypal.configured()) return res.status(503).json({ error: 'PayPal not configured' });
    const { serviceId, date, time, name, dob, contact, question } = req.body || {};
    const reading = paypal.READINGS[serviceId];
    if (!reading) return res.status(400).json({ error: 'Unknown service' });
    if (!name || !contact) return res.status(400).json({ error: 'Missing required fields' });
    // a live session is for a time: check it before anything is charged
    if (reading.durationMin && (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time)))) {
        return res.status(400).json({ error: 'Missing date or time' });
    }
    if (missingEmail(serviceId, contact)) return res.status(400).json({ error: 'EMAIL_REQUIRED' });
    if (underAge(req.body?.dob)) return res.status(400).json({ error: 'UNDER_18' });
    let id;
    try {
        id = await paypal.createOrder(serviceId);
    } catch (e) {
        console.error('PayPal order failed:', e.message);
        return res.status(502).json({ error: 'Could not start the payment' });
    }
    // the booking is saved now, pending + unpaid, until PayPal says it's paid (a live
    // session's slot is held meanwhile, so nobody else takes it); unpaid after an hour,
    // it's cancelled
    {
        try {
            await bookingStore.createBooking({
                serviceId,
                serviceName: reading.name,
                date: reading.durationMin ? date : '',
                time: reading.durationMin ? time : '',
                durationMin: reading.durationMin || 0,
                name: String(name).slice(0, 120),
                dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
                contact: String(contact).slice(0, 160),
                question: String(question || '').slice(0, 2000),
                market: 'Global',
                status: 'pending',
                holdOnly: true,
                holdUntil: bookingStore.payBy(),
                amountDue: reading.value,
                paypalOrderId: id,
                skipCalendar: true,
            });
        } catch (e) {
            if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
            console.error('PayPal hold failed:', e);
            return res.status(500).json({ error: 'Failed to start booking' });
        }
    }
    res.status(201).json({ id });
});

// PayPal's window closed without paying: a live session's slot is let go straight away
app.post('/api/paypal/orders/:id/release', async (req, res) => {
    try {
        const hold = await bookingStore.findByPayPalOrder(String(req.params.id || '').slice(0, 64));
        if (hold?.holdOnly) await bookingStore.releaseHold(hold);
        res.json({ ok: true });
    } catch (e) {
        console.error('PayPal release failed:', e.message);
        res.json({ ok: false }); // the hold runs out on its own
    }
});

// "payment received" email, once per booking, for a global booking paid with PayPal or
// marked Paid in the dashboard. Indonesian bookings get none: they're followed up on
// WhatsApp. Awaited before answering (a serverless function stops once it has
// answered); a failed email never undoes anything.
async function emailPaid(booking) {
    try {
        if (!booking?.id || mailer.isIndonesian(booking) || booking.paidEmailSentAt || !mailer.emailOf(booking.contact)) return;
        if (!(await bookingStore.claimOnce(`paidmail_${booking.ref || booking.id}`))) return;
        if (await mailer.sendPaid(booking, booking.amountDue || paypal.READINGS[booking.serviceId]?.value || '')) {
            const st = await bookingStore.markPaidEmailSent(booking.id);
            if (st) booking.paidEmailSentAt = st.paidEmailSentAt;
        }
    } catch (e) {
        console.error('[mail] paid email failed:', booking.id, e.message);
    }
}

app.post('/api/paypal/orders/:id/capture', async (req, res) => {
    if (!paypal.configured()) return res.status(503).json({ error: 'PayPal not configured' });
    const orderId = String(req.params.id || '').slice(0, 64);
    const { serviceId, name, dob, contact, question } = req.body || {};
    const reading = paypal.READINGS[serviceId];
    // checked before taking the money, so a bad form never ends in a paid order with no booking
    // (an email reading's question comes by replying to the confirmation email)
    if (!reading || !name || !contact || missingEmail(serviceId, contact)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // the pending booking made with the order; a live session's slot must still be its
    // own, or the payment isn't taken
    let hold = null;
    try {
        hold = await bookingStore.findByPayPalOrder(orderId);
        if (hold && !hold.holdOnly) return res.json(hold); // a retried request, already booked
        if ((reading.durationMin && !hold) || (hold && (hold.serviceId !== serviceId || !(await bookingStore.holdStillFree(hold))))) {
            return res.status(409).json({ error: 'SLOT_TAKEN' });
        }
    } catch (e) {
        console.error('PayPal hold check failed:', orderId, e.message);
        return res.status(500).json({ error: 'CAPTURE_FAILED' });
    }
    let paid;
    try {
        paid = await paypal.captureOrder(orderId);
    } catch (e) {
        console.error('PayPal capture failed:', orderId, e.message, e.issue || '');
        // INSTRUMENT_DECLINED: the buyer can pick another card/account and try again
        return res.status(402).json({ error: e.issue === 'INSTRUMENT_DECLINED' ? 'DECLINED' : 'CAPTURE_FAILED' });
    }
    if (!paid.completed || paid.serviceId !== serviceId || paid.amount !== reading.value) {
        console.error('PayPal capture mismatch:', orderId, paid);
        return res.status(402).json({ error: 'CAPTURE_FAILED' });
    }
    try {
        if (hold) {
            // the pending booking becomes confirmed and paid (a live session goes on the calendar)
            const booking = await bookingStore.confirmPaidHold(hold, {
                name: String(name).slice(0, 120),
                dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
                contact: String(contact).slice(0, 160),
                question: String(question || '').slice(0, 2000),
                paymentMethod: paypal.SIMULATE ? 'PayPal (simulated)' : 'PayPal',
                paypalCaptureId: paid.captureId,
                paypalPayer: paid.payerEmail,
                paidAt: new Date().toISOString(),
            });
            await emailPaid(booking);
            await notices.notifyNewBooking(booking, reading.value);
            return res.status(201).json(booking);
        }
        // (an order made before bookings were saved pending has no hold: it's booked here)
        // a retried request for an order already turned into a booking gets that booking back
        const existing = (await bookingStore.getAllBookings()).find((b) => b.paypalOrderId === orderId);
        if (existing) return res.json(existing);
        const booking = await bookingStore.createBooking({
            serviceId,
            serviceName: reading.name,
            date: '',
            time: '',
            durationMin: 0,
            name: String(name).slice(0, 120),
            dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
            contact: String(contact).slice(0, 160),
            question: String(question || '').slice(0, 2000),
            market: 'Global',
            paymentStatus: 'paid',
            paymentMethod: paypal.SIMULATE ? 'PayPal (simulated)' : 'PayPal',
            paypalOrderId: orderId,
            paypalCaptureId: paid.captureId,
            paypalPayer: paid.payerEmail,
        });
        // an email reading: tell the customer straight away that it's paid and coming.
        // Sent before answering (a serverless function stops once it has answered), once
        // per booking; a failed email never undoes the booking.
        await emailPaid(booking);
        await notices.notifyNewBooking(booking, reading.value);
        res.status(201).json(booking);
    } catch (e) {
        // paid but not saved: keep every detail in the log so it can be entered by hand
        console.error('PAID BUT NOT SAVED:', orderId, paid.captureId, JSON.stringify(req.body), e);
        res.status(500).json({ error: 'SAVE_FAILED', captureId: paid.captureId });
    }
});

// Public: Midtrans Snap for the Indonesian bookings (server/midtrans.js). Checkout
// holds the slot and opens a payment; the booking turns real (paid, in the dashboard,
// on the calendar) once Midtrans confirms it — by its notification or the visitor's
// own check, whichever lands first — and a failed or expired payment frees the slot.
async function settleMidtrans(orderId) {
    const booking = await bookingStore.findByMidtransOrder(orderId);
    if (!booking) return { state: 'failed' };
    if (!booking.holdOnly) return { state: booking.status === 'cancelled' ? 'failed' : 'paid', booking };
    if (booking.status === 'cancelled' && booking.cancelReason !== 'unpaid') return { state: 'failed' };
    const st = await midtrans.getStatus(orderId);
    if (st.state === 'paid') {
        if (st.amount !== booking.amountDue) {
            console.error('Midtrans amount mismatch:', orderId, st.amount, booking.amountDue);
            return { state: 'pending' };
        }
        const paid = await bookingStore.confirmPaidHold(booking, {
            paymentMethod: `Midtrans · ${st.method}`,
            midtransTransactionId: st.transactionId,
            paidAt: new Date().toISOString(),
        });
        await notices.notifyNewBooking(paid, st.amount); // (once, whichever check lands first)
        return { state: 'paid', booking: paid };
    }
    if (st.state === 'failed') {
        await bookingStore.releaseHold(booking, 'failed');
        return { state: 'failed' };
    }
    return { state: 'pending' };
}

app.get('/api/midtrans/config', (req, res) => {
    if (!midtrans.configured()) return res.json({ enabled: false });
    res.json({ enabled: true, ...midtrans.publicConfig() });
});

app.post('/api/midtrans/checkout', async (req, res) => {
    if (!midtrans.configured()) return res.status(503).json({ error: 'Midtrans not configured' });
    const { serviceId, pkg, date, time, name, dob, contact, question, phone, email } = req.body || {};
    const q = midtrans.quote(serviceId, String(pkg || ''));
    if (!q || !name || !contact) return res.status(400).json({ error: 'Missing required fields' });
    if (missingEmail(serviceId, contact)) return res.status(400).json({ error: 'EMAIL_REQUIRED' });
    if (underAge(req.body?.dob)) return res.status(400).json({ error: 'UNDER_18' });
    if (q.scheduled && (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time)))) {
        return res.status(400).json({ error: 'Missing date or time' });
    }
    const orderId = `MYV-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
    let hold;
    try {
        hold = await bookingStore.createBooking({
            serviceId,
            serviceName: q.name,
            date: q.scheduled ? date : '',
            time: q.scheduled ? time : '',
            durationMin: q.durationMin,
            name: String(name).slice(0, 120),
            dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
            contact: String(contact).slice(0, 160),
            question: String(question || '').slice(0, 2000),
            market: 'ID',
            status: 'pending',
            holdOnly: true,
            holdUntil: bookingStore.payBy(),
            amountDue: q.amount,
            midtransOrderId: orderId,
            skipCalendar: true,
        });
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('Midtrans hold failed:', e);
        return res.status(500).json({ error: 'Failed to start booking' });
    }
    try {
        const token = await midtrans.createTransaction({
            orderId,
            amount: q.amount,
            item: { id: serviceId, name: q.name },
            customer: {
                first_name: String(name).slice(0, 50),
                ...(phone ? { phone: String(phone).slice(0, 20) } : {}),
                ...(email ? { email: String(email).slice(0, 80) } : {}),
            },
        });
        res.status(201).json({ token, orderId });
    } catch (e) {
        console.error('Midtrans checkout failed:', e.message);
        await bookingStore.releaseHold(hold).catch(() => {});
        res.status(502).json({ error: 'Could not start the payment' });
    }
});

// the visitor's own check (after the payment window closes, or while they're paying)
app.get('/api/midtrans/status/:orderId', async (req, res) => {
    if (!midtrans.configured()) return res.status(503).json({ error: 'Midtrans not configured' });
    try {
        const { state, booking } = await settleMidtrans(String(req.params.orderId).slice(0, 64));
        res.json({ state, ...(booking ? { ref: booking.ref } : {}) });
    } catch (e) {
        console.error('Midtrans status failed:', e.message);
        res.json({ state: 'pending' });
    }
});

// the visitor went back or closed the form before paying: cancel that payment with
// Midtrans, then free the slot (unless it was paid just now — then it's confirmed)
app.post('/api/midtrans/release/:orderId', async (req, res) => {
    if (!midtrans.configured()) return res.status(503).json({ error: 'Midtrans not configured' });
    const orderId = String(req.params.orderId).slice(0, 64);
    try {
        const settled = await settleMidtrans(orderId);
        if (settled.state !== 'pending') return res.json({ state: settled.state });
        const booking = await bookingStore.findByMidtransOrder(orderId);
        if (booking && await midtrans.cancel(orderId)) await bookingStore.releaseHold(booking);
        res.json({ state: 'failed' });
    } catch (e) {
        console.error('Midtrans release failed:', orderId, e.message);
        res.json({ state: 'pending' }); // the hold runs out on its own
    }
});

// Midtrans's notification (set as the Payment Notification URL in its dashboard); it
// retries until it gets a 2xx, so a failure here is answered with a 500
app.post('/api/midtrans/notify', async (req, res) => {
    if (!midtrans.configured() || !midtrans.validNotification(req.body)) return res.status(403).json({ error: 'Invalid' });
    try {
        await settleMidtrans(String(req.body.order_id));
        res.json({ ok: true });
    } catch (e) {
        console.error('Midtrans notification failed:', req.body.order_id, e.message);
        res.status(500).json({ error: 'Retry' });
    }
});

// Admin: Google Calendar sync status (for setup verification).
app.get('/api/admin/calendar/status', verifyToken, (req, res) => {
    res.json(gcal.calendarStatus());
});

// Admin: actively test the calendar connection (creates + deletes a throwaway event).
app.get('/api/admin/calendar/test', verifyToken, async (req, res) => {
    res.json(await gcal.selfTest());
});

// Cron: periodically pull Google Calendar changes (cancel bookings whose event was
// deleted, follow moves) and sweep orphaned meetup transport blocks. Triggered by
// Vercel Cron on a schedule. Protected by CRON_SECRET when that env var is set.
app.get('/api/cron/reconcile', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    try {
        const changed = (await bookingStore.reconcileWithCalendar()) + ((await bookingStore.completePastSessions().catch(() => 0)) || 0);
        // (the timed emails too, as a fallback for the clock that runs /api/cron/tick)
        const sent = await notices.runChecks().catch((e) => { console.error('checks failed:', e.message); return []; });
        res.json({ ok: true, changed, sent });
    } catch (e) {
        console.error('cron reconcile failed:', e.message);
        res.status(500).json({ error: 'reconcile failed' });
    }
});

// Cron: the timed emails (server/notices.js): a reading due in 5 hours (to Mayanov), a
// Live Session tomorrow and in an hour (to the customer). Each is sent once, so this is
// meant to be called every 10 minutes by an outside clock (the Vercel plan only runs its
// own once a day). Needs CRON_SECRET, sent as "Authorization: Bearer <CRON_SECRET>".
app.get('/api/cron/tick', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });
    try {
        const sent = await notices.runChecks();
        const done = await bookingStore.completePastSessions().catch((e) => { console.error('marking sessions done failed:', e.message); return 0; });
        res.json({ ok: true, sent, done });
    } catch (e) {
        console.error('cron tick failed:', e.message);
        res.status(500).json({ error: 'checks failed' });
    }
});

// Admin: the owner's Google Calendar events in a date range (for the schedule grid).
app.get('/api/admin/calendar/events', verifyToken, async (req, res) => {
    const start = String(req.query.start || '');
    const end = String(req.query.end || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        return res.status(400).json({ error: 'Invalid start or end' });
    }
    try {
        res.json({ events: await gcal.listEvents(start, end) });
    } catch (e) {
        console.error('list calendar events failed:', e);
        res.status(500).json({ error: 'Failed to load events' });
    }
});

// Throttle the (slow) Google Calendar reconcile so it runs at most once per window
// instead of on every dashboard load / tab switch. The daily cron and the manual
// cron endpoint still run it unconditionally.
let lastReconcileAt = 0;
let lastChecksAt = 0;
const RECONCILE_THROTTLE_MS = 3 * 60 * 1000;

// Admin: list all bookings (JWT-protected, same auth as the dashboard).
// Admin: the housekeeping that used to hold up the bookings list (it took ~5 s): read back
// changes made in Google Calendar, cancel bookings left unpaid past their hour, mark
// sessions that are over as done, and send
// any timed email whose clock was missed. The dashboard calls it in the background right
// after the list has loaded, and loads the list again if anything changed.
app.post('/api/admin/sync', verifyToken, async (req, res) => {
    let changed = 0;
    if (Date.now() - lastReconcileAt > RECONCILE_THROTTLE_MS) {
        lastReconcileAt = Date.now();
        try { changed += (await bookingStore.reconcileWithCalendar()) || 0; } catch (e) { console.error('reconcile failed:', e.message); }
    }
    try { changed += (await bookingStore.expireUnpaid()) || 0; } catch (e) { console.error('expire unpaid failed:', e.message); }
    try { changed += (await bookingStore.completePastSessions()) || 0; } catch (e) { console.error('marking sessions done failed:', e.message); }
    if (Date.now() - lastChecksAt > RECONCILE_THROTTLE_MS) {
        lastChecksAt = Date.now();
        await notices.runChecks().catch((e) => console.error('checks failed:', e.message));
    }
    res.json({ changed });
});

app.get('/api/admin/bookings', verifyToken, async (req, res) => {
    try {
        // (Google Calendar changes, unpaid bookings and missed emails: POST /api/admin/sync)
        // bookings being paid for show as pending/unpaid, and as cancelled if never paid;
        // a payment window the customer closed (they usually just try again) is left out
        res.json((await bookingStore.getAllBookings()).filter((b) => !(b.holdOnly && b.status === 'cancelled' && b.cancelReason !== 'unpaid')));
    } catch (e) {
        console.error('list bookings failed:', e);
        res.status(500).json({ error: 'Failed to load bookings' });
    }
});

// Admin: create a booking manually (e.g. orders taken over WhatsApp) so they
// show up in the schedule, customer list and revenue report.
app.post('/api/admin/bookings', verifyToken, async (req, res) => {
    const { serviceId, serviceName, date, time, durationMin, name, contact, question, amount, currency, orderDate, status, paymentStatus, linkEventId } = req.body || {};
    if (linkEventId !== undefined && !(typeof linkEventId === 'string' && /^[A-Za-z0-9_-]{1,1024}$/.test(linkEventId) && date && time)) {
        return res.status(400).json({ error: 'Invalid calendar entry' });
    }
    if (!serviceId || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date' });
    }
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: 'Invalid time' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    const cur = currency === 'USD' ? 'USD' : 'IDR';
    // A price token the revenue parser understands ("Rp 300000" or "$20").
    const price = cur === 'USD' ? `$${amt}` : `Rp ${Math.round(amt)}`;
    const st = ['pending', 'confirmed', 'done'].includes(status) ? status : 'confirmed';
    // The order date drives which day the revenue lands on; default to now.
    const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(String(orderDate || ''))
        ? `${orderDate}T12:00:00.000Z`
        : new Date().toISOString();
    const scheduled = Boolean(date && time);
    try {
        const booking = await bookingStore.createBooking({
            serviceId: String(serviceId).slice(0, 60),
            serviceName: String(serviceName || '').slice(0, 120),
            date: date || undefined,
            time: time || undefined,
            durationMin: Number.isFinite(+durationMin) ? Math.max(0, Math.min(600, Math.round(+durationMin))) : (scheduled ? 60 : 0),
            name: String(name).slice(0, 120),
            dob: '',
            contact: String(contact || '').slice(0, 160),
            question: String(question || '').slice(0, 2000),
            market: cur === 'IDR' ? 'ID' : 'Global',
            price,
            source: 'manual',
            status: st,
            paymentStatus: paymentStatus === 'paid' ? 'paid' : 'unpaid',
            createdAt,
            // Only put a manual booking on Google Calendar if it's an actual upcoming
            // session (has date + time); pure report records skip the calendar.
            skipCalendar: !scheduled,
            // a session she already has on her Google Calendar: that entry becomes the booking's
            ...(linkEventId ? { linkEventId } : {}),
        });
        res.status(201).json(booking);
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        if (e.code === 'LINKED') return res.status(409).json({ error: 'LINKED' });
        console.error('manual booking create failed:', e);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Admin: a call or meetup that ran longer than booked. The extra time is its own small
// record (extraFor: the session's ref), with its own price and Paid switch, so Sales,
// Revenue and Customers count it like any order; the session itself gets longer, here and
// on the calendar (without Google emailing the guest), unless `keepTime` (the time after it
// is booked: only the money is recorded).
const EXTRA_TIME = {
    call: { minutes: 15, amount: 110000, label: 'Tambahan 15 Menit' },
    meetup: { minutes: 60, amount: 360000, label: 'Jam Berikutnya (per jam)' },
};
app.post('/api/admin/bookings/:id/extra', verifyToken, async (req, res) => {
    const { units: rawUnits, paid, keepTime } = req.body || {};
    const units = Math.round(Number(rawUnits) || 1);
    if (units < 1 || units > 8) return res.status(400).json({ error: 'Invalid amount of time' });
    try {
        const b = await bookingStore.getBooking(req.params.id);
        if (!b) return res.status(404).json({ error: 'Not found' });
        const x = EXTRA_TIME[b.serviceId];
        if (!x || !b.date || !b.time || b.status === 'cancelled') return res.status(400).json({ error: 'Not a session that can run longer' });
        const minutes = x.minutes * units;
        let session = b;
        if (!keepTime) {
            session = await bookingStore.rescheduleBooking(b.id, {
                date: b.date, time: b.time, durationMin: (b.durationMin || 30) + minutes,
            }, { quiet: true });
        }
        const svc = String(b.serviceName || '').split(' · ')[0].trim() || b.serviceId;
        const extra = await bookingStore.createBooking({
            serviceId: b.serviceId,
            serviceName: `${svc} · ${x.label}${units > 1 ? ` ×${units}` : ''}`,
            name: b.name || '',
            dob: '',
            contact: b.contact || '',
            question: `Extra time for the session on ${b.date} ${b.time}`,
            market: 'ID',
            price: `Rp ${x.amount * units}`,
            source: 'manual',
            status: 'done',
            paymentStatus: paid ? 'paid' : 'unpaid',
            // revenue lands on the session's day
            createdAt: `${b.date}T12:00:00.000Z`,
            extraFor: b.ref || b.id,
            extraMinutes: minutes,
            skipCalendar: true,
        });
        res.status(201).json({ session, extra });
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('extra time failed:', e);
        res.status(500).json({ error: 'Failed to add extra time' });
    }
});

// Admin: move a booking to a new date/time (drag-and-drop reschedule).
app.post('/api/admin/bookings/:id/reschedule', verifyToken, async (req, res) => {
    const { date, time, durationMin } = req.body || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^\d{2}:\d{2}$/.test(String(time || ''))) {
        return res.status(400).json({ error: 'Invalid date or time' });
    }
    try {
        const before = await bookingStore.getBooking(req.params.id);
        const updated = await bookingStore.rescheduleBooking(req.params.id, {
            date, time,
            durationMin: Number.isFinite(+durationMin) ? Math.max(0, Math.min(600, Math.round(+durationMin))) : undefined,
        });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        // the customer hears about it (a global session with an email; once it's sent)
        if (before) await notices.notifyMoved(before, updated);
        res.json(updated);
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('reschedule failed:', e);
        res.status(500).json({ error: 'Failed to reschedule' });
    }
});

// Marking a global booking Paid by hand (paid on a payment link) emails the customer, but
// only for a recent booking made on the site: never for orders entered in the dashboard
// or old, cancelled or finished ones being tidied up.
function emailOnMarkPaid(b) {
    if (b.source === 'manual' || b.holdOnly || ['cancelled', 'done'].includes(b.status)) return false;
    if (Date.now() - new Date(b.createdAt || 0).getTime() > 30 * 86400000) return false;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    return !b.date || b.date >= today;
}

// Admin: update a booking's payment status (unpaid | paid) — for the Sales report.
app.post('/api/admin/bookings/:id/payment', verifyToken, async (req, res) => {
    const { paymentStatus } = req.body || {};
    if (!['unpaid', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }
    try {
        const updated = await bookingStore.updatePayment(req.params.id, paymentStatus);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        if (paymentStatus === 'paid' && emailOnMarkPaid(updated)) await emailPaid(updated);
        res.json(updated);
    } catch (e) {
        console.error('update payment failed:', e);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Admin: the booking confirmation was sent from Mayanov's own WhatsApp (dashboard button,
// a wa.me link — an ordinary message, so nothing is charged). Only records when.
app.post('/api/admin/bookings/:id/wa-confirmed', verifyToken, async (req, res) => {
    try {
        const updated = await bookingStore.markWhatsAppConfirmed(req.params.id);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (e) {
        console.error('mark WhatsApp confirmation failed:', e);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// Admin: the dashboard's "Ask to pay" opened WhatsApp with the payment details typed in;
// remember when (shown by the button)
app.post('/api/admin/bookings/:id/wa-pay-asked', verifyToken, async (req, res) => {
    try {
        const updated = await bookingStore.markWhatsAppPayAsked(req.params.id);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (e) {
        console.error('mark WhatsApp payment request failed:', e);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// Admin: send a global booking's confirmation email ("your … is booked", the one a PayPal
// payment sends by itself) from the Sales screen, for one that never got it: paid by hand,
// or entered in the dashboard. Once per booking: one already emailed is left as it is.
app.post('/api/admin/bookings/:id/email-confirm', verifyToken, async (req, res) => {
    try {
        const b = await bookingStore.getBooking(req.params.id);
        if (!b) return res.status(404).json({ error: 'Not found' });
        if (b.paidEmailSentAt) return res.json(b);
        if (mailer.isIndonesian(b)) return res.status(400).json({ error: 'INDONESIA' });
        if (b.paymentStatus !== 'paid') return res.status(409).json({ error: 'NOT_PAID' });
        if (!mailer.emailOf(b.contact)) return res.status(400).json({ error: 'NO_EMAIL' });
        await bookingStore.claimOnce(`paidmail_${b.ref || b.id}`).catch(() => false); // (so the automatic one never follows)
        if (!(await mailer.sendPaid(b, b.amountDue || paypal.READINGS[b.serviceId]?.value || ''))) return res.status(502).json({ error: 'NOT_SENT' });
        const st = await bookingStore.markPaidEmailSent(b.id);
        res.json({ ...b, paidEmailSentAt: st?.paidEmailSentAt || new Date().toISOString() });
    } catch (e) {
        console.error('confirmation email failed:', e);
        res.status(500).json({ error: 'Failed to send' });
    }
});

// Admin: fix a booking's details after it's saved: the customer's name and contact, the
// price, and a private note only the dashboard shows (adminNote). Only the fields sent change.
app.post('/api/admin/bookings/:id/details', verifyToken, async (req, res) => {
    const { name, contact, amount, adminNote } = req.body || {};
    const fields = {};
    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required' });
        fields.name = name.trim().slice(0, 120);
    }
    if (contact !== undefined) fields.contact = String(contact).trim().slice(0, 160);
    if (adminNote !== undefined) fields.adminNote = String(adminNote).trim().slice(0, 2000);
    try {
        if (amount !== undefined) {
            const amt = Number(amount);
            if (!Number.isFinite(amt) || amt < 0) return res.status(400).json({ error: 'Invalid amount' });
            const b = await bookingStore.getBooking(req.params.id);
            if (!b) return res.status(404).json({ error: 'Not found' });
            // in the booking's own currency; the edited price replaces what was charged online
            fields.price = b.market === 'ID' ? 'Rp ' + Math.round(amt) : '$' + amt;
            fields.amountDue = null;
        }
        const updated = await bookingStore.updateDetails(req.params.id, fields);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (e) {
        console.error('edit booking failed:', e);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// Admin: update a booking's status (pending | confirmed | cancelled | done).
app.post('/api/admin/bookings/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body || {};
    if (!['pending', 'confirmed', 'cancelled', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const before = status === 'cancelled' ? await bookingStore.getBooking(req.params.id) : null;
        const updated = await bookingStore.updateStatus(req.params.id, status);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        if (before && before.status !== 'cancelled') await notices.notifyCancelled(before);
        res.json(updated);
    } catch (e) {
        // bringing back a cancelled session whose time someone else has since booked
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('update status failed:', e);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Start Server (Only locally, Vercel handles this automatically)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`----------------------------------------------------------`);
        console.log(`🚀 Admin Backend Server running on http://localhost:${PORT}`);
        console.log(`----------------------------------------------------------`);
    });
}

export default app;
