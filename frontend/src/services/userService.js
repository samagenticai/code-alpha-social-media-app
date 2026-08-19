import api from './api';
import { mapPost, mapPosts, mapProfile } from '../utils/postMapper';
import { mapReel, mapReels } from '../utils/reelMapper';

const unwrapPosts = (data) => {
  const posts = data?.posts || data?.data || [];
  return mapPosts(posts);
};

const unwrapPost = (data) => {
  const post = data?.post || data?.data || data;
  return mapPost(post);
};

export const userService = {
  async getFeedPosts({ page = 1, limit = 10 } = {}) {
    const { data } = await api.get('/posts', { params: { page, limit } });
    return {
      success: true,
      posts: unwrapPosts(data),
      pagination: data.pagination || { page, limit, hasMore: false, total: 0 },
    };
  },

  async getReels() {
    const { data } = await api.get('/reels');
    return { success: true, reels: mapReels(data.reels || []) };
  },

  async createReel(reelData) {
    const { data } = await api.post('/reels', reelData);
    return { success: true, reel: mapReel(data.reel) };
  },

  async updateReel(reelId, reelData) {
    const { data } = await api.put(`/reels/${reelId}`, reelData);
    return { success: true, reel: mapReel(data.reel) };
  },

  async deleteReel(reelId) {
    const { data } = await api.delete(`/reels/${reelId}`);
    return { success: true, ...data };
  },

  async toggleLikeReel(reelId) {
    const { data } = await api.post(`/reels/${reelId}/like`);
    return {
      success: true,
      isLiked: data.isLiked,
      likesCount: data.likesCount,
      reel: data.reel ? mapReel(data.reel) : undefined,
    };
  },

  async addCommentToReel(reelId, commentData) {
    const { data } = await api.post(`/reels/${reelId}/comment`, { text: commentData.text });
    return { success: true, reel: mapReel(data.reel) };
  },

  async deleteReelComment(reelId, commentId) {
    const { data } = await api.delete(`/reels/${reelId}/comment/${commentId}`);
    return { success: true, reel: mapReel(data.reel) };
  },

  async toggleReelCommentLike(reelId, commentId) {
    const { data } = await api.post(`/reels/${reelId}/comment/${commentId}/like`);
    return {
      success: true,
      isLiked: data.isLiked,
      likesCount: data.likesCount,
      reel: mapReel(data.reel),
    };
  },

  async getUserReels(username) {
    const clean = username.replace('@', '').toLowerCase();
    const { data } = await api.get(`/users/${clean}/reels`);
    return { success: true, reels: mapReels(data.reels || []), isLocked: Boolean(data.isLocked) };
  },

  async getSavedPosts() {
    const { data } = await api.get('/posts/saved');
    return { success: true, posts: unwrapPosts(data) };
  },

  async getPostLikers(postId) {
    const { data } = await api.get(`/posts/${postId}/likes`);
    return { success: true, likers: data.likers || [] };
  },

  async getUserByUsername(username) {
    const cleanUsername = username ? username.replace('@', '').toLowerCase() : '';
    const { data } = await api.get(`/users/${cleanUsername}`);
    return { success: true, data: mapProfile(data.data) };
  },

  async getUserPosts(username) {
    const cleanUsername = username ? username.replace('@', '').toLowerCase() : '';
    const { data } = await api.get(`/users/${cleanUsername}/posts`);
    return {
      success: true,
      isPrivate: Boolean(data.isPrivate),
      isLocked: Boolean(data.isLocked),
      data: unwrapPosts(data),
      posts: unwrapPosts(data),
    };
  },

  async updateUserProfile(profileData) {
    const { data } = await api.put('/users/profile', profileData);
    return { success: true, data: mapProfile(data.data) };
  },

  async createPost(postData) {
    const { data } = await api.post('/posts', {
      content: postData.content,
      images: postData.images,
      imageUrl: postData.imageUrl,
      imagePublicId: postData.imagePublicId,
      videoUrl: postData.videoUrl,
      videoPublicId: postData.videoPublicId,
      media: postData.media,
      video: postData.video,
      audience: postData.audience || 'public',
    });
    return { success: true, post: unwrapPost(data), data: unwrapPost(data) };
  },

  async updatePost(postId, postData) {
    const { data } = await api.put(`/posts/${postId}`, postData);
    return { success: true, post: unwrapPost(data), data: unwrapPost(data) };
  },

  async deletePost(postId) {
    const { data } = await api.delete(`/posts/${postId}`);
    return { success: true, ...data };
  },

  async toggleFollowUser(userId) {
    const { data } = await api.post(`/users/follow/${userId}`);
    return {
      success: true,
      isFollowing: data.isFollowing,
      followRequestPending: data.followRequestPending || false,
      followDisabled: data.followDisabled || false,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      message: data.message,
    };
  },

  async getSuggestedUsers() {
    const { data } = await api.get('/users/suggested');
    return { success: true, data: data.data || [] };
  },

  async getFollowers(username) {
    const clean = username.replace('@', '').toLowerCase();
    const { data } = await api.get(`/users/${clean}/followers`);
    return { success: true, users: data.users || [], count: data.count || 0 };
  },

  async getFollowing(username) {
    const clean = username.replace('@', '').toLowerCase();
    const { data } = await api.get(`/users/${clean}/following`);
    return { success: true, users: data.users || [], count: data.count || 0 };
  },

  async getProfileLikers(username) {
    const clean = username.replace('@', '').toLowerCase();
    const { data } = await api.get(`/users/${clean}/likers`);
    return {
      success: true,
      users: data.users || [],
      count: data.count || 0,
      totalLikes: data.totalLikes || 0,
    };
  },

  async toggleLikePost(postId) {
    const { data } = await api.post(`/posts/${postId}/like`);
    return {
      success: true,
      isLiked: data.isLiked,
      likesCount: data.likesCount,
      post: data.post ? mapPost(data.post) : undefined,
    };
  },

  async addCommentToPost(postId, commentData) {
    const { data } = await api.post(`/posts/${postId}/comment`, {
      text: commentData.text,
    });
    return {
      success: true,
      post: mapPost(data.post),
    };
  },

  async deleteComment(postId, commentId) {
    const { data } = await api.delete(`/posts/${postId}/comment/${commentId}`);
    return {
      success: true,
      post: mapPost(data.post),
    };
  },

  async toggleCommentLike(postId, commentId) {
    const { data } = await api.post(`/posts/${postId}/comment/${commentId}/like`);
    return {
      success: true,
      isLiked: data.isLiked,
      likesCount: data.likesCount,
      post: mapPost(data.post),
    };
  },

  async toggleSavePost(postId) {
    const { data } = await api.post(`/posts/${postId}/save`);
    return {
      success: true,
      isSaved: data.isSaved,
      savesCount: data.savesCount,
      post: data.post ? mapPost(data.post) : undefined,
    };
  },

  async sharePost(postId) {
    const { data } = await api.post(`/posts/${postId}/share`);
    return {
      success: true,
      sharesCount: data.sharesCount,
      post: data.post ? mapPost(data.post) : undefined,
    };
  },

  async shareReel(reelId) {
    const { data } = await api.post(`/reels/${reelId}/share`);
    return {
      success: true,
      sharesCount: data.sharesCount,
      reel: data.reel ? mapReel(data.reel) : undefined,
    };
  },

  async searchUsers(query) {
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return { success: true, users: data.users || [] };
  },

  async getStories() {
    try {
      const { data } = await api.get('/stories');
      return { success: true, stories: data.stories || [] };
    } catch (err) {
      const { data } = await api.get('/users/stories');
      return { success: true, stories: data.stories || [] };
    }
  },

  async createStory(storyData) {
    try {
      const { data } = await api.post('/stories', storyData);
      return { success: true, story: data.story, storyItem: data.storyItem };
    } catch (err) {
      const { data } = await api.post('/users/stories', storyData);
      return { success: true, story: data.story, storyItem: data.storyItem };
    }
  },

  async likeStory(storyId) {
    try {
      const { data } = await api.post(`/stories/${storyId}/like`);
      return { success: true, isLiked: data.isLiked, likesCount: data.likesCount };
    } catch (err) {
      return { success: false };
    }
  },

  async viewStory(storyId) {
    try {
      const { data } = await api.post(`/stories/${storyId}/view`);
      return { success: true, viewsCount: data.viewsCount };
    } catch (err) {
      return { success: false };
    }
  },

  async deleteStory(storyId) {
    try {
      const { data } = await api.delete(`/stories/${storyId}`);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false };
    }
  },

  async getStoryStats(storyId) {
    try {
      const { data } = await api.get(`/stories/${storyId}/stats`);
      return { success: true, ...data };
    } catch (err) {
      return { success: false, likesCount: 0, viewsCount: 0, likers: [], viewers: [] };
    }
  },
};
