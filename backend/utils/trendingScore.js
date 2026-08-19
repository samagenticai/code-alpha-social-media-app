const config = require('../config/trending');

const MS_HOUR = 60 * 60 * 1000;

const getPeriodStart = (period) => {
  const now = Date.now();
  if (period === 'today') return new Date(now - 24 * MS_HOUR);
  if (period === 'week') return new Date(now - 7 * 24 * MS_HOUR);
  return new Date(0);
};

const getLookbackDate = (period) => {
  const days = config.lookbackDays[period] || config.lookbackDays.week;
  return new Date(Date.now() - days * 24 * MS_HOUR);
};

const computeDecay = (createdAt) => {
  const ageHours = Math.max((Date.now() - new Date(createdAt).getTime()) / MS_HOUR, 0.1);
  return Math.pow(0.5, ageHours / config.halfLifeHours);
};

const countRecentComments = (comments, periodStart) =>
  (comments || []).filter((c) => c.createdAt && new Date(c.createdAt) >= periodStart).length;

const computeTrendingScore = (doc, periodStart) => {
  const { weights } = config;
  const likes = doc.likes?.length || 0;
  const comments = doc.comments?.length || 0;
  const shares = doc.shares?.length || 0;
  const recentComments = countRecentComments(doc.comments, periodStart);
  const decay = computeDecay(doc.createdAt);
  const updatedAt = doc.updatedAt || doc.createdAt;
  const recentlyUpdated = new Date(updatedAt) >= periodStart;
  const updateBoost = recentlyUpdated ? likes * weights.recentLike * 0.12 : 0;

  const base =
    likes * weights.likes +
    comments * weights.comments +
    shares * weights.shares +
    recentComments * weights.recentComment +
    updateBoost;

  return base * decay;
};

const computeRisingScore = (doc, periodStart) => {
  const { weights } = config;
  const ageHours = Math.max((Date.now() - new Date(doc.createdAt).getTime()) / MS_HOUR, 0.25);
  const recentComments = countRecentComments(doc.comments, periodStart);
  const shares = doc.shares?.length || 0;
  const likes = doc.likes?.length || 0;
  const updatedAt = doc.updatedAt || doc.createdAt;
  const recentlyUpdated = new Date(updatedAt) >= periodStart;

  const recentEngagement =
    recentComments * weights.recentComment +
    shares * weights.recentShare * 0.5 +
    (recentlyUpdated ? likes * weights.recentLike * 0.25 : 0);

  return recentEngagement / Math.sqrt(ageHours);
};

const computeCreatorScore = (stats, periodStart) => {
  const { weights } = config;
  const decay = computeDecay(stats.latestActivity || stats.latestCreated || new Date());
  const score =
    stats.totalLikes * weights.likes +
    stats.totalComments * weights.comments +
    stats.totalShares * weights.shares +
    stats.recentComments * weights.recentComment;
  return score * decay;
};

const paginate = (items, page, limit) => {
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return {
    items: slice,
    page,
    limit,
    total: items.length,
    hasMore: start + limit < items.length,
  };
};

module.exports = {
  config,
  getPeriodStart,
  getLookbackDate,
  computeTrendingScore,
  computeRisingScore,
  computeCreatorScore,
  paginate,
};
