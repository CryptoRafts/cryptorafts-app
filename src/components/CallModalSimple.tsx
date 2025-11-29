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

interface Props {
  type: 'video' | 'voice';
  roomId: string;
  participants: string[];
  onEnd: () => void;
}

export default function CallModalSimple({ type, roomId, participants, onEnd }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start call timer
    const startTimer = () => {
      setCallStartTime(Date.now());
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            // Auto-end call after 30 minutes
            onEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    // Simulate call connection
    const initCall = async () => {
      try {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsConnected(true);
        startTimer();
      } catch (error) {
        console.error('Error starting call:', error);
        onEnd();
      }
    };

    initCall();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [type, onEnd]);

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
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {type === 'video' ? 'Video Call' : 'Voice Call'}
              </h2>
              <p className="text-sm text-white/60">
                {isConnected ? 'Connected' : 'Connecting...'}
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
            <div className="text-3xl font-mono font-bold text-white mb-2">
              {formatTime(timeRemaining)}
            </div>
            {getTimeWarning() && (
              <p className="text-yellow-400 text-sm font-medium">
                {getTimeWarning()}
              </p>
            )}
          </div>

          {/* Participants */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Participants:</h3>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {participant.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white">{participant}</span>
                  {isConnected && (
                    <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video Preview (for video calls) */}
          {type === 'video' && !isVideoOff && (
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
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isMuted ? (
                <MicrophoneIcon className="w-6 h-6 text-white opacity-50" />
              ) : (
                <MicrophoneIcon className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Video On/Off (for video calls) */}
            {type === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
                }`}
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
              className={`p-4 rounded-full transition-colors ${
                isSpeakerOn ? 'bg-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
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
              {isConnected ? 'Call in progress' : 'Establishing connection...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
