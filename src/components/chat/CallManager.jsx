// frontend/src/components/chat/CallManager.jsx

import React, { useState, useEffect, useRef } from 'react';
import socketService from '../../utils/socket';
import IncomingCallNotification from './IncomingCallNotification';
import CallModal from './CallModal';

const CallManager = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const isMountedRef = useRef(true);
  const pendingOfferRef = useRef(null); // ✅ Store offer here

  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🎬 CallManager mounted - setting up listeners');
    console.log('Socket connected?', socketService.isConnected());
    console.log('Socket ID:', socketService.getSocketId());

    const setupListeners = () => {
      console.log('🔧 Setting up CallManager listeners...');
      
      // ✅ Listen for incoming call notification
      socketService.onIncomingCall((callData) => {
        if (!isMountedRef.current) return;
        
        console.log('📞 CallManager received call:incoming event');
        console.log('   From:', callData.from);
        console.log('   Caller:', callData.callerInfo?.name);
        console.log('   Call ID:', callData.callId);
        console.log('   Type:', callData.type);
        
        // Store call data (without offer - it comes separately)
        setIncomingCall(callData);
      });

      // ✅ Listen for WebRTC offer (arrives separately)
      socketService.onOffer((offerData) => {
        if (!isMountedRef.current) return;
        
        console.log('📨 CallManager received call:offer event');
        console.log('   From:', offerData.from);
        console.log('   Call ID:', offerData.callId);
        console.log('   Has offer?', !!offerData.offer);
        
        // Store the offer for when user answers
        pendingOfferRef.current = offerData.offer;
        console.log('✅ Offer stored in CallManager');
      });

      // Listen for call rejected
      socketService.onCallRejected((data) => {
        if (!isMountedRef.current) return;
        
        console.log('❌ CallManager: Call rejected', data);
        setIncomingCall(null);
        setActiveCall(null);
        pendingOfferRef.current = null;
      });

      // Listen for call ended
      socketService.onCallEnded((data) => {
        if (!isMountedRef.current) return;
        
        console.log('📴 CallManager: Call ended', data);
        setIncomingCall(null);
        setActiveCall(null);
        pendingOfferRef.current = null;
      });

      // Listen for user offline
      socketService.socket?.on('call:user-offline', ({ to }) => {
        if (!isMountedRef.current) return;
        
        console.log('📵 CallManager: User offline', to);
        alert('User is currently offline');
        setActiveCall(null);
        setIncomingCall(null);
        pendingOfferRef.current = null;
      });

      console.log('✅ CallManager listeners registered');
    };

    // Setup listeners with connection check
    if (socketService.isConnected()) {
      setupListeners();
    } else {
      console.log('⏳ Waiting for socket connection...');
      const checkConnection = setInterval(() => {
        if (socketService.isConnected()) {
          console.log('✅ Socket connected, setting up listeners');
          setupListeners();
          clearInterval(checkConnection);
        }
      }, 100);

      return () => clearInterval(checkConnection);
    }

    return () => {
      console.log('🧹 CallManager unmounting');
      isMountedRef.current = false;
      pendingOfferRef.current = null;
    };
  }, []);

  const handleAnswerCall = () => {
    console.log('✅ CallManager: User clicked Answer');
    console.log('   Incoming call data:', incomingCall);
    console.log('   Has pending offer?', !!pendingOfferRef.current);
    
    if (!incomingCall) {
      console.error('❌ No incoming call data!');
      return;
    }

    if (!pendingOfferRef.current) {
      console.warn('⚠️ No offer received yet, but proceeding (offer might arrive soon)');
    }
    
    // Create active call with the stored offer
    setActiveCall({
      user: {
        _id: incomingCall.from,
        name: incomingCall.callerInfo.name,
        avatar: incomingCall.callerInfo.avatar,
        verified: incomingCall.callerInfo.verified
      },
      type: incomingCall.type,
      isIncoming: true,
      callId: incomingCall.callId,
      from: incomingCall.from,
      offer: pendingOfferRef.current // ✅ Pass the stored offer
    });
    
    console.log('📲 Active call created with offer:', !!pendingOfferRef.current);
    
    // Clear incoming call but keep offer for CallModal
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    console.log('❌ CallManager: Rejecting incoming call');
    
    if (incomingCall) {
      socketService.rejectCall({
        callId: incomingCall.callId,
        to: incomingCall.from
      });
    }
    
    setIncomingCall(null);
    pendingOfferRef.current = null;
  };

  const handleCloseCallModal = () => {
    console.log('🚪 CallManager: Closing call modal');
    setActiveCall(null);
    pendingOfferRef.current = null;
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
          incomingCallData={{
            callId: activeCall.callId,
            offer: activeCall.offer,
            from: activeCall.from
          }}
          onClose={handleCloseCallModal}
        />
      )}
    </>
  );
};

export default CallManager;