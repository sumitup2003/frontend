// frontend/src/components/chat/IncomingCallNotification.jsx

import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';
import socketService from '../../utils/socket';

const IncomingCallNotification = ({ callData, onAnswer, onReject }) => {
  const { callerInfo, type } = callData;

  useEffect(() => {
    // Play ringtone when component mounts
    socketService.playRingtone();

    return () => {
      // Stop ringtone when component unmounts
      socketService.stopRingtone();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Avatar 
              src={callerInfo.avatar} 
              alt={callerInfo.name}
              size="2xl"
              className="w-32 h-32 mx-auto ring-4 ring-blue-500 animate-pulse-slow"
            />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {callerInfo.name}
            </h2>
            {callerInfo.verified && <VerifiedBadge size={24} />}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-4">
            {type === 'video' ? (
              <span className="flex items-center justify-center gap-2">
                <Video size={20} />
                Incoming video call...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Phone size={20} />
                Incoming call...
              </span>
            )}
          </p>

          {/* Ringing animation */}
          <div className="flex justify-center gap-1 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="group relative w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110 active:scale-95"
          >
            <PhoneOff size={32} />
            <span className="absolute -bottom-8 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Decline
            </span>
          </button>

          {/* Answer Button */}
          <button
            onClick={onAnswer}
            className="group relative w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110 active:scale-95 animate-bounce"
          >
            <Phone size={32} />
            <span className="absolute -bottom-8 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Answer
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;