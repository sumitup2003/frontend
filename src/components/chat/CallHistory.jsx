
//frontend/src/components/chat/CallHistory.jsx

import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, X } from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { formatTimestamp } from '../../utils/formatters';

const CallHistory = ({ onClose }) => {
  const { user } = useAuthStore();
  const { callHistory, fetchCallHistory, deleteCall, loading } = useCallStore();

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const getCallIcon = (call) => {
    const isIncoming = call.receiver._id === user._id;
    const isMissed = call.status === 'missed';
    const isVideo = call.type === 'video';

    if (isMissed) {
      return <PhoneMissed size={20} className="text-red-500" />;
    } else if (isIncoming) {
      return isVideo ? 
        <Video size={20} className="text-green-500" /> : 
        <PhoneIncoming size={20} className="text-green-500" />;
    } else {
      return isVideo ? 
        <Video size={20} className="text-blue-500" /> : 
        <PhoneOutgoing size={20} className="text-blue-500" />;
    }
  };

  const formatDuration = (seconds) => {
    if (seconds === 0) return 'Not answered';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (callId) => {
    if (window.confirm('Delete this call from history?')) {
      await deleteCall(callId);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Call History" size="lg">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : callHistory.length === 0 ? (
          <div className="text-center py-8">
            <Phone size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No call history</p>
          </div>
        ) : (
          callHistory.map((call) => {
            const isIncoming = call.receiver._id === user._id;
            const otherUser = isIncoming ? call.caller : call.receiver;

            return (
              <div
                key={call._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getCallIcon(call)}
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {otherUser.name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(call.createdAt)} • {formatDuration(call.duration)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(call._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default CallHistory;