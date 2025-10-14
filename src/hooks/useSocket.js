import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import socketService from '../utils/socket';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addMessage, updateUserStatus, addTypingUser, removeTypingUser } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = socketService.connect(user._id);

      // Message events
      socketService.onReceiveMessage((message) => {
        addMessage(message.senderId, message);
      });

      // User status
      socketService.onUserStatus(({ userId, isActive }) => {
        updateUserStatus(userId, isActive);
      });

      // Typing events
      socketService.onTyping(({ userId }) => {
        addTypingUser(userId);
        setTimeout(() => removeTypingUser(userId), 3000);
      });

      socketService.onStopTyping(({ userId }) => {
        removeTypingUser(userId);
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return socketService;
};