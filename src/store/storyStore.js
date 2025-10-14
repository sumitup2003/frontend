import { create } from 'zustand';
import api from '../utils/api';

export const useStoryStore = create((set, get) => ({
  stories: [],
  loading: false,

  fetchStories: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/stories');
      set({ stories: response.data.data, loading: false });
    } catch (error) {
      console.error('Fetch stories error:', error);
      set({ loading: false });
    }
  },

  createStory: async (file, caption) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const formData = new FormData();
      formData.append('media', file);
      if (caption) formData.append('caption', caption);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        get().fetchStories();
        return data.data;
      }
      throw new Error(data.message);
    } catch (error) {
      throw error;
    }
  },

  viewStory: async (storyId) => {
    try {
      await api.post(`/stories/${storyId}/view`);
    } catch (error) {
      console.error('View story error:', error);
    }
  },

  deleteStory: async (storyId) => {
    try {
      await api.delete(`/stories/${storyId}`);
      get().fetchStories();
    } catch (error) {
      console.error('Delete story error:', error);
    }
  }
}));