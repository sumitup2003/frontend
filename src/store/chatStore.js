import { create } from 'zustand';
import api from '../utils/api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: {},
  selectedChat: null,
  loading: false,
  typingUsers: new Set(),

  fetchConversations: async () => {
    try {
      set({ loading: true });
      console.log('📞 Fetching conversations...');
      
      const response = await api.get('/messages/conversations');
      console.log('✅ Conversations fetched:', response.data.data?.length);
      
      set({ conversations: response.data.data || [], loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('❌ Fetch conversations error:', error.response?.data || error.message);
    }
  },

  fetchMessages: async (userId) => {
    try {
      console.log('📨 Fetching messages for user:', userId);
      
      const response = await api.get(`/messages/${userId}`);
      console.log('✅ Messages fetched:', response.data.data?.length);
      
      set({
        messages: {
          ...get().messages,
          [userId]: response.data.data || []
        }
      });
    } catch (error) {
      console.error('❌ Fetch messages error:', {
        userId,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
    }
  },

  sendMessage: async (receiverId, text) => {
    try {
      console.log('📤 Sending message to:', receiverId);
      
      const response = await api.post('/messages', {
        receiver: receiverId,
        text
      });
      
      const newMessage = response.data.data;
      console.log('✅ Message sent:', newMessage._id);
      
      set({
        messages: {
          ...get().messages,
          [receiverId]: [...(get().messages[receiverId] || []), newMessage]
        }
      });

      return newMessage;
    } catch (error) {
      console.error('❌ Send message error:', error.response?.data || error.message);
      throw error;
    }
  },

  addMessage: (userId, message) => {
    set({
      messages: {
        ...get().messages,
        [userId]: [...(get().messages[userId] || []), message]
      }
    });
  },

  setSelectedChat: (chat) => {
    set({ selectedChat: chat });
  },

  addTypingUser: (userId) => {
    const typingUsers = new Set(get().typingUsers);
    typingUsers.add(userId);
    set({ typingUsers });
  },

  removeTypingUser: (userId) => {
    const typingUsers = new Set(get().typingUsers);
    typingUsers.delete(userId);
    set({ typingUsers });
  },

  updateUserStatus: (userId, isActive) => {
    set({
      conversations: get().conversations.map(conv =>
        conv._id === userId ? { ...conv, isActive } : conv
      )
    });

    if (get().selectedChat?._id === userId) {
      set({
        selectedChat: {
          ...get().selectedChat,
          isActive
        }
      });
    }
  }
}));