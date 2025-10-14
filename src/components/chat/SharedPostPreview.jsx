// frontend/components/chat/SharedPostPreview.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ExternalLink } from 'lucide-react';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';

const SharedPostPreview = ({ postData }) => {
  const navigate = useNavigate();

  if (!postData) return null;

  const handleClick = () => {
    navigate(`/post/${postData._id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="max-w-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md"
    >
      {/* Shared Post Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <ExternalLink size={14} className="text-gray-500" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Shared Post
        </span>
      </div>

      {/* Post Author */}
      <div className="flex items-center gap-2 p-3">
        <Avatar 
          src={postData.user?.avatar} 
          alt={postData.user?.name} 
          size="sm" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {postData.user?.name}
            </span>
            {postData.user?.verified && <VerifiedBadge size={12} />}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            @{postData.user?.username}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-2">
        <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
          {postData.content}
        </p>
      </div>

      {/* Post Image/Video */}
      {postData.image && (
        <div className="relative">
          {postData.image.includes('.mp4') || postData.image.includes('video') ? (
            <div className="relative bg-black">
              <video 
                src={postData.image} 
                className="w-full h-48 object-cover"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-800 border-b-8 border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <img 
              src={postData.image} 
              alt="Post" 
              className="w-full h-48 object-cover"
            />
          )}
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center gap-4 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Heart size={14} />
          <span>{postData.likesCount || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={14} />
          <span>{postData.commentsCount || 0}</span>
        </div>
        <span className="ml-auto text-blue-500 hover:text-blue-600 font-medium">
          View Post →
        </span>
      </div>
    </div>
  );
};

export default SharedPostPreview;