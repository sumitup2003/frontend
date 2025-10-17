// frontend/src/components/stories/StoryViewersModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Eye, Clock } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';
import { formatDistanceToNow } from 'date-fns';

const StoryViewersModal = ({ stories, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [allViewers, setAllViewers] = useState([]);

  useEffect(() => {
    // Compile all unique viewers across all stories
    const viewersMap = new Map();
    
    stories.forEach(story => {
      story.views?.forEach(view => {
        const userId = view.user?._id || view.user;
        if (!viewersMap.has(userId)) {
          viewersMap.set(userId, {
            user: view.user,
            viewedAt: view.viewedAt,
            storyCount: 1
          });
        } else {
          const existing = viewersMap.get(userId);
          existing.storyCount += 1;
          // Keep the most recent view time
          if (new Date(view.viewedAt) > new Date(existing.viewedAt)) {
            existing.viewedAt = view.viewedAt;
          }
        }
      });
    });

    // Convert to array and sort by most recent view
    const viewers = Array.from(viewersMap.values())
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    
    setAllViewers(viewers);
  }, [stories]);

  const currentStory = stories[activeTab];
  const currentViewers = currentStory?.views || [];

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye size={24} className="text-blue-600" />
            Story Viewers
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs for multiple stories */}
        {stories.length > 1 && (
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All ({allViewers.length})
              </button>
              {stories.map((story, index) => (
                <button
                  key={story._id}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === index
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Story {index + 1} ({story.views?.length || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Total Views Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'all' ? allViewers.length : currentViewers.length}
              </p>
            </div>
            <Eye size={32} className="text-blue-600" />
          </div>
        </div>

        {/* Viewers List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeTab === 'all' ? (
            // Show all viewers
            allViewers.length > 0 ? (
              allViewers.map((viewerData, index) => (
                <ViewerItem
                  key={viewerData.user._id || index}
                  viewer={viewerData.user}
                  viewedAt={viewerData.viewedAt}
                  storyCount={viewerData.storyCount}
                  totalStories={stories.length}
                />
              ))
            ) : (
              <EmptyState message="No views yet" />
            )
          ) : (
            // Show viewers for specific story
            currentViewers.length > 0 ? (
              currentViewers.map((view, index) => (
                <ViewerItem
                  key={view.user?._id || index}
                  viewer={view.user}
                  viewedAt={view.viewedAt}
                />
              ))
            ) : (
              <EmptyState message="No views yet" />
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

// Viewer Item Component
const ViewerItem = ({ viewer, viewedAt, storyCount, totalStories }) => {
  if (!viewer) return null;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
      <div className="flex items-center gap-3 flex-1">
        <Avatar 
          src={viewer.avatar} 
          alt={viewer.name} 
          size="md"
          className="ring-2 ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {viewer.name}
            </p>
            {viewer.verified && <VerifiedBadge size={16} />}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock size={12} />
            {formatDistanceToNow(new Date(viewedAt), { addSuffix: true })}
          </div>
        </div>
      </div>
      
      {/* Story count badge for "All" tab */}
      {storyCount && totalStories > 1 && (
        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
          <Eye size={12} />
          {storyCount}/{totalStories}
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message }) => (
  <div className="text-center py-12">
    <Eye size={48} className="mx-auto text-gray-400 mb-3" />
    <p className="text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

export default StoryViewersModal;