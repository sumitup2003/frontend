import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import { formatTimestamp } from '../../utils/formatters';

const StoryViewer = ({ userStories, onClose }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
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
      setProgress(prev => {
        const next = prev + (100 / (duration / 100));
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex]);

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

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {userStories.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Avatar src={userStories.user.avatar} alt={userStories.user.name} size="md" />
          <div>
            <p className="font-semibold text-white">{userStories.user.name}</p>
            <p className="text-sm text-gray-300">{formatTimestamp(currentStory.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnStory && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Trash2 size={20} className="text-white" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-lg h-full flex items-center justify-center">
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.media}
            autoPlay
            className="max-h-full max-w-full"
            onEnded={handleNext}
          />
        ) : (
          <img
            src={currentStory.media}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 p-4">
            <p className="text-white text-center bg-black/50 backdrop-blur-sm rounded-lg p-3">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Navigation */}
        {currentStoryIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}

        {currentStoryIndex < userStories.stories.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>

      {/* Story Info */}
      {isOwnStory && (
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-sm">{currentStory.viewersCount} views</p>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;