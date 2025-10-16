import React, { useState } from 'react';
import { Home, MessageCircle, User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../chat/Sidebar';
import ChatArea from '../chat/ChatArea';

const Navbar = ({ activeView, setActiveView, onSettingsClick }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [mobileSelectedChat, setMobileSelectedChat] = useState(false);

  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'chat', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: onSettingsClick }
  ];

  const handleNavClick = (id, onClick) => {
    if (onClick) {
      onClick();
    } else {
      setActiveView(id);
      if (id === 'chat') {
        // Reset chat view when switching to chat tab
        setShowMobileSidebar(true);
        setMobileSelectedChat(false);
      }
    }
  };

  const handleChatSelect = () => {
    setShowMobileSidebar(false);
    setMobileSelectedChat(true);
  };

  const handleBackToSidebar = () => {
    setShowMobileSidebar(true);
    setMobileSelectedChat(false);
  };

  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
    setMobileSelectedChat(!mobileSelectedChat);
  };

  return (
    <>
      {/* Mobile Chat Views - Only show when chat is active */}
      {/* TEMPORARY: Shows on all screens for testing - ADD 'md:hidden' class back after testing */}
      {activeView === 'chat' && (
        <>
          {/* Sidebar - slides out to left */}
          <div
            className={`fixed inset-0 bg-white dark:bg-gray-800 z-40 transition-transform duration-300 ${
              showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar onChatSelect={handleChatSelect} />
            
            {/* Toggle Arrow Button - Shows when sidebar is visible and chat is selected */}
            {mobileSelectedChat && (
              <button
                onClick={toggleSidebar}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                title="Show Chat"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* ChatArea - slides in from right */}
          <div
            className={`fixed inset-0 bg-white dark:bg-gray-800 z-40 transition-transform duration-300 ${
              mobileSelectedChat ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ paddingBottom: '64px' }}
          >
            <ChatArea onBackClick={handleBackToSidebar} isMobile={true} />
            
            {/* Toggle Arrow Button - Shows when chat is visible */}
            {mobileSelectedChat && (
              <button
                onClick={toggleSidebar}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                title="Show Conversations"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      {/* TEMPORARY: Shows on all screens for testing - ADD 'md:hidden' class back after testing */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map(({ id, icon: Icon, label, onClick }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id, onClick)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeView === id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;