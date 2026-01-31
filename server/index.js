
import express from 'express';
import cors from 'cors';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyPassword } from './auth.js';
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
        'https://tarotreadingbymayanov.com',
        'https://www.tarotreadingbymayanov.com',
        'https://mayanov-tarot.onrender.com'
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization', 'Authorization-Token']
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Analytics Client
const analyticsDataClient = new BetaAnalyticsDataClient();

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

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const csvPath = path.join(__dirname, 'admin_users.csv');

        if (!fs.existsSync(csvPath)) {
            console.error('[Server] admin_users.csv not found');
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const data = fs.readFileSync(csvPath, 'utf8');
        const lines = data.split('\n');


        // Skip header and check credentials
        const isValid = lines.slice(1).some(line => {
            if (!line.trim()) return false;
            const parts = line.split(',');
            if (parts.length < 2) return false;

            const storedEmail = parts[0].trim();
            const storedHash = parts[1].trim();

            if (storedEmail !== email) return false;

            return verifyPassword(password, storedHash);
        });

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

// Admin User Management
import { hashPassword } from './auth.js';

app.post('/api/users/add', verifyToken, (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const csvPath = path.join(__dirname, 'admin_users.csv');
        let lines = [];

        if (fs.existsSync(csvPath)) {
            const data = fs.readFileSync(csvPath, 'utf8');
            lines = data.split('\n').filter(line => line.trim() !== '');
        } else {
            lines.push('email,password_hash');
        }

        // Check if user exists
        const exists = lines.some(line => line.startsWith(`${email},`));
        if (exists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const storedValue = hashPassword(password);
        lines.push(`${email},${storedValue}`);

        fs.writeFileSync(csvPath, lines.join('\n'));

        console.log(`[Server] New admin user added: ${email}`);
        res.json({ success: true });

    } catch (e) {
        console.error('[Server] Add User Error:', e);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

app.get('/api/users', verifyToken, (req, res) => {
    try {
        const csvPath = path.join(__dirname, 'admin_users.csv');
        if (!fs.existsSync(csvPath)) {
            return res.json([]);
        }

        const data = fs.readFileSync(csvPath, 'utf8');
        const lines = data.split('\n').slice(1); // Skip header
        const users = lines
            .filter(line => line.trim())
            .map(line => line.split(',')[0].trim());

        res.json(users);
    } catch (e) {
        console.error('[Server] List Users Error:', e);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

app.delete('/api/users', verifyToken, (req, res) => {
    const { email } = req.body;
    const currentUser = req.user.email; // Extracted safely from JWT by verifyToken middleware

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (email === currentUser) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const csvPath = path.join(__dirname, 'admin_users.csv');
        const data = fs.readFileSync(csvPath, 'utf8');
        let lines = data.split('\n').filter(line => line.trim() !== '');

        // Ensure at least one admin remains (excluding the one being deleted)
        // lines[0] is header. Length - 1 is number of users.
        if (lines.length - 1 <= 1) {
            return res.status(400).json({ error: 'Cannot delete the only admin user' });
        }

        const initialLength = lines.length;
        lines = lines.filter(line => !line.startsWith(`${email},`));

        if (lines.length === initialLength) {
            return res.status(404).json({ error: 'User not found' });
        }

        fs.writeFileSync(csvPath, lines.join('\n'));
        console.log(`[Server] Admin user deleted: ${email} by ${currentUser}`);
        res.json({ success: true });

    } catch (e) {
        console.error('[Server] Delete User Error:', e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


app.get('/api/analytics', verifyToken, async (req, res) => {
    try {
        const propertyId = process.env.GA4_PROPERTY_ID; // '386315459'
        const { startDate, endDate } = req.query;

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
                // 4: Event Tracking
                {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'itemName' }],
                    metrics: [{ name: 'activeUsers' }],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'eventName',
                            inListFilter: { values: ['initiate_checkout', 'begin_checkout', 'schedule', 'view_item'] }
                        }
                    }
                }
            ]
        };

        // Run the Batch Report
        const [response] = await analyticsDataClient.batchRunReports(requestBody);

        console.log("[Server] Data fetched successfully.");
        // The Node.js client returns an array [response, request, raw].
        // The response object contains { reports: [...] }
        res.json(response);

    } catch (error) {
        console.error("[Server] Error fetching analytics:", error);
        res.status(500).json({
            error: "Failed to fetch analytics data",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`----------------------------------------------------------`);
    console.log(`🚀 Admin Backend Server running on http://localhost:${PORT}`);
    console.log(`----------------------------------------------------------`);
});
