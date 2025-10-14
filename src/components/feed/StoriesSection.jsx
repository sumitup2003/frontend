import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';

const StoriesSection = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollRef = useRef(null);

  const { stories, fetchStories, loading } = useStoryStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [stories]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleStoryClick = (userStories) => {
    setSelectedUserStories(userStories);
  };

  // Get own stories
  const ownStories = stories.find(s => s.user._id === user._id);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-2xl mx-auto relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <ChevronLeft size={20} className="text-gray-900 dark:text-white" />
          </button>
        )}

        {/* Stories */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add Story Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              <Avatar src={user.avatar} alt={user.name} size="xl" />
              <div className="absolute bottom-0 right-0 bg-gray-900 rounded-full p-1 border-2 border-white dark:border-gray-800 group-hover:bg-blue-600 transition">
                <Plus size={16} className="text-white" />
              </div>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              Your Story
            </span>
          </button>

          {/* User Stories */}
          {loading ? (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              Loading stories...
            </div>
          ) : (
            stories.map((userStory) => (
              <button
                key={userStory.user._id}
                onClick={() => handleStoryClick(userStory)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className={`p-1 rounded-full ${
                  userStory.hasUnviewed
                    ? 'bg-gradient-to-tr from-yellow-400 via-blue-500 to-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className="p-0.5 bg-white dark:bg-gray-800 rounded-full">
                    <Avatar src={userStory.user.avatar} alt={userStory.user.name} size="xl" />
                  </div>
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium max-w-[70px] truncate">
                  {userStory.user._id === user._id ? 'You' : userStory.user.name}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <ChevronRight size={20} className="text-gray-900 dark:text-white" />
          </button>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateStoryModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedUserStories && (
        <StoryViewer
          userStories={selectedUserStories}
          onClose={() => setSelectedUserStories(null)}
        />
      )}
    </div>
  );
};

export default StoriesSection;