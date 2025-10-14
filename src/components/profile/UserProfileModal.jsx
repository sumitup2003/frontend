import React, { useEffect, useState } from 'react'; // ✅ Added useState
import { useNavigate } from 'react-router-dom'; // ✅ Added useNavigate
import { X, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { usePostStore } from '../../store/postStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import VerifiedBadge from '../common/VerifiedBadge';

const UserProfileModal = ({ user, onClose }) => {
  const { fetchUserPosts, userPosts } = usePostStore();
  const { setSelectedChat } = useChatStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();
  const { followUser, unfollowUser } = useUserStore();

  useEffect(() => {
    // Check if current user is following this user
    if (currentUser && user) {
      const following = currentUser.following?.some(
        f => {
          const followId = typeof f === 'string' ? f : f._id;
          return followId === user._id;
        }
      );
      setIsFollowing(following);
      console.log('Is following:', following, 'User ID:', user._id);
    }
  }, [currentUser, user]);
  
  useEffect(() => {
    fetchUserPosts(user._id);
  }, [user._id, fetchUserPosts]);

  const handleMessage = () => {
    if (user.mutualFollow) {
      setSelectedChat(user);
      onClose();
    }
  };

  const handleFollowToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        console.log('Attempting to unfollow:', user._id);
        await unfollowUser(user._id);
        
        // Update current user's following list
        const updatedFollowing = currentUser.following.filter(
          f => {
            const followId = typeof f === 'string' ? f : f._id;
            return followId !== user._id;
          }
        );
        updateUser({ 
          ...currentUser, 
          following: updatedFollowing 
        });
        
        setIsFollowing(false);
        console.log('✅ Unfollowed successfully');
      } else {
        console.log('Attempting to follow:', user._id);
        await followUser(user._id);
        
        // Add to current user's following list
        updateUser({ 
          ...currentUser, 
          following: [...(currentUser.following || []), user._id] 
        });
        
        setIsFollowing(true);
        console.log('✅ Followed successfully');
      }
    } catch (error) {
      console.error('Follow/Unfollow error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update follow status';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/profile/${user.username}`);
  };

  const handleSendMessage = () => {
    onClose();
    navigate('/messages', { state: { selectedUser: user } });
  };

  if (!user) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="md">
      <div className="space-y-6">
        {/* Header with close button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center -mt-4">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="2xl"
            online={user.isActive}
            className="mx-auto mb-4 ring-4 ring-white dark:ring-gray-800 shadow-xl"
          />
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            {user.verified && <VerifiedBadge size={24} />}
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            @{user.username}
          </p>
          
          {user.isActive && (
            <p className="text-sm text-green-500 mb-4">
              🟢 Active now
            </p>
          )}
          
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md mx-auto px-4">
              {user.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.postsCount || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.followers?.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.following?.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
          </div>
        </div>

        {/* Actions */}
        {user._id !== currentUser._id ? (
          <div className="space-y-3">
            {/* Primary Actions */}
            <div className="flex gap-3">
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                fullWidth
                onClick={handleFollowToggle}
                loading={loading}
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Loading...</span>
                ) : isFollowing ? (
                  <>
                    <UserMinus size={18} />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Follow
                  </>
                )}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleSendMessage}
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Message
              </Button>
            </div>

            {/* View Profile Button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleViewProfile}
            >
              View Full Profile
            </Button>
          </div>
        ) : (
          /* Own Profile */
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleViewProfile}
            >
              View Your Profile
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
            >
              Edit Profile
            </Button>
          </div>
        )}

        {/* Additional Info */}
        {user.mutualFollowers && user.mutualFollowers.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Followed by {user.mutualFollowers[0].name}
              {user.mutualFollowers.length > 1 && ` and ${user.mutualFollowers.length - 1} others you follow`}
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center gap-2">
          {isFollowing && (
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
              Following
            </span>
          )}
          {user.followsYou && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
              Follows you
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;