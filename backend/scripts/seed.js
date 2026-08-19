require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const DEMO_USERS = require('./demoData');
const {
  COMMENT_POOL,
  POST_TEMPLATES,
} = require('./demoData');
const { assignDemoCloudinaryVideos } = require('../utils/assignDemoCloudinaryVideos');

const DEMO_PASSWORD = 'DemoUser123!';
const SEED_MARKER = 'nexora_demo_v1';

const unsplashAvatar = (username) => `https://i.pravatar.cc/400?u=${username}`;
const unsplashCover = (username) => `https://picsum.photos/seed/${username}-cover/1200/400`;
const unsplashPost = (username, idx, topic) =>
  `https://picsum.photos/seed/${username}-post-${idx}-${topic}/800/800`;

const pickRandom = (arr, count, rng) => {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < count && copy.length; i += 1) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
};

const seededRng = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

async function uploadRemoteImage(url, folder, publicId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return { secure_url: url, public_id: '' };
  }
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: `nexora/demo/${folder}`,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
  } catch (err) {
    console.warn(`  Cloudinary skip (${publicId}):`, err.message);
    return { secure_url: url, public_id: '' };
  }
}

async function cleanupLegacyReelPosts() {
  const deleted = await Post.deleteMany({ isReel: true });
  if (deleted.deletedCount > 0) {
    console.log(`  ↪ Removed ${deleted.deletedCount} legacy reel post(s)`);
  }
  return deleted.deletedCount;
}

async function seedDemoUsers() {
  const users = [];

  for (let i = 0; i < 32; i += 1) {
    const profile = DEMO_USERS[i];
    const order = i + 1;
    const existing = await User.findOne({ username: profile.username, isDemo: true });

    if (existing) {
      users.push(existing);
      console.log(`  ✓ User ${order}/32 exists: @${profile.username}`);
      continue;
    }

    const avatar = await uploadRemoteImage(
      unsplashAvatar(profile.username),
      'avatars',
      `avatar_${profile.username}`
    );
    const cover = await uploadRemoteImage(
      unsplashCover(profile.username),
      'covers',
      `cover_${profile.username}`
    );

    const user = await User.create({
      fullName: profile.fullName,
      username: profile.username,
      email: `${profile.username}@demo.nexora.app`,
      password: DEMO_PASSWORD,
      job: profile.job || profile.title || '',
      city: profile.city || profile.location || '',
      maritalStatus: profile.maritalStatus || '',
      dateOfBirth: profile.dateOfBirth || '',
      school: profile.school || '',
      college: profile.college || '',
      university: profile.university || '',
      title: profile.job || profile.title || '',
      location: profile.city || profile.location || '',
      bio: profile.bio,
      profileImage: avatar.secure_url,
      profileImagePublicId: avatar.public_id,
      coverImage: cover.secure_url,
      coverImagePublicId: cover.public_id,
      isDemo: true,
      demoSeedOrder: order,
    });

    users.push(user);
    console.log(`  + Created user ${order}/32: @${profile.username}`);
  }

  return users;
}

async function seedPosts(users) {
  let totalCreated = 0;

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const rng = seededRng(1000 + i);
    const postCount = 3 + Math.floor(rng() * 6);

    const existingCount = await Post.countDocuments({ user: user._id, isReel: { $ne: true } });
    if (existingCount >= 3) {
      console.log(`  ✓ Posts exist for @${user.username} (${existingCount})`);
      continue;
    }

    const templates = pickRandom(POST_TEMPLATES, postCount, rng);

    for (let j = 0; j < templates.length; j += 1) {
      const tpl = templates[j];
      const postData = {
        user: user._id,
        content: tpl.content,
        isDemo: true,
      };

      if (tpl.type === 'image' || tpl.type === 'multi') {
        const seeds = tpl.imageSeeds || [tpl.imageSeed || 'creative'];
        const images = [];
        const media = [];

        for (let k = 0; k < seeds.length; k += 1) {
          const remoteUrl = unsplashPost(user.username, j + k, seeds[k]);
          const uploaded = await uploadRemoteImage(
            remoteUrl,
            'posts',
            `post_${user.username}_${j}_${k}`
          );
          images.push(uploaded.secure_url);
          media.push({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            resourceType: 'image',
          });
        }

        postData.images = images;
        postData.imageUrl = images[0];
        postData.imagePublicId = media[0]?.publicId || '';
        postData.media = media;
      }

      const daysAgo = Math.floor(rng() * 60) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await Post.create({ ...postData, createdAt });
      totalCreated += 1;
    }

    console.log(`  + Created ${templates.length} posts for @${user.username}`);
  }

  return totalCreated;
}

async function seedEngagement(users) {
  const allPosts = await Post.find({
    isReel: { $ne: true },
    $or: [{ isDemo: true }, { user: { $in: users.map((u) => u._id) } }],
  });

  for (const post of allPosts) {
    if (post.likes?.length >= 3 && post.comments?.length >= 2) continue;

    const rng = seededRng(parseInt(post._id.toString().slice(-6), 16) || 42);
    const likeCount = 5 + Math.floor(rng() * 45);
    const commentCount = 2 + Math.floor(rng() * 6);

    const likers = pickRandom(
      users.filter((u) => u._id.toString() !== post.user.toString()),
      Math.min(likeCount, users.length - 1),
      rng
    );
    post.likes = likers.map((u) => u._id);

    if (!post.comments?.length) {
      const commenters = pickRandom(
        users.filter((u) => u._id.toString() !== post.user.toString()),
        Math.min(commentCount, users.length - 1),
        rng
      );

      post.comments = commenters.map((commenter) => {
        const text = COMMENT_POOL[Math.floor(rng() * COMMENT_POOL.length)];
        const hoursAgo = Math.floor(rng() * 72) + 1;
        return {
          user: commenter._id,
          name: commenter.fullName,
          avatar: commenter.profileImage,
          text,
          likes: pickRandom(
            users.filter((u) => u._id.toString() !== commenter._id.toString()),
            Math.floor(rng() * 4),
            rng
          ).map((u) => u._id),
          createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        };
      });
    }

    await post.save();
  }

  const allReels = await Reel.find({ isDemo: true });

  for (const reel of allReels) {
    if (reel.likes?.length >= 3 && reel.comments?.length >= 2) continue;

    const rng = seededRng(parseInt(reel._id.toString().slice(-6), 16) || 42);
    const likeCount = 5 + Math.floor(rng() * 45);
    const commentCount = 2 + Math.floor(rng() * 6);

    const likers = pickRandom(
      users.filter((u) => u._id.toString() !== reel.author.toString()),
      Math.min(likeCount, users.length - 1),
      rng
    );
    reel.likes = likers.map((u) => u._id);

    if (!reel.comments?.length) {
      const commenters = pickRandom(
        users.filter((u) => u._id.toString() !== reel.author.toString()),
        Math.min(commentCount, users.length - 1),
        rng
      );

      reel.comments = commenters.map((commenter) => {
        const text = COMMENT_POOL[Math.floor(rng() * COMMENT_POOL.length)];
        const hoursAgo = Math.floor(rng() * 72) + 1;
        return {
          user: commenter._id,
          name: commenter.fullName,
          avatar: commenter.profileImage,
          text,
          likes: pickRandom(
            users.filter((u) => u._id.toString() !== commenter._id.toString()),
            Math.floor(rng() * 4),
            rng
          ).map((u) => u._id),
          createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        };
      });
    }

    await reel.save();
  }

  console.log(`  ✓ Engagement seeded for ${allPosts.length} posts + ${allReels.length} reels`);
}

async function seedFollowRelationships(users) {
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    if (user.followers?.length >= 5) continue;

    const rng = seededRng(2000 + i);
    const followCount = 4 + Math.floor(rng() * 12);
    const followerCount = 6 + Math.floor(rng() * 18);

    const followingTargets = pickRandom(
      users.filter((u) => u._id.toString() !== user._id.toString()),
      Math.min(followCount, users.length - 1),
      rng
    );

    const followerSources = pickRandom(
      users.filter((u) => u._id.toString() !== user._id.toString()),
      Math.min(followerCount, users.length - 1),
      rng
    );

    user.following = followingTargets.map((u) => u._id);
    user.followers = followerSources.map((u) => u._id);
    await user.save();

    for (const target of followingTargets) {
      if (!target.followers.some((id) => id.toString() === user._id.toString())) {
        target.followers.push(user._id);
        await target.save();
      }
    }

    for (const source of followerSources) {
      if (!source.following.some((id) => id.toString() === user._id.toString())) {
        source.following.push(user._id);
        await source.save();
      }
    }
  }

  console.log('  ✓ Follow relationships seeded');
}

async function runSeed() {
  console.log('\n🌱 Pulse Demo Seed —', SEED_MARKER);
  console.log('================================\n');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Check MONGODB_URI.');
    process.exit(1);
  }

  await cleanupLegacyReelPosts();

  const existingDemoCount = await User.countDocuments({ isDemo: true });
  if (existingDemoCount >= 32) {
    console.log(`ℹ Found ${existingDemoCount} demo users — refreshing Cloudinary reels & engagement.\n`);
    const users = await User.find({ isDemo: true }).sort({ demoSeedOrder: 1 });
    console.log('🎬 Assigning demo Cloudinary videos...');
    await assignDemoCloudinaryVideos();
    console.log('');
    await seedEngagement(users);
    console.log('\n✅ Seed complete (idempotent refresh).\n');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('1️⃣  Creating 32 demo users...');
  const users = await seedDemoUsers();
  console.log('');

  console.log('2️⃣  Assigning Cloudinary demo reels...');
  await assignDemoCloudinaryVideos();
  console.log('');

  console.log('3️⃣  Creating normal posts (3–8 per user)...');
  await seedPosts(users);
  console.log('');

  console.log('4️⃣  Seeding likes & comments...');
  await seedEngagement(users);
  console.log('');

  console.log('5️⃣  Seeding follow relationships...');
  await seedFollowRelationships(users);
  console.log('');

  const summary = {
    users: await User.countDocuments({ isDemo: true }),
    reels: await Reel.countDocuments({}),
    demoReels: await Reel.countDocuments({ isDemo: true }),
    realReels: await Reel.countDocuments({ isDemo: false }),
    posts: await Post.countDocuments({ isReel: { $ne: true }, isDemo: true }),
  };

  console.log('✅ Seed complete!');
  console.log(`   Demo users:  ${summary.users}`);
  console.log(`   Total reels: ${summary.reels} (${summary.demoReels} demo + ${summary.realReels} real)`);
  console.log(`   Posts:       ${summary.posts}\n`);

  await mongoose.connection.close();
  process.exit(0);
}

runSeed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
