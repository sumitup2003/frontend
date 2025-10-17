// frontend/src/components/stories/StoryViewer.jsx

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Play, Pause } from 'lucide-react';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';
import { formatTimestamp } from '../../utils/formatters';

const StoryViewer = ({ userStories, onClose, onViewersClick }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { viewStory, deleteStory } = useStoryStore();
  const { user } = useAuthStore();

  const currentStory = userStories.stories[currentStoryIndex];
  const isOwnStory = userStories.user._id === user._id;

  useEffect(() => {
    // Mark as viewed
    if (currentStory && !currentStory.hasViewed && !isOwnStory) {
      viewStory(currentStory._id);
    }

    // Auto progress
    setProgress(0);
    const duration = currentStory.mediaType === 'video' ? 15000 : 5000;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          const next = prev + (100 / (duration / 100));
          if (next >= 100) {
            handleNext();
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < userStories.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this story?')) {
      await deleteStory(currentStory._id);
      if (userStories.stories.length === 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  const handleViewersClick = (e) => {
    e.stopPropagation(); // Prevent story navigation
    setIsPaused(true); // Pause story when viewing viewers
    if (onViewersClick) {
      onViewersClick(currentStory);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStoryIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {userStories.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width:
                  index === currentStoryIndex
                    ? `${progress}%`
                    : index < currentStoryIndex
                    ? "100%"
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 bg-gradient-to-r from-black/50 to-transparent pr-8 py-2 rounded-full backdrop-blur-sm">
          <Avatar
            src={userStories.user.avatar}
            alt={userStories.user.name}
            size="md"
            className="ring-2 ring-white/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm">
                {userStories.user.name}
              </p>
              {userStories.user.verified && <VerifiedBadge size={14} />}
            </div>
            <p className="text-xs text-gray-300">
              {formatTimestamp(currentStory.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewers Button - Only show for own stories */}
          {isOwnStory && (
            <button
              onClick={handleViewersClick}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full transition-all transform hover:scale-105 active:scale-95 border border-white/20"
            >
              <Eye size={16} />
              <span className="text-sm font-semibold">
                {currentStory.views?.length || 0}
              </span>
            </button>
          )}

          {/* Pause/Play Button */}
          <button
            onClick={togglePause}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20"
            title={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? (
              <Play size={20} className="text-white fill-white" />
            ) : (
              <Pause size={20} className="text-white" />
            )}
          </button>

          {/* Delete Button - Only show for own stories */}
          {isOwnStory && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm transition-all border border-red-500/30"
              title="Delete story"
            >
              <Trash2 size={20} className="text-red-400" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20"
            title="Close (Esc)"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-lg h-full flex items-center justify-center">
        {currentStory.mediaType === "video" ? (
          <video
            src={currentStory.media}
            autoPlay
            muted
            loop={false}
            playsInline
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            onEnded={handleNext}
            style={{ maxHeight: '90vh' }}
          />
        ) : (
          <img
            src={currentStory.media}
            alt="Story"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: '90vh' }}
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-white text-center text-sm leading-relaxed">
                {currentStory.caption}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStoryIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all border border-white/20 transform hover:scale-110"
            title="Previous (←)"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        {currentStoryIndex < userStories.stories.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all border border-white/20 transform hover:scale-110"
            title="Next (→)"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        {/* Click areas for navigation */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={handlePrev}
          title="Previous"
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={handleNext}
          title="Next"
        />
      </div>

      {/* Story Info Footer - Only show for own stories */}
      {isOwnStory && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <div className="flex items-center gap-2 text-white">
              <Eye size={16} className="text-blue-400" />
              <span className="text-sm font-medium">
                {currentStory.views?.length || 0} {currentStory.views?.length === 1 ? 'view' : 'views'}
              </span>
            </div>
          </div>

          {/* Story counter */}
          <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
            <span className="text-white text-xs font-medium">
              {currentStoryIndex + 1} / {userStories.stories.length}
            </span>
          </div>
        </div>
      )}

      {/* Paused Indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-6 border-2 border-white/30 animate-pulse">
            <Pause size={48} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;