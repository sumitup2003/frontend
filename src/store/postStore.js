import { create } from 'zustand';
import api from '../utils/api';

export const usePostStore = create((set, get) => ({
  posts: [],
  userPosts: [],
  savedPosts: [],
  loading: false,
  error: null,

  fetchFeed: async (page = 1) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/posts/feed?page=${page}`);
      set({ posts: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message, loading: false });
    }
  },

  fetchUserPosts: async (userId) => {
    try {
      set({ loading: true });
      const response = await api.get(`/posts/user/${userId}`);
      set({ userPosts: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  fetchSavedPosts: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/posts/saved');
      set({ savedPosts: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  createPostWithFile: async (postData) => {
    try {
      console.log('📤 Creating post with:', postData);

      const formData = new FormData();
      formData.append('content', postData.content || '');
      
      if (postData.file) {
        formData.append('media', postData.file);
        console.log('📎 File attached:', postData.file.name);
      }

      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      console.log('🔐 Token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      console.log('📥 Response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (data.success) {
        set({ posts: [data.data, ...get().posts] });
        console.log('✅ Post created successfully');
        return data.data;
      }
      
      throw new Error(data.message || 'Failed to create post');
    } catch (error) {
      console.error('❌ Create post error:', error);
      throw error;
    }
  },

  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      const { isLiked, likesCount } = response.data.data;
      
      set({
        posts: get().posts.map(post =>
          post._id === postId
            ? { ...post, isLiked, likesCount }
            : post
        ),
        userPosts: get().userPosts.map(post =>
          post._id === postId
            ? { ...post, isLiked, likesCount }
            : post
        )
      });
    } catch (error) {
      console.error('Like error:', error);
    }
  },

  savePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/save`);
      const { isSaved } = response.data.data;
      
      set({
        posts: get().posts.map(post =>
          post._id === postId
            ? { ...post, isSaved }
            : post
        )
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  },

  addComment: async (postId, text) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text });
      
      set({
        posts: get().posts.map(post =>
          post._id === postId
            ? { ...post, comments: response.data.data, commentsCount: response.data.data.length }
            : post
        )
      });
    } catch (error) {
      console.error('Comment error:', error);
    }
  },

  deletePost: async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      set({
        posts: get().posts.filter(post => post._id !== postId),
        userPosts: get().userPosts.filter(post => post._id !== postId)
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}));