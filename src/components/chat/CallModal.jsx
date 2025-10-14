import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import socketService from '../../utils/socket';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import VerifiedBadge from '../common/VerifiedBadge';

const CallModal = ({ user: receiverUser, isIncoming = false, incomingCallData = null, onClose, callType = 'audio' }) => {
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

  // Start call duration timer
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

  // Setup WebRTC and Socket listeners
  useEffect(() => {
    initializeCall();

    // Setup socket listeners
    socketService.onCallAnswered(handleCallAnswered);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onOffer(handleOffer);
    socketService.onAnswer(handleAnswer);
    socketService.onIceCandidate(handleRemoteIceCandidate);

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      setupPeerConnection();

      // If outgoing call, initiate
      if (!isIncoming) {
        initiateOutgoingCall();
      }
    } catch (error) {
      console.error('Media access error:', error);
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

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('📺 Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate({
          to: receiverUser._id,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      
      if (peerConnectionRef.current.connectionState === 'disconnected' ||
          peerConnectionRef.current.connectionState === 'failed') {
        handleCallEnded({ reason: 'connection_lost' });
      }
    };
  };

  const initiateOutgoingCall = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      // Send call initiation through socket
      socketService.initiateCall({
        to: receiverUser._id,
        from: currentUser._id,
        type: callType,
        offer,
        callerInfo: {
          name: currentUser.name,
          avatar: currentUser.avatar,
          verified: currentUser.verified
        }
      });

      console.log('📞 Call initiated to:', receiverUser.name);
    } catch (error) {
      console.error('Initiate call error:', error);
      alert('Failed to initiate call');
      onClose();
    }
  };

  const handleCallAnswered = async ({ answer, callId: answeredCallId }) => {
    try {
      console.log('✅ Call answered by receiver');
      
      if (answeredCallId) {
        setCallId(answeredCallId);
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      
      setCallStatus('connected');
    } catch (error) {
      console.error('Handle call answered error:', error);
    }
  };

  const handleCallRejected = ({ callId: rejectedCallId }) => {
    console.log('❌ Call was rejected');
    alert(`${receiverUser.name} rejected the call`);
    onClose();
  };

  const handleCallEnded = async ({ reason }) => {
    console.log('📴 Call ended:', reason);
    
    // Save call to history
    if (callStatus === 'connected' || callStatus === 'calling') {
      await saveCall({
        receiverId: receiverUser._id,
        type: callType,
        status: callStatus === 'connected' ? 'answered' : 'missed',
        duration: callDuration
      });
    }

    cleanup();
    onClose();
  };

  const handleOffer = async ({ from, offer }) => {
    try {
      console.log('📞 Received offer from:', from);
      
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketService.sendAnswer({
        to: from,
        answer
      });
    } catch (error) {
      console.error('Handle offer error:', error);
    }
  };

  const handleAnswer = async ({ answer }) => {
    try {
      console.log('✅ Received answer');
      
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error('Handle answer error:', error);
    }
  };

  const handleRemoteIceCandidate = async ({ candidate }) => {
    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Handle ICE candidate error:', error);
    }
  };

  const handleAnswerCall = async () => {
    try {
      console.log('✅ Answering call');
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketService.answerCall({
        callId,
        answer
      });

      setCallStatus('connected');
    } catch (error) {
      console.error('Answer call error:', error);
      alert('Failed to answer call');
      onClose();
    }
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call');
    
    socketService.rejectCall({
      callId,
      to: receiverUser._id
    });

    onClose();
  };

  const handleEndCall = async () => {
    console.log('📴 Ending call');
    
    socketService.endCall({
      callId,
      to: receiverUser._id
    });

    // Save call to history
    await saveCall({
      receiverId: receiverUser._id,
      type: callType,
      status: callStatus === 'connected' ? 'answered' : 'cancelled',
      duration: callDuration
    });

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
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

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
            {/* Remote video (full screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* No video placeholder */}
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
            
            {/* Local video (picture-in-picture) */}
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
            // Incoming call buttons
            <>
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110"
                title="Reject"
              >
                <PhoneOff size={28} />
              </button>
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110 animate-bounce"
                title="Answer"
              >
                <Phone size={28} />
              </button>
            </>
          ) : (
            // Active call controls
            <>
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
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
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transform transition hover:scale-110"
                title="End call"
              >
                <PhoneOff size={28} />
              </button>
            </>
          )}
        </div>

        {/* Connection Status */}
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