
//frontend/src/components/chat/chatArea.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, MessageCircle, Paperclip, X } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import socketService from '../../utils/socket';
import Avatar from '../common/Avatar';
import CallModal from './CallModal';
import CallHistory from './CallHistory';
import { formatTime } from '../../utils/formatters';
import VerifiedBadge from '../common/VerifiedBadge';
import SharedPostPreview from './SharedPostPreview';

const ChatArea = () => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callType, setCallType] = useState('audio');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const { user } = useAuthStore();
  const { 
    selectedChat, 
    messages, 
    fetchMessages, 
    sendMessage,
    addMessage,
    typingUsers
  } = useChatStore();
  
  const { missedCallsCount, fetchMissedCallsCount, markCallsAsSeen } = useCallStore();

  useEffect(() => {
    fetchMissedCallsCount();
    const interval = setInterval(fetchMissedCallsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages[selectedChat?._id]]);

  useEffect(() => {
    socketService.onReceiveMessage((message) => {
      if (message.senderId === selectedChat?._id) {
        addMessage(selectedChat._id, message);
      }
    });
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      socketService.emitTyping(selectedChat._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emitStopTyping(selectedChat._id);
    }, 1000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 40 * 1024 * 1024) {
        alert('File size must be less than 40MB');
        return;
      }

      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !mediaFile) return;
    if (!selectedChat) return;

    const text = messageInput.trim();
    
    if (mediaFile) {
      try {
        const formData = new FormData();
        formData.append('media', mediaFile);
        
        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/messages/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadResponse.json();
        const mediaUrl = uploadData.data?.url;

        await sendMessage(selectedChat._id, text + (mediaUrl ? `\n📎 ${mediaUrl}` : ''));
        
        socketService.sendMessage({
          senderId: user._id,
          receiverId: selectedChat._id,
          text: text + (mediaUrl ? `\n📎 ${mediaUrl}` : '')
        });
      } catch (error) {
        console.error('Media upload error:', error);
        alert('Failed to upload media');
      }
    } else {
      await sendMessage(selectedChat._id, text);
      socketService.sendMessage({
        senderId: user._id,
        receiverId: selectedChat._id,
        text
      });
    }

    setMessageInput('');
    handleRemoveMedia();
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  

  const handleAudioCall = () => {
    setCallType('audio');
    setShowCallModal(true);
  };

  const handleVideoCall = () => {
    setCallType('video');
    setShowCallModal(true);
  };

  const handleCallHistoryClick = () => {
    setShowCallHistory(true);
    if (missedCallsCount > 0) {
      markCallsAsSeen();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl">Select a chat to start messaging</p>
          <p className="text-sm mt-2">Messages disappear after 24 hours</p>
        </div>
      </div>
    );
  }

  const chatMessages = messages[selectedChat._id] || [];
  const isUserTyping = typingUsers.has(selectedChat._id);

  const parseMessage = (messageText) => {
  try {
    const parsed = JSON.parse(messageText);
    if (parsed.type === 'shared_post') {
      return {
        isSharedPost: true,
        sharer: parsed.sharer,
        post: parsed.post
      };
    }
  } catch (e) {
    // Not JSON, regular text message
  }
  return {
    isSharedPost: false,
    text: messageText
  };
};

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Avatar
              src={selectedChat.avatar}
              alt={selectedChat.name}
              size="lg"
              online={selectedChat.isActive}
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedChat.name}
                {selectedChat.verified && <VerifiedBadge size={16} />}
              </p>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedChat.isActive ? "Active now" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudioCall}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Phone size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleVideoCall}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Video size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="relative">
              <button
                onClick={handleCallHistoryClick}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical
                  size={20}
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
              {missedCallsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {missedCallsCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isOwnMessage =
                message.sender?._id === user._id || message.sender === user._id;
              const parsedMessage = parseMessage(message.text);

              // Handle media URLs for regular messages
              const mediaUrlMatch =
                !parsedMessage.isSharedPost &&
                message.text?.match(/📎\s*(https?:\/\/[^\s]+)/);
              const mediaUrl = mediaUrlMatch ? mediaUrlMatch[1] : null;
              const textWithoutMedia = mediaUrl
                ? message.text.replace(/📎\s*https?:\/\/[^\s]+/, "").trim()
                : message.text;

              const isImage =
                mediaUrl &&
                (mediaUrl.includes(".jpg") ||
                  mediaUrl.includes(".jpeg") ||
                  mediaUrl.includes(".png") ||
                  mediaUrl.includes(".gif") ||
                  mediaUrl.includes("image"));
              const isVideo =
                mediaUrl &&
                (mediaUrl.includes(".mp4") ||
                  mediaUrl.includes(".mov") ||
                  mediaUrl.includes(".avi") ||
                  mediaUrl.includes("video"));

              return (
                <div
                  key={message._id || index}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Shared Post Message */}
                  {parsedMessage.isSharedPost ? (
                    <div className="space-y-2 max-w-sm">
                      {/* Sharer info */}
                      <div
                        className={`text-xs ${
                          isOwnMessage ? "text-right" : "text-left"
                        } px-2`}
                      >
                        <span className="text-gray-500 dark:text-gray-400">
                          {isOwnMessage ? "You" : parsedMessage.sharer.name}{" "}
                          shared a post
                        </span>
                      </div>

                      {/* Post Preview */}
                      <SharedPostPreview postData={parsedMessage.post} />

                      {/* Timestamp */}
                      <div
                        className={`px-2 ${
                          isOwnMessage ? "text-right" : "text-left"
                        }`}
                      >
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Regular Message */
                    <div
                      className={`max-w-xs md:max-w-md rounded-2xl overflow-hidden ${
                        isOwnMessage
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {/* Media */}
                      {mediaUrl && (
                        <div className="w-full">
                          {isImage && (
                            <img
                              src={mediaUrl}
                              alt="Shared media"
                              className="w-full h-auto max-h-64 object-cover cursor-pointer"
                              onClick={() => window.open(mediaUrl, "_blank")}
                            />
                          )}
                          {isVideo && (
                            <video
                              src={mediaUrl}
                              controls
                              className="w-full h-auto max-h-64"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}

                      {/* Text */}
                      {textWithoutMedia && (
                        <div className="px-4 py-2">
                          <p className="break-words whitespace-pre-wrap">
                            {textWithoutMedia}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div
                        className={`px-4 pb-2 ${
                          textWithoutMedia || !mediaUrl ? "" : "pt-2"
                        }`}
                      >
                        <span
                          className={`text-xs block ${
                            isOwnMessage
                              ? "text-blue-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isUserTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          {mediaPreview && (
            <div className="mb-3 relative inline-block">
              {mediaFile?.type.startsWith("video/") ? (
                <video
                  src={mediaPreview}
                  className="max-h-32 rounded-lg"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg"
                />
              )}
              <button
                onClick={handleRemoveMedia}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Paperclip
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() && !mediaFile}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {showCallModal && (
        <CallModal
          user={selectedChat}
          onClose={() => setShowCallModal(false)}
          callType={callType}
        />
      )}

      {showCallHistory && (
        <CallHistory onClose={() => setShowCallHistory(false)} />
      )}
    </div>
  );
};

export default ChatArea;