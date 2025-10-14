// frontend/src/utils/socket.js

import io from 'socket.io-client';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';




class SocketService {
  constructor() {
    this.socket = null;
    this.ringtone = null;
    this.callSound = null;
    this.initAudio();
  }

  initAudio() {
    // Create audio elements for ringtones
    this.ringtone = new Audio('/sounds/ringtone.mp3'); // Add this file to public/sounds/
    this.ringtone.loop = true;
    
    this.callSound = new Audio('/sounds/call-start.mp3'); // Add this file
    this.dialTone = new Audio('/sounds/dial-tone.mp3'); // Add this file
    this.dialTone.loop = true;
  }

  connect(userId) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.SOCKET_URL || 'http://localhost:5000', {
      auth: { userId },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.stopAllSounds();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopAllSounds();
  }

  // Sound control methods
  playRingtone() {
    this.ringtone?.play().catch(err => console.log('Ringtone play error:', err));
  }

  stopRingtone() {
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone.currentTime = 0;
    }
  }

  playDialTone() {
    this.dialTone?.play().catch(err => console.log('Dial tone play error:', err));
  }

  stopDialTone() {
    if (this.dialTone) {
      this.dialTone.pause();
      this.dialTone.currentTime = 0;
    }
  }

  playCallStart() {
    this.callSound?.play().catch(err => console.log('Call sound play error:', err));
  }

  stopAllSounds() {
    this.stopRingtone();
    this.stopDialTone();
    if (this.callSound) {
      this.callSound.pause();
      this.callSound.currentTime = 0;
    }
  }

  // ============ CALL EVENTS ============

  // Initiate a call
  initiateCall(data) {
    console.log('📞 Initiating call to:', data.to);
    this.socket?.emit('call:initiate', data);
    this.playDialTone();
  }

  // Listen for incoming call
  onIncomingCall(callback) {
    this.socket?.on('call:incoming', (data) => {
      console.log('📞 Incoming call from:', data.from);
      this.playRingtone();
      callback(data);
    });
  }

  // Answer a call
  answerCall(data) {
    console.log('✅ Answering call');
    this.stopRingtone();
    this.playCallStart();
    this.socket?.emit('call:answer', data);
  }

  // Listen for call answered
  onCallAnswered(callback) {
    this.socket?.on('call:answered', (data) => {
      console.log('✅ Call answered');
      this.stopDialTone();
      this.playCallStart();
      callback(data);
    });
  }

  // Reject a call
  rejectCall(data) {
    console.log('❌ Rejecting call');
    this.stopRingtone();
    this.socket?.emit('call:reject', data);
  }

  // Listen for call rejected
  onCallRejected(callback) {
    this.socket?.on('call:rejected', (data) => {
      console.log('❌ Call rejected');
      this.stopDialTone();
      callback(data);
    });
  }

  // End call
  endCall(data) {
    console.log('📴 Ending call');
    this.stopAllSounds();
    this.socket?.emit('call:end', data);
  }

  // Listen for call ended
  onCallEnded(callback) {
    this.socket?.on('call:ended', (data) => {
      console.log('📴 Call ended');
      this.stopAllSounds();
      callback(data);
    });
  }

  // Listen for call missed (caller cancels before answer)
  onCallMissed(callback) {
    this.socket?.on('call:missed', (data) => {
      console.log('📵 Call missed');
      this.stopRingtone();
      callback(data);
    });
  }

  // Send WebRTC offer
  sendOffer(data) {
    this.socket?.emit('call:offer', data);
  }

  // Listen for WebRTC offer
  onOffer(callback) {
    this.socket?.on('call:offer', callback);
  }

  // Send WebRTC answer
  sendAnswer(data) {
    this.socket?.emit('call:answer-signal', data);
  }

  // Listen for WebRTC answer
  onAnswer(callback) {
    this.socket?.on('call:answer-signal', callback);
  }

  // Send ICE candidate
  sendIceCandidate(data) {
    this.socket?.emit('call:ice-candidate', data);
  }

  // Listen for ICE candidate
  onIceCandidate(callback) {
    this.socket?.on('call:ice-candidate', callback);
  }

  // ============ MESSAGE EVENTS ============

  sendMessage(data) {
    this.socket?.emit('message:send', data);
  }

  onReceiveMessage(callback) {
    this.socket?.on('message:receive', callback);
  }

  // Message read receipts
  markMessageAsRead(messageId) {
    this.socket?.emit('message:read', messageId);
  }

  onMessageRead(callback) {
    this.socket?.on('message:read', callback);
  }

  emitTyping(userId) {
    this.socket?.emit('typing:start', userId);
  }

  emitStopTyping(userId) {
    this.socket?.emit('typing:stop', userId);
  }

  onTyping(callback) {
    this.socket?.on('user:typing', callback);
  }

  onStopTyping(callback) {
    this.socket?.on('user:stop-typing', callback);
  }

  // ============ USER STATUS ============

  onUserOnline(callback) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback) {
    this.socket?.on('user:offline', callback);
  }

  // Combined user status listener (for backward compatibility)
  onUserStatus(callback) {
    this.socket?.on('user:online', (userId) => {
      callback({ userId, status: 'online' });
    });
    this.socket?.on('user:offline', (userId) => {
      callback({ userId, status: 'offline' });
    });
  }

  // ============ NOTIFICATIONS ============

  onNotification(callback) {
    this.socket?.on('notification:new', callback);
  }

  sendNotification(data) {
    this.socket?.emit('notification:send', data);
  }

  // ============ POST EVENTS ============

  onPostCreated(callback) {
    this.socket?.on('post:created', callback);
  }

  onPostDeleted(callback) {
    this.socket?.on('post:deleted', callback);
  }

  onPostLiked(callback) {
    this.socket?.on('post:liked', callback);
  }

  // ============ UTILITY METHODS ============

  // Check if socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }

  // Remove all listeners for cleanup
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove specific listener
  off(event, callback) {
    this.socket?.off(event, callback);
  }

  // Generic emit for custom events
  emit(event, data) {
    this.socket?.emit(event, data);
  }

  // Generic listener for custom events
  on(event, callback) {
    this.socket?.on(event, callback);
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;