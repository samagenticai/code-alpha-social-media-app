import api from './api';

export const moderationService = {
  async blockUser(userId) {
    const { data } = await api.post(`/users/${userId}/block`);
    return data;
  },

  async unblockUser(userId) {
    const { data } = await api.delete(`/users/${userId}/block`);
    return data;
  },

  async getBlockedUsers() {
    const { data } = await api.get('/users/blocked');
    return data;
  },

  async restrictUser(userId) {
    const { data } = await api.post(`/users/${userId}/restrict`);
    return data;
  },

  async unrestrictUser(userId) {
    const { data } = await api.delete(`/users/${userId}/restrict`);
    return data;
  },

  async getRestrictedUsers() {
    const { data } = await api.get('/users/restricted');
    return data;
  },
};

export default moderationService;
