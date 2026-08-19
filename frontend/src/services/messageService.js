import api from './api';

export const messageService = {
  async getConversations() {
    try {
      const { data } = await api.get('/messages/conversations');
      return { success: true, conversations: data.conversations || [] };
    } catch (err) {
      try {
        const { data } = await api.get('/users/conversations');
        return { success: true, conversations: data.conversations || [] };
      } catch (e) {
        return { success: false, conversations: [] };
      }
    }
  },

  async getMessagesWithUser(userId) {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      return { success: true, messages: data.messages || [] };
    } catch (err) {
      try {
        const { data } = await api.get(`/users/messages/${userId}`);
        return { success: true, messages: data.messages || [] };
      } catch (e) {
        return { success: false, messages: [] };
      }
    }
  },

  async sendMessage({ receiverId, text, storyRef }) {
    try {
      const { data } = await api.post('/messages', { receiverId, text, storyRef });
      return { success: true, message: data.message };
    } catch (err) {
      try {
        const { data } = await api.post('/users/messages', { receiverId, text, storyRef });
        return { success: true, message: data.message };
      } catch (e) {
        return { success: false };
      }
    }
  },

  async markAsRead(userId) {
    try {
      await api.put(`/messages/read/${userId}`);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },
};
