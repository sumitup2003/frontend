//frontend/src/components/chat/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { Search, Phone } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';
import { useDebounce } from '../../hooks/useDebounce';
import Avatar from '../common/Avatar';
import { formatMessageTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import CallModal from './CallModal';
import VerifiedBadge from '../common/VerifiedBadge';

const Sidebar = ({ onChatSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // const [showCallModal, setShowCallModal] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { 
    conversations, 
    selectedChat, 
    setSelectedChat, 
    fetchConversations,
    loading 
  } = useChatStore();
  
  const { users, searchUsers, clearUsers } = useUserStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchUsers(debouncedSearch);
    } else {
      clearUsers();
    }
  }, [debouncedSearch]);

  const handleChatClick = (user) => {
    setSelectedChat(user);
    if (onChatSelect) {
      onChatSelect(); // Notify parent to switch views (mobile)
    }
  };

  const displayList = searchQuery ? users : conversations;

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-800 md:border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            DayTalk
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">
              {searchQuery ? "No users found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          displayList.map((item) => (
            <button
              key={item._id}
              onClick={() => handleChatClick(item)}
              className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedChat?._id === item._id
                  ? "bg-blue-50 dark:bg-gray-700"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={item.avatar}
                  alt={item.name}
                  size="lg"
                  online={item.isActive}
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {item.name}
                      {item.verified && <VerifiedBadge size={16} />}
                    </p>
                    
                    {item.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(item.lastMessage.time)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {item.lastMessage?.text ||
                        (item.mutualFollow
                          ? "Start chatting"
                          : "Follow to chat")}
                    </p>
                    {item.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 24hr Message Note */}
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
          ⏰ Messages auto-delete after 24 hours
        </p>
      </div>

      {/* {showCallModal && selectedChat && (
        <CallModal
          user={selectedChat}
          onClose={() => setShowCallModal(false)}
          callType="audio"
        />
      )} */}
    </div>
  );
};

export default Sidebar;