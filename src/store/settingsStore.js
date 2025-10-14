import { create } from 'zustand';
import api from '../utils/api';

export const useSettingsStore = create((set) => ({
  settings: null,
  blockedUsers: [],
  loading: false,

  fetchSettings: async () => {
    try {
      const response = await api.get('/settings');
      set({ settings: response.data.data });
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  },

  updatePrivacy: async (privacySettings) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await api.put('/settings/privacy', privacySettings);
      set({ settings: response.data.data });
    } catch (error) {
      throw error;
    }
  },

  updateNotifications: async (notificationSettings) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await api.put('/settings/notifications', notificationSettings);
      set({ settings: response.data.data });
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (passwords) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await api.put('/settings/password', passwords);
    } catch (error) {
      throw error;
    }
  },

  blockUser: async (userId) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await api.post(`/settings/block/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  unblockUser: async (userId) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await api.delete(`/settings/block/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  fetchBlockedUsers: async () => {
    try {
      const response = await api.get('/settings/blocked');
      set({ blockedUsers: response.data.data });
    } catch (error) {
      console.error('Fetch blocked users error:', error);
    }
  },

  deleteAccount: async (password) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await api.delete('/settings/account', { data: { password } });
    } catch (error) {
      throw error;
    }
  }
}));