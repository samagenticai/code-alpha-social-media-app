const Post = require('../models/Post');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { formatPost, formatUserSnippet } = require('../utils/postFormatter');
const { formatReel } = require('../utils/reelFormatter');
const {
  config: trendingConfig,
  getPeriodStart,
  getLookbackDate,
  computeTrendingScore,
  computeRisingScore,
  computeCreatorScore,
  paginate,
} = require('../utils/trendingScore');

const populatePost = (query) =>
  query
    .populate('user', 'fullName username profileImage title verified isPrivate followers')
    .populate({ path: 'comments.user', select: 'fullName username profileImage title' });

const populateReel = (query) =>
  query
    .populate('author', 'fullName username profileImage title verified isPrivate followers')
    .populate({ path: 'comments.user', select: 'fullName username profileImage title' });

const getFollowingIds = async (userId) => {
  if (!userId) return [];
  const user = await User.findById(userId).select('following');
  return (user?.following || []).map((id) => id.toString());
};

const canViewPost = (post, currentUserId, followingIds) => {
  const author = post.user;
  if (!author) return false;
  if (!author.isPrivate) return true;
  if (!currentUserId) return false;
  const authorId = author._id?.toString();
  if (authorId === currentUserId.toString()) return true;
  return followingIds.includes(authorId);
};

const canViewReel = (reel, currentUserId, followingIds) => {
  const author = reel.author;
  if (!author) return false;
  const vis = reel.visibility || 'public';
  if (vis === 'public') return true;
  if (!currentUserId) return false;
  const authorId = author._id?.toString();
  if (authorId === currentUserId.toString()) return true;
  if (vis === 'private') return false;
  return followingIds.includes(authorId);
};

const scoreAndSortPosts = (posts, periodStart, scoreFn) =>
  posts
    .map((p) => ({
      doc: p,
      score: scoreFn(p, periodStart),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    trendingConfig.maxLimit,
    Math.max(1, parseInt(query.limit, 10) || trendingConfig.defaultLimit)
  );
  return { page, limit };
};

const buildPostCandidatesQuery = (lookbackDate, periodStart) => ({
  isReel: { $ne: true },
  $or: [{ createdAt: { $gte: lookbackDate } }, { updatedAt: { $gte: periodStart } }],
});

const buildReelCandidatesQuery = (lookbackDate, periodStart) => ({
  $or: [{ createdAt: { $gte: lookbackDate } }, { updatedAt: { $gte: periodStart } }],
  visibility: { $in: ['public', 'followers'] },
});

const emptySection = (page, limit) => ({
  items: [],
  page,
  limit,
  total: 0,
  hasMore: false,
});

exports.getTrending = async (req, res) => {
  try {
    const type = ['all', 'posts', 'reels', 'creators'].includes(req.query.type)
      ? req.query.type
      : 'all';
    const period = ['today', 'week', 'all'].includes(req.query.period) ? req.query.period : 'week';
    const section = ['trending_now', 'rising', 'reels', 'creators'].includes(req.query.section)
      ? req.query.section
      : null;

    const { page, limit } = parsePagination(req.query);
    const periodStart = getPeriodStart(period);
    const lookbackDate = getLookbackDate(period);
    const followingIds = await getFollowingIds(req.user?._id);
    const currentUserId = req.user?._id;

    const response = {
      success: true,
      filters: { type, period, page, limit },
      weights: trendingConfig.weights,
      pagination: { page, limit, hasMore: false },
      posts: [],
      reels: [],
      creators: [],
      trendingNow: emptySection(page, limit),
      rising: emptySection(page, limit),
      trendingReels: emptySection(page, limit),
      trendingCreators: emptySection(page, limit),
    };

    const includePosts = type === 'all' || type === 'posts';
    const includeReels = type === 'all' || type === 'reels';
    const includeCreators = type === 'all' || type === 'creators';

    if ((!section || section === 'trending_now') && includePosts) {
      const posts = await populatePost(
        Post.find(buildPostCandidatesQuery(lookbackDate, periodStart))
          .sort({ updatedAt: -1 })
          .limit(trendingConfig.maxCandidates)
      );

      const visible = posts.filter((p) => canViewPost(p, currentUserId, followingIds));
      const scored = scoreAndSortPosts(visible, periodStart, computeTrendingScore);
      const paged = paginate(scored, page, limit);

      response.trendingNow = {
        ...paged,
        items: paged.items.map(({ doc, score }) => ({
          ...formatPost(doc, currentUserId),
          trendingScore: Math.round(score * 100) / 100,
        })),
      };
      response.posts = response.trendingNow.items;
    }

    if ((!section || section === 'rising') && includePosts) {
      const posts = await populatePost(
        Post.find(buildPostCandidatesQuery(lookbackDate, periodStart))
          .sort({ updatedAt: -1 })
          .limit(trendingConfig.maxCandidates)
      );

      const visible = posts.filter((p) => canViewPost(p, currentUserId, followingIds));
      const scored = scoreAndSortPosts(visible, periodStart, computeRisingScore);
      const paged = paginate(scored, page, limit);

      response.rising = {
        ...paged,
        items: paged.items.map(({ doc, score }) => ({
          ...formatPost(doc, currentUserId),
          risingScore: Math.round(score * 100) / 100,
        })),
      };
    }

    if ((!section || section === 'reels') && includeReels) {
      const reels = await populateReel(
        Reel.find(buildReelCandidatesQuery(lookbackDate, periodStart))
          .sort({ updatedAt: -1 })
          .limit(trendingConfig.maxCandidates)
      );

      const visible = reels.filter((r) => canViewReel(r, currentUserId, followingIds));
      const scored = scoreAndSortPosts(visible, periodStart, computeTrendingScore);
      const paged = paginate(scored, page, limit);

      response.trendingReels = {
        ...paged,
        items: paged.items.map(({ doc, score }) => {
          const authorId = doc.author?._id?.toString();
          return {
            ...formatReel(doc, currentUserId, {
              isFollowing: authorId ? followingIds.includes(authorId) : false,
            }),
            trendingScore: Math.round(score * 100) / 100,
          };
        }),
      };
      response.reels = response.trendingReels.items;
    }

    if ((!section || section === 'creators') && includeCreators) {
      const [postDocs, reelDocs] = await Promise.all([
        Post.find(buildPostCandidatesQuery(lookbackDate, periodStart))
          .select('user likes comments shares createdAt updatedAt')
          .populate('user', 'fullName username profileImage title followers isPrivate')
          .limit(trendingConfig.maxCandidates),
        Reel.find(buildReelCandidatesQuery(lookbackDate, periodStart))
          .select('author likes comments shares createdAt updatedAt visibility')
          .populate('author', 'fullName username profileImage title followers isPrivate')
          .limit(trendingConfig.maxCandidates),
      ]);

      const creatorMap = new Map();

      const accumulate = (author, doc) => {
        if (!author) return;
        const authorId = author._id?.toString();
        if (!authorId) return;
        if (author.isPrivate && authorId !== currentUserId?.toString() && !followingIds.includes(authorId)) {
          return;
        }

        const recentComments = (doc.comments || []).filter(
          (c) => c.createdAt && new Date(c.createdAt) >= periodStart
        ).length;

        const existing = creatorMap.get(authorId) || {
          user: author,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          recentComments: 0,
          latestActivity: doc.updatedAt || doc.createdAt,
          latestCreated: doc.createdAt,
        };

        existing.totalLikes += doc.likes?.length || 0;
        existing.totalComments += doc.comments?.length || 0;
        existing.totalShares += doc.shares?.length || 0;
        existing.recentComments += recentComments;

        const activityDate = doc.updatedAt || doc.createdAt;
        if (new Date(activityDate) > new Date(existing.latestActivity)) {
          existing.latestActivity = activityDate;
        }
        if (new Date(doc.createdAt) > new Date(existing.latestCreated)) {
          existing.latestCreated = doc.createdAt;
        }

        creatorMap.set(authorId, existing);
      };

      postDocs.forEach((p) => accumulate(p.user, p));
      reelDocs.forEach((r) => accumulate(r.author, r));

      const scoredCreators = Array.from(creatorMap.values())
        .map((stats) => ({
          stats,
          score: computeCreatorScore(stats, periodStart),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      const paged = paginate(scoredCreators, page, limit);

      response.trendingCreators = {
        ...paged,
        items: paged.items.map(({ stats, score }) => {
          const user = stats.user;
          const userId = user._id?.toString();
          return {
            ...formatUserSnippet(user),
            followersCount: user.followers?.length || 0,
            isFollowing: userId ? followingIds.includes(userId) : false,
            trendingScore: Math.round(score * 100) / 100,
            recentEngagement: {
              likes: stats.totalLikes,
              comments: stats.totalComments,
              shares: stats.totalShares,
              recentComments: stats.recentComments,
            },
          };
        }),
      };
      response.creators = response.trendingCreators.items;
    }

    const anyHasMore =
      response.trendingNow.hasMore ||
      response.rising.hasMore ||
      response.trendingReels.hasMore ||
      response.trendingCreators.hasMore;
    response.pagination.hasMore = anyHasMore;

    res.status(200).json(response);
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ success: false, message: 'Failed to load trending content' });
  }
};

exports.getTrendingConfig = (req, res) => {
  res.json({
    success: true,
    config: trendingConfig,
  });
};
