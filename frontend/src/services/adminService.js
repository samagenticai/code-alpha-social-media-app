import api from './api';

export const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getAnalytics() {
    const { data } = await api.get('/admin/analytics');
    return data;
  },

  async getNotifications(params = {}) {
    const { data } = await api.get('/admin/notifications', { params });
    return data;
  },

  async getRecentNotifications() {
    const { data } = await api.get('/admin/notifications', { params: { recent: true, limit: 10 } });
    return data;
  },

  async getUnreadNotificationCount() {
    const { data } = await api.get('/admin/notifications/unread-count');
    return data;
  },

  async markNotificationRead(id) {
    const { data } = await api.put(`/admin/notifications/${id}/read`);
    return data;
  },

  async markAllNotificationsRead() {
    const { data } = await api.put('/admin/notifications/read-all');
    return data;
  },

  async search(q) {
    const { data } = await api.get('/admin/search', { params: { q } });
    return data;
  },

  async getUsers(params = {}) {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  async getUser(id) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async blockUser(id, reason) {
    const { data } = await api.put(`/admin/users/${id}/block`, { reason });
    return data;
  },

  async unblockUser(id) {
    const { data } = await api.put(`/admin/users/${id}/unblock`);
    return data;
  },

  async suspendUser(id, reason) {
    const { data } = await api.put(`/admin/users/${id}/suspend`, { reason });
    return data;
  },

  async deleteUser(id) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  async getBlockedUsers(params = {}) {
    const { data } = await api.get('/admin/blocked-users', { params });
    return data;
  },

  async getPosts(params = {}) {
    const { data } = await api.get('/admin/posts', { params });
    return data;
  },

  async removePost(id, reason) {
    const { data } = await api.put(`/admin/posts/${id}/remove`, { reason });
    return data;
  },

  async restorePost(id) {
    const { data } = await api.put(`/admin/posts/${id}/restore`);
    return data;
  },

  async getReels(params = {}) {
    const { data } = await api.get('/admin/reels', { params });
    return data;
  },

  async removeReel(id, reason) {
    const { data } = await api.put(`/admin/reels/${id}/remove`, { reason });
    return data;
  },

  async restoreReel(id) {
    const { data } = await api.put(`/admin/reels/${id}/restore`);
    return data;
  },

  async getComments(params = {}) {
    const { data } = await api.get('/admin/comments', { params });
    return data;
  },

  async removeComment(payload) {
    const { data } = await api.delete('/admin/comments', { data: payload });
    return data;
  },

  async getReports(params = {}) {
    const { data } = await api.get('/admin/reports', { params });
    return data;
  },

  async getReport(id) {
    const { data } = await api.get(`/admin/reports/${id}`);
    return data;
  },

  async updateReport(id, payload) {
    const { data } = await api.put(`/admin/reports/${id}`, payload);
    return data;
  },

  async getReportMessages(id) {
    const { data } = await api.get(`/admin/reports/${id}/messages`);
    return data;
  },

  async sendReportMessage(id, message) {
    const { data } = await api.post(`/admin/reports/${id}/messages`, { message });
    return data;
  },

  async getUserModeration(id) {
    const { data } = await api.get(`/admin/users/${id}/moderation`);
    return data;
  },

  async getSupportTickets(params = {}) {
    const { data } = await api.get('/admin/support', { params });
    return data;
  },

  async getSupportTicket(id) {
    const { data } = await api.get(`/admin/support/${id}`);
    return data;
  },

  async updateSupportTicket(id, payload) {
    const { data } = await api.put(`/admin/support/${id}`, payload);
    return data;
  },

  async getActivityLogs(params = {}) {
    const { data } = await api.get('/admin/activity-logs', { params });
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/admin/profile');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/admin/profile', payload);
    return data;
  },
};

export default adminService;
