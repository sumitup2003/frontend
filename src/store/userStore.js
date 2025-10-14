import { create } from 'zustand';
import api from '../utils/api';

export const useUserStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  followRequests: [],
  loading: false,
  error: null,

  // Set selected user
  setSelectedUser: (user) => {
    set({ selectedUser: user });
  },

  // Clear selected user
  clearSelectedUser: () => {
    set({ selectedUser: null });
  },

  // Search users
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ users: [] });
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await api.get(`/users/search?query=${query}`);
      set({ users: response.data.data, loading: false });
    } catch (error) {
      console.error('Search error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to search users',
        loading: false 
      });
    }
  },

  // Get user by ID
  getUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/users/${userId}`);
      set({ selectedUser: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Get user error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch user',
        loading: false 
      });
      throw error;
    }
  },

  // ✅ FIXED: Follow user - use correct endpoint
  followUser: async (userId) => {
    try {
      console.log('Following user:', userId);
      
      // ✅ Use the correct endpoint format: /users/:userId/follow
      const response = await api.post(`/users/${userId}/follow`);
      
      console.log('✅ Follow response:', response.data);
      
      // Update users list
      set({
        users: get().users.map(u =>
          u._id === userId ? { ...u, isFollowing: true } : u
        )
      });

      // Update selected user if it's the same user
      if (get().selectedUser?._id === userId) {
        set({
          selectedUser: {
            ...get().selectedUser,
            isFollowing: true
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error('❌ Follow error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ FIXED: Unfollow user - use correct endpoint
  unfollowUser: async (userId) => {
    try {
      console.log('Unfollowing user:', userId);
      
      // ✅ Use the correct endpoint format: /users/:userId/unfollow
      const response = await api.post(`/users/${userId}/unfollow`);
      
      console.log('✅ Unfollow response:', response.data);
      
      // Update users list
      set({
        users: get().users.map(u =>
          u._id === userId ? { ...u, isFollowing: false } : u
        )
      });

      // Update selected user if it's the same user
      if (get().selectedUser?._id === userId) {
        set({
          selectedUser: {
            ...get().selectedUser,
            isFollowing: false
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error('❌ Unfollow error:', error.response?.data || error);
      throw error;
    }
  },

  // Get user's followers
  getUserFollowers: async (userId) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/users/${userId}/followers`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Get followers error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch followers',
        loading: false 
      });
      throw error;
    }
  },

  // Get user's following
  getUserFollowing: async (userId) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/users/${userId}/following`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Get following error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch following',
        loading: false 
      });
      throw error;
    }
  },

  // Get follow requests
  getFollowRequests: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/users/follow-requests');
      set({ followRequests: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Get requests error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch follow requests',
        loading: false 
      });
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put('/users/profile', profileData);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Update profile error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to update profile',
        loading: false 
      });
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      console.error('Upload avatar error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to upload avatar',
        loading: false 
      });
      throw error;
    }
  },

  // Clear users list
  clearUsers: () => {
    set({ users: [] });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));