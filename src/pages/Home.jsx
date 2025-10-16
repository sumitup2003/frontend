import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/chat/Sidebar';
import Feed from '../components/feed/Feed';
import ChatArea from '../components/chat/ChatArea';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import Settings from '../components/common/Settings';

const Home = () => {
  const [activeView, setActiveView] = useState('feed'); // 'feed', 'chat', 'profile'
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuthStore();
  const { darkMode } = useThemeStore();
  
  // Initialize socket connection
  useSocket();

  const handleChatSelect = () => {
    setActiveView('chat');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Left Sidebar - Chat Users */}
        {/* <Sidebar onChatSelect={handleChatSelect} /> */}

        {/* Middle Section - Feed, Chat, or Profile */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activeView === 'feed' && <Feed />}
            {activeView === 'chat' && <ChatArea />}
            {activeView === 'profile' && (
              <div className="flex-1 overflow-y-auto">
                <ProfileSidebar isFullView={true} />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Only show on feed view on desktop */}
        {activeView === 'feed' && (
          <div className="hidden xl:block">
            <ProfileSidebar />
          </div>
        )}

        {/* Bottom Navbar */}
        <Navbar 
          activeView={activeView} 
          setActiveView={setActiveView}
          onSettingsClick={() => setShowSettings(true)}
        />

        {/* Settings Modal */}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </div>
    </div>
  );
};

export default Home;