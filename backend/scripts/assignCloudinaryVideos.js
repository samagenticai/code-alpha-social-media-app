require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { assignDemoCloudinaryVideos } = require('../utils/assignDemoCloudinaryVideos');

async function run() {
  console.log('\n🎬 Assign demo Cloudinary videos to existing users\n');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB.');
    process.exit(1);
  }

  const demoCount = await User.countDocuments({ isDemo: true });
  if (demoCount === 0) {
    console.error('❌ No demo users found. Run `npm run seed` first.');
    await mongoose.connection.close();
    process.exit(1);
  }

  const result = await assignDemoCloudinaryVideos();
  console.log(`\n✅ Done — ${result.created} created, ${result.skipped} skipped\n`);

  for (const item of result.reels) {
    const { reel, user, status } = item;
    console.log(`   [${status}] @${user?.username} → ${reel.videoUrl}`);
    console.log(`            reelId: ${reel._id}, userId: ${user?._id || reel.author}`);
  }

  console.log('');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Assign failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
