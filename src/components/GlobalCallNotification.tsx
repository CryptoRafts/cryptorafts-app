"use client";

import { useState, useEffect } from "react";
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  isVisible: boolean;
  callerName: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export default function GlobalCallNotification({ 
  isVisible, 
  callerName, 
  callType, 
  onAccept, 
  onDecline, 
  onClose 
}: Props) {
  const [ringCount, setRingCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // Play ringing sound
    const playRingingSound = () => {
      console.log('🔔🔊 GLOBAL INCOMING CALL RINGING!');
      setRingCount(prev => prev + 1);
      
      // Play actual ringing sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create classic phone ringing sound
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, startTime);
          oscillator.type = 'sine';
          
          // Volume envelope
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + duration - 0.05);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        
        // Ring-Ring pattern (440Hz)
        playTone(440, now, 0.4);
        playTone(440, now + 0.5, 0.4);
        
        // Vibrate on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms, pause 100ms, 200ms
        }
        
        console.log('🔔 [GLOBAL CALL] Ringing sound played (with vibration on mobile)');
      } catch (error) {
        console.error('❌ [GLOBAL CALL] Error playing ringing:', error);
      }
    };

    // Play initial sound
    playRingingSound();

    // Ring every 2 seconds
    const soundInterval = setInterval(playRingingSound, 2000);

    // Auto-decline after 30 seconds
    const autoDeclineTimer = setTimeout(() => {
      console.log('⏰ Global call auto-declined after 30 seconds');
      onDecline();
    }, 30000);

    return () => {
      clearInterval(soundInterval);
      clearTimeout(autoDeclineTimer);
    };
  }, [isVisible, onDecline]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-gray-800 border border-white/20 rounded-2xl max-w-md w-full mx-4 overflow-hidden animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
              </h2>
              <p className="text-sm text-white/60">
                {callerName} is calling you...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Caller Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-semibold">
                {callerName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{callerName}</h3>
            <p className="text-white/60">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
            <p className="text-white/40 text-sm mt-2">
              Ring count: {ringCount}
            </p>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6">
            {/* Decline */}
            <button
              onClick={onDecline}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-8 h-8 text-white" />
            </button>

            {/* Accept */}
            <button
              onClick={onAccept}
              className="p-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
            >
              {callType === 'video' ? (
                <VideoCameraIcon className="w-8 h-8 text-white" />
              ) : (
                <PhoneIcon className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Tap to accept or decline the call
            </p>
            <p className="text-white/40 text-xs mt-2">
              Call will auto-decline in 30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
