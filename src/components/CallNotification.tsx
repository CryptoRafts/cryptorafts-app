"use client";

import { useState, useEffect } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { callSoundManager } from '@/lib/call-sound-manager';

interface Props {
  callId: string;
  callerName: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

export default function CallNotification({ callId, callerName, callType, onAccept, onDecline }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [ringCount, setRingCount] = useState(0);

  useEffect(() => {
    // Use global sound manager to prevent multiple sounds
    callSoundManager.startRinging(callId, callerName);

    // Update ring count every 2 seconds
    const ringCountInterval = setInterval(() => {
      setRingCount(prev => prev + 1);
    }, 2000);

    // Create browser notification (only once)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Incoming ${callType} call`, {
          body: `${callerName} is calling you`,
          tag: callId,
          requireInteraction: true,
          icon: '/cryptorafts.logo (1).svg'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`Incoming ${callType} call`, {
              body: `${callerName} is calling you`,
              tag: callId,
              requireInteraction: true,
              icon: '/cryptorafts.logo (1).svg'
            });
          }
        });
      }
    }

    // Auto-decline after 30 seconds
    const autoDeclineTimer = setTimeout(() => {
      console.log('⏰ Call auto-declined after 30 seconds');
      callSoundManager.stopRinging();
      onDecline();
    }, 30000);

    return () => {
      clearInterval(ringCountInterval);
      clearTimeout(autoDeclineTimer);
      // Stop ringing when component unmounts
      callSoundManager.stopRinging();
    };
  }, [onDecline, callerName, callType, callId]);

  const handleAccept = () => {
    // Stop ringing sound immediately when accepting
    callSoundManager.stopRinging();
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    // Stop ringing sound immediately when declining
    callSoundManager.stopRinging();
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999999] animate-fadeIn"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
    >
      <div 
        className="neo-glass-card border-2 border-cyan-400/50 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl shadow-cyan-500/50 animate-bounce-slow"
        style={{
          position: 'relative',
          zIndex: 999999,
          pointerEvents: 'auto'
        }}
      >
        {/* Ringing Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-shimmer" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                🔔 Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
              </h2>
              <p className="text-sm text-white/80 font-medium animate-pulse">
                📞 {callerName} is calling... ({ringCount} rings)
              </p>
            </div>
          </div>
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
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6">
            {/* Decline */}
            <button
              onClick={handleDecline}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors border border-red-400/30 shadow-lg"
            >
              <NeonCyanIcon type="close" size={32} className="text-white" />
            </button>

            {/* Accept */}
            <button
              onClick={handleAccept}
              className="p-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors border border-green-400/30 shadow-lg"
            >
              {callType === 'video' ? (
                <NeonCyanIcon type="video" size={32} className="text-white" />
              ) : (
                <NeonCyanIcon type="phone" size={32} className="text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Tap to accept or decline the call
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
