/**
 * Sync the MongoDB admin user from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
 * Run: node scripts/createAdmin.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const {
  getAdminEmail,
  isAdminCredentialsConfigured,
  ensureAdminUser,
} = require('../utils/adminCredentials');

const createAdmin = async () => {
  if (!isAdminCredentialsConfigured()) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before running this script.');
    process.exit(1);
  }

  await connectDB();

  const user = await ensureAdminUser(User);

  console.log(`Admin user synced for: ${getAdminEmail()}`);
  console.log(`Username: ${user.username}`);
  console.log('Log in at /admin using the credentials from your .env file.');
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
