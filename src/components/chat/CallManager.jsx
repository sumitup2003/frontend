// frontend/src/components/chat/CallManager.jsx

import React, { useState, useEffect } from 'react';
import socketService from '../../utils/socket';
import IncomingCallNotification from './IncomingCallNotification';
import CallModal from './CallModal';

const CallManager = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    // Listen for incoming calls
    socketService.onIncomingCall((callData) => {
      console.log('📞 Incoming call received:', callData);
      setIncomingCall(callData);
    });

    // Listen for call rejected by receiver
    socketService.onCallRejected(() => {
      setIncomingCall(null);
      setActiveCall(null);
    });

    // Listen for call ended
    socketService.onCallEnded(() => {
      setIncomingCall(null);
      setActiveCall(null);
    });

    // Listen for user offline
    socketService.socket?.on('call:user-offline', ({ to }) => {
      alert('User is currently offline');
      setActiveCall(null);
    });

    return () => {
      // Cleanup listeners
      socketService.socket?.off('call:incoming');
      socketService.socket?.off('call:rejected');
      socketService.socket?.off('call:ended');
      socketService.socket?.off('call:user-offline');
    };
  }, []);

  const handleAnswerCall = () => {
    console.log('✅ Answering incoming call');
    setActiveCall({
      user: {
        _id: incomingCall.from,
        name: incomingCall.callerInfo.name,
        avatar: incomingCall.callerInfo.avatar,
        verified: incomingCall.callerInfo.verified
      },
      type: incomingCall.type,
      isIncoming: true,
      callId: incomingCall.callId
    });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting incoming call');
    
    if (incomingCall) {
      socketService.rejectCall({
        callId: incomingCall.callId,
        to: incomingCall.from
      });
    }
    
    setIncomingCall(null);
  };

  const handleCloseCallModal = () => {
    setActiveCall(null);
  };

  return (
    <>
      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          callData={incomingCall}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active Call Modal */}
      {activeCall && (
        <CallModal
          user={activeCall.user}
          callType={activeCall.type}
          isIncoming={activeCall.isIncoming}
          incomingCallData={activeCall}
          onClose={handleCloseCallModal}
        />
      )}
    </>
  );
};

export default CallManager;