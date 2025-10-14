import React from 'react';
import { X } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import VerifiedBadge from '../common/VerifiedBadge';

const UserSearchResults = ({ users, onClose }) => {
  const { followUser, unfollowUser, getUser } = useUserStore();

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    }
  };

  const handleUserClick = async (user) => {
    await getUser(user._id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Search Results</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <button
              onClick={() => handleUserClick(user)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <Avatar src={user.avatar} alt={user.name} size="md" online={user.isActive} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                 {user.verified && <VerifiedBadge size={16} />}
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                {user.mutualFollow && (
                  <p className="text-xs text-blue-500">Mutual Follow</p>
                )}
              </div>
            </button>

            <Button
              variant={user.isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(user._id, user.isFollowing);
              }}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearchResults;