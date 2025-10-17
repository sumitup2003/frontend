// frontend/src/components/profile/ProfileSidebar.jsx
// COMPLETE FILE - Replace entire file with this

import React, { useEffect, useState } from 'react';
import { Grid, Bookmark, Users, Edit2, X, Camera } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { useUserStore } from '../../store/userStore';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import UserProfileModal from './UserProfileModal';
import AvatarUpload from './AvatarUpload';
import VerifiedBadge from '../common/VerifiedBadge';
import FollowersModal from './FollowersModal';

const ProfileSidebar = ({ isFullView = false }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers'); // 'followers' or 'following'

  
  const { user, updateUser } = useAuthStore();
  const { userPosts, savedPosts, fetchUserPosts, fetchSavedPosts } = usePostStore();
  const { selectedUser, setSelectedUser } = useUserStore();

  // Show selected user profile or current user
  const displayUser = selectedUser || user;
  const isOwnProfile = !selectedUser || selectedUser._id === user._id;

  useEffect(() => {
    if (displayUser) {
      fetchUserPosts(displayUser._id);
      if (isOwnProfile) {
        fetchSavedPosts();
      }
    }
  }, [displayUser]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditBio(user.bio || '');
    }
  }, [user]);

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid, count: userPosts.length },
    ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark, count: savedPosts.length }] : [])
  ];

  const displayPosts = activeTab === 'posts' ? userPosts : savedPosts;

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          bio: editBio
        })
      });

      const data = await response.json();
      if (data.success) {
        updateUser(data.data);
        setShowEditProfile(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    updateUser({ ...user, avatar: newAvatarUrl });
  };

  // Full view layout (when showing in main area)
  if (isFullView) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900">
        {/* Profile Header - Full View */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={displayUser?.avatar}
                alt={displayUser?.name}
                size="2xl"
                online={displayUser?.isActive}
                className="w-32 h-32"
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarUpload(true)}
                  className="absolute bottom-0 right-0 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <Camera size={10} />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2 ">
                {displayUser?.name}
                {user.verified && <VerifiedBadge size={12} />}
              </p>
              
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                @{displayUser?.username}
              </p>
              {displayUser?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                  {displayUser.bio}
                </p>
              )}
              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-4">
                <button
                  onClick={() => {
                    // Navigate to posts (optional)
                  }}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userPosts.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posts
                  </p>
                </button>

                <button
                  onClick={() => {
                    setFollowersModalType("followers");
                    setShowFollowersModal(true);
                  }}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {displayUser?.followers?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Followers
                  </p>
                </button>

                <button
                  onClick={() => {
                    setFollowersModalType("following");
                    setShowFollowersModal(true);
                  }}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {displayUser?.following?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Following
                  </p>
                </button>
              </div>
              {/* // For SIDEBAR VIEW - Replace the stats div:
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <button
                  onClick={() => {
                    // Navigate to posts (optional)
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {userPosts.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posts
                  </p>
                </button>

                <button
                  onClick={() => {
                    setFollowersModalType("followers");
                    setShowFollowersModal(true);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {displayUser?.followers?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Followers
                  </p>
                </button>

                <button
                  onClick={() => {
                    setFollowersModalType("following");
                    setShowFollowersModal(true);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {displayUser?.following?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Following
                  </p>
                </button>
              </div> */}
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEditProfile(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-6">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 transition-colors ${
                activeTab === id
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
              <span className="text-sm">({count})</span>
            </button>
          ))}
        </div>

        {/* Posts Grid - Full View */}
        <div className="grid grid-cols-3 gap-4">
          {displayPosts.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl">
              <p>No {activeTab} yet</p>
            </div>
          ) : (
            displayPosts.map((post) => (
              <div
                key={post._id}
                className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
              >
                {post.image ? (
                  post.image.includes(".mp4") ||
                  post.image.includes("video") ? (
                    <video
                      src={post.image}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-6 text-center">
                      {post.content}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modals */}
        {showEditProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editBio.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowEditProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAvatarUpload && (
          <AvatarUpload
            currentAvatar={user.avatar}
            userName={user.name}
            onUploadSuccess={handleAvatarUpdate}
            onClose={() => setShowAvatarUpload(false)}
          />
        )}

        {selectedUser && selectedUser._id !== user._id && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {showFollowersModal && (
        <FollowersModal
          userId={displayUser._id}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
      </div>
    );
  }

  // Sidebar layout (original)
  return (
    <>
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto h-screen hidden lg:block">
        <div className="p-6">
          {/* Profile Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Avatar
                src={displayUser?.avatar}
                alt={displayUser?.name}
                size="2xl"
                className="mx-auto mb-4"
                online={displayUser?.isActive}
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarUpload(true)}
                  className="absolute bottom-4 right-1/2 translate-x-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {displayUser?.name}
            </h2>
            {user.verified && <VerifiedBadge size={16} />}
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              @{displayUser?.username}
            </p>
            {displayUser?.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-4">
                {displayUser.bio}
              </p>
            )}

            {isOwnProfile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditProfile(true)}
                className="flex items-center justify-center gap-2 mx-auto"
              >
                <Edit2 size={16} />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <button
              onClick={() => {
                // Navigate to posts (optional)
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userPosts.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
            </button>

            <button
              onClick={() => {
                setFollowersModalType("followers");
                setShowFollowersModal(true);
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {displayUser?.followers?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Followers
              </p>
            </button>

            <button
              onClick={() => {
                setFollowersModalType("following");
                setShowFollowersModal(true);
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {displayUser?.following?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Following
              </p>
            </button>
            
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 pb-3 transition-colors ${
                  activeTab === id
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs">({count})</span>
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-3 gap-2">
            {displayPosts.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No {activeTab} yet</p>
              </div>
            ) : (
              displayPosts.map((post) => (
                <div
                  key={post._id}
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {post.image ? (
                    post.image.includes(".mp4") ||
                    post.image.includes("video") ? (
                      <video
                        src={post.image}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Profile
              </h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editBio.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowEditProfile(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <AvatarUpload
          currentAvatar={user.avatar}
          userName={user.name}
          onUploadSuccess={handleAvatarUpdate}
          onClose={() => setShowAvatarUpload(false)}
        />
      )}

      {/* User Profile Modal */}
      {selectedUser && selectedUser._id !== user._id && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {showFollowersModal && (
        <FollowersModal
          userId={displayUser._id}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      
    </>
   
  );

};

export default ProfileSidebar;