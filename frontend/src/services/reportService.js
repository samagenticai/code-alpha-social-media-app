import api from './api';

export const reportService = {
  async createReport(payload) {
    const { data } = await api.post('/reports', payload);
    return data;
  },

  async getMyReports() {
    const { data } = await api.get('/reports/my');
    return data;
  },

  async getReport(reportId) {
    const { data } = await api.get(`/reports/${reportId}`);
    return data;
  },

  async getReportMessages(reportId) {
    const { data } = await api.get(`/reports/${reportId}/messages`);
    return data;
  },

  async sendReportMessage(reportId, message) {
    const { data } = await api.post(`/reports/${reportId}/messages`, { message });
    return data;
  },
};

export default reportService;
