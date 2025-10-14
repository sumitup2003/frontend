
//frontend/store/callStore.js

import { create } from 'zustand';
import api from '../utils/api';

export const useCallStore = create((set, get) => ({
  callHistory: [],
  missedCallsCount: 0,
  loading: false,

  saveCall: async (callData) => {
    try {
      await api.post('/calls/save', callData);
      get().fetchCallHistory();
      get().fetchMissedCallsCount();
    } catch (error) {
      console.error('Save call error:', error);
    }
  },

  fetchCallHistory: async () => {
    try {
      set({ loading: true });
      const response = await api.get('/calls/history');
      set({ callHistory: response.data.data, loading: false });
    } catch (error) {
      console.error('Fetch call history error:', error);
      set({ loading: false });
    }
  },

  fetchMissedCallsCount: async () => {
    try {
      const response = await api.get('/calls/missed-count');
      set({ missedCallsCount: response.data.data.count });
    } catch (error) {
      console.error('Fetch missed calls count error:', error);
    }
  },

  markCallsAsSeen: async () => {
    try {
      await api.put('/calls/mark-seen');
      set({ missedCallsCount: 0 });
      get().fetchCallHistory();
    } catch (error) {
      console.error('Mark calls as seen error:', error);
    }
  },

  deleteCall: async (callId) => {
    try {
      await api.delete(`/calls/${callId}`);
      set({
        callHistory: get().callHistory.filter(call => call._id !== callId)
      });
    } catch (error) {
      console.error('Delete call error:', error);
    }
  }
}));