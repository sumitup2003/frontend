import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';
import StoryViewersModal from '../stories/StoryViewersModal';
import HeadlinesSection from './HeadlinesSection';

const StoriesSection = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [selectedStoryForViewers, setSelectedStoryForViewers] = useState(null);
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

  // Handle clicking viewers badge on story thumbnail
  const handleStoriesViewersClick = (e, userStories) => {
    e.stopPropagation(); // Prevent story viewer from opening
    setSelectedStoryForViewers(userStories);
    setShowViewersModal(true);
  };

  // Handle clicking viewers button inside StoryViewer
  const handleStoryViewersClick = (story) => {
    if (selectedUserStories) {
      setSelectedStoryForViewers({ 
        stories: [story], 
        user: selectedUserStories.user 
      });
      setShowViewersModal(true);
    }
  };

  // Get own stories
  const ownStories = stories.find(s => s.user._id === user._id);

  // Calculate total viewers for own stories
  const getTotalViewers = (userStories) => {
    if (!userStories || !userStories.stories) return 0;
    const uniqueViewers = new Set();
    userStories.stories.forEach(story => {
      story.views?.forEach(view => uniqueViewers.add(view.user?._id || view.user));
    });
    return uniqueViewers.size;
  };

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
          {/* Add Story Button / Own Stories */}
          {ownStories && ownStories.stories.length > 0 ? (
            // If user has stories, show them with viewers count
            <div
              className="flex-shrink-0 flex flex-col items-center gap-2 group relative"
            >
              <div 
                className="relative cursor-pointer"
                onClick={() => handleStoryClick(ownStories)}
              >
                <div className={`p-1 rounded-full ${
                  ownStories.hasUnviewed
                    ? 'bg-gradient-to-tr from-yellow-400 via-blue-500 to-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className="p-0.5 bg-white dark:bg-gray-800 rounded-full">
                    <Avatar src={user.avatar} alt={user.name} size="xl" />
                  </div>
                </div>
                
                {/* Viewers Count Badge */}
                {getTotalViewers(ownStories) > 0 && (
                  <button 
                    onClick={(e) => handleStoriesViewersClick(e, ownStories)}
                    className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition shadow-lg border-2 border-white dark:border-gray-800 z-10"
                  >
                    <Eye size={12} />
                    {getTotalViewers(ownStories)}
                  </button>
                )}
                
                {/* Add More Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  className="absolute top-0 right-0 bg-gray-900 rounded-full p-1 border-2 border-white dark:border-gray-800 group-hover:bg-blue-600 transition z-10"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                Your Story
              </span>
            </div>
          ) : (
            // If no stories, show add button
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
          )}

          {/* Other Users' Stories */}
          {loading ? (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              Loading stories...
            </div>
          ) : (
            stories
              .filter(userStory => userStory.user._id !== user._id) // Don't show own stories again
              .map((userStory) => (
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
                    {userStory.user.name}
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
          onViewersClick={handleStoryViewersClick}
        />
      )}

      {showViewersModal && selectedStoryForViewers && (
        <StoryViewersModal
          stories={selectedStoryForViewers.stories}
          onClose={() => {
            setShowViewersModal(false);
            setSelectedStoryForViewers(null);
          }}
        />
      )}
      <HeadlinesSection />
    </div>
    
  );
};

export default StoriesSection;