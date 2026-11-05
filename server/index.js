
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
        /\.vercel\.app$/,
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

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mayanov_2026';

// Security Middleware: Verify Token
const verifyToken = (req, res, next) => {
    // Check cookie first, then auth header
    const token = req.cookies.admin_token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const isValid = await userStore.verifyLogin(email, password);

        if (isValid) {
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

// Public: create a booking.
app.post('/api/bookings', async (req, res) => {
    const { serviceId, serviceName, date, time, durationMin, name, dob, contact, question, market } = req.body || {};
    if (!serviceId || !name || !contact) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (missingEmail(serviceId, contact)) return res.status(400).json({ error: 'EMAIL_REQUIRED' });
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
    // a live session is for a time: check it before anything is charged
    if (reading.durationMin && (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time)) || !name || !contact)) {
        return res.status(400).json({ error: 'Missing date or time' });
    }
    if (missingEmail(serviceId, contact)) return res.status(400).json({ error: 'EMAIL_REQUIRED' });
    let id;
    try {
        id = await paypal.createOrder(serviceId);
    } catch (e) {
        console.error('PayPal order failed:', e.message);
        return res.status(502).json({ error: 'Could not start the payment' });
    }
    if (reading.durationMin) {
        // its slot is held while PayPal's window is open, so nobody else takes it meanwhile
        try {
            await bookingStore.createBooking({
                serviceId,
                serviceName: reading.name,
                date,
                time,
                durationMin: reading.durationMin,
                name: String(name).slice(0, 120),
                dob: /^\d{4}-\d{2}-\d{2}$/.test(String(dob || '')) ? String(dob) : '',
                contact: String(contact).slice(0, 160),
                question: String(question || '').slice(0, 2000),
                market: 'Global',
                status: 'awaiting_payment',
                holdOnly: true,
                holdUntil: new Date(Date.now() + paypal.HOLD_MIN * 60_000).toISOString(),
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

app.post('/api/paypal/orders/:id/capture', async (req, res) => {
    if (!paypal.configured()) return res.status(503).json({ error: 'PayPal not configured' });
    const orderId = String(req.params.id || '').slice(0, 64);
    const { serviceId, name, dob, contact, question } = req.body || {};
    const reading = paypal.READINGS[serviceId];
    // checked before taking the money, so a bad form never ends in a paid order with no booking
    // (an email reading needs the question; a live session is asked in person)
    if (!reading || !name || !contact || (!reading.durationMin && !String(question || '').trim()) || missingEmail(serviceId, contact)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // a live session: its slot must still be its own, or the payment isn't taken
    let hold = null;
    if (reading.durationMin) {
        try {
            hold = await bookingStore.findByPayPalOrder(orderId);
            if (hold && !hold.holdOnly) return res.json(hold); // a retried request, already booked
            if (!hold || hold.serviceId !== serviceId || !(await bookingStore.holdStillFree(hold))) {
                return res.status(409).json({ error: 'SLOT_TAKEN' });
            }
        } catch (e) {
            console.error('PayPal hold check failed:', orderId, e.message);
            return res.status(500).json({ error: 'CAPTURE_FAILED' });
        }
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
            // the held slot becomes the booking: confirmed, paid, on the calendar
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
            return res.status(201).json(booking);
        }
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
            question: String(question).slice(0, 2000),
            market: 'Global',
            paymentStatus: 'paid',
            paymentMethod: paypal.SIMULATE ? 'PayPal (simulated)' : 'PayPal',
            paypalOrderId: orderId,
            paypalCaptureId: paid.captureId,
            paypalPayer: paid.payerEmail,
        });
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
    if (booking.status === 'cancelled') return { state: 'failed' };
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
        return { state: 'paid', booking: paid };
    }
    if (st.state === 'failed') {
        await bookingStore.releaseHold(booking);
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
            status: 'awaiting_payment',
            holdOnly: true,
            holdUntil: new Date(Date.now() + midtrans.HOLD_MIN * 60_000).toISOString(),
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
        const changed = await bookingStore.reconcileWithCalendar();
        res.json({ ok: true, changed });
    } catch (e) {
        console.error('cron reconcile failed:', e.message);
        res.status(500).json({ error: 'reconcile failed' });
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
const RECONCILE_THROTTLE_MS = 3 * 60 * 1000;

// Admin: list all bookings (JWT-protected, same auth as the dashboard).
app.get('/api/admin/bookings', verifyToken, async (req, res) => {
    try {
        // Reverse-sync Google Calendar changes — but only if we haven't recently, so
        // navigating between admin tabs stays fast.
        if (Date.now() - lastReconcileAt > RECONCILE_THROTTLE_MS) {
            lastReconcileAt = Date.now();
            try { await bookingStore.reconcileWithCalendar(); } catch (e) { console.error('reconcile failed:', e.message); }
        }
        // holds still waiting on (or never paid through) Midtrans aren't bookings yet
        res.json((await bookingStore.getAllBookings()).filter((b) => !b.holdOnly));
    } catch (e) {
        console.error('list bookings failed:', e);
        res.status(500).json({ error: 'Failed to load bookings' });
    }
});

// Admin: create a booking manually (e.g. orders taken over WhatsApp) so they
// show up in the schedule, customer list and revenue report.
app.post('/api/admin/bookings', verifyToken, async (req, res) => {
    const { serviceId, serviceName, date, time, durationMin, name, contact, question, amount, currency, orderDate, status, paymentStatus } = req.body || {};
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
        });
        res.status(201).json(booking);
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('manual booking create failed:', e);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Admin: move a booking to a new date/time (drag-and-drop reschedule).
app.post('/api/admin/bookings/:id/reschedule', verifyToken, async (req, res) => {
    const { date, time, durationMin } = req.body || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^\d{2}:\d{2}$/.test(String(time || ''))) {
        return res.status(400).json({ error: 'Invalid date or time' });
    }
    try {
        const updated = await bookingStore.rescheduleBooking(req.params.id, {
            date, time,
            durationMin: Number.isFinite(+durationMin) ? Math.max(0, Math.min(600, Math.round(+durationMin))) : undefined,
        });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (e) {
        if (e.code === 'SLOT_TAKEN') return res.status(409).json({ error: 'SLOT_TAKEN' });
        console.error('reschedule failed:', e);
        res.status(500).json({ error: 'Failed to reschedule' });
    }
});

// Admin: update a booking's payment status (unpaid | paid) — for the Sales report.
app.post('/api/admin/bookings/:id/payment', verifyToken, async (req, res) => {
    const { paymentStatus } = req.body || {};
    if (!['unpaid', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }
    try {
        const updated = await bookingStore.updatePayment(req.params.id, paymentStatus);
        if (!updated) return res.status(404).json({ error: 'Not found' });
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

// Admin: update a booking's status (pending | confirmed | cancelled | done).
app.post('/api/admin/bookings/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body || {};
    if (!['pending', 'confirmed', 'cancelled', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const updated = await bookingStore.updateStatus(req.params.id, status);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (e) {
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
