require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');

async function removeYoutubeVideos() {
  console.log('\n🗑️  Removing YouTube videos from database\n');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB.');
    process.exit(1);
  }

  const youtubeReels = await Reel.find({ source: 'youtube' }).select('_id author');
  const youtubeReelIds = new Set(youtubeReels.map((r) => r._id.toString()));
  console.log(`  Found ${youtubeReels.length} YouTube reel(s) to delete`);

  const reelDelete = await Reel.deleteMany({ source: 'youtube' });
  console.log(`  ✓ Deleted ${reelDelete.deletedCount} YouTube reel(s)`);

  const legacyReelPosts = await Post.deleteMany({ isReel: true });
  console.log(`  ✓ Deleted ${legacyReelPosts.deletedCount} legacy reel post(s)`);

  const demoUsers = await User.find({ isDemo: true });
  let reassigned = 0;
  for (const user of demoUsers) {
    const assignedId = user.assignedReel?.toString();
    if (!assignedId || !youtubeReelIds.has(assignedId)) continue;

    const replacement = await Reel.findOne({
      author: user._id,
      source: 'cloudinary',
      isDemo: true,
    }).sort({ createdAt: -1 });

    user.assignedReel = replacement?._id || null;
    await user.save();
    reassigned += 1;
  }
  console.log(`  ✓ Reassigned ${reassigned} demo user assignedReel pointer(s) to Cloudinary reels`);

  const remainingReels = await Reel.countDocuments({ source: 'cloudinary' });
  const remainingDemoUsers = await User.countDocuments({ isDemo: true });
  console.log(`\n✅ Cleanup complete — ${remainingReels} Cloudinary reel(s), ${remainingDemoUsers} demo user(s) intact\n`);

  await mongoose.connection.close();
  process.exit(0);
}

removeYoutubeVideos().catch(async (err) => {
  console.error('Cleanup failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
