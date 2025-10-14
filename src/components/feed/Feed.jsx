//Feed.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { usePostStore } from '../../store/postStore';
import { useUserStore } from '../../store/userStore';
import { useDebounce } from '../../hooks/useDebounce';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import UserSearchResults from './UserSearchResults';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import StoriesSection from './StoriesSection';

const Feed = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const observerTarget = useRef(null);

  const { posts, fetchFeed, loading } = usePostStore();
  const { users, searchUsers, clearUsers } = useUserStore();

  useEffect(() => {
    fetchFeed(1);
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchUsers(debouncedSearch);
    } else {
      clearUsers();
    }
  }, [debouncedSearch]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, page]);

  const loadMorePosts = async () => {
    const nextPage = page + 1;
    const newPosts = await fetchFeed(nextPage);
    if (newPosts && newPosts.length > 0) {
      setPage(nextPage);
    } else {
      setHasMore(false);
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
      {/* Header - Sticky */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          
        {/* Stories Section */}
      <StoriesSection />
      

          {/* Create Post Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowCreatePost(true)}
            className="flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Create Post
          </Button>
        </div>
        
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
        {/* Search Results */}
        {searchQuery && users.length > 0 && (
          <UserSearchResults users={users} onClose={() => setSearchQuery('')} />
        )}

        {/* Feed Posts */}
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No posts yet. Follow users to see their posts!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
            
            {/* Loading indicator for infinite scroll */}
            <div ref={observerTarget} className="flex justify-center py-4">
              {loading && <LoadingSpinner />}
              {!hasMore && posts.length > 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  You're all caught up! 🎉
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
};

export default Feed;