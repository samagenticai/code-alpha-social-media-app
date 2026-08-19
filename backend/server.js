require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { autoMigrateProfileFields } = require('./utils/migrateProfileFields');

const PORT = process.env.PORT || 5000;

/**
 * Local / traditional Node process entry.
 * Vercel uses api/index.js → backend/app.js (no listen).
 */
const startServer = async () => {
  const dbConnected = await connectDB();

  if (dbConnected) {
    autoMigrateProfileFields().catch((e) =>
      console.warn('Auto migration error:', e.message)
    );
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    if (!dbConnected) {
      console.warn(
        'Server started without a database connection. Auth routes will not work until MongoDB is connected.'
      );
    }
  });
};

startServer();
