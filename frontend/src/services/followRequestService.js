import api from './api';

export const followRequestService = {
  async getFollowRequests() {
    const { data } = await api.get('/follow-requests');
    return {
      success: true,
      requests: data.requests || [],
      count: data.count || 0,
    };
  },

  async getFollowRequestCount() {
    const { data } = await api.get('/follow-requests/count');
    return { success: true, count: data.count || 0 };
  },

  async sendFollowRequest(userId) {
    const { data } = await api.post(`/follow-requests/${userId}`);
    return data;
  },

  async acceptRequest(requestId) {
    const { data } = await api.put(`/follow-requests/${requestId}/accept`);
    return data;
  },

  async rejectRequest(requestId) {
    const { data } = await api.put(`/follow-requests/${requestId}/reject`);
    return data;
  },
};

export default followRequestService;
