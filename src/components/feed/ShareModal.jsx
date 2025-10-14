// frontend/components/feed/ShareModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Search, Send } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../utils/socket';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import VerifiedBadge from '../common/VerifiedBadge';

const ShareModal = ({ post, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sending, setSending] = useState(false);

  const { conversations, fetchConversations, sendMessage } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (conversation) => {
    const userId = conversation._id;
    if (selectedUsers.find(u => u.id === userId)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, { 
        id: userId, 
        name: conversation.name,
        username: conversation.username 
      }]);
    }
  };

  const isSelected = (userId) => {
    return selectedUsers.some(u => u.id === userId);
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    setSending(true);
    try {
      // Create message with embedded post data
      const sharedPostData = {
        type: 'shared_post',
        sharer: {
          name: user.name,
          username: user.username
        },
        post: {
          _id: post._id,
          content: post.content,
          image: post.image,
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          user: {
            name: post.user.name,
            username: post.user.username,
            avatar: post.user.avatar,
            verified: post.user.verified
          }
        }
      };

      // Convert to JSON string for storage
      const messageText = JSON.stringify(sharedPostData);

      // Send to each selected user
      const promises = selectedUsers.map(async (selectedUser) => {
        try {
          // Save message to database via API
          await sendMessage(selectedUser.id, messageText);
          
          // Also send via socket for real-time delivery
          socketService.sendMessage({
            senderId: user._id,
            receiverId: selectedUser.id,
            text: messageText
          });

          return { success: true, user: selectedUser };
        } catch (error) {
          console.error(`Failed to share with ${selectedUser.name}:`, error);
          return { success: false, user: selectedUser };
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        alert(`Post shared with ${successCount} user(s)!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      } else {
        alert('Failed to share post. Please try again.');
      }

      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share post. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Share Post" size="md">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Post Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={post.user.avatar} alt={post.user.name} size="sm" />
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {post.user.name}
              </span>
              {post.user.verified && <VerifiedBadge size={14} />}
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {post.content}
          </p>
          {post.image && (
            <div className="mt-2 rounded overflow-hidden">
              <img 
                src={post.image} 
                alt="Post preview" 
                className="w-full h-32 object-cover"
              />
            </div>
          )}
        </div>

        {/* User List */}
        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a chat to share posts
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => toggleUser(conv)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isSelected(conv._id)
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <Avatar 
                  src={conv.avatar} 
                  alt={conv.name} 
                  size="md" 
                  online={conv.isActive}
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {conv.name}
                    </p>
                    {conv.verified && <VerifiedBadge size={14} />}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{conv.username}
                  </p>
                </div>
                {isSelected(conv._id) && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Selected Users Count */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Selected: {selectedUsers.length}
            </span>
            {selectedUsers.map((u) => (
              <span 
                key={u.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 rounded-full text-xs"
              >
                {u.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUsers(selectedUsers.filter(user => user.id !== u.id));
                  }}
                  className="hover:text-blue-700 dark:hover:text-blue-200"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleShare}
            loading={sending}
            disabled={selectedUsers.length === 0 || sending}
            className="flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {sending ? 'Sharing...' : `Share (${selectedUsers.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;