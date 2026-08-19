import api from './api';

export const notificationService = {
  // Fetch user notifications (max 10)
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  // Delete a single notification
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const res = await api.delete('/notifications');
    return res.data;
  },
};
