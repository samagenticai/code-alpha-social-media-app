/**
 * Vercel serverless entry — exports the Express app.
 * Environment variables are injected by Vercel (no .env file on the host).
 * Local development continues to use: node backend/server.js
 */
module.exports = require('../backend/app');
