import api from './api';
import { mapPost, mapPosts } from '../utils/postMapper';
import { mapReel, mapReels } from '../utils/reelMapper';

const EMPTY_SECTION = { items: [], page: 1, limit: 20, total: 0, hasMore: false };

const mapSection = (sectionData, mapper) => {
  if (!sectionData) return { ...EMPTY_SECTION };
  return {
    ...EMPTY_SECTION,
    ...sectionData,
    items: mapper(sectionData.items || []),
  };
};

const assertSuccess = (data) => {
  if (data?.success === false) {
    throw new Error(data.message || 'Failed to load trending content');
  }
};

export const trendingService = {
  async getTrending({ type = 'all', period = 'week', section = null, page = 1, limit = 10 } = {}) {
    const params = { type, period, page, limit };
    if (section) params.section = section;

    const { data } = await api.get('/trending', { params });
    assertSuccess(data);

    return {
      success: true,
      filters: data.filters,
      weights: data.weights,
      pagination: data.pagination,
      trendingNow: mapSection(data.trendingNow, mapPosts),
      rising: mapSection(data.rising, mapPosts),
      trendingReels: mapSection(data.trendingReels, mapReels),
      trendingCreators: data.trendingCreators || { ...EMPTY_SECTION },
    };
  },

  async loadSection(section, { type = 'all', period = 'week', page = 1, limit = 10 } = {}) {
    const { data } = await api.get('/trending', {
      params: { type, period, section, page, limit },
    });
    assertSuccess(data);

    if (section === 'trending_now') {
      return mapSection(data.trendingNow, mapPosts);
    }
    if (section === 'rising') {
      return mapSection(data.rising, mapPosts);
    }
    if (section === 'reels') {
      return mapSection(data.trendingReels, mapReels);
    }
    if (section === 'creators') {
      return data.trendingCreators || { ...EMPTY_SECTION };
    }
    return { ...EMPTY_SECTION };
  },
};

export default trendingService;
