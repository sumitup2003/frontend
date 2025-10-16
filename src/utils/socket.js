// frontend/src/utils/socket.js

import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.ringtone = null;
    this.callSound = null;
    this.dialTone = null;
    this.listeners = new Map();
  }

  initAudio() {
    this.ringtone = new Audio("/sounds/ringtone.mp3");
    this.ringtone.loop = true;

    this.callSound = new Audio("/sounds/call-start.mp3");
    this.dialTone = new Audio("/sounds/dial-tone.mp3");
    this.dialTone.loop = true;
  }

  connect(userId) {
    console.log('🔌 Attempting to connect socket with userId:', userId);
    
    if (this.socket?.connected) {
      console.log('⚠️ Socket already connected');
      return;
    }

    this.socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: { userId },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    this.socket.on("connect", () => {
      console.log("✅ Socket CONNECTED:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket DISCONNECTED");
      this.stopAllSounds();
    });

    this.socket.on("error", (error) => {
      console.error("🔴 Socket ERROR:", error);
    });

    this.initAudio();
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopAllSounds();
  }

  playRingtone() {
    console.log('🔔 Playing ringtone');
    if (this.ringtone) {
      this.ringtone.currentTime = 0;
      this.ringtone.play().catch(err => console.log('Ringtone error:', err));
    }
  }

  stopRingtone() {
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone.currentTime = 0;
    }
  }

  playDialTone() {
    console.log('📞 Playing dial tone');
    if (this.dialTone) {
      this.dialTone.currentTime = 0;
      this.dialTone.play().catch(err => console.log('Dial tone error:', err));
    }
  }

  stopDialTone() {
    if (this.dialTone) {
      this.dialTone.pause();
      this.dialTone.currentTime = 0;
    }
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

  initiateCall(data) {
    console.log("📞 INITIATING CALL - Emitting call:initiate to server");
    console.log("Call data:", data);
    this.socket?.emit("call:initiate", data);
    this.playDialTone();
  }

  onIncomingCall(callback) {
    console.log('👂 LISTENING for incoming calls on call:incoming');
    console.log('Socket connected?', this.socket?.connected);
    console.log('Socket ID:', this.socket?.id);
    
    const handler = (data) => {
      console.log('🎉🎉🎉 INCOMING CALL RECEIVED! 🎉🎉🎉');
      console.log('Caller:', data.from);
      console.log('Call ID:', data.callId);
      console.log('Type:', data.type);
      console.log('Full data:', data);
      this.playRingtone();
      callback(data);
    };
    
    // IMPORTANT: Only remove if we're replacing with new handler
    const existingHandler = this.listeners.get('call:incoming');
    if (existingHandler) {
      this.socket?.off('call:incoming', existingHandler);
    }
    
    this.socket?.on('call:incoming', handler);
    this.listeners.set('call:incoming', handler);
    console.log('✅ Listener registered for call:incoming');
  }

  answerCall(data) {
    console.log("✅ ANSWERING CALL");
    this.stopRingtone();
    this.playCallStart();
    this.socket?.emit("call:answer", data);
  }

  onCallAnswered(callback) {
    console.log('👂 LISTENING for call:answered');
    
    const handler = (data) => {
      console.log('✅ CALL ANSWERED by receiver');
      this.stopDialTone();
      this.playCallStart();
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:answered');
    if (existingHandler) {
      this.socket?.off('call:answered', existingHandler);
    }
    
    this.socket?.on('call:answered', handler);
    this.listeners.set('call:answered', handler);
  }

  rejectCall(data) {
    console.log("❌ REJECTING CALL");
    this.stopRingtone();
    this.socket?.emit("call:reject", data);
  }

  onCallRejected(callback) {
    console.log('👂 LISTENING for call:rejected');
    
    const handler = (data) => {
      console.log('❌ CALL REJECTED');
      this.stopDialTone();
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:rejected');
    if (existingHandler) {
      this.socket?.off('call:rejected', existingHandler);
    }
    
    this.socket?.on('call:rejected', handler);
    this.listeners.set('call:rejected', handler);
  }

  endCall(data) {
    console.log("📴 ENDING CALL");
    this.stopAllSounds();
    this.socket?.emit("call:end", data);
  }

  onCallEnded(callback) {
    console.log('👂 LISTENING for call:ended');
    
    const handler = (data) => {
      console.log('📴 CALL ENDED');
      this.stopAllSounds();
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:ended');
    if (existingHandler) {
      this.socket?.off('call:ended', existingHandler);
    }
    
    this.socket?.on('call:ended', handler);
    this.listeners.set('call:ended', handler);
  }

  sendOffer(data) {
    console.log('📨 Sending WebRTC offer');
    this.socket?.emit('call:offer', data);
  }

  onOffer(callback) {
    console.log('👂 LISTENING for call:offer');
    const handler = (data) => {
      console.log('📨 Received WebRTC offer from:', data.from);
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:offer');
    if (existingHandler) {
      this.socket?.off('call:offer', existingHandler);
    }
    
    this.socket?.on('call:offer', handler);
    this.listeners.set('call:offer', handler);
  }

  sendAnswer(data) {
    console.log('📨 Sending WebRTC answer');
    this.socket?.emit('call:answer-signal', data);
  }

  onAnswer(callback) {
    console.log('👂 LISTENING for call:answer-signal');
    const handler = (data) => {
      console.log('📨 Received WebRTC answer from:', data.from);
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:answer-signal');
    if (existingHandler) {
      this.socket?.off('call:answer-signal', existingHandler);
    }
    
    this.socket?.on('call:answer-signal', handler);
    this.listeners.set('call:answer-signal', handler);
  }

  sendIceCandidate(data) {
    this.socket?.emit('call:ice-candidate', data);
  }

  onIceCandidate(callback) {
    const handler = (data) => {
      console.log('❄️ Received ICE candidate');
      callback(data);
    };
    
    const existingHandler = this.listeners.get('call:ice-candidate');
    if (existingHandler) {
      this.socket?.off('call:ice-candidate', existingHandler);
    }
    
    this.socket?.on('call:ice-candidate', handler);
    this.listeners.set('call:ice-candidate', handler);
  }

  playCallStart() {
    if (this.callSound) {
      this.callSound.currentTime = 0;
      this.callSound
        .play()
        .catch((err) => console.log("Call sound error:", err));
    }
  }

  removeAllListeners() {
    this.listeners.forEach((handler, event) => {
      this.socket?.off(event, handler);
    });
    this.listeners.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  // ============ MESSAGE EVENTS ============

  sendMessage(data) {
    console.log('💬 Sending message');
    this.socket?.emit('message:send', data);
  }

  onReceiveMessage(callback) {
    console.log('👂 LISTENING for message:receive');
    const handler = (data) => {
      console.log('💬 Received message:', data);
      callback(data);
    };
    
    const existingHandler = this.listeners.get('message:receive');
    if (existingHandler) {
      this.socket?.off('message:receive', existingHandler);
    }
    
    this.socket?.on('message:receive', handler);
    this.listeners.set('message:receive', handler);
  }

  markMessageAsRead(messageId) {
    this.socket?.emit("message:read", messageId);
  }

  onMessageRead(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('message:read');
    if (existingHandler) {
      this.socket?.off('message:read', existingHandler);
    }
    
    this.socket?.on("message:read", handler);
    this.listeners.set('message:read', handler);
  }

  emitTyping(userId) {
    this.socket?.emit("typing:start", userId);
  }

  emitStopTyping(userId) {
    this.socket?.emit("typing:stop", userId);
  }

  onTyping(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('user:typing');
    if (existingHandler) {
      this.socket?.off('user:typing', existingHandler);
    }
    
    this.socket?.on("user:typing", handler);
    this.listeners.set('user:typing', handler);
  }

  onStopTyping(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('user:stop-typing');
    if (existingHandler) {
      this.socket?.off('user:stop-typing', existingHandler);
    }
    
    this.socket?.on("user:stop-typing", handler);
    this.listeners.set('user:stop-typing', handler);
  }

  // ============ USER STATUS ============

  onUserOnline(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('user:online');
    if (existingHandler) {
      this.socket?.off('user:online', existingHandler);
    }
    
    this.socket?.on("user:online", handler);
    this.listeners.set('user:online', handler);
  }

  onUserOffline(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('user:offline');
    if (existingHandler) {
      this.socket?.off('user:offline', existingHandler);
    }
    
    this.socket?.on("user:offline", handler);
    this.listeners.set('user:offline', handler);
  }

  onUserStatus(callback) {
    this.onUserOnline((userId) => {
      callback({ userId, status: "online" });
    });
    this.onUserOffline((userId) => {
      callback({ userId, status: "offline" });
    });
  }

  // ============ NOTIFICATIONS ============

  onNotification(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('notification:new');
    if (existingHandler) {
      this.socket?.off('notification:new', existingHandler);
    }
    
    this.socket?.on("notification:new", handler);
    this.listeners.set('notification:new', handler);
  }

  sendNotification(data) {
    this.socket?.emit("notification:send", data);
  }

  // ============ POST EVENTS ============

  onPostCreated(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('post:created');
    if (existingHandler) {
      this.socket?.off('post:created', existingHandler);
    }
    
    this.socket?.on("post:created", handler);
    this.listeners.set('post:created', handler);
  }

  onPostDeleted(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('post:deleted');
    if (existingHandler) {
      this.socket?.off('post:deleted', existingHandler);
    }
    
    this.socket?.on("post:deleted", handler);
    this.listeners.set('post:deleted', handler);
  }

  onPostLiked(callback) {
    const handler = callback;
    
    const existingHandler = this.listeners.get('post:liked');
    if (existingHandler) {
      this.socket?.off('post:liked', existingHandler);
    }
    
    this.socket?.on("post:liked", handler);
    this.listeners.set('post:liked', handler);
  }

  // ============ UTILITY METHODS ============

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;