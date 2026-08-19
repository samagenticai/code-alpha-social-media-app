const mongoose = require('mongoose');

const PLACEHOLDER_PATTERNS = [
  '<username>',
  '<password>',
  '<cluster>',
  'YOUR_USER',
  'YOUR_PASSWORD',
  'YOUR_CLUSTER',
];

const validateMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return 'MONGODB_URI is missing. Add it to your backend/.env (or Vercel env vars).';
  }

  const trimmed = uri.trim();

  for (const placeholder of PLACEHOLDER_PATTERNS) {
    if (trimmed.includes(placeholder)) {
      return `MONGODB_URI still contains placeholder "${placeholder}". Replace it with your real MongoDB Atlas values.`;
    }
  }

  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://".';
  }

  return null;
};

/**
 * Cached connection for serverless (Vercel) — reuse across warm invocations.
 * On a traditional Node process this also avoids reconnecting every request.
 */
let cached = global.__pulseMongoose;
if (!cached) {
  cached = global.__pulseMongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  const validationError = validateMongoUri(uri);

  if (validationError) {
    console.error(`MongoDB configuration error: ${validationError}`);
    return false;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri.trim(), {
        serverSelectionTimeoutMS: 10000,
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((conn) => {
        console.log('MongoDB Connected Successfully');
        console.log(`   Host: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('MongoDB connection failed:');

        if (
          error.message.includes('EBADNAME') ||
          error.message.includes('querySrv') ||
          error.message.includes('ENOTFOUND')
        ) {
          console.error(
            '   DNS lookup failed for the MongoDB Atlas hostname. Check internet connection or MongoDB Atlas cluster URL.'
          );
          if (uri.trim().startsWith('mongodb+srv://')) {
            console.error(
              '   If SRV is blocked on this network, use the standard connection string from Atlas (mongodb://...).'
            );
          }
        } else if (
          error.message.includes('authentication failed') ||
          error.codeName === 'AuthenticationFailed'
        ) {
          console.error('   Authentication failed. Check your database username and password.');
          console.error(
            '   URL-encode special characters in the password (@, #, %, &, /, ?).'
          );
        } else if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('Could not connect to any servers')
        ) {
          console.error(
            '   Could not reach MongoDB Atlas. Check Network Access / IP Whitelist in Atlas (add 0.0.0.0/0 for Vercel).'
          );
        } else {
          console.error(`   ${error.message}`);
        }

        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch {
    return false;
  }
};

module.exports = connectDB;
