const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const brand = require('./config/brand');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const reelsRoutes = require('./routes/reels');
const storiesRoutes = require('./routes/stories');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const notificationsRoutes = require('./routes/notifications');
const trendingRoutes = require('./routes/trending');
const settingsRoutes = require('./routes/settings');
const followRequestsRoutes = require('./routes/followRequests');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const userReportsRoutes = require('./routes/reports');

const app = express();

/** True on Vercel even if NODE_ENV was mistakenly left as "development". */
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

/**
 * Normalize an origin/host to `scheme://host[:port]` — no trailing slash, no path.
 * Accepts: https://app.vercel.app/  |  app.vercel.app  |  https://app.vercel.app/api
 */
const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;
  let raw = value.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

/** Build the allowlist from env — never use origin: "*" with credentials. */
const buildAllowedOrigins = () => {
  const candidates = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    ...String(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim()),
    // Injected by Vercel for the current deployment / production domain
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];

  const fromEnv = candidates.map(normalizeOrigin).filter(Boolean);

  if (!isProduction) {
    fromEnv.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173'
    );
  }

  return [...new Set(fromEnv)];
};

const allowedOrigins = buildAllowedOrigins();

const allowVercelPreviews =
  String(process.env.ALLOW_VERCEL_PREVIEWS || '').toLowerCase() === 'true';

/**
 * Prefix used to scope preview hosts to this project only
 * (not every *.vercel.app site on the internet).
 */
const vercelProjectPrefix = (() => {
  const prod = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      process.env.VERCEL_URL
  );
  if (!prod) return null;
  try {
    return new URL(prod).hostname.replace(/\.vercel\.app$/i, '');
  } catch {
    return null;
  }
})();

const isDevLanOrigin = (origin) =>
  !isProduction &&
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );

const isProjectVercelPreview = (hostname) => {
  if (!hostname.endsWith('.vercel.app')) return false;
  if (!vercelProjectPrefix) return false;
  // Exact production host or deployment/preview variants for this project
  return (
    hostname === `${vercelProjectPrefix}.vercel.app` ||
    hostname.startsWith(`${vercelProjectPrefix}-`)
  );
};

const isAllowedOrigin = (origin) => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (allowedOrigins.includes(normalized)) return true;
  if (isDevLanOrigin(normalized)) return true;

  if (allowVercelPreviews) {
    try {
      return isProjectVercelPreview(new URL(normalized).hostname);
    } catch {
      return false;
    }
  }
  return false;
};

if (isVercel || isProduction) {
  console.log(
    `CORS allowlist (${allowedOrigins.length}): ${
      allowedOrigins.join(', ') || '(empty — set CLIENT_URL on Vercel)'
    }`
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin tooling / server-to-server / some WebViews omit Origin
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  let dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    try {
      dbConnected = Boolean(await connectDB());
    } catch {
      dbConnected = false;
    }
  }

  res.json({
    success: true,
    message: `${brand.name} API is running.`,
    database: dbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    vercel: isVercel,
  });
});

// Ensure Mongo is ready on every request (cached in serverless / reused locally)
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    const ok = await connectDB();
    if (!ok) {
      return res.status(503).json({
        success: false,
        message:
          'Database is not connected. Check MONGODB_URI and MongoDB Atlas Network Access.',
      });
    }
    return next();
  } catch (err) {
    console.error('DB middleware error:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/follow-requests', followRequestsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reports', userReportsRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, _next) => {
  if (err && err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({ success: false, message: 'CORS: origin not allowed.' });
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error.' : err.message || 'Internal server error.',
  });
});

module.exports = app;
