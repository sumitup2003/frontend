import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, MoreVertical, Trash2, Share2, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import Avatar from '../common/Avatar';
import ShareModal from './ShareModal';
import { formatTimestamp } from '../../utils/formatters';
import VerifiedBadge from '../common/VerifiedBadge';

const PostCard = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { user } = useAuthStore();
  const { likePost, savePost, addComment, deletePost, markAsNotInterested } = usePostStore();
  const { getUser } = useUserStore();

  const isOwnPost = post.user._id === user._id;
  const isVideo = post.image && (post.image.includes('.mp4') || post.image.includes('video') || post.image.includes('.mov'));

  const handleLike = () => {
    likePost(post._id);
  };

  const handleSave = () => {
    savePost(post._id);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    await addComment(post._id, commentText);
    setCommentText('');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post._id);
    }
  };

  const handleNotInterested = async () => {
    if (window.confirm('Mark this post as not interested? You\'ll see fewer posts like this.')) {
      // You can implement this to filter posts
      setShowMenu(false);
    }
  };

  const handleUserClick = async () => {
    await getUser(post.user._id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleUserClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={post.user.avatar}
              alt={post.user.name}
              size="md"
            />
            <div className="text-left">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {post.user.name}
                </p>
                {post.user.verified && (
                  <CheckCircle size={16} className="text-gray-100 fill-green-700" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(post.createdAt)}
              </p>
            </div>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                {isOwnPost ? (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleNotInterested}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <EyeOff size={16} />
                      Not Interested
                    </button>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <AlertCircle size={16} />
                      Report Post
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Post Media */}
        {post.image && (
          <div className="mb-3 rounded-lg overflow-hidden bg-black">
            {isVideo ? (
              <video
                controls
                className="w-full max-h-96 object-contain"
                preload="metadata"
              >
                <source src={post.image} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={post.image}
                alt="Post"
                className="w-full max-h-96 object-contain"
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:text-red-500 transition-colors group"
          >
            <Heart
              size={20}
              className={post.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {post.likesCount || 0}
            </span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 hover:text-blue-500 transition-colors group"
          >
            <MessageCircle size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {post.commentsCount || 0}
            </span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
          >
            <Share2 size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-green-500" />
          </button>

          <button
            onClick={handleSave}
            className="hover:text-blue-500 transition-colors"
          >
            <Bookmark
              size={20}
              className={post.isSaved ? 'fill-blue-500 text-blue-500' : 'text-gray-600 dark:text-gray-400'}
            />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
              {post.comments?.map((comment) => (
                <div key={comment._id} className="flex gap-2">
                  <Avatar src={comment.user.avatar} alt={comment.user.name} size="sm" />
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {comment.user.name}
                      {post.user.verified && (
                        <CheckCircle size={16} className="text-gray-100 fill-green-700" />)}
                    </p>
                   
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.text}
                    
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          post={post}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default PostCard;