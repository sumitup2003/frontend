// frontend/src/hooks/useSocket.js

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import socketService from '../utils/socket';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addMessage, updateUserStatus, addTypingUser, removeTypingUser } = useChatStore();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && user) {
      // Connect socket if not already connected
      if (!socketService.isConnected()) {
        socketService.connect(user._id);
      }

      // ✅ Setup message listener with mount check
      socketService.onReceiveMessage((message) => {
        if (!isMountedRef.current) return;
        console.log('💬 useSocket: Received message', message);
        addMessage(message.senderId, message);
      });

      // User status
      socketService.onUserStatus(({ userId, isActive }) => {
        if (!isMountedRef.current) return;
        updateUserStatus(userId, isActive);
      });

      // Typing events
      socketService.onTyping(({ userId }) => {
        if (!isMountedRef.current) return;
        addTypingUser(userId);
        setTimeout(() => removeTypingUser(userId), 3000);
      });

      socketService.onStopTyping(({ userId }) => {
        if (!isMountedRef.current) return;
        removeTypingUser(userId);
      });
    }

    return () => {
      console.log('🧹 useSocket cleanup');
      isMountedRef.current = false;
      // ✅ DON'T disconnect - socket should stay connected
      // Only disconnect when user logs out (handled in App.jsx)
    };
  }, [isAuthenticated, user]);

  return socketService;
};