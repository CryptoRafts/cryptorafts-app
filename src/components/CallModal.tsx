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

export default function CallModal({ type, roomId, participants, onEnd }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCleanedUp = useRef(false);

  useEffect(() => {
    // Start call timer
    const startTimer = () => {
      callStartTime && setCallStartTime(Date.now());
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            endCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    // Initialize call
    const initCall = async () => {
      try {
        if (type === 'video') {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localStreamRef.current = stream;
          }
        } else {
          // Voice call - get audio only
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          localStreamRef.current = stream;
          
          // Create audio context for voice calls
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(audioContextRef.current.destination);
        }

        setIsConnected(true);
        startTimer();
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
        onEnd();
      }
    };

    initCall();

    return () => {
      if (!isCleanedUp.current) {
        isCleanedUp.current = true;
        
        if (timerRef.current) clearInterval(timerRef.current);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Safely close AudioContext
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (error) {
            console.warn('AudioContext already closed:', error);
          }
        }
      }
    };
  }, [type, onEnd]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, you'd control the speaker output here
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-400'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-yellow-400'; // Last 10 minutes
    return 'text-green-400';
  };

  return (
    <div className="fixed inset-0 bg-black z-modal flex items-center justify-center">
      {/* Call Interface */}
      <div className="relative w-full h-full flex flex-col">
        {/* Video Area */}
        {type === 'video' && (
          <div className="flex-1 relative">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Voice Call Interface */}
        {type === 'voice' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl font-bold">
                  {participants[0]?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {participants[0] || 'Unknown User'}
              </h3>
              <p className="text-white/60">Voice Call</p>
            </div>
          </div>
        )}

        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-3">
            {type === 'video' ? (
              <VideoCameraIcon className="w-5 h-5 text-white" />
            ) : (
              <PhoneIcon className="w-5 h-5 text-white" />
            )}
            <div>
              <p className="text-white font-medium">
                {type === 'video' ? 'Video Call' : 'Voice Call'}
              </p>
              <p className={`text-sm font-mono ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full p-4">
            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isMuted ? (
                <MicrophoneIcon className="w-6 h-6 text-white opacity-50" />
              ) : (
                <MicrophoneIcon className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Video Toggle (Video calls only) */}
            {type === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
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

            {/* Speaker Toggle */}
            <button
              onClick={toggleSpeaker}
              className={`p-3 rounded-full transition-colors ${
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
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Time Warning */}
        {timeRemaining <= 300 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600/90 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white font-medium text-center">
              ⏰ Call ending in {formatTime(timeRemaining)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

