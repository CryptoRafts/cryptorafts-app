"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  XMarkIcon, 
  MicrophoneIcon, 
  VideoCameraSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from "@heroicons/react/24/outline";
import { simpleFirebaseCallManager, type SimpleFirebaseCall } from "@/lib/simpleFirebaseCallManager";

interface Props {
  type: 'video' | 'voice';
  roomId: string;
  participants: string[];
  currentUserId: string;
  currentUserName: string;
  onEnd: () => void;
}

export default function CallModalWorking({ type, roomId, participants, currentUserId, currentUserName, onEnd }: Props) {
  const [callState, setCallState] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [callDuration, setCallDuration] = useState(0); // Call duration in seconds
  const [callId, setCallId] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<SimpleFirebaseCall | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callInitializedRef = useRef(false); // Prevent duplicate calls

  useEffect(() => {
    // Prevent duplicate call creation (React 18 Strict Mode)
    if (callInitializedRef.current) {
      console.log('📞 [CALL] Already initialized, skipping duplicate');
      return;
    }
    callInitializedRef.current = true;

    // Start the call using Firebase call manager
    const initCall = async () => {
      try {
        // Start call with simple Firebase manager
        const newCallId = await simpleFirebaseCallManager.startCall({
          roomId,
          callerId: currentUserId,
          callerName: currentUserName,
          callType: type,
          participants
        });
        
        setCallId(newCallId);
        
        console.log(`📞 [FIREBASE CALL] Starting ${type} call from ${currentUserName}`);
        console.log(`📞 [FIREBASE CALL] Participants: ${participants.join(', ')}`);
        console.log(`📞 [FIREBASE CALL] Call ID: ${newCallId}`);
        
        // Subscribe to call updates
        const unsubscribe = simpleFirebaseCallManager.subscribeToCall(newCallId, (call) => {
          if (call) {
            setActiveCall(call);
            setCallState(call.status);
            
            // Check if call is connected
            if (call.status === 'connected') {
              setIsConnected(true);
              
              // Start call duration timer
              if (!callTimerRef.current) {
                callTimerRef.current = setInterval(() => {
                  setCallDuration(prev => prev + 1);
                }, 1000);
              }
              
              // Start 30-minute countdown timer
              if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                  setTimeRemaining(prev => {
                    if (prev <= 0) {
                      console.log('🤖 RaftAI: Group call ended after 30 minutes');
                      simpleFirebaseCallManager.endCall(newCallId);
                      endCall();
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
            }
          }
        });
        
        // Simulate call flow
        setTimeout(async () => {
          await simpleFirebaseCallManager.updateCallStatus(newCallId, 'connecting');
          console.log('📞 [SIMPLE CALL] Connecting...');
        }, 3000);
        
        setTimeout(async () => {
          await simpleFirebaseCallManager.updateCallStatus(newCallId, 'connected');
          await simpleFirebaseCallManager.joinCall(newCallId, currentUserId);
          console.log('📞 [SIMPLE CALL] Connected!');
          console.log('🤖 RaftAI: Group call started with participants:', participants);
        }, 5000);
        
        return () => {
          unsubscribe();
        };
        
      } catch (error) {
        console.error('Error starting Firebase call:', error);
        endCall();
      }
    };

    initCall();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (callId) {
        simpleFirebaseCallManager.endCall(callId);
      }
    };
  }, [type, participants, currentUserId, currentUserName, roomId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const endCall = () => {
    setCallState('ended');
    if (callId) {
      simpleFirebaseCallManager.endCall(callId);
    }
    onEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeWarning = () => {
    if (timeRemaining <= 300) { // 5 minutes
      return "⚠️ Call will end in 5 minutes";
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-white/20 rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              callState === 'connected' ? 'bg-green-500' : 
              callState === 'connecting' ? 'bg-blue-500' : 
              callState === 'ringing' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {type === 'video' ? 'Video Call' : 'Voice Call'}
              </h2>
              <p className="text-sm text-white/60">
                {callState === 'ringing' ? 'Ringing...' :
                 callState === 'connecting' ? 'Connecting...' :
                 callState === 'connected' ? 'Connected' : 'Call ended'}
              </p>
            </div>
          </div>
          <button
            onClick={endCall}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Call Content */}
        <div className="p-6">
          {/* Timer */}
          <div className="text-center mb-6">
            {callState === 'connected' ? (
              <div>
                <div className="text-2xl font-mono font-bold text-white mb-2">
                  {formatTime(callDuration)}
                </div>
                <div className="text-sm text-white/60 mb-2">
                  Time remaining: {formatTime(timeRemaining)}
                </div>
                {getTimeWarning() && (
                  <p className="text-yellow-400 text-sm font-medium">
                    {getTimeWarning()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-2xl font-mono font-bold text-white mb-2">
                {callState === 'ringing' ? '📞' : callState === 'connecting' ? '🔄' : '📞'}
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">
              {callState === 'ringing' ? 'Calling:' : 'Participants:'}
            </h3>
            <div className="space-y-2">
              {activeCall?.participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {participant.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white">{participant.userName}</span>
                  {participant.status === 'connected' && (
                    <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" title="Connected" />
                  )}
                  {participant.status === 'ringing' && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto animate-pulse" title="Ringing" />
                  )}
                  {participant.status === 'disconnected' && (
                    <div className="w-2 h-2 rounded-full bg-red-500 ml-auto" title="Disconnected" />
                  )}
                </div>
              )) || participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {participant?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white">{participant}</span>
                  {callState === 'connected' && (
                    <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                  )}
                  {callState === 'ringing' && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto animate-pulse" />
                  )}
                  {callState === 'connecting' && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 ml-auto animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video Preview (for video calls) */}
          {type === 'video' && !isVideoOff && callState === 'connected' && (
            <div className="mb-6">
              <div className="bg-gray-900 rounded-lg p-4 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <VideoCameraIcon className="w-12 h-12 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">Video Preview</p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              disabled={callState !== 'connected'}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
              } ${callState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MicrophoneIcon className={`w-6 h-6 text-white ${isMuted ? 'opacity-50' : ''}`} />
            </button>

            {/* Video On/Off (for video calls) */}
            {type === 'video' && (
              <button
                onClick={toggleVideo}
                disabled={callState !== 'connected'}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
                } ${callState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isVideoOff ? (
                  <VideoCameraSlashIcon className="w-6 h-6 text-white" />
                ) : (
                  <VideoCameraIcon className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {/* Speaker */}
            <button
              onClick={toggleSpeaker}
              disabled={callState !== 'connected'}
              className={`p-4 rounded-full transition-colors ${
                isSpeakerOn ? 'bg-blue-600' : 'bg-white/20 hover:bg-white/30'
              } ${callState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSpeakerOn ? (
                <SpeakerWaveIcon className="w-6 h-6 text-white" />
              ) : (
                <SpeakerXMarkIcon className="w-6 h-6 text-white" />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={endCall}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <PhoneIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Status */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              {callState === 'ringing' && 'Waiting for answer...'}
              {callState === 'connecting' && 'Establishing connection...'}
              {callState === 'connected' && 'Call in progress'}
              {callState === 'ended' && 'Call ended'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
