// frontend/src/components/profile/FollowersModal.jsx

import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';
import Button from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

const FollowersModal = ({ userId, type = 'followers', onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();
  const { setSelectedUser } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${userId}/${type}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch ${type}`);
      }

      if (data.success) {
        setUsers(data.data);
        
        // Initialize following states - check if current user is following each user
        const states = {};
        data.data.forEach(user => {
          // Check if currentUser's following array includes this user's ID
          const isFollowing = currentUser?.following?.some(
            f => (typeof f === 'string' ? f : f._id) === user._id
          ) || false;
          states[user._id] = isFollowing;
        });
        setFollowingStates(states);
        
        console.log('✅ Users loaded:', data.data.length);
        console.log('Following states:', states);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch ${type}:`, error);
      alert(error.message || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Updated follow toggle with correct endpoints
  const handleFollowToggle = async (targetUserId) => {
    if (actionLoading[targetUserId]) return; // Prevent multiple clicks
    
    const isFollowing = followingStates[targetUserId];
    
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      console.log(`${isFollowing ? 'Unfollowing' : 'Following'} user:`, targetUserId);
      
      // ✅ Use correct endpoint format
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${targetUserId}/${endpoint}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${endpoint} user`);
      }

      if (data.success) {
        // Update local following state
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: !isFollowing
        }));

        // Update current user's following array in auth store
        if (isFollowing) {
          // Remove from following
          const updatedFollowing = currentUser.following.filter(
            f => {
              const followId = typeof f === 'string' ? f : f._id;
              return followId !== targetUserId;
            }
          );
          updateUser({ 
            ...currentUser, 
            following: updatedFollowing 
          });
          console.log('✅ Unfollowed successfully');
        } else {
          // Add to following
          updateUser({ 
            ...currentUser, 
            following: [...(currentUser.following || []), targetUserId] 
          });
          console.log('✅ Followed successfully');
        }
      }
    } catch (error) {
      console.error('❌ Follow/unfollow error:', error);
      alert(error.message || 'Failed to update follow status');
      
      // Revert state on error
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: isFollowing
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUserClick = (clickedUser) => {
    // Close modal
    onClose();
    
    // If clicking on own profile, navigate to /profile
    if (clickedUser._id === currentUser._id) {
      navigate('/profile');
    } else {
      // Set selected user and navigate
      setSelectedUser(clickedUser);
      navigate(`/profile/${clickedUser.username}`);
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={type === 'followers' ? 'Followers' : 'Following'}
      size="md"
    >
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No {type} yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrentUser = user._id === currentUser._id;
              const isFollowing = followingStates[user._id];
              const isLoading = actionLoading[user._id];

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {/* User Info - Clickable */}
                  <button
                    onClick={() => handleUserClick(user)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      size="md"
                      online={user.isActive}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.verified && <VerifiedBadge size={14} />}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Follow/Unfollow Button */}
                  {!isCurrentUser && (
                    <Button
                      variant={isFollowing ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleFollowToggle(user._id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 ml-3 flex-shrink-0"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus size={14} />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FollowersModal;