import React from 'react';
import { Home, MessageCircle, User, Settings } from 'lucide-react';

const Navbar = ({ activeView, setActiveView, onSettingsClick }) => {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'chat', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: onSettingsClick }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map(({ id, icon: Icon, label, onClick }) => (
          <button
            key={id}
            onClick={() => onClick ? onClick() : setActiveView(id)}
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
  );
};

export default Navbar;