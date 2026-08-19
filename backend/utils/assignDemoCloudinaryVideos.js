const Reel = require('../models/Reel');
const User = require('../models/User');
const { getCloudinaryThumbnailUrl } = require('./cloudinaryDelivery');
const DEMO_CLOUDINARY_VIDEOS = require('../scripts/demoCloudinaryVideos');
const { REEL_CAPTIONS } = require('../scripts/demoData');

const LEGACY_REEL_ORDER_BASE = 1000;

/** Extract Cloudinary public_id from a delivery URL (best-effort). */
const extractCloudinaryPublicId = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) return '';
  try {
    const afterUpload = videoUrl.split('/upload/')[1];
    if (!afterUpload) return '';
    const withoutQuery = afterUpload.split('?')[0];
    return decodeURIComponent(withoutQuery.replace(/\.(mp4|mov|webm|mkv|m4v)$/i, ''));
  } catch {
    return '';
  }
};

const normalizeVideoUrl = (url) => (url || '').trim().replace(/\/+$/, '');

const resolveAssignee = (entry, demoUsers, entryIndex) => {
  if (entry.assignToUsername) {
    const byUsername = demoUsers.find((u) => u.username === entry.assignToUsername);
    if (byUsername) return byUsername;
  }

  if (entry.assignToOrder) {
    const byOrder = demoUsers.find((u) => u.demoSeedOrder === entry.assignToOrder);
    if (byOrder) return byOrder;
  }

  // Round-robin across all demo users for even distribution
  const idx = entryIndex % demoUsers.length;
  return demoUsers[idx];
};

const resolveFeedOrder = (entry, entryIndex) => {
  if (entry.feedOrder != null) return entry.feedOrder;
  if (entry.reelOrder != null) return entry.reelOrder;
  return LEGACY_REEL_ORDER_BASE + entryIndex;
};

/**
 * Assign configured Cloudinary videos to existing demo users.
 * Idempotent — matches by videoUrl; updates reelOrder when config changes.
 */
async function assignDemoCloudinaryVideos(options = {}) {
  const videos = options.videos ?? DEMO_CLOUDINARY_VIDEOS;
  if (!videos?.length) {
    return { created: 0, skipped: 0, updated: 0, reels: [] };
  }

  const demoUsers = await User.find({ isDemo: true }).sort({ demoSeedOrder: 1 });
  if (!demoUsers.length) {
    throw new Error('No demo users found. Run the main seed first.');
  }

  const results = { created: 0, skipped: 0, updated: 0, reels: [] };
  const seenUrls = new Set();

  for (let i = 0; i < videos.length; i += 1) {
    const entry = videos[i];
    const videoUrl = normalizeVideoUrl(entry.videoUrl);
    if (!videoUrl) continue;

    const feedOrder = resolveFeedOrder(entry, i);
    const user = resolveAssignee(entry, demoUsers, i);
    if (!user) {
      console.warn(`  ⚠ No demo user for Cloudinary video ${i + 1}, skipping`);
      continue;
    }

    if (seenUrls.has(videoUrl)) {
      results.skipped += 1;
      console.log(`  ⊘ Skipped duplicate URL at feedOrder ${feedOrder} (same file as earlier entry)`);
      continue;
    }
    seenUrls.add(videoUrl);

    const existing = await Reel.findOne({ videoUrl, isDemo: true, source: 'cloudinary' });

    if (existing) {
      let changed = false;
      if (existing.reelOrder !== feedOrder) {
        existing.reelOrder = feedOrder;
        changed = true;
      }
      if (existing.author.toString() !== user._id.toString()) {
        existing.author = user._id;
        changed = true;
      }
      if (entry.caption?.trim() && existing.caption !== entry.caption.trim()) {
        existing.caption = entry.caption.trim();
        changed = true;
      }
      if (changed) {
        await existing.save();
        results.updated += 1;
        console.log(`  ↻ Updated reel feedOrder ${feedOrder} → @${user.username}`);
      } else {
        results.skipped += 1;
        console.log(`  ✓ Reel exists feedOrder ${feedOrder} (@${user.username})`);
      }
      results.reels.push({ reel: existing, user, status: changed ? 'updated' : 'exists', feedOrder });
      continue;
    }

    const videoPublicId = entry.videoPublicId?.trim() || extractCloudinaryPublicId(videoUrl);
    const thumbnailUrl = entry.thumbnailUrl?.trim() || getCloudinaryThumbnailUrl(videoUrl);
    const caption =
      entry.caption?.trim() ||
      REEL_CAPTIONS[(user.demoSeedOrder || 1) - 1] ||
      'Check out my latest reel!';

    const reel = await Reel.create({
      author: user._id,
      source: 'cloudinary',
      videoUrl,
      videoPublicId,
      thumbnailUrl,
      caption,
      isDemo: true,
      reelOrder: feedOrder,
      visibility: 'public',
    });

    results.created += 1;
    results.reels.push({ reel, user, status: 'created', feedOrder });
    console.log(`  + feedOrder ${feedOrder} → @${user.username} (${videoUrl.slice(-36)})`);
  }

  return results;
}

/** Sort reels for feed display: lower reelOrder first, then newest. */
function sortReelsForFeed(reels) {
  return [...reels].sort((a, b) => {
    const ao = a.reelOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.reelOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

module.exports = {
  assignDemoCloudinaryVideos,
  extractCloudinaryPublicId,
  sortReelsForFeed,
  LEGACY_REEL_ORDER_BASE,
};
