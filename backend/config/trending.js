/** Configurable weights for trending score calculations */
module.exports = {
  weights: {
    likes: 1,
    comments: 3,
    shares: 5,
    recentLike: 2,
    recentComment: 4,
    recentShare: 6,
  },
  /** Time-decay half-life in hours — score halves every N hours */
  halfLifeHours: 24,
  /** Max documents to score before pagination (performance cap) */
  maxCandidates: 400,
  /** Lookback window for candidate queries (days) */
  lookbackDays: {
    today: 7,
    week: 21,
    all: 90,
  },
  /** Default page size */
  defaultLimit: 20,
  maxLimit: 50,
};
