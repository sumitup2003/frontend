// frontend/src/components/chat/CallModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import socketService from '../../utils/socket';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import VerifiedBadge from '../common/VerifiedBadge';

const CallModal = ({ 
  user: receiverUser, 
  isIncoming = false, 
  incomingCallData = null, 
  onClose, 
  callType = 'audio' 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState(incomingCallData?.callId || null);
  
  const { user: currentUser } = useAuthStore();
  const { saveCall } = useCallStore();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const intervalRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const isCleanedUpRef = useRef(false);
  const pendingOfferRef = useRef(incomingCallData?.offer || null);
  
  // ✅ Store the caller ID immediately to prevent it from being lost
  const callerIdRef = useRef(incomingCallData?.from || null);

  console.log('🎯 CallModal - Initial state:');
  console.log('   isIncoming:', isIncoming);
  console.log('   incomingCallData:', incomingCallData);
  console.log('   Caller ID:', incomingCallData?.from);
  console.log('   Has offer in incomingCallData?', !!incomingCallData?.offer);
  console.log('   pendingOfferRef initialized:', !!pendingOfferRef.current);
  console.log('   callerIdRef initialized:', callerIdRef.current);

  // Start call duration timer when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      callStartTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callStatus]);

  // Initialize call and setup WebRTC
  useEffect(() => {
    console.log('🚀 CallModal mounted - initializing call');
    console.log('Is incoming?', isIncoming);
    console.log('Call type:', callType);
    console.log('Receiver:', receiverUser.name);
    
    let mounted = true;

    const initializeCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
        });

        if (!mounted) return;

        localStreamRef.current = stream;
        
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        console.log('📹 Media stream acquired');

        // Create peer connection
        setupPeerConnection();

        if (isIncoming) {
          console.log('📞 Incoming call - waiting for user to answer...');
        } else {
          initiateOutgoingCall();
        }
      } catch (error) {
        console.error('❌ Media access error:', error);
        alert('Could not access camera/microphone. Please check permissions.');
        onClose();
      }
    };

    const setupPeerConnection = () => {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);
      console.log('🔗 Peer connection created');

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('📺 Received remote stream');
        if (remoteVideoRef.current && mounted) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('❄️ Generated ICE candidate');
          
          // ✅ FIX: For incoming calls, send to caller (incomingCallData.from)
          const targetUserId = isIncoming ? incomingCallData.from : receiverUser._id;
          
          socketService.sendIceCandidate({
            to: targetUserId,
            candidate: event.candidate,
            callId: callId || incomingCallData?.callId
          });
        }
      };

      // Monitor connection state
      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('🔌 Connection state:', peerConnectionRef.current.connectionState);
        
        if (peerConnectionRef.current.connectionState === 'connected') {
          setCallStatus('connected');
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('❄️ ICE connection state:', peerConnectionRef.current.iceConnectionState);
      };
    };

    const initiateOutgoingCall = async () => {
      try {
        console.log('📞 Creating offer...');
        
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video'
        });

        await peerConnectionRef.current.setLocalDescription(offer);
        console.log('📞 Local description set');

        const generatedCallId = `${currentUser._id}-${receiverUser._id}-${Date.now()}`;
        setCallId(generatedCallId);

        socketService.initiateCall({
          to: receiverUser._id,
          from: currentUser._id,
          type: callType,
          offer,
          callId: generatedCallId,
          callerInfo: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            verified: currentUser.verified
          }
        });

        console.log('📞 Call initiated to:', receiverUser.name);
      } catch (error) {
        console.error('❌ Initiate call error:', error);
        alert('Failed to initiate call');
        onClose();
      }
    };

    initializeCall();

    return () => {
      mounted = false;
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    console.log('👂 Setting up socket listeners');

    const handleCallAnswered = async (data) => {
      console.log('✅ Call answered by receiver');
      console.log('   Received answer from:', data.from);
      
      if (data.answer && peerConnectionRef.current && !isCleanedUpRef.current) {
        try {
          console.log('🔧 Setting remote description from answer');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('✅ Remote description set from answer');
          setCallStatus('connected');
        } catch (error) {
          console.error('❌ Set remote description error:', error);
        }
      }
    };

    const handleCallRejected = () => {
      console.log('❌ Call was rejected');
      alert(`${receiverUser.name} rejected the call`);
      cleanup();
      onClose();
    };

    const handleCallEnded = () => {
      console.log('📴 Call ended by other user');
      cleanup();
      onClose();
    };

    // ✅ FIXED: Simplified handleOffer - just store it, don't process
    const handleOffer = async (data) => {
      try {
        console.log('📞 Received WebRTC offer');
        console.log('   Offer from:', data.from);
        console.log('   Call status:', callStatus);
        
        if (!peerConnectionRef.current || isCleanedUpRef.current) {
          console.log('⚠️ Cannot process offer - no peer connection');
          return;
        }

        // ✅ Just store the offer - handleAnswerCall will process it when user clicks Answer
        console.log('📦 Storing offer in pendingOfferRef');
        pendingOfferRef.current = data.offer;
        
      } catch (error) {
        console.error('❌ Handle offer error:', error);
      }
    };

    const handleAnswer = async (data) => {
      try {
        console.log('✅ Received WebRTC answer (via call:answer-signal)');
        
        if (peerConnectionRef.current && !isCleanedUpRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('✅ Remote description set');
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('❌ Handle answer error:', error);
      }
    };

    const handleIceCandidate = async (data) => {
      try {
        if (data.candidate && peerConnectionRef.current && !isCleanedUpRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log('❄️ ICE candidate added');
        }
      } catch (error) {
        console.error('❌ ICE candidate error:', error);
      }
    };

    // Register listeners
    socketService.onCallAnswered(handleCallAnswered);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onOffer(handleOffer);
    socketService.onAnswer(handleAnswer);
    socketService.onIceCandidate(handleIceCandidate);

    return () => {
      console.log('🧹 CallModal socket listeners cleanup');
    };
  }, [callStatus, callId]);

  // ✅ FIXED: Handle answering incoming call
  const handleAnswerCall = async () => {
    try {
      console.log('✅ Answering call');
      console.log('   Peer connection state:', peerConnectionRef.current?.signalingState);
      console.log('   incomingCallData:', incomingCallData);
      console.log('   Caller ID (incomingCallData.from):', incomingCallData?.from);
      console.log('   receiverUser:', receiverUser);
      
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection');
        return;
      }

      if (isCleanedUpRef.current) {
        console.log('⚠️ Already cleaned up');
        return;
      }

      // Process the pending offer
      if (pendingOfferRef.current) {
        console.log('📦 Processing pending offer');
        
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(pendingOfferRef.current)
        );
        console.log('✅ Remote description set from pending offer');
        
        pendingOfferRef.current = null;
      } else {
        console.error('❌ No pending offer available!');
        alert('No call offer received');
        return;
      }

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ Answer created and local description set');

      // ✅ CRITICAL FIX: Determine the caller ID with multiple fallbacks
      const callerUserId = callerIdRef.current || incomingCallData?.from || receiverUser?._id;
      
      if (!callerUserId) {
        console.error('❌ Cannot determine caller ID!');
        console.error('   callerIdRef:', callerIdRef.current);
        console.error('   incomingCallData:', incomingCallData);
        console.error('   receiverUser:', receiverUser);
        alert('Cannot answer call - caller information missing');
        return;
      }

      console.log('   Sending answer to caller:', callerUserId);

      socketService.answerCall({
        callId: callId || incomingCallData?.callId,
        answer,
        from: currentUser._id,
        to: callerUserId  // ✅ Send to caller!
      });

      console.log('✅ Answer sent to caller:', callerUserId);
      setCallStatus('connected');
    } catch (error) {
      console.error('❌ Answer call error:', error);
      alert('Failed to answer call: ' + error.message);
      cleanup();
      onClose();
    }
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call');
    
    // ✅ FIX: Determine who to send the rejection to
    let targetUserId;
    
    if (isIncoming && incomingCallData?.from) {
      targetUserId = incomingCallData.from;
    } else if (receiverUser?._id) {
      targetUserId = receiverUser._id;
    }
    
    console.log('   Sending rejection to:', targetUserId);
    
    if (targetUserId) {
      socketService.rejectCall({
        callId: callId || incomingCallData?.callId,
        to: targetUserId
      });
    }

    cleanup();
    onClose();
  };

  const handleEndCall = async () => {
    // ✅ Prevent duplicate calls
    if (isCleanedUpRef.current) {
      console.log('⚠️ Call already ended, skipping');
      return;
    }
    
    console.log('📴 Ending call');
    console.log('   Current user:', currentUser._id);
    console.log('   Is incoming?', isIncoming);
    console.log('   Incoming data:', incomingCallData);
    console.log('   Receiver user:', receiverUser);
    console.log('   Stored caller ID:', callerIdRef.current);
    
    // ✅ Mark as cleaned up immediately to prevent duplicate calls
    isCleanedUpRef.current = true;
    
    // ✅ FIX: Determine the other user correctly
    let otherUserId;
    
    if (isIncoming) {
      // For incoming calls, the other user is the caller
      otherUserId = callerIdRef.current || incomingCallData?.from;
    } else {
      // For outgoing calls, the other user is the receiver
      otherUserId = receiverUser?._id;
    }
    
    console.log('   Other user ID:', otherUserId);
    
    // Send end call signal
    if (otherUserId) {
      socketService.endCall({
        callId: callId || incomingCallData?.callId,
        to: otherUserId,
        userId: currentUser._id
      });
    }

    // ✅ FIX: Only save call if we have the other user's ID
    if ((callStatus === 'connected' || callStatus === 'calling') && otherUserId) {
      try {
        // ✅ Determine who is caller and who is receiver
        // For incoming calls: the caller is the other user, receiver is currentUser
        // For outgoing calls: the caller is currentUser, receiver is the other user
        const callData = {
          receiverId: isIncoming ? currentUser._id : otherUserId,
          callerId: isIncoming ? otherUserId : currentUser._id,
          type: callType,
          status: callStatus === 'connected' ? 'answered' : 'cancelled',
          duration: callDuration
        };
        
        console.log('💾 Saving call history:', callData);
        await saveCall(callData);
        console.log('✅ Call history saved');
      } catch (error) {
        console.error('❌ Failed to save call history:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    } else {
      console.warn('⚠️ Cannot save call: missing otherUserId');
      console.warn('   otherUserId:', otherUserId);
      console.warn('   callStatus:', callStatus);
    }

    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up call resources');
    
    if (isCleanedUpRef.current) {
      console.log('⚠️ Already cleaned up');
      return;
    }

    isCleanedUpRef.current = true;

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log('🔌 Peer connection closed');
    }
    
    // Stop timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clear pending offer
    pendingOfferRef.current = null;

    socketService.stopAllSounds();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={true} onClose={handleEndCall} size="lg" className="call-modal">
      <div className="space-y-6 p-6">
        {/* Call Info Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <Avatar 
              src={receiverUser.avatar} 
              alt={receiverUser.name} 
              size="2xl" 
              className="w-24 h-24 mx-auto ring-4 ring-blue-500 animate-pulse-slow" 
            />
            {callStatus === 'calling' && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {receiverUser.name}
            </h3>
            {receiverUser.verified && <VerifiedBadge size={24} />}
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            {callStatus === 'incoming' && '📞 Incoming call...'}
            {callStatus === 'calling' && '📱 Calling...'}
            {callStatus === 'connected' && `⏱️ ${formatDuration(callDuration)}`}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </p>
        </div>

        {/* Video Display */}
        {callType === 'video' && (
          <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Placeholder */}
            {(!remoteVideoRef.current?.srcObject || callStatus !== 'connected') && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <User size={64} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {callStatus === 'connected' ? 'Waiting for video...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Local video PIP */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff size={24} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Call Display */}
        {callType === 'audio' && (
          <div className="flex justify-center py-12">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center ${
              callStatus === 'connected' 
                ? 'bg-green-500 animate-pulse-slow' 
                : 'bg-blue-500 animate-pulse'
            }`}>
              <Phone size={64} className="text-white" />
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4">
          {callStatus === 'incoming' ? (
            <>
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110 active:scale-95"
              >
                <PhoneOff size={28} />
              </button>
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110 active:scale-95 animate-bounce"
              >
                <Phone size={28} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                    isVideoOff
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110"
              >
                <PhoneOff size={28} />
              </button>
            </>
          )}
        </div>

        {callStatus === 'calling' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Connecting...
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CallModal;