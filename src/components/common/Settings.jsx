import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, LogOut, Shield, Bell, Lock, HelpCircle, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import VerificationRequest from '../profile/VerificationRequest';
import VerificationPanel from '../admin/VerificationPanel';

const Settings = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Privacy settings
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessagesFromEveryone, setAllowMessagesFromEveryone] = useState(false);

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [likesNotifications, setLikesNotifications] = useState(true);
  const [commentsNotifications, setCommentsNotifications] = useState(true);
  const [followsNotifications, setFollowsNotifications] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { logout, user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { settings, fetchSettings, updatePrivacy, updateNotifications, changePassword, deleteAccount, blockedUsers, fetchBlockedUsers } = useSettingsStore();
  const navigate = useNavigate();

  // DEBUG: Log user data to console
  useEffect(() => {
    console.log('🔍 Current User Data:', user);
    console.log('✓ Is Verified:', user?.verified);
    console.log('🔐 Is Admin:', user?.isAdmin);
    console.log('📋 Verification Request:', user?.verificationRequest);
  }, [user]);

  useEffect(() => {
    fetchSettings();
    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    if (settings) {
      // Load privacy settings
      setPrivateAccount(settings.privacy?.privateAccount || false);
      setShowOnlineStatus(settings.privacy?.showOnlineStatus || true);
      setAllowMessagesFromEveryone(settings.privacy?.allowMessagesFromEveryone || false);

      // Load notification settings
      setPushNotifications(settings.notifications?.push || true);
      setEmailNotifications(settings.notifications?.email || true);
      setMessageNotifications(settings.notifications?.messages || true);
      setLikesNotifications(settings.notifications?.likes || true);
      setCommentsNotifications(settings.notifications?.comments || true);
      setFollowsNotifications(settings.notifications?.follows || true);
    }
  }, [settings]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updatePrivacy({
        privateAccount,
        showOnlineStatus,
        allowMessagesFromEveryone
      });
      setSuccess('Privacy settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateNotifications({
        push: pushNotifications,
        email: emailNotifications,
        messages: messageNotifications,
        likes: likesNotifications,
        comments: commentsNotifications,
        follows: followsNotifications
      });
      setSuccess('Notification settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await deleteAccount(deletePassword);
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const PrivacySettings = () => (
    <div className="space-y-4">
      <button
        onClick={() => setActiveSection('main')}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Privacy Settings
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="text-gray-900 dark:text-white font-medium">Private Account</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Only followers can see your posts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={privateAccount}
              onChange={(e) => setPrivateAccount(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="text-gray-900 dark:text-white font-medium">Show Online Status</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you're active</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={showOnlineStatus}
              onChange={(e) => setShowOnlineStatus(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="text-gray-900 dark:text-white font-medium">Allow Messages from Everyone</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive messages from non-followers</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={allowMessagesFromEveryone}
              onChange={(e) => setAllowMessagesFromEveryone(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleSavePrivacy}
        loading={loading}
      >
        Save Changes
      </Button>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-4">
      <button
        onClick={() => setActiveSection('main')}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Notification Settings
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-3">
        {[
          { label: 'Push Notifications', value: pushNotifications, setter: setPushNotifications },
          { label: 'Email Notifications', value: emailNotifications, setter: setEmailNotifications },
          { label: 'Message Notifications', value: messageNotifications, setter: setMessageNotifications },
          { label: 'Likes Notifications', value: likesNotifications, setter: setLikesNotifications },
          { label: 'Comments Notifications', value: commentsNotifications, setter: setCommentsNotifications },
          { label: 'Follows Notifications', value: followsNotifications, setter: setFollowsNotifications }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-900 dark:text-white">{item.label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={item.value}
                onChange={(e) => item.setter(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleSaveNotifications}
        loading={loading}
      >
        Save Changes
      </Button>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-4">
      <button
        onClick={() => setActiveSection('main')}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Security Settings
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Change Password</h4>
          <div className="space-y-3">
            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button
              variant="primary"
              fullWidth
              onClick={handleChangePassword}
              loading={loading}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Change Password
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Blocked Users</h4>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No blocked users</p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-white">{user.name}</span>
                  <button className="text-sm text-blue-600 hover:underline">
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h4>
          <Button
            variant="danger"
            fullWidth
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );

  const HelpSupport = () => (
    <div className="space-y-4">
      <button
        onClick={() => setActiveSection('main')}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Help & Support
      </h3>
      <div className="space-y-3">
        <a
          href="https://help.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <p className="font-medium text-gray-900 dark:text-white">Help Center</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Find answers to common questions</p>
        </a>

        <a
          href="mailto:sumitwork25@gmail.com"
          className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <p className="font-medium text-gray-900 dark:text-white">Contact Support</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">sumitwork25@gmail.com</p>
        </a>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Version:</strong> 1.0.0
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>User ID:</strong> {user?._id}
          </p>
        </div>
      </div>
    </div>
  );

  const MainSettings = () => (
    <div className="space-y-2">
      {/* Debug Button - Remove after testing
      <button
        onClick={() => {
          console.log('=== DEBUG USER DATA ===');
          console.log('User Object:', user);
          console.log('Verified:', user?.verified);
          console.log('Is Admin:', user?.isAdmin);
          console.log('Verification Request:', user?.verificationRequest);
          alert(`Verified: ${user?.verified}\nAdmin: ${user?.isAdmin}`);
        }}
        className="w-full p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
      >
        🐛 Debug User Data (Remove After Testing)
      </button> */}

      <button
        onClick={toggleDarkMode}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {darkMode ? (
            <Sun size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon size={20} className="text-gray-600 dark:text-gray-400" />
          )}
          <span className="text-gray-900 dark:text-white font-medium">
            Theme
          </span>
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {darkMode ? "Dark" : "Light"}
        </span>
      </button>

      {/* Verification Status/Request */}
      {!user?.verified && user?.verificationRequest?.status !== "pending" && (
        <button
          onClick={() => setActiveSection("verification")}
          className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckCircle
              size={20}
              className="text-gray-600 dark:text-gray-400"
            />
            <span className="text-gray-900 dark:text-white font-medium">
              Get Verified
            </span>
          </div>
        </button>
      )}

      {user?.verificationRequest?.status === "pending" && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⏳ Verification request pending review
          </p>
        </div>
      )}

      {user?.verified && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
          <CheckCircle
            size={20}
            className="text-green-600 dark:text-green-400"
          />
          <p className="text-sm text-green-800 dark:text-green-200">
            ✨ You are verified!
          </p>
        </div>
      )}

      {/* Admin Panel */}
      {user?.isAdmin && (
        <button
          onClick={() => setActiveSection("admin")}
          className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-blue-500"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="text-gray-900 dark:text-white font-medium">
              Admin Panel - Verification Requests
            </span>
          </div>
        </button>
      )}

      <button
        onClick={() => setActiveSection("notifications")}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">
            Notifications
          </span>
        </div>
      </button>

      <button
        onClick={() => setActiveSection("privacy")}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">
            Privacy
          </span>
        </div>
      </button>

      <button
        onClick={() => setActiveSection("security")}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Lock size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">
            Security
          </span>
        </div>
      </button>

      <button
        onClick={() => setActiveSection("help")}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">
            Help & Support
          </span>
        </div>
      </button>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="danger"
          fullWidth
          onClick={handleLogout}
          className="flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Settings" size="md">
        {activeSection === 'main' && <MainSettings />}
        {activeSection === 'privacy' && <PrivacySettings />}
        {activeSection === 'notifications' && <NotificationSettings />}
        {activeSection === 'security' && <SecuritySettings />}
        {activeSection === 'help' && <HelpSupport />}
        {activeSection === 'verification' && (
          <VerificationRequest 
            onBack={() => setActiveSection('main')} 
            user={user}
          />
        )}
        {activeSection === 'admin' && user?.isAdmin && (
          <VerificationPanel onBack={() => setActiveSection('main')} />
        )}
      </Modal>

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Account"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">Warning!</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Input
              type="password"
              label="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleDeleteAccount}
                loading={loading}
                disabled={!deletePassword}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Settings;