import api from './api';

export const supportService = {
  async createTicket(payload) {
    const { data } = await api.post('/support', payload);
    return data;
  },

  async getMyTickets() {
    const { data } = await api.get('/support');
    return data;
  },

  async getMyTicket(id) {
    const { data } = await api.get(`/support/${id}`);
    return data;
  },

  async replyToTicket(id, message) {
    const { data } = await api.post(`/support/${id}/reply`, { message });
    return data;
  },
};

export default supportService;
