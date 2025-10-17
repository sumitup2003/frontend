// frontend/src/components/chat/CallModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User, BadgeCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import socketService from '../../utils/socket';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';

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
  const callerIdRef = useRef(incomingCallData?.from || null);

  console.log('🎯 CallModal - Initial state:');
  console.log('   isIncoming:', isIncoming);
  console.log('   callType:', callType);
  console.log('   Caller ID:', callerIdRef.current);

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
    
    let mounted = true;

    const initializeCall = async () => {
      try {
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

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        });
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('📺 Received remote stream');
        if (remoteVideoRef.current && mounted) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('❄️ Generated ICE candidate');
          
          const targetUserId = isIncoming ? callerIdRef.current : receiverUser._id;
          
          socketService.sendIceCandidate({
            to: targetUserId,
            candidate: event.candidate,
            callId: callId || incomingCallData?.callId
          });
        }
      };

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
      
      if (data.answer && peerConnectionRef.current && !isCleanedUpRef.current) {
        try {
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

    const handleOffer = async (data) => {
      try {
        console.log('📞 Received WebRTC offer');
        
        if (!peerConnectionRef.current || isCleanedUpRef.current) {
          return;
        }

        console.log('📦 Storing offer in pendingOfferRef');
        pendingOfferRef.current = data.offer;
        
      } catch (error) {
        console.error('❌ Handle offer error:', error);
      }
    };

    const handleAnswer = async (data) => {
      try {
        console.log('✅ Received WebRTC answer');
        
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

  const handleAnswerCall = async () => {
    try {
      console.log('✅ Answering call');
      
      if (!peerConnectionRef.current || !pendingOfferRef.current) {
        console.error('❌ No peer connection or offer');
        return;
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(pendingOfferRef.current)
      );
      console.log('✅ Remote description set from pending offer');
      
      pendingOfferRef.current = null;

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ Answer created and local description set');

      const callerUserId = callerIdRef.current || incomingCallData?.from || receiverUser?._id;
      
      if (!callerUserId) {
        console.error('❌ Cannot determine caller ID!');
        alert('Cannot answer call - caller information missing');
        return;
      }

      socketService.answerCall({
        callId: callId || incomingCallData?.callId,
        answer,
        from: currentUser._id,
        to: callerUserId
      });

      console.log('✅ Answer sent to caller');
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
    
    let targetUserId = isIncoming ? callerIdRef.current : receiverUser._id;
    
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
    if (isCleanedUpRef.current) {
      return;
    }
    
    console.log('📴 Ending call');
    isCleanedUpRef.current = true;
    
    let otherUserId = isIncoming ? callerIdRef.current : receiverUser?._id;
    
    if (otherUserId) {
      socketService.endCall({
        callId: callId || incomingCallData?.callId,
        to: otherUserId,
        userId: currentUser._id
      });
    }

    if ((callStatus === 'connected' || callStatus === 'calling') && otherUserId) {
      try {
        const callData = {
          receiverId: isIncoming ? currentUser._id : otherUserId,
          callerId: isIncoming ? otherUserId : currentUser._id,
          type: callType,
          status: callStatus === 'connected' ? 'answered' : 'cancelled',
          duration: callDuration
        };
        
        await saveCall(callData);
        console.log('✅ Call history saved');
      } catch (error) {
        console.error('❌ Failed to save call history:', error);
      }
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
      return;
    }

    isCleanedUpRef.current = true;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log('🔌 Peer connection closed');
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    pendingOfferRef.current = null;
    socketService.stopAllSounds();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={true} onClose={handleEndCall} size={callType === 'video' ? 'md' : 'lg'} className="call-modal">
      <div className={callType === 'video' ? 'space-y-4 p-4' : 'space-y-6 p-6'}>
        {/* Call Info Header - Only for audio calls */}
        {callType === 'audio' && (
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
              {receiverUser.verified && <BadgeCheck size={24} className="text-blue-500" />}
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              {callStatus === 'incoming' && '📞 Incoming call...'}
              {callStatus === 'calling' && '📱 Calling...'}
              {callStatus === 'connected' && `⏱️ ${formatDuration(callDuration)}`}
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              📞 Voice Call
            </p>
          </div>
        )}

        {/* Video Display - Portrait Mode (Phone-like) */}
        {callType === 'video' && (
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl mx-auto" 
               style={{ aspectRatio: '9/16', maxHeight: '70vh', maxWidth: '400px' }}>
            {/* Remote video - Full screen vertical */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Placeholder when no remote video */}
            {(!remoteVideoRef.current?.srcObject || callStatus !== 'connected') && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <User size={80} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {callStatus === 'connected' ? 'Waiting for video...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Local video PIP - Top right corner (phone style) */}
            <div className="absolute top-4 right-4 w-24 h-32 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff size={20} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Top overlay with user info (phone style) */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="flex items-center gap-3">
                <Avatar 
                  src={receiverUser.avatar} 
                  alt={receiverUser.name} 
                  size="sm"
                  className="w-10 h-10 ring-2 ring-white/30"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-white font-semibold text-sm">
                      {receiverUser.name}
                    </h3>
                    {receiverUser.verified && (
                      <BadgeCheck size={14} className="text-blue-400" />
                    )}
                  </div>
                  <p className="text-white/80 text-xs">
                    {callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Call Display */}
        {callType === 'audio' && (
          <div className="flex justify-center py-12">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              callStatus === 'connected' 
                ? 'bg-green-500 animate-pulse-slow' 
                : 'bg-blue-500 animate-pulse'
            }`}>
              <Phone size={34} className="text-white" />
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