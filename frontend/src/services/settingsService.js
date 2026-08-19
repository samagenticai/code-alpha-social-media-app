import api from './api';

export const settingsService = {
  async getPrivacySettings() {
    const { data } = await api.get('/settings/privacy');
    return { success: true, privacy: data.privacy };
  },

  async updatePrivacySettings(updates) {
    const { data } = await api.put('/settings/privacy', updates);
    return { success: true, privacy: data.privacy, data: data.data };
  },
};

export default settingsService;
