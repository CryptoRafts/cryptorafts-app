"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  PhoneIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  SparklesIcon,
  Cog6ToothIcon,
  SignalIcon,
  ArrowsPointingOutIcon,
  ComputerDesktopIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import WebRTCManager from "@/lib/webrtc/WebRTCManager";
import simpleFirebaseCallManager from "@/lib/simpleFirebaseCallManager";
import { CALL_CONFIG } from "@/config/chat.config";
import { VideoFrameAnalyzer, saveCallAnalysis } from "@/lib/raftai/videoAnalysis";

interface Props {
  type: 'video' | 'voice';
  roomId: string;
  callId: string;
  currentUserId: string;
  currentUserName: string;
  isInitiator: boolean; // true if starting call, false if joining
  onEnd: () => void;
  
  // RaftAI Analysis (optional)
  remoteUserId?: string;
  remoteUserName?: string;
  remoteUserRole?: string;
  enableRaftAI?: boolean; // Enable AI analysis
}

export default function WebRTCCallModal({
  type,
  roomId,
  callId,
  currentUserId,
  currentUserName,
  isInitiator,
  onEnd,
  remoteUserId,
  remoteUserName,
  remoteUserRole,
  enableRaftAI = true // Enable by default
}: Props) {
  const [callState, setCallState] = useState<'initializing' | 'connecting' | 'connected' | 'failed'>('initializing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(CALL_CONFIG.maxDuration * 60); // From config
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [raftaiAnalyzing, setRaftaiAnalyzing] = useState(false);
  const [remoteVideoVisible, setRemoteVideoVisible] = useState(false);
  
  // CRITICAL: Use refs for RaftAI detection to prevent video re-renders
  // State updates from AI detection should NOT trigger video element re-renders
  const raftaiDetectionRef = useRef<{
    isReal: boolean;
    confidence: number;
    aiDetected: boolean;
    lastUpdate: number;
  } | null>(null);
  
  // RaftAI real-time detection (for UI display only - updates don't affect video)
  const [raftaiDetection, setRaftaiDetection] = useState<{
    isReal: boolean;
    confidence: number;
    aiDetected: boolean;
    lastUpdate: number;
  } | null>(null);
  
  // CRITICAL: Track if remote stream has been attached to prevent re-attachment
  const remoteStreamAttachedRef = useRef(false);
  
  // Active speaker detection
  const [activeSpeaker, setActiveSpeaker] = useState<'local' | 'remote' | null>(null);
  const [pinnedParticipant, setPinnedParticipant] = useState<'local' | 'remote' | null>(null);
  
  // Advanced controls
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'4K' | '1080p' | '720p' | '480p' | 'auto'>('4K');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  
  // Audio level monitoring refs
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callInitializedRef = useRef(false);
  const callEndedRef = useRef(false);
  const raftaiAnalyzerRef = useRef<VideoFrameAnalyzer | null>(null);
  const modalRef = useRef<HTMLDivElement>(null); // CRITICAL: Ref for modal element
  
  // Safe play mechanism to prevent AbortError from multiple play() calls
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isPlayingRef = useRef(false);
  
  // Safe play function that prevents multiple simultaneous play() calls
  const safePlay = async (videoElement: HTMLVideoElement, context: string = 'unknown'): Promise<void> => {
    if (callEndedRef.current) {
      return;
    }
    
    // If already playing, don't call play() again
    if (!videoElement.paused && !isPlayingRef.current) {
      // Video is playing but our flag isn't set - update flag
      isPlayingRef.current = true;
      return;
    }
    
    if (!videoElement.paused && isPlayingRef.current) {
      return;
    }
    
    // If a play is already in progress, wait for it to complete or abort
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
        // If previous play succeeded, we're done
        if (!videoElement.paused) {
          isPlayingRef.current = true;
          return;
        }
      } catch (err: any) {
        // AbortError is expected when srcObject changes - ignore it completely
        if (err.name === 'AbortError') {
          // Silently ignore - this is expected behavior
        } else {
          // Other errors - log but continue
          console.warn(`⚠️ [WebRTC Call] Previous play failed (${context}):`, err.name);
        }
        // Continue with new play attempt
      }
    }
    
    // Only play if paused and not already playing
    if (videoElement.paused && !isPlayingRef.current) {
      // Store the current srcObject to detect if it changes during play
      const currentSrcObject = videoElement.srcObject;
      
      isPlayingRef.current = true;
      const playPromise = videoElement.play();
      playPromiseRef.current = playPromise;
      
      playPromise
        .then(() => {
          // Check if srcObject changed during play (would cause AbortError)
          if (videoElement.srcObject !== currentSrcObject) {
            // srcObject changed - this is expected, don't log as error
            isPlayingRef.current = false;
            return;
          }
          
          isPlayingRef.current = true;
          if (!callEndedRef.current) {
            console.log(`✅ [WebRTC Call] Play successful (${context})`);
          }
        })
        .catch((err: any) => {
          isPlayingRef.current = false;
          
          // AbortError is completely expected when srcObject changes - never log it
          if (err.name === 'AbortError') {
            // Silently ignore - this is normal behavior
            return;
          }
          
          // Only log non-AbortError failures
          if (!callEndedRef.current) {
            console.error(`❌ [WebRTC Call] Play failed (${context}):`, err);
          }
        })
        .finally(() => {
          // Clear the promise reference after a delay
          const promiseToClear = playPromiseRef.current;
          setTimeout(() => {
            // Only clear if it's still the same promise (wasn't replaced)
            if (playPromiseRef.current === promiseToClear) {
              playPromiseRef.current = null;
            }
          }, 200);
        });
      
      return playPromise.catch((err: any) => {
        // Suppress AbortError completely - don't propagate it
        if (err.name === 'AbortError') {
          return Promise.resolve();
        }
        throw err;
      });
    }
  };

  // CRITICAL: Initialize video element with mobile attributes on mount and continuously
  useEffect(() => {
    const initVideo = () => {
      if (!remoteVideoRef.current) return;
      
      const video = remoteVideoRef.current;
      
      // CRITICAL: Set all mobile attributes immediately on mount
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');
      video.setAttribute('x5-video-player-type', 'h5');
      video.setAttribute('x5-video-player-fullscreen', 'true');
      video.setAttribute('x5-video-orientation', 'portrait');
      
      // CRITICAL: Set all styles immediately for mobile compatibility
      video.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 9999 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 100% !important;
        min-height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        background-color: #000000 !important;
        pointer-events: auto !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        will-change: auto !important;
      `;
      
      // Ensure video is not muted
      video.muted = false;
      video.volume = 1.0;
      
      // CRITICAL: If stream exists, force play immediately
      if (video.srcObject && video.paused) {
        safePlay(video, 'init-video-with-stream').catch(() => {});
      }
    };
    
    // Initialize immediately
    initVideo();
    
    // Also initialize after a short delay to catch late-mounted elements
    const timeout = setTimeout(initVideo, 100);
    
    // Re-initialize periodically to ensure attributes stay set (mobile browsers sometimes reset them)
    const interval = setInterval(initVideo, 1000);
    
    console.log('✅ [WebRTC Call] Video element initialization set up');
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // CRITICAL: Ensure all UI elements are visible on mobile AND desktop when call connects
  // This runs ONCE on mount and when call state changes to prevent blinking
  useEffect(() => {
    // Only run if call is active (not ended)
    if (callEndedRef.current) return;
    
    // Force all UI elements to be visible on mobile AND desktop - RUN ONCE to prevent blinking
    const ensureUIVisible = () => {
      // Skip if call has ended
      if (callEndedRef.current) return;
      
      // Ensure back button is visible - try multiple selectors
      const backButtonSelectors = [
        '[aria-label="Back to Chat"]',
        '[aria-label*="Back"]',
        'button[class*="back"]'
      ];
      for (const selector of backButtonSelectors) {
        try {
          const backButton = document.querySelector(selector) as HTMLElement;
          if (backButton && backButton.closest('#webrtc-call-modal')) {
            backButton.style.cssText = `
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 100 !important;
              position: absolute !important;
              pointer-events: auto !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            break;
          }
        } catch (e) {
          // Skip invalid selectors
          continue;
        }
      }
      
      // Also search for back button by SVG content (fallback - browser-compatible)
      try {
        const allButtons = document.querySelectorAll('#webrtc-call-modal button');
        for (const button of Array.from(allButtons)) {
          const svg = button.querySelector('svg');
          if (svg && (svg.querySelector('path[d*="M19 12"]') || button.getAttribute('aria-label')?.includes('Back'))) {
            const backButton = button as HTMLElement;
            if (backButton.closest('#webrtc-call-modal')) {
              backButton.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 100 !important;
                position: absolute !important;
                pointer-events: auto !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
              `;
              break;
            }
          }
        }
      } catch (e) {
        // Ignore errors in fallback search
      }
      
      // Ensure RaftAI badge is visible - try multiple selectors
      const raftAIBadgeSelectors = [
        '[role="status"][aria-live="polite"]',
        '[class*="RaftAI"]',
        '[class*="raftai"]'
      ];
      for (const selector of raftAIBadgeSelectors) {
        try {
          const raftAIBadge = document.querySelector(selector) as HTMLElement;
          if (raftAIBadge && raftAIBadge.closest('#webrtc-call-modal')) {
            raftAIBadge.style.cssText = `
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 100 !important;
              position: absolute !important;
              pointer-events: auto !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            break;
          }
        } catch (e) {
          // Skip invalid selectors
          continue;
        }
      }
      
      // Also search for RaftAI badge by text content (fallback - browser-compatible)
      try {
        const allDivs = document.querySelectorAll('#webrtc-call-modal div');
        for (const div of Array.from(allDivs)) {
          const text = div.textContent || '';
          if (text.includes('Live:') && (text.includes('REAL') || text.includes('AI') || text.includes('VERIFYING'))) {
            const raftAIBadge = div as HTMLElement;
            if (raftAIBadge.closest('#webrtc-call-modal')) {
              raftAIBadge.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 100 !important;
                position: absolute !important;
                pointer-events: auto !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
              `;
              break;
            }
          }
        }
      } catch (e) {
        // Ignore errors in fallback search
      }
      
      // Ensure local video container is visible
      const localVideoContainer = localVideoRef.current?.parentElement;
      if (localVideoContainer && localVideoContainer.closest('#webrtc-call-modal')) {
        localVideoContainer.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 80 !important;
          position: absolute !important;
          pointer-events: auto !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
        `;
      }
      
      // Ensure local video element itself is visible
      if (localVideoRef.current) {
        localVideoRef.current.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: ${isVideoOff ? '0.3' : '1'} !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
        `;
      }
      
      // Ensure call info (time) is visible - try multiple selectors
      const callInfoSelectors = [
        '[class*="Call Info"]',
        '[class*="callDuration"]',
        '[class*="Duration"]',
        '[class*="time"]'
      ];
      for (const selector of callInfoSelectors) {
        try {
          const callInfo = document.querySelector(selector) as HTMLElement;
          if (callInfo && callInfo.closest('#webrtc-call-modal')) {
            callInfo.style.cssText = `
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 90 !important;
              position: absolute !important;
              pointer-events: auto !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            break;
          }
        } catch (e) {
          // Skip invalid selectors
          continue;
        }
      }
      
      // Also search for call info by text content (fallback - browser-compatible)
      try {
        const allDivs = document.querySelectorAll('#webrtc-call-modal div');
        for (const div of Array.from(allDivs)) {
          const text = div.textContent || '';
          if ((text.includes('Duration:') || text.includes('Time left:') || /^\d{2}:\d{2}$/.test(text.trim())) && 
              div.closest('#webrtc-call-modal')) {
            const callInfo = div as HTMLElement;
            callInfo.style.cssText = `
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 90 !important;
              position: absolute !important;
              pointer-events: auto !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            break;
          }
        }
      } catch (e) {
        // Ignore errors in fallback search
      }
      
      // Also check for the call info container (the div that contains duration and user info)
      const callInfoContainer = Array.from(document.querySelectorAll('#webrtc-call-modal div')).find(el => {
        const text = el.textContent || '';
        return (text.includes('Duration:') || text.includes('Time left:') || text.includes('00:')) && 
               el.closest('#webrtc-call-modal');
      }) as HTMLElement;
      if (callInfoContainer) {
        callInfoContainer.style.cssText = `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 90 !important;
          position: absolute !important;
          pointer-events: auto !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
        `;
      }
      
      // Ensure remote video is visible
      if (remoteVideoRef.current) {
        remoteVideoRef.current.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
        `;
      }
    };
    
    // Run immediately
    ensureUIVisible();
    
    // Run after short delays to catch late-rendered elements
    const timeout1 = setTimeout(ensureUIVisible, 50);
    const timeout2 = setTimeout(ensureUIVisible, 100);
    const timeout3 = setTimeout(ensureUIVisible, 200);
    const timeout4 = setTimeout(ensureUIVisible, 500);
    
    // CRITICAL FIX: Disable periodic checks to prevent blinking - only run on mount and state changes
    // Removed setInterval to prevent repeated style updates that cause blinking
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, [callState, enableRaftAI, raftaiDetection, isVideoOff]);

  // CRITICAL: DISABLED - Continuous monitoring causes blinking and re-renders
  // Video element styles are locked after initial setup and should never be updated
  // This useEffect is disabled to prevent video element re-renders
  useEffect(() => {
    // DISABLED: No continuous monitoring - video styles are locked after initial setup
    return;
    
    if (!remoteVideoRef.current) return;
    
    const video = remoteVideoRef.current;
    // CRITICAL FIX: Reduce frequency and only update when needed to prevent layout shifts
    let lastVideoCheck = 0;
    const checkInterval = setInterval(() => {
      if (callEndedRef.current) {
        clearInterval(checkInterval);
        return;
      }
      
      // Only check every 1 second to prevent excessive style updates
      const now = Date.now();
      if (now - lastVideoCheck < 1000) return;
      lastVideoCheck = now;
      
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const hasVideoTrack = stream.getVideoTracks().length > 0;
        const hasAudioTrack = stream.getAudioTracks().length > 0;
        const hasActiveTracks = stream.getTracks().some(t => t.readyState === 'live');
        
        // If stream exists with active tracks, ensure video is visible
        if ((hasVideoTrack || hasAudioTrack) && hasActiveTracks) {
          // CRITICAL: Only update attributes if they're missing (prevent repeated DOM changes)
          if (!video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x5-playsinline', 'true');
            video.setAttribute('x5-video-player-type', 'h5');
            video.setAttribute('x5-video-player-fullscreen', 'true');
            video.setAttribute('preload', 'auto');
            video.setAttribute('autoplay', 'true');
          }
          
          // CRITICAL: Only play if actually paused (prevent repeated play() calls)
          if (video.paused && hasVideoTrack && !isPlayingRef.current) {
            console.log('🔧 [WebRTC Call] Video is paused with active stream, forcing play');
            safePlay(video, 'monitor-paused-fix').catch((err) => {
              console.warn('⚠️ [WebRTC Call] Failed to play video in monitor:', err);
            });
          }
          
          // CRITICAL: Only update styles if they're actually wrong (prevent layout shifts)
          const needsStyleUpdate = (
            video.style.opacity !== '1' || 
            video.style.visibility !== 'visible' || 
            video.style.display === 'none' ||
            !remoteVideoVisible
          );
          
          if (needsStyleUpdate) {
            console.log('🔧 [WebRTC Call] Updating video styles (monitor check)');
            // Use individual style properties instead of cssText to prevent full reflow
            video.style.display = 'block';
            video.style.visibility = 'visible';
            video.style.opacity = '1';
            video.style.zIndex = '9999';
            video.style.position = 'absolute';
            video.style.top = '0';
            video.style.left = '0';
            video.style.right = '0';
            video.style.bottom = '0';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.backgroundColor = '#000000';
            video.style.transform = 'translateZ(0)';
            video.style.setProperty('-webkit-transform', 'translateZ(0)');
            setRemoteVideoVisible(true);
          }
          
          // Ensure audio is playing
          if (hasAudioTrack && video.muted) {
            console.log('🔧 [WebRTC Call] Unmuting video for audio playback');
            video.muted = false;
            video.volume = 1.0;
          }
          
          // Force play if paused - use safe play to prevent AbortError
          if (video.paused && !callEndedRef.current && !isPlayingRef.current) {
            console.log('🔧 [WebRTC Call] Force playing paused video (monitor)');
            // CRITICAL: Re-apply mobile attributes before playing
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x5-playsinline', 'true');
            safePlay(video, 'monitor').then(() => {
              video.style.opacity = '1';
              video.style.visibility = 'visible';
              setRemoteVideoVisible(true);
            }).catch(() => {
              // Error already logged in safePlay - retry after delay
              setTimeout(() => {
                if (video && !callEndedRef.current && video.srcObject && video.paused) {
                  video.setAttribute('playsinline', 'true');
                  video.setAttribute('webkit-playsinline', 'true');
                  safePlay(video, 'monitor-retry').catch(() => {});
                }
              }, 500);
            });
          }
          
          // CRITICAL: Check if video is actually showing content (not black) on mobile AND desktop
          // If video has dimensions but appears black, force play again
          if (hasVideoTrack && !video.paused) {
            // CRITICAL: Ensure video container is visible and has proper dimensions (desktop fix)
            const videoContainer = video.parentElement;
            if (videoContainer) {
              const containerStyle = window.getComputedStyle(videoContainer);
              if (containerStyle.display === 'none' || containerStyle.visibility === 'hidden' || 
                  containerStyle.opacity === '0' || videoContainer.clientWidth === 0 || 
                  videoContainer.clientHeight === 0) {
                console.log('🔧 [WebRTC Call] Video container not visible, fixing...');
                videoContainer.style.cssText = `
                  position: relative !important;
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  background-color: #000000 !important;
                  z-index: 10 !important;
                  overflow: hidden !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                `;
              }
            }
            
            // Video has dimensions and is playing, but might still appear black
            // CRITICAL FIX: Only update styles if needed (prevent layout shifts)
            const needsUpdate = (
              video.style.opacity !== '1' || 
              video.style.visibility !== 'visible' || 
              video.style.display === 'none' || 
              video.clientWidth === 0 || 
              video.clientHeight === 0
            );
            
            if (needsUpdate) {
              // Use individual properties instead of cssText to prevent full reflow
              video.style.display = 'block';
              video.style.visibility = 'visible';
              video.style.opacity = '1';
              video.style.zIndex = '9999';
              video.style.position = 'absolute';
              video.style.top = '0';
              video.style.left = '0';
              video.style.right = '0';
              video.style.bottom = '0';
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.minWidth = '100%';
              video.style.minHeight = '100%';
              video.style.objectFit = 'cover';
              video.style.backgroundColor = '#000000';
              video.style.transform = 'translateZ(0)';
              video.style.setProperty('-webkit-transform', 'translateZ(0)');
              video.style.pointerEvents = 'auto';
              setRemoteVideoVisible(true);
              
              // CRITICAL: Force play on desktop if still paused
              if (video.paused && !isPlayingRef.current) {
                safePlay(video, 'monitor-desktop-play').catch((err) => {
                  console.warn('⚠️ [WebRTC Call] Failed to play video in monitor (desktop):', err);
                });
              }
            }
          }
        }
      }
    }, 1000); // CRITICAL FIX: Reduced from 200ms to 1000ms to prevent layout shifts and "moving up and down" issue
    
    return () => clearInterval(checkInterval);
  }, [callState, remoteVideoVisible]);

  // CRITICAL: DISABLED - Continuous black screen monitoring causes blinking and re-renders
  // Video element styles are locked after initial setup in onRemoteStream handler
  // This useEffect is disabled to prevent video element re-renders
  // useEffect(() => {
  //   // DISABLED: No continuous monitoring - video styles are locked after initial setup
  //   // The onRemoteStream handler sets up the video element correctly once
  //   return;
  // }, [callState, remoteVideoVisible]);

  useEffect(() => {
    // Prevent duplicate initialization (React 18 Strict Mode)
    if (callInitializedRef.current) {
      console.log('🎥 [WebRTC Call] Already initialized, skipping duplicate');
      return;
    }
    
    // CRITICAL: Reset callEndedRef when initializing a new call
    callEndedRef.current = false;
    callInitializedRef.current = true;

    console.log(`🎥 [WebRTC Call] Initializing ${type} call`);
    console.log(`🎥 [WebRTC Call] Role: ${isInitiator ? 'Initiator' : 'Joiner'}`);
    console.log(`🎥 [WebRTC Call] Call ID: ${callId}`);
    console.log(`🎥 [WebRTC Call] Room ID: ${roomId}`);
    
    // CRITICAL: Set call state to initializing immediately
    setCallState('initializing');
    
    // CRITICAL: Ensure modal is visible
    if (modalRef.current) {
      modalRef.current.style.display = 'flex';
      modalRef.current.style.visibility = 'visible';
      modalRef.current.style.opacity = '1';
      modalRef.current.style.pointerEvents = 'auto';
      modalRef.current.style.zIndex = '2147483647';
    }
    
    // Add keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'm':
          toggleMute();
          break;
        case 'v':
          if (type === 'video') toggleVideo();
          break;
        case 'f':
          if (type === 'video') toggleFullscreen();
          break;
        case 'q':
          if (type === 'video') setShowQualityMenu(!showQualityMenu);
          break;
        case 'e':
        case 'escape':
          if (e.key === 'Escape') {
            // Close quality menu if open, otherwise end call
            if (showQualityMenu) {
              setShowQualityMenu(false);
            } else {
              endCall();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    const manager = new WebRTCManager(currentUserId, currentUserName, roomId);
    webrtcManagerRef.current = manager;

    // Set up callbacks
    manager.onLocalStream((stream) => {
      console.log('📹 [WebRTC Call] Local stream received', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Always show local video in the PiP window - FORCE VISIBILITY
      if (localVideoRef.current && type === 'video') {
        const video = localVideoRef.current;
        const container = video.parentElement;
        
        // CRITICAL: Force container visibility FIRST
        if (container) {
          container.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            top: 16px !important;
            right: 16px !important;
            z-index: 80 !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
            width: clamp(120px, 25vw, 320px) !important;
            height: clamp(90px, 18.75vw, 240px) !important;
          `;
        }
        
        // CRITICAL: Set all attributes FIRST
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');
        
        // CRITICAL: Set styles BEFORE srcObject to prevent blinking
        video.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: ${isVideoOff ? '0.3' : '1'} !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          position: relative !important;
          z-index: 1 !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
          transition: none !important;
          animation: none !important;
        `;
        
        // NOW set srcObject
        video.srcObject = stream;
        video.muted = true; // Always mute local video
        
        // CRITICAL: Force play immediately
        safePlay(video, 'onLocalStream').catch(() => {});
      }

      // CRITICAL: Use local video as a temporary full‑screen preview until remote video arrives
      // This prevents the large black area and makes layout immediately look like Zoom/Google Meet
      if (remoteVideoRef.current) {
        const remoteEl = remoteVideoRef.current;
        const existingStream = remoteEl.srcObject as MediaStream | null;
        
        // Check if current stream is actually a remote stream (not local preview)
        const isLocalPreview = existingStream && 
          existingStream.getVideoTracks().some(t => {
            // Check if this track is from local stream by comparing with local video tracks
            if (localVideoRef.current?.srcObject) {
              const localStream = localVideoRef.current.srcObject as MediaStream;
              return localStream.getVideoTracks().some(lt => lt.id === t.id);
            }
            return false;
          });
        
        const hasRealRemoteVideo = existingStream && !isLocalPreview &&
          existingStream.getVideoTracks().some(t => t.readyState === 'live');

        // Only attach local stream to remote video element if there is no real remote video yet
        if (!hasRealRemoteVideo) {
          console.log('📹 [WebRTC Call] Using local stream as temporary main video preview (Zoom/Meet style)');
          remoteEl.srcObject = stream;
          remoteEl.muted = true; // mute to avoid any echo
          remoteEl.volume = 0;
          remoteEl.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            background-color: #000000 !important;
            z-index: 9999 !important;
            pointer-events: auto !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
          `;
          setRemoteVideoVisible(true);
          safePlay(remoteEl, 'local-preview-main-video').catch(() => {});
        }
      }
    });

    manager.onRemoteStream((stream) => {
      // FIXED: Don't process stream if call is ending or ended
      if (callEndedRef.current || callState === 'failed') {
        console.log('⚠️ [WebRTC Call] Ignoring remote stream - call is ending or ended');
        return;
      }
      
      // CRITICAL: Prevent re-attaching stream if already attached (prevents black screen and blinking)
      if (remoteStreamAttachedRef.current && remoteVideoRef.current?.srcObject) {
        const existingStream = remoteVideoRef.current.srcObject as MediaStream;
        const existingTracks = existingStream.getTracks();
        const newTracks = stream.getTracks();
        
        // Check if it's the same stream (same track IDs)
        const isSameStream = existingTracks.length === newTracks.length &&
          existingTracks.every(et => newTracks.some(nt => nt.id === et.id));
        
        if (isSameStream) {
          console.log('📹 [WebRTC Call] Stream already attached, skipping re-attachment (prevents blinking)');
          return;
        }
      }
      
      console.log('📹 [WebRTC Call] Remote stream received', {
        isInitiator,
        callState,
        hasVideoTracks: stream.getVideoTracks().length,
        hasAudioTracks: stream.getAudioTracks().length
      });
      const streamAudioTracks = stream.getAudioTracks();
      const streamVideoTracks = stream.getVideoTracks();
      console.log('🎵 Stream tracks - Audio:', streamAudioTracks.length, 'Video:', streamVideoTracks.length);
      console.log('🎵 Audio track states:', streamAudioTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })));
      console.log('📹 Video track states:', streamVideoTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })));
      
      // Store the stream reference for later checking
      const streamRef = stream;
      
      if (!remoteVideoRef.current) {
        console.error('❌ [WebRTC Call] Remote video ref not available');
        // Retry after a short delay - ref might not be ready yet
        setTimeout(() => {
          if (remoteVideoRef.current && !callEndedRef.current && stream) {
            console.log('🔄 [WebRTC Call] Retrying remote stream setup after ref ready');
            // Re-trigger the stream setup by calling the callback logic directly
            const videoElement = remoteVideoRef.current;
            if (videoElement) {
          // CRITICAL: Mark as attached BEFORE setting to prevent re-attachment
          remoteStreamAttachedRef.current = true;
          videoElement.srcObject = stream;
          videoElement.muted = false;
          videoElement.volume = 1.0;
          // CRITICAL: Lock styles - set once and never update again (prevents blinking)
          videoElement.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 20 !important;
            background-color: #000000 !important;
            transition: none !important;
            animation: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          `;
          setRemoteVideoVisible(true);
          safePlay(videoElement, 'retry-after-ref-ready').catch(() => {});
            }
          }
        }, 100);
        return;
      }
      
      const videoElement = remoteVideoRef.current;
      const currentStream = videoElement.srcObject as MediaStream;
      
      // CRITICAL: Always ensure video element has proper sizing regardless of who initiated
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.minWidth = '100%';
      videoElement.style.minHeight = '100%';
      videoElement.style.maxWidth = '100%';
      videoElement.style.maxHeight = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.objectPosition = 'center';
      
      // CRITICAL: Check if current stream is local preview - if so, always replace with remote
      const isLocalPreview = currentStream && 
        currentStream.getVideoTracks().some(t => {
          if (localVideoRef.current?.srcObject) {
            const localStream = localVideoRef.current.srcObject as MediaStream;
            return localStream.getVideoTracks().some(lt => lt.id === t.id);
          }
          return false;
        });
      
      // If current stream is local preview, always replace with remote stream
      if (isLocalPreview) {
        console.log('📹 [WebRTC Call] Replacing local preview with remote stream');
        // Continue to set up the remote stream below (skip the existing stream check)
      } else if (currentStream) {
        // Check if we need to update the stream (new tracks added)
        const currentTracks = currentStream.getTracks();
        const newTracks = stream.getTracks();
        
        // Check if all current tracks are in the new stream and counts match
        const allCurrentTracksExist = currentTracks.every(ct => 
          newTracks.some(nt => nt.id === ct.id)
        );
        const trackCountsMatch = currentTracks.length === newTracks.length;
        
        // If it's the same stream with same tracks, just ensure visibility and playback
        if (allCurrentTracksExist && trackCountsMatch) {
          console.log('📹 [WebRTC Call] Stream already set with same tracks, ensuring it plays');
          // CRITICAL: Always ensure perfect sizing - NO STRETCH
          videoElement.style.position = 'absolute';
          videoElement.style.top = '0';
          videoElement.style.left = '0';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.minWidth = '0';
          videoElement.style.minHeight = '0';
          videoElement.style.maxWidth = '100%';
          videoElement.style.maxHeight = '100%';
          videoElement.style.objectFit = 'cover'; // Prevents stretching
          videoElement.style.objectPosition = 'center';
          videoElement.style.opacity = '1';
          videoElement.style.visibility = 'visible';
          videoElement.style.zIndex = '20';
          videoElement.style.display = 'block';
          setRemoteVideoVisible(true);
          
          if (videoElement.paused && !callEndedRef.current) {
            safePlay(videoElement, 'existing-stream-resume').then(() => {
              console.log('✅ [WebRTC Call] Existing stream resumed playing');
              setRemoteVideoVisible(true);
              videoElement.style.opacity = '1';
            }).catch(() => {
              // Error already logged in safePlay
            });
          } else if (!videoElement.paused) {
            console.log('✅ [WebRTC Call] Stream already playing, ensuring visibility');
            videoElement.style.opacity = '1';
            setRemoteVideoVisible(true);
          }
          return;
        } else if (allCurrentTracksExist && newTracks.length > currentTracks.length) {
          // New tracks were added - update the stream by adding missing tracks
          console.log('📹 [WebRTC Call] New tracks added to stream, updating video element');
          
          // Add missing tracks to the existing stream on the video element
          const missingTracks = newTracks.filter(nt => 
            !currentTracks.some(ct => ct.id === nt.id)
          );
          
          // Instead of adding tracks to existing stream, replace with new stream that has all tracks
          // This ensures the video element properly detects the new video track
          console.log('📹 [WebRTC Call] Replacing stream with complete stream (all tracks)', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
            totalTracks: stream.getTracks().length
          });
          
          // CRITICAL: Ensure all tracks are active and unmuted before setting srcObject
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              if (!track.enabled) {
                track.enabled = true;
                console.log('🔧 [WebRTC Call] Enabled track:', track.kind, track.id);
              }
              // Handle muted tracks
              if (track.muted) {
                console.log('🔧 [WebRTC Call] Track is muted, waiting for unmute:', track.kind, track.id);
                track.onunmute = () => {
                  console.log('✅ [WebRTC Call] Track unmuted:', track.kind, track.id);
                  if (remoteVideoRef.current && !callEndedRef.current) {
                    safePlay(remoteVideoRef.current, `track-unmute-${track.kind}`).catch(() => {});
                  }
                };
              }
            }
          });
          
          videoElement.srcObject = stream;
          videoElement.muted = false;
          videoElement.volume = 1.0;
          videoElement.style.display = 'block';
          videoElement.style.visibility = 'visible';
          videoElement.style.opacity = '1';
          videoElement.style.zIndex = '10';
          videoElement.style.position = 'absolute';
          videoElement.style.top = '0';
          videoElement.style.left = '0';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.minWidth = '0';
          videoElement.style.minHeight = '0';
          videoElement.style.maxWidth = '100%';
          videoElement.style.maxHeight = '100%';
          videoElement.style.objectFit = 'cover'; // Prevents stretching
          videoElement.style.objectPosition = 'center';
          setRemoteVideoVisible(true);
          
          // Force play with a small delay to ensure srcObject is set
          requestAnimationFrame(() => {
            if (callEndedRef.current || !remoteVideoRef.current) return;
            
              setTimeout(() => {
                if (callEndedRef.current || !remoteVideoRef.current) return;
                
                safePlay(remoteVideoRef.current, 'new-tracks').then(() => {
                  console.log('✅ [WebRTC Call] Stream with new tracks is now playing!');
                  setRemoteVideoVisible(true);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.style.opacity = '1';
                    remoteVideoRef.current.style.visibility = 'visible';
                  }
                }).catch(() => {
                  // Error already logged in safePlay, retry once after delay
                  if (!callEndedRef.current) {
                    setTimeout(() => {
                      if (remoteVideoRef.current && !callEndedRef.current) {
                        safePlay(remoteVideoRef.current, 'new-tracks-retry').catch(() => {});
                      }
                    }, 500);
                  }
                });
              }, 100);
          });
          return;
        } else {
          // Different stream - replace it
          console.log('📹 [WebRTC Call] Different stream received, replacing');
          // Continue to set up the stream below
        }
      }
        
      // FIXED: Don't set stream if call is ending
      if (callEndedRef.current) {
        console.log('⚠️ [WebRTC Call] Call is ending, not setting remote stream');
        return;
      }
      
      // FIXED: Set stream immediately, then use requestAnimationFrame to avoid play() interruption
      console.log('📹 [WebRTC Call] Setting remote stream to video element');
      
      // Store if there was a previous stream playing
      const hadPreviousStream = !!videoElement.srcObject;
      const wasPlaying = !videoElement.paused && hadPreviousStream;
      
      // Ensure parent container has dimensions before setting stream
      const parentContainer = videoElement.parentElement;
      if (parentContainer) {
        const containerWidth = parentContainer.clientWidth || parentContainer.offsetWidth;
        const containerHeight = parentContainer.clientHeight || parentContainer.offsetHeight;
        if (containerWidth === 0 || containerHeight === 0) {
          console.log('⚠️ [WebRTC Call] Parent container has no dimensions, waiting...', {
            containerWidth,
            containerHeight
          });
          // Wait for container to have dimensions
          setTimeout(() => {
            if (!callEndedRef.current && remoteVideoRef.current) {
              const retryContainer = remoteVideoRef.current.parentElement;
              if (retryContainer && (retryContainer.clientWidth > 0 || retryContainer.offsetWidth > 0)) {
                console.log('✅ [WebRTC Call] Container now has dimensions, setting stream');
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = stream;
                  remoteVideoRef.current.muted = false;
                  remoteVideoRef.current.volume = 1.0;
                  remoteVideoRef.current.style.display = 'block';
                  remoteVideoRef.current.style.visibility = 'visible';
                  remoteVideoRef.current.style.opacity = '1';
                  remoteVideoRef.current.style.zIndex = '10';
                  remoteVideoRef.current.style.position = 'absolute';
                  remoteVideoRef.current.style.top = '0';
                  remoteVideoRef.current.style.left = '0';
                  remoteVideoRef.current.style.width = '100%';
                  remoteVideoRef.current.style.height = '100%';
                  remoteVideoRef.current.style.minWidth = '0';
                  remoteVideoRef.current.style.minHeight = '0';
                  remoteVideoRef.current.style.maxWidth = '100%';
                  remoteVideoRef.current.style.maxHeight = '100%';
                  remoteVideoRef.current.style.objectFit = 'cover'; // Prevents stretching
                  remoteVideoRef.current.style.objectPosition = 'center';
                  setRemoteVideoVisible(true);
                  safePlay(remoteVideoRef.current, 'container-ready').catch(() => {});
                }
              }
            }
          }, 100);
          return;
        }
      }
      
      // CRITICAL: Ensure all tracks are active and unmuted before setting srcObject
      stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          if (!track.enabled) {
            track.enabled = true;
            console.log('🔧 [WebRTC Call] Enabled track before setting srcObject:', track.kind, track.id);
          }
          // Handle muted tracks - listen for unmute event
          if (track.muted) {
            console.log('🔧 [WebRTC Call] Track is muted, waiting for unmute:', track.kind, track.id);
            track.onunmute = () => {
              console.log('✅ [WebRTC Call] Track unmuted:', track.kind, track.id);
              // Force video element to play when track unmutes
              if (remoteVideoRef.current && !callEndedRef.current) {
                safePlay(remoteVideoRef.current, `track-unmute-${track.kind}`).catch(() => {});
              }
            };
          }
        }
      });
      
      console.log('📹 [WebRTC Call] Setting stream with tracks:', {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
        total: stream.getTracks().length,
        trackStates: stream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, readyState: t.readyState }))
      });
      
      // CRITICAL: Mark stream as attached BEFORE setting srcObject to prevent re-attachment
      remoteStreamAttachedRef.current = true;
      
      // CRITICAL: Set all styles and attributes BEFORE setting srcObject for mobile compatibility
      // Mobile browsers require this order to properly display video
      
      // CRITICAL: Set playsInline attribute for mobile FIRST (must be done via setAttribute)
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      videoElement.setAttribute('x5-playsinline', 'true');
      videoElement.setAttribute('x5-video-player-type', 'h5');
      videoElement.setAttribute('x5-video-player-fullscreen', 'true');
      videoElement.setAttribute('x5-video-orientation', 'portrait');
      
      // CRITICAL: Set all styles BEFORE setting srcObject for mobile compatibility
      // Use cssText with !important to override any conflicting styles on mobile
      // CRITICAL: Lock styles to prevent re-renders - NO transitions, animations, or filters
      videoElement.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 20 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 100% !important;
        min-height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        background-color: #000000 !important;
        pointer-events: auto !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        will-change: auto !important;
        transition: none !important;
        animation: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      `;
      
      // CRITICAL: Also ensure parent container is properly styled BEFORE setting stream
      // CRITICAL: Use STRETCH instead of CENTER to fill entire container - NO BLACK AREAS
      const container = videoElement.parentElement;
      if (container) {
        container.style.cssText = `
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          display: flex !important;
          align-items: stretch !important;
          justify-content: stretch !important;
          background-color: #000000 !important;
          z-index: 10 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
        `;
      }
      
      // CRITICAL: Ensure video element is NOT muted so audio plays
      videoElement.muted = false;
      videoElement.volume = 1.0;
      
      // CRITICAL: Remove any existing srcObject first to prevent conflicts
      // Don't stop tracks - they might still be needed
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
        // Small delay to ensure cleanup completes
        setTimeout(() => {
          if (!callEndedRef.current && remoteVideoRef.current) {
            const video = remoteVideoRef.current;
            // CRITICAL: Re-apply all mobile attributes before setting stream
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x5-playsinline', 'true');
            video.setAttribute('x5-video-player-type', 'h5');
            video.setAttribute('x5-video-player-fullscreen', 'true');
            
            video.srcObject = stream;
            video.muted = false;
            video.volume = 1.0;
            setRemoteVideoVisible(true);
            // Force play immediately with multiple retries for mobile
            safePlay(video, 'stream-replace').then(() => {
              // Ensure visibility after play
              video.style.opacity = '1';
              video.style.visibility = 'visible';
            }).catch(() => {
              // Retry after short delay
              setTimeout(() => {
                if (video && !callEndedRef.current && video.srcObject) {
                  safePlay(video, 'stream-replace-retry').catch(() => {});
                }
              }, 200);
            });
          }
        }, 10);
      } else {
        // CRITICAL: Set stream immediately if no previous stream - ONLY ONCE
        // Mark as attached BEFORE setting to prevent re-attachment
        remoteStreamAttachedRef.current = true;
        videoElement.srcObject = stream;
        
        // CRITICAL: For mobile, we need to trigger play immediately with user interaction context
        // Create a synthetic click event to satisfy mobile browser autoplay policies
        const triggerMobilePlay = () => {
          if (!callEndedRef.current && remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            const video = remoteVideoRef.current;
            // Re-apply mobile attributes
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x5-playsinline', 'true');
            video.setAttribute('x5-video-player-type', 'h5');
            video.setAttribute('x5-video-player-fullscreen', 'true');
            
            // Force visibility styles
            video.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 9999 !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              background-color: #000000 !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            
            safePlay(video, 'initial-stream-set').then(() => {
              if (video) {
                video.style.opacity = '1';
                video.style.visibility = 'visible';
                setRemoteVideoVisible(true);
                console.log('✅ [WebRTC Call] Mobile video playing successfully');
              }
            }).catch(() => {
              // Retry after delay with more aggressive approach
              setTimeout(() => {
                if (remoteVideoRef.current && !callEndedRef.current && remoteVideoRef.current.srcObject) {
                  const retryVideo = remoteVideoRef.current;
                  retryVideo.setAttribute('playsinline', 'true');
                  retryVideo.setAttribute('webkit-playsinline', 'true');
                  safePlay(retryVideo, 'initial-stream-retry').catch(() => {
                    // Final retry after longer delay
                    setTimeout(() => {
                      if (remoteVideoRef.current && !callEndedRef.current && remoteVideoRef.current.srcObject) {
                        safePlay(remoteVideoRef.current, 'initial-stream-final-retry').catch(() => {});
                      }
                    }, 500);
                  });
                }
              }, 300);
            });
          }
        };
        
        // CRITICAL: Try immediate play for mobile (before requestAnimationFrame)
        if (videoElement.srcObject && videoElement.paused) {
          safePlay(videoElement, 'immediate-stream-set').catch(() => {
            // Will retry in requestAnimationFrame
          });
        }
        
        // CRITICAL: Force play immediately for mobile
        requestAnimationFrame(triggerMobilePlay);
        
        // Also try after a short delay for mobile browsers that need more time
        setTimeout(triggerMobilePlay, 50);
        setTimeout(triggerMobilePlay, 200);
      }
      
      // CRITICAL: Force video to be in viewport on mobile
      videoElement.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
      
      // Update state immediately to ensure React re-renders
      setRemoteVideoVisible(true);
      
      // CRITICAL: Force play immediately for mobile browsers
      // Mobile browsers require play() to be called in user gesture context
      // We use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (callEndedRef.current || !remoteVideoRef.current) return;
        
        const video = remoteVideoRef.current;
        
        // CRITICAL: Re-apply mobile attributes BEFORE setting styles
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');
        video.setAttribute('preload', 'auto');
        video.setAttribute('autoplay', 'true');
        
        // CRITICAL: Ensure video element is visible and has proper attributes - use cssText for mobile
        video.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 9999 !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          background-color: #000000 !important;
          pointer-events: auto !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
          -webkit-backface-visibility: hidden !important;
          backface-visibility: hidden !important;
          will-change: auto !important;
        `;
        
        // CRITICAL: Ensure parent container fills ENTIRE space - NO BLACK AREAS
        const container = video.parentElement;
        if (container) {
          container.style.cssText = `
            position: relative !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            background-color: #000000 !important;
            z-index: 10 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          `;
        }
        
        // CRITICAL: Re-apply mobile attributes
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');
        
        if (video.srcObject && !video.paused && video.readyState >= 2) {
          // Already playing and has data
          console.log('✅ [WebRTC Call] Video already playing with data');
          video.style.opacity = '1';
          video.style.visibility = 'visible';
          setRemoteVideoVisible(true);
          return;
        }
        
        // CRITICAL: Force play with multiple attempts for mobile
        safePlay(video, 'immediate-after-srcObject').then(() => {
          console.log('✅ [WebRTC Call] Video started playing immediately after srcObject set');
          
          // CRITICAL: Force all visibility styles for mobile
          video.style.opacity = '1';
          video.style.visibility = 'visible';
          video.style.display = 'block';
          video.style.position = 'absolute';
          video.style.top = '0';
          video.style.left = '0';
          video.style.right = '0';
          video.style.bottom = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.zIndex = '9999';
          video.style.backgroundColor = '#000000';
          video.style.transform = 'translateZ(0)';
          video.style.webkitTransform = 'translateZ(0)';
          video.style.willChange = 'auto';
          setRemoteVideoVisible(true);
          
          // CRITICAL: Additional check after play succeeds - especially for mobile
          setTimeout(() => {
            if (callEndedRef.current || !remoteVideoRef.current) return;
            const checkVideo = remoteVideoRef.current;
            
            // CRITICAL: Re-apply all styles for mobile browsers
            checkVideo.style.opacity = '1';
            checkVideo.style.visibility = 'visible';
            checkVideo.style.display = 'block';
            checkVideo.style.position = 'absolute';
            checkVideo.style.top = '0';
            checkVideo.style.left = '0';
            checkVideo.style.right = '0';
            checkVideo.style.bottom = '0';
            checkVideo.style.width = '100%';
            checkVideo.style.height = '100%';
            checkVideo.style.zIndex = '9999';
            checkVideo.style.backgroundColor = '#000000';
            checkVideo.style.transform = 'translateZ(0)';
            checkVideo.style.webkitTransform = 'translateZ(0)';
            
            // CRITICAL: Re-apply cssText to ensure all styles are enforced
            checkVideo.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 9999 !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              background-color: #000000 !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            
            if (checkVideo.paused) {
              console.log('⚠️ [WebRTC Call] Video paused after play, retrying...');
              safePlay(checkVideo, 'post-play-retry').catch(() => {});
            }
            setRemoteVideoVisible(true);
          }, 200);
          
          // CRITICAL: Additional mobile-specific check after longer delay
          setTimeout(() => {
            if (callEndedRef.current || !remoteVideoRef.current) return;
            const checkVideo = remoteVideoRef.current;
            
            // Force visibility again for mobile browsers with cssText
            checkVideo.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              z-index: 9999 !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              background-color: #000000 !important;
              transform: translateZ(0) !important;
              -webkit-transform: translateZ(0) !important;
            `;
            
            // Ensure video is playing
            if (checkVideo.paused && checkVideo.srcObject) {
              console.log('⚠️ [WebRTC Call] Video paused on mobile, forcing play...');
              safePlay(checkVideo, 'mobile-retry').catch(() => {});
            }
            setRemoteVideoVisible(true);
          }, 500);
        }).catch(() => {
          // Retry after short delay for mobile browsers
          setTimeout(() => {
            if (callEndedRef.current || !remoteVideoRef.current) return;
            const retryVideo = remoteVideoRef.current;
            if (retryVideo.srcObject) {
              // Re-apply all attributes and styles for mobile
              retryVideo.setAttribute('playsinline', 'true');
              retryVideo.setAttribute('webkit-playsinline', 'true');
              retryVideo.setAttribute('x5-playsinline', 'true');
              retryVideo.setAttribute('x5-video-player-type', 'h5');
              retryVideo.setAttribute('x5-video-player-fullscreen', 'true');
              
              retryVideo.style.opacity = '1';
              retryVideo.style.visibility = 'visible';
              retryVideo.style.display = 'block';
              retryVideo.style.position = 'absolute';
              retryVideo.style.top = '0';
              retryVideo.style.left = '0';
              retryVideo.style.right = '0';
              retryVideo.style.bottom = '0';
              retryVideo.style.width = '100%';
              retryVideo.style.height = '100%';
              retryVideo.style.zIndex = '20';
              retryVideo.style.backgroundColor = '#000000';
              
              safePlay(retryVideo, 'retry-after-srcObject').then(() => {
                console.log('✅ [WebRTC Call] Video started playing on retry');
                retryVideo.style.opacity = '1';
                retryVideo.style.visibility = 'visible';
                setRemoteVideoVisible(true);
              }).catch(() => {});
            }
          }, 100);
        });
      });
      
      // Log video element state for debugging
      console.log('📹 [WebRTC Call] Video element configured:', {
        muted: videoElement.muted,
        volume: videoElement.volume,
        paused: videoElement.paused,
        readyState: videoElement.readyState,
        hasAudioTracks: stream.getAudioTracks().length > 0,
        hasVideoTracks: stream.getVideoTracks().length > 0
      });
      
      // Log track states
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('📹 [WebRTC Call] Setting stream with', audioTracks.length, 'audio and', videoTracks.length, 'video tracks');
      audioTracks.forEach(track => {
        console.log('🎤 Audio track:', { id: track.id, enabled: track.enabled, readyState: track.readyState, muted: track.muted });
      });
      videoTracks.forEach(track => {
        console.log('📹 Video track:', { id: track.id, enabled: track.enabled, readyState: track.readyState, muted: track.muted });
      });
      
        // Use requestAnimationFrame to ensure DOM is updated before playing
        // This prevents "play() request was interrupted" errors
        requestAnimationFrame(() => {
          // Double-check call is still active
          if (callEndedRef.current || !remoteVideoRef.current) {
            console.log('⚠️ [WebRTC Call] Call ended or ref missing, not playing');
            return;
          }
          
          const currentVideoElement = remoteVideoRef.current;
          const currentSrcObject = currentVideoElement.srcObject as MediaStream;
          
          // Check if tracks match instead of stream reference (since WebRTCManager creates new stream refs)
          let shouldUpdateStream = false;
          if (currentSrcObject) {
            const currentTracks = currentSrcObject.getTracks();
            const streamTracks = stream.getTracks();
            const allStreamTracksExist = streamTracks.every(st => 
              currentTracks.some(ct => ct.id === st.id)
            );
            const trackCountsMatch = currentTracks.length === streamTracks.length;
            
            if (!allStreamTracksExist || !trackCountsMatch) {
              console.log('📹 [WebRTC Call] Stream tracks changed, updating srcObject');
              shouldUpdateStream = true;
            }
          } else {
            shouldUpdateStream = true;
          }
          
          if (shouldUpdateStream) {
            // CRITICAL: Mark as attached BEFORE setting to prevent re-attachment
            remoteStreamAttachedRef.current = true;
            currentVideoElement.srcObject = stream;
            // CRITICAL: Ensure video element is NOT muted so audio plays
            currentVideoElement.muted = false;
            currentVideoElement.volume = 1.0;
            currentVideoElement.style.opacity = '1';
            currentVideoElement.style.visibility = 'visible';
            currentVideoElement.style.display = 'block';
            currentVideoElement.style.position = 'absolute';
            currentVideoElement.style.top = '0';
            currentVideoElement.style.left = '0';
            currentVideoElement.style.width = '100%';
            currentVideoElement.style.height = '100%';
            currentVideoElement.style.minWidth = '0';
            currentVideoElement.style.minHeight = '0';
            currentVideoElement.style.maxWidth = '100%';
            currentVideoElement.style.maxHeight = '100%';
            currentVideoElement.style.objectFit = 'cover'; // Prevents stretching
            currentVideoElement.style.objectPosition = 'center';
            setRemoteVideoVisible(true);
            
            console.log('📹 [WebRTC Call] Updated video element:', {
              muted: currentVideoElement.muted,
              volume: currentVideoElement.volume,
              hasAudioTracks: stream.getAudioTracks().length > 0,
              hasVideoTracks: stream.getVideoTracks().length > 0
            });
          }
          
          // Small additional delay to ensure srcObject is fully set
          setTimeout(() => {
            if (callEndedRef.current || !remoteVideoRef.current) {
              return;
            }
            
            // Verify tracks are present
            const finalSrcObject = remoteVideoRef.current.srcObject as MediaStream;
            if (!finalSrcObject || finalSrcObject.getTracks().length === 0) {
              console.log('⚠️ [WebRTC Call] No tracks in stream, not playing');
              return;
            }
            
            // Use safe play to prevent AbortError
            const playPromise = safePlay(videoElement, 'remote-stream-initial');
            
            playPromise.then(() => {
              console.log('✅ [WebRTC Call] Remote audio/video playing successfully!');
              // CRITICAL: Make video visible
              videoElement.style.opacity = '1';
              videoElement.style.visibility = 'visible';
              videoElement.style.zIndex = '10';
              videoElement.style.display = 'block';
              // CRITICAL: Ensure audio is enabled and NOT muted
              videoElement.muted = false;
              videoElement.volume = 1.0;
              
              // Double-check all audio tracks are enabled
              const streamAudioTracks = stream.getAudioTracks();
              streamAudioTracks.forEach(track => {
                if (!track.enabled) {
                  track.enabled = true;
                  console.log('🔧 [WebRTC Call] Enabled audio track after play:', track.id);
                }
              });
              
              setRemoteVideoVisible(true); // Update state to trigger re-render
              
              // Force a re-check after a short delay to ensure visibility
              setTimeout(() => {
                if (remoteVideoRef.current && !callEndedRef.current) {
                  remoteVideoRef.current.style.opacity = '1';
                  remoteVideoRef.current.style.visibility = 'visible';
                  setRemoteVideoVisible(true);
                }
              }, 100);
              
              console.log('📹 [WebRTC Call] Video element:', {
                paused: videoElement.paused,
                muted: videoElement.muted,
                volume: videoElement.volume,
                readyState: videoElement.readyState,
                videoWidth: videoElement.videoWidth,
                videoHeight: videoElement.videoHeight,
                srcObject: !!videoElement.srcObject,
                opacity: videoElement.style.opacity,
                zIndex: videoElement.style.zIndex,
                display: videoElement.style.display,
                clientWidth: videoElement.clientWidth,
                clientHeight: videoElement.clientHeight,
                offsetWidth: videoElement.offsetWidth,
                offsetHeight: videoElement.offsetHeight
              });
              
              // Always wait for video dimensions - they may not be available immediately
              // Also ensure video element has proper size in DOM
              const waitForDimensions = (maxAttempts = 200) => {
                if (callEndedRef.current || !remoteVideoRef.current) return;
                
                const video = remoteVideoRef.current;
                // CRITICAL: Check the ACTUAL stream attached to the video element
                const actualStream = video.srcObject as MediaStream;
                
                // Also check the callback stream parameter (from closure) in case tracks are there
                const callbackStreamTracks = stream?.getVideoTracks() || [];
                const actualStreamTracks = actualStream?.getVideoTracks() || [];
                
                // Combine both to get all possible video tracks
                const allVideoTracks = [...actualStreamTracks, ...callbackStreamTracks];
                const uniqueVideoTracks = Array.from(new Map(allVideoTracks.map(t => [t.id, t])).values());
                const hasVideoTrack = uniqueVideoTracks.length > 0 && uniqueVideoTracks.some(t => t.readyState === 'live' && t.enabled);
                
                // Use actualStreamTracks for logging
                const videoTracks = actualStreamTracks.length > 0 ? actualStreamTracks : callbackStreamTracks;
                
                // Ensure video element is visible and has size
                if (video.clientWidth === 0 || video.clientHeight === 0) {
                  // Force video element to have dimensions
                  const parent = video.parentElement;
                  if (parent) {
                    const parentWidth = parent.clientWidth || window.innerWidth;
                    const parentHeight = parent.clientHeight || window.innerHeight;
                    if (parentWidth > 0 && parentHeight > 0) {
                      video.style.width = `${parentWidth}px`;
                      video.style.height = `${parentHeight}px`;
                    }
                  }
                }
                
                // Check if video has actual video dimensions (from stream)
                // For WebRTC, videoWidth/Height may be 0 initially even if video is playing
                // We need to wait for the video track to actually produce frames
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('✅ [WebRTC Call] Video dimensions loaded:', {
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    clientWidth: video.clientWidth,
                    clientHeight: video.clientHeight,
                    readyState: video.readyState,
                    hasVideoTrack,
                    videoTrackState: videoTracks[0]?.readyState
                  });
                  // Ensure visibility
                  video.style.opacity = '1';
                  video.style.visibility = 'visible';
                  video.style.display = 'block';
                  setRemoteVideoVisible(true);
                  
                  // Start RaftAI video analysis (only for video calls)
                  if (type === 'video' && enableRaftAI && remoteUserId && !callEndedRef.current) {
                    console.log('🤖 [RaftAI] Starting video analysis of remote participant', {
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight
                    });
                    setRaftaiAnalyzing(true);
                    
                    raftaiAnalyzerRef.current = new VideoFrameAnalyzer();
                    
                    // CRITICAL: Set up real-time callback for RaftAI detection
                    raftaiAnalyzerRef.current.onFrameAnalyzed((frame: any) => {
                      // ENHANCED: Improved detection logic with liveness checks
                      // Use liveness indicators for better detection
                      const liveness = frame.liveness || {};
                      const hasBlink = liveness.blinkDetected !== false; // Default to true if not specified
                      const hasMicroMovements = liveness.microMovements !== false; // Default to true
                      const naturalMovement = liveness.naturalMovement !== false; // Default to true
                      
                      // ENHANCED: Real person detection with liveness checks
                      // Real person: Low risk AND high authenticity (>0.75) AND liveness indicators
                      const isReal = frame.deepfakeRisk === 'low' && 
                                    frame.authenticityScore > 0.75 &&
                                    (hasBlink || hasMicroMovements || naturalMovement);
                      
                      // ENHANCED: AI detected with liveness failure
                      // AI detected: High risk OR (medium risk with low authenticity) OR (no liveness indicators)
                      const aiDetected = frame.deepfakeRisk === 'high' || 
                                        (frame.deepfakeRisk === 'medium' && frame.authenticityScore < 0.6) ||
                                        frame.authenticityScore < 0.5 ||
                                        (!hasBlink && !hasMicroMovements && !naturalMovement);
                      
                      // CRITICAL: Update ref first (doesn't trigger re-render)
                      raftaiDetectionRef.current = {
                        isReal,
                        confidence: frame.authenticityScore * 100,
                        aiDetected,
                        lastUpdate: frame.timestamp
                      };
                      
                      // CRITICAL: Only update state if value changed significantly (throttle to prevent re-renders)
                      const current = raftaiDetection;
                      const shouldUpdate = !current || 
                        current.isReal !== isReal || 
                        current.aiDetected !== aiDetected ||
                        Math.abs(current.confidence - (frame.authenticityScore * 100)) > 5; // Only update if confidence changed by >5%
                      
                      if (shouldUpdate) {
                        setRaftaiDetection(raftaiDetectionRef.current);
                      }
                      
                      // If AI detected, show warning and reduce bitrate
                      if (aiDetected && webrtcManagerRef.current) {
                        console.warn('⚠️ [RaftAI] AI-generated content detected! Reducing bitrate for review.');
                        // Reduce video bitrate for review
                        const peerConnection = webrtcManagerRef.current.getPeerConnection();
                        if (peerConnection) {
                          const senders = peerConnection.getSenders();
                          senders.forEach(sender => {
                            if (sender.track && sender.track.kind === 'video' && 'setParameters' in sender) {
                              try {
                                const params = sender.getParameters();
                                if (params.encodings && params.encodings.length > 0) {
                                  params.encodings[0].maxBitrate = 500000; // Reduce to 500kbps
                                  sender.setParameters(params).catch(err => {
                                    console.warn('⚠️ [RaftAI] Could not reduce bitrate:', err);
                                  });
                                }
                              } catch (err) {
                                console.warn('⚠️ [RaftAI] Error reducing bitrate:', err);
                              }
                            }
                          });
                        }
                      }
                    });
                    
                    // CRITICAL: Start real-time analysis with faster interval for face movement detection
                    raftaiAnalyzerRef.current.startAnalysis(video, 3000); // 3 seconds = reduced frequency to prevent performance issues
                  }
                } else if (hasVideoTrack && maxAttempts > 0) {
                  // If we have a video track but no dimensions yet, keep waiting
                  // This is normal for WebRTC - video frames may take time to decode
                  setTimeout(() => waitForDimensions(maxAttempts - 1), 100);
                } else if (!hasVideoTrack) {
                  // No video track - this is a voice-only call or video track hasn't arrived yet
                  // But check if the callback stream has tracks that we should attach
                  if (stream && stream.getVideoTracks().length > 0 && !actualStream) {
                    // The callback stream has video tracks but video element has no stream - attach it!
                    console.log('🔧 [WebRTC Call] Callback stream has video tracks, attaching to video element');
                    // CRITICAL: Mark as attached BEFORE setting to prevent re-attachment
                    remoteStreamAttachedRef.current = true;
                    video.srcObject = stream;
                    video.muted = false;
                    video.volume = 1.0;
                    // CRITICAL: Lock styles - set once and never update again (prevents blinking)
                    video.style.cssText = `
                      display: block !important;
                      visibility: visible !important;
                      opacity: 1 !important;
                      width: 100% !important;
                      height: 100% !important;
                      object-fit: cover !important;
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                      right: 0 !important;
                      bottom: 0 !important;
                      z-index: 20 !important;
                      background-color: #000000 !important;
                      transition: none !important;
                      animation: none !important;
                      filter: none !important;
                      -webkit-filter: none !important;
                    `;
                    setRemoteVideoVisible(true);
                    safePlay(video, 'waitForDimensions').catch(() => {});
                    // Retry immediately with the new stream
                    setTimeout(() => waitForDimensions(maxAttempts - 1), 100);
                    return;
                  }
                  
                  console.log('ℹ️ [WebRTC Call] No video track yet, waiting...', {
                    actualStreamTracks: actualStreamTracks.length,
                    callbackStreamTracks: callbackStreamTracks.length,
                    hasActualStream: !!actualStream,
                    hasCallbackStream: !!stream,
                    trackStates: uniqueVideoTracks.map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled }))
                  });
                  if (maxAttempts > 0) {
                    setTimeout(() => waitForDimensions(maxAttempts - 1), 200);
                  }
                } else if (maxAttempts > 0) {
                  // Retry after a short delay
                  setTimeout(() => waitForDimensions(maxAttempts - 1), 100);
                } else {
                  // After max attempts, log warning but don't fail - video might still work
                  console.warn('⚠️ [WebRTC Call] Video dimensions not available after max attempts', {
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    clientWidth: video.clientWidth,
                    clientHeight: video.clientHeight,
                    readyState: video.readyState,
                    paused: video.paused,
                    srcObject: !!video.srcObject,
                    hasVideoTrack,
                    videoTrackState: videoTracks[0]?.readyState
                  });
                  // Still make video visible - it might render even without dimensions
                  video.style.opacity = '1';
                  video.style.visibility = 'visible';
                  setRemoteVideoVisible(true);
                }
              };
              
              // Start waiting for dimensions after a small delay to ensure DOM is ready
              setTimeout(() => waitForDimensions(), 200);
              
              // Log tracks
              const finalAudioTracks = stream.getAudioTracks();
              const finalVideoTracks = stream.getVideoTracks();
              console.log('🎵 Audio tracks:', finalAudioTracks.length);
              console.log('📹 Video tracks:', finalVideoTracks.length);
            }).catch(err => {
              // Only log if call is still active
              if (!callEndedRef.current) {
                console.error('❌ [WebRTC Call] Remote stream play failed:', err);
                // Retry once after delay
                setTimeout(() => {
                  if (callEndedRef.current || !remoteVideoRef.current) {
                    return;
                  }
                  
                  // Verify tracks are present
                  const retrySrcObject = remoteVideoRef.current.srcObject as MediaStream;
                  if (!retrySrcObject || retrySrcObject.getTracks().length === 0) {
                    return;
                  }
                  console.log('🔄 [WebRTC Call] Retrying play()...');
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.muted = false;
                    remoteVideoRef.current.volume = 1.0;
                    safePlay(remoteVideoRef.current, 'retry-after-error').then(() => {
                      console.log('✅ [WebRTC Call] Retry successful!');
                      // Make visible on successful retry
                      if (remoteVideoRef.current) {
                        remoteVideoRef.current.style.opacity = '1';
                        remoteVideoRef.current.style.visibility = 'visible';
                        remoteVideoRef.current.style.zIndex = '10';
                        setRemoteVideoVisible(true); // Update state
                      }
                    }).catch(() => {
                      // Error already logged in safePlay
                    });
                  }
                }, 500);
              }
            });
          }, 50); // Small delay to ensure srcObject is set
        });
      
      setCallState('connected');
      startTimers();
    });

    manager.onConnectionState((state) => {
      console.log('🔗 [WebRTC Call] Connection state:', state);
      
      if (state === 'connecting') {
        setCallState('connecting');
      } else if (state === 'connected') {
        // CRITICAL: Set to connected immediately when connection is established
        setCallState('connected');
        setError(null); // Clear any previous errors
        console.log('✅ [WebRTC Call] Connection established - UI should show video now');
        // Start audio level monitoring for active speaker detection
        startAudioLevelMonitoring();
      } else if (state === 'failed') {
        // Only set to failed if we've exhausted restart attempts
        // The WebRTCManager will handle restarts, so we don't immediately fail
        console.warn('⚠️ [WebRTC Call] Connection failed, but manager will attempt restart');
        // Don't set to failed immediately - let the manager try to restart
        // Only set to failed if manager gives up (handled in onError)
      } else if (state === 'disconnected') {
        // Disconnected might be temporary - wait a bit before considering it failed
        console.log('⚠️ [WebRTC Call] Connection disconnected, waiting to see if it reconnects...');
        // Don't immediately set to failed - give it time to reconnect
        setTimeout(() => {
          if (webrtcManagerRef.current) {
            const currentState = webrtcManagerRef.current.getConnectionState();
            if (currentState === 'disconnected' || currentState === 'failed') {
              console.warn('⚠️ [WebRTC Call] Still disconnected after wait');
              // Only set to failed if it's still disconnected after waiting
              if (currentState === 'failed') {
                setCallState('failed');
                setError('Connection failed. This may be due to network restrictions (firewall/NAT). Please try again.');
              }
            }
          }
        }, 5000); // Wait 5 seconds before considering it failed
      }
    });

    manager.onError((err) => {
      console.error('❌ [WebRTC Call] Error:', err);
      setError(err.message);
      setCallState('failed');
    });

    // Initialize call with 4K quality by default
    const initializeCall = async () => {
      // CRITICAL: Prevent multiple simultaneous initialization attempts
      if (callEndedRef.current) {
        console.log('⚠️ [WebRTC Call] Call already ended, skipping initialization');
        return;
      }
      
      try {
        // CRITICAL: Verify call still exists in Firebase before initializing (for joiners)
        if (!isInitiator) {
          const call = await simpleFirebaseCallManager.getCall(callId);
          if (!call) {
            console.error('❌ [WebRTC Call] Call not found in Firebase:', callId);
            setError('Call not found. It may have been cancelled.');
            setCallState('failed');
            return;
          }
          if (call.status === 'ended') {
            console.error('❌ [WebRTC Call] Call already ended:', callId);
            setError('Call has already ended.');
            setCallState('failed');
            return;
          }
          console.log('✅ [WebRTC Call] Call verified in Firebase before joining:', callId);
        }
        
        const mediaConfig = {
          audio: true,
          video: type === 'video'
        };

        // CRITICAL: Pass 4K quality to getLocalStream for perfect video quality
        // CRITICAL: Always use 4K quality for video calls
        const quality = type === 'video' ? '4K' : undefined;
        
        if (isInitiator) {
          await manager.startCall(callId, mediaConfig, quality);
          console.log('✅ [WebRTC Call] Call started successfully with 4K quality');
        } else {
          // CRITICAL: Set state to connecting before joining
          setCallState('connecting');
          await manager.joinCall(callId, mediaConfig, quality);
          console.log('✅ [WebRTC Call] Joined call successfully with 4K quality');
        }
      } catch (error: any) {
        console.error('❌ [WebRTC Call] Failed to initialize:', error);
        
        // CRITICAL: Don't set error state if call was already ended
        if (callEndedRef.current) {
          console.log('⚠️ [WebRTC Call] Call ended during initialization, ignoring error');
          return;
        }
        
        // Use the enhanced error message from WebRTCManager
        let errorMessage = error?.message || 'Failed to access camera/microphone. Please check permissions.';
        
        // If it's a permission error, add more helpful instructions
        if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' || 
            errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          errorMessage = 'Camera/microphone permission denied.\n\nPlease:\n1. Click the lock icon (🔒) in your browser\'s address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again';
        } else if (error?.name === 'NotFoundError' || errorMessage.includes('not found')) {
          errorMessage = 'Camera/microphone not found.\n\nPlease make sure your camera/microphone is connected and not being used by another application.';
        } else if (error?.name === 'NotReadableError' || errorMessage.includes('already in use')) {
          errorMessage = 'Camera/microphone is already in use.\n\nPlease close other applications using your camera/microphone (Zoom, Teams, etc.) and try again.';
        }
        
        setError(errorMessage);
        setCallState('failed');
      }
    };

    // CRITICAL: Add a small delay to ensure modal is fully mounted before initializing
    // This prevents race conditions where the modal opens but isn't ready
    const initTimeout = setTimeout(() => {
      if (!callEndedRef.current) {
        initializeCall();
      }
    }, 100);
    
    // Listen for call status changes (to detect when other person ends call)
    const callStatusUnsubscribe = simpleFirebaseCallManager.subscribeToCall(callId, (call) => {
      // Prevent duplicate end calls
      if (callEndedRef.current) {
        console.log('📞 [WebRTC Call] Already ended locally, ignoring Firebase update');
        return;
      }
      
      if (!call) {
        console.log('📞 [WebRTC Call] Call document deleted from Firebase - ending both sides');
        callEndedRef.current = true;
        
        // CRITICAL: Dispatch call-ended event BEFORE cleanup to ensure UI restoration
        window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
        
        cleanup(false);
        
        // CRITICAL: Call onEnd after a small delay to ensure cleanup completes
        setTimeout(() => {
          onEnd();
        }, 100);
        return;
      }
      
      if (call.status === 'ended') {
        console.log('📞 [WebRTC Call] Call status changed to "ended" by other participant');
        console.log('📞 [WebRTC Call] Auto-closing this side to sync with other participant');
        callEndedRef.current = true;
        
        // CRITICAL: Dispatch call-ended event BEFORE cleanup to ensure UI restoration
        window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
        
        cleanup(false);
        
        // CRITICAL: Call onEnd after a small delay to ensure cleanup completes
        setTimeout(() => {
          onEnd();
        }, 100);
      } else {
        console.log('📞 [WebRTC Call] Call status update:', call.status);
      }
    });

    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('keydown', handleKeyPress);
      callStatusUnsubscribe();
      stopAudioLevelMonitoring();
      // CRITICAL: Don't cleanup on unmount if call is still active (React 18 strict mode)
      // Only cleanup if call was explicitly ended
      if (callEndedRef.current) {
        cleanup(false);
      }
    };
  }, [type, roomId, callId, currentUserId, currentUserName, isInitiator, onEnd]);

  const startTimers = () => {
    // Start duration timer
    if (!durationTimerRef.current) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    // Start 30-minute countdown
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            console.log('⏰ [WebRTC Call] 30-minute limit reached');
            endCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const cleanup = (deleteData: boolean = false) => {
    console.log('🧹 [WebRTC Call] Cleaning up and STOPPING all media devices...');
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    // CRITICAL: Stop all media tracks FIRST (turn off mic/camera)
    let stoppedTracks = 0;
    
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        const trackInfo = `${track.kind} device (${track.label})`;
        const wasStopped = track.readyState === 'ended';
        
        if (!wasStopped) {
          track.stop();
          stoppedTracks++;
          console.log(`⏹️ [WebRTC Call] STOPPED ${trackInfo}`);
          console.log(`   State: ${track.readyState} (should be "ended")`);
        } else {
          console.log(`✓ [WebRTC Call] ${trackInfo} already stopped`);
        }
      });
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current?.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
      remoteVideoRef.current.srcObject = null;
    }
    
    // Stop audio level monitoring
    stopAudioLevelMonitoring();
    
    // End WebRTC manager (also stops tracks on its end)
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.endCall(deleteData);
      webrtcManagerRef.current = null;
    }
    
    console.log(`✅ [WebRTC Call] Cleanup complete - ${stoppedTracks} device(s) stopped`);
    console.log('✅ [WebRTC Call] Microphone and camera are now OFF and released');
    
    // Verify all tracks are stopped
    setTimeout(() => {
      if (localVideoRef.current?.srcObject || remoteVideoRef.current?.srcObject) {
        console.warn('⚠️ [WebRTC Call] Warning: Some streams still active after cleanup');
      } else {
        console.log('✅ [WebRTC Call] Verified: All streams successfully released');
      }
    }, 100);
  };

  const toggleMute = () => {
    if (!webrtcManagerRef.current) {
      console.warn('⚠️ [WebRTC Call] WebRTC manager not available');
      setIsMuted(false);
      return;
    }
    
    try {
      // Get the local stream and peer connection
      const localStream = webrtcManagerRef.current.getCurrentLocalStream();
      const peerConnection = webrtcManagerRef.current.getPeerConnection();
      
      if (!localStream) {
        console.warn('⚠️ [WebRTC Call] No local stream available for mute toggle');
        setIsMuted(false);
        return;
      }
      
      const audioTracks = localStream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        console.warn('⚠️ [WebRTC Call] No audio tracks found');
        setIsMuted(false);
        return;
      }
      
      // Get current state BEFORE toggling
      const currentEnabled = audioTracks[0]?.enabled ?? true;
      const newEnabled = !currentEnabled;
      
      // CRITICAL FIX: Toggle track enabled state - this directly controls transmission
      audioTracks.forEach(track => {
        track.enabled = newEnabled;
        console.log(`🎤 [WebRTC Call] Audio track ${newEnabled ? 'ENABLED' : 'DISABLED'}`, {
          trackId: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });
      
      // CRITICAL FIX: Ensure RTCRtpSender reflects the track state
      if (peerConnection) {
        const senders = peerConnection.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            const senderTrack = sender.track;
            
            // Verify the sender track is actually disabled/enabled
            if (senderTrack.enabled !== newEnabled) {
              console.warn('⚠️ [WebRTC Call] Sender track state mismatch! Forcing sync...');
              // Force sync by replacing the track
              if (audioTracks[0]) {
                sender.replaceTrack(audioTracks[0]).then(() => {
                  console.log('✅ [WebRTC Call] Track replaced successfully');
                }).catch(err => {
                  console.error('❌ [WebRTC Call] Error replacing track:', err);
                });
              }
            }
          }
        });
      }
      
      // Update UI state IMMEDIATELY - isMuted is true when track is disabled
      setIsMuted(!newEnabled);
      
      // Verify mute state with multiple checks
      setTimeout(() => {
        const verifyTrack = audioTracks[0];
        if (verifyTrack && verifyTrack.enabled !== newEnabled) {
          console.warn('⚠️ [WebRTC Call] Track state not updated, forcing...');
          verifyTrack.enabled = newEnabled;
          setIsMuted(!newEnabled);
        }
      }, 50);
      
      // Additional verification after longer delay
      setTimeout(() => {
        const finalTrack = audioTracks[0];
        if (finalTrack && finalTrack.enabled !== newEnabled) {
          console.warn('⚠️ [WebRTC Call] Track state still not updated, forcing again...');
          finalTrack.enabled = newEnabled;
          setIsMuted(!newEnabled);
        }
      }, 200);
      
      console.log(`🎤 [WebRTC Call] Mute toggled: ${!newEnabled ? 'MUTED' : 'UNMUTED'}`, {
        trackEnabled: newEnabled,
        trackId: audioTracks[0]?.id,
        readyState: audioTracks[0]?.readyState,
        uiState: !newEnabled ? 'MUTED' : 'UNMUTED',
        verified: audioTracks[0]?.enabled === newEnabled
      });
    } catch (error) {
      console.error('❌ [WebRTC Call] Error in toggleMute:', error);
      setIsMuted(false);
    }
  };

  const toggleVideo = () => {
    if (webrtcManagerRef.current && type === 'video') {
      const isEnabled = webrtcManagerRef.current.toggleVideo();
      setIsVideoOff(!isEnabled);
      
      // CRITICAL: After toggling video, ensure remote video is still visible on mobile
      setTimeout(() => {
        if (remoteVideoRef.current && !callEndedRef.current) {
          const video = remoteVideoRef.current;
          
          // Force video to be visible after toggle
          video.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 9999 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            background-color: #000000 !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
          `;
          
          // Ensure video is playing
          if (video.paused && video.srcObject) {
            safePlay(video, 'after-video-toggle').catch(() => {});
          }
          
          // Force into viewport
          video.scrollIntoView({ behavior: 'instant', block: 'center' });
          setRemoteVideoVisible(true);
        }
      }, 100);
    }
  };

  const toggleSpeaker = async () => {
    const newSpeakerState = !isSpeakerOn;
    
    // Get the remote video element (where audio is played)
    const remoteVideo = remoteVideoRef.current;
    if (!remoteVideo) {
      console.warn('⚠️ [WebRTC Call] Remote video element not available for speaker control');
      setIsSpeakerOn(true);
      return;
    }
    
    try {
      // CRITICAL FIX: Always use volume control first (most reliable)
      if (newSpeakerState) {
        // Speaker ON
        remoteVideo.volume = 1.0;
        remoteVideo.muted = false;
        console.log('🔊 [WebRTC Call] Speaker ON via volume control');
      } else {
        // Speaker OFF
        remoteVideo.volume = 0.0;
        remoteVideo.muted = true;
        console.log('🔇 [WebRTC Call] Speaker OFF via volume control');
      }
      
      // CRITICAL: Also check local video element (for voice calls or if audio is routed there)
      if (localVideoRef.current) {
        if (newSpeakerState) {
          localVideoRef.current.volume = 1.0;
          localVideoRef.current.muted = false;
        } else {
          localVideoRef.current.volume = 0.0;
          localVideoRef.current.muted = true;
        }
      }
      
      // Try to set audio output device using setSinkId (if available) - but don't rely on it
      if ('setSinkId' in remoteVideo && typeof (remoteVideo as any).setSinkId === 'function') {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
          
          if (audioOutputs.length > 0 && newSpeakerState) {
            try {
              await (remoteVideo as any).setSinkId('');
              console.log('✅ [WebRTC Call] Set audio output to default device');
            } catch (err) {
              console.warn('⚠️ [WebRTC Call] Could not set default sink, volume control is active:', err);
            }
          }
        } catch (err) {
          console.warn('⚠️ [WebRTC Call] Error enumerating audio devices, volume control is active:', err);
        }
      }
      
      // Update UI state IMMEDIATELY
      setIsSpeakerOn(newSpeakerState);
      
      // Verify speaker state with multiple checks
      setTimeout(() => {
        if (remoteVideo) {
          const isActuallyOn = remoteVideo.volume > 0 && !remoteVideo.muted;
          if (isActuallyOn !== newSpeakerState) {
            console.warn('⚠️ [WebRTC Call] Speaker state mismatch, correcting...');
            remoteVideo.volume = newSpeakerState ? 1.0 : 0.0;
            remoteVideo.muted = !newSpeakerState;
            setIsSpeakerOn(newSpeakerState);
          }
        }
      }, 50);
      
      // Additional verification after longer delay
      setTimeout(() => {
        if (remoteVideo) {
          const isActuallyOn = remoteVideo.volume > 0 && !remoteVideo.muted;
          if (isActuallyOn !== newSpeakerState) {
            console.warn('⚠️ [WebRTC Call] Speaker state still mismatch, forcing correction...');
            remoteVideo.volume = newSpeakerState ? 1.0 : 0.0;
            remoteVideo.muted = !newSpeakerState;
            setIsSpeakerOn(newSpeakerState);
          }
        }
      }, 200);
      
      const sinkId = (remoteVideo as any).sinkId || 'default';
      console.log(`🔊 [WebRTC Call] Speaker ${newSpeakerState ? 'ON' : 'OFF'}`, {
        volume: remoteVideo.volume,
        muted: remoteVideo.muted,
        hasSetSinkId: 'setSinkId' in remoteVideo,
        sinkId: sinkId,
        verified: newSpeakerState ? remoteVideo.volume > 0 && !remoteVideo.muted : remoteVideo.volume === 0 || remoteVideo.muted
      });
    } catch (error) {
      console.error('❌ [WebRTC Call] Error toggling speaker:', error);
      // Fallback: just control volume
      if (remoteVideo) {
        remoteVideo.volume = newSpeakerState ? 1.0 : 0.0;
        remoteVideo.muted = !newSpeakerState;
      }
      if (localVideoRef.current) {
        localVideoRef.current.volume = newSpeakerState ? 1.0 : 0.0;
        localVideoRef.current.muted = !newSpeakerState;
      }
      setIsSpeakerOn(newSpeakerState);
    }
  };

  const changeVideoQuality = async (quality: '4K' | '1080p' | '720p' | '480p' | 'auto') => {
    if (!webrtcManagerRef.current || type !== 'video') return;
    
    try {
      console.log(`📺 [WebRTC Call] Changing video quality to: ${quality}`);
      setVideoQuality(quality);
      
      const preset = CALL_CONFIG.qualityPresets[quality];
      if (!preset) return;
      
      // Get current video track
      const localStream = webrtcManagerRef.current.getCurrentLocalStream();
      if (!localStream) return;
      
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Apply new constraints with max values for 4K
        await videoTrack.applyConstraints({
          width: { ideal: preset.width, max: preset.width },
          height: { ideal: preset.height, max: preset.height },
          frameRate: { ideal: preset.frameRate, max: preset.frameRate }
        });
        
        // Apply bitrate if specified
        if (preset.bitrate && preset.bitrate > 0) {
          const senders = webrtcManagerRef.current.getPeerConnection()?.getSenders();
          const sender = senders && Array.isArray(senders) ? senders.find(s => s.track === videoTrack) : null;
          if (sender && 'setParameters' in sender) {
            try {
              const params = sender.getParameters();
              if (params.encodings && params.encodings.length > 0) {
                params.encodings[0].maxBitrate = preset.bitrate;
                await sender.setParameters(params);
                console.log(`✅ [WebRTC Call] Bitrate set to ${preset.bitrate / 1000000} Mbps`);
              }
            } catch (err) {
              console.warn('⚠️ [WebRTC Call] Could not set bitrate:', err);
            }
          }
        }
        
        console.log(`✅ [WebRTC Call] Video quality changed to ${quality} (${preset.width}x${preset.height}@${preset.frameRate}fps)`);
      }
    } catch (error) {
      console.error('❌ Error changing video quality:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        console.log('📺 [WebRTC Call] Entered fullscreen');
      }).catch(err => {
        console.error('❌ Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        console.log('📺 [WebRTC Call] Exited fullscreen');
      }).catch(err => {
        console.error('❌ Error exiting fullscreen:', err);
      });
    }
  };

  const endCall = async () => {
    // CRITICAL: Define restoreUI before try-catch so it's accessible in catch block
    const restoreUI = () => {
      // Remove video-call-active class immediately
      document.documentElement.classList.remove('video-call-active');
      document.body.classList.remove('video-call-active');
      
      // Restore all headers immediately
      const allHeaders = document.querySelectorAll('header, nav, [class*="Header"], [class*="PerfectHeader"], [class*="neo-glass-header"]');
      allHeaders.forEach((header) => {
        const htmlEl = header as HTMLElement;
        if (htmlEl) {
          htmlEl.removeAttribute('style');
          htmlEl.style.cssText = '';
          htmlEl.style.display = '';
          htmlEl.style.visibility = 'visible';
          htmlEl.style.opacity = '1';
          htmlEl.style.position = '';
          htmlEl.style.zIndex = '';
          htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
        }
      });
      
      // Restore body and html
      document.body.style.cssText = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      if (document.documentElement) {
        document.documentElement.style.cssText = '';
        document.documentElement.style.overflow = '';
      }
      
      // Force reflow
      void document.body.offsetHeight;
    };
    
    // CRITICAL: Wrap entire function in try-catch to prevent errors from triggering ErrorBoundary
    try {
      // Prevent duplicate end calls
      if (callEndedRef.current) {
        console.log('📞 [WebRTC Call] Already ended, skipping');
        return;
      }
      
      console.log('📞 [WebRTC Call] User ending call:', callId);
      callEndedRef.current = true;
    } catch (err) {
      console.error('❌ [WebRTC Call] Error in endCall start (caught):', err);
      callEndedRef.current = true;
      // Continue with cleanup even if there's an error
    }
    
    try {
    
    // Generate RaftAI report (only for video calls with analysis enabled)
    if (type === 'video' && enableRaftAI && raftaiAnalyzerRef.current && remoteUserId) {
      try {
        console.log('🤖 [RaftAI] Generating authenticity report...');
        setRaftaiAnalyzing(true);
        
        // Stop analysis
        raftaiAnalyzerRef.current.stopAnalysis();
        
        // Generate report
        const report = await raftaiAnalyzerRef.current.generateReport(
          callId,
          remoteUserId,
          remoteUserName || 'Unknown',
          remoteUserRole || 'participant',
          callDuration
        );
        
        // Save to Firebase
        const frames = raftaiAnalyzerRef.current.getFrames();
        const analysisId = await saveCallAnalysis(
          callId,
          roomId,
          remoteUserId,
          remoteUserName || 'Unknown',
          remoteUserRole || 'participant',
          callDuration,
          report,
          frames,
          [currentUserId, remoteUserId] // Both participants can view
        );
        
        console.log('✅ [RaftAI] Analysis saved! ID:', analysisId);
        console.log('📊 [RaftAI] Overall Score:', report.overallScore);
        console.log('📊 [RaftAI] Recommendation:', report.recommendation);
        
        // Show notification to user
        showRaftAIReportNotification(report);
        
      } catch (error) {
        console.error('❌ [RaftAI] Error generating report:', error);
      } finally {
        setRaftaiAnalyzing(false);
      }
    }
    
    // CRITICAL: Hide modal immediately (don't remove from DOM - let React handle it)
    if (modalRef.current) {
      modalRef.current.style.display = 'none';
      modalRef.current.style.visibility = 'hidden';
      modalRef.current.style.opacity = '0';
      modalRef.current.style.pointerEvents = 'none';
    }
    
    // CRITICAL: Clear sessionStorage and URL params immediately to prevent reopening
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingCall');
      const url = new URL(window.location.href);
      url.searchParams.delete('call');
      window.history.replaceState({}, '', url.toString());
    }
    
    // CRITICAL: Dispatch call-ended event BEFORE cleanup to ensure UI restoration
    window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
    
    // Immediate restoration
    restoreUI();
    
    // End the call in Firebase first (so other participant knows)
    try {
      await simpleFirebaseCallManager.endCall(callId);
      console.log('✅ [WebRTC Call] Call ended in Firebase - other side will auto-close');
    } catch (error) {
      console.error('❌ [WebRTC Call] Error ending call in Firebase:', error);
    }
    
    // Then cleanup WebRTC resources
    cleanup(true); // Delete WebRTC data when user actively ends call
    
    // CRITICAL: Call onEnd immediately - this will trigger React to unmount the component
    // Don't manually remove DOM nodes - let React handle it to avoid removeChild errors
    onEnd();
    
    // Additional restoration after a short delay
    setTimeout(() => {
      restoreUI();
    }, 50);
    } catch (err) {
      console.error('❌ [WebRTC Call] Error in endCall cleanup (caught):', err);
      // Still try to call onEnd and restore UI even if there's an error
      try {
        onEnd();
        restoreUI();
      } catch (finalErr) {
        console.error('❌ [WebRTC Call] Error in final cleanup (caught):', finalErr);
      }
    }
  };

  const showRaftAIReportNotification = (report: any) => {
    // Show a brief notification about the analysis
    const emoji = report.recommendation === 'highly_trustworthy' ? '✅' : 
                  report.recommendation === 'trustworthy' ? '👍' : 
                  report.recommendation === 'neutral' ? 'ℹ️' : '⚠️';
    
    console.log(`${emoji} [RaftAI] ${report.summary}`);
    
    // Could trigger a toast notification here
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Browser notification (if permitted)
      if (Notification.permission === 'granted') {
        new Notification('🤖 RaftAI Analysis Complete', {
          body: `Authenticity Score: ${report.overallScore}/100 - ${report.recommendation.replace(/_/g, ' ')}`,
          icon: '/icon.png'
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Active speaker detection using audio level monitoring
  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    const monitorAudioLevels = () => {
      if (callEndedRef.current || !webrtcManagerRef.current) return;

      try {
        const localStream = webrtcManagerRef.current.getCurrentLocalStream();
        const remoteVideo = remoteVideoRef.current;
        
        let localLevel = 0;
        let remoteLevel = 0;

        // Monitor local audio
        if (localStream) {
          const localAudioTracks = localStream.getAudioTracks();
          if (localAudioTracks.length > 0 && localAudioTracks[0].enabled) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            if (!analyserRef.current) {
              analyserRef.current = audioContextRef.current.createAnalyser();
              analyserRef.current.fftSize = 256;
              const source = audioContextRef.current.createMediaStreamSource(localStream);
              source.connect(analyserRef.current);
            }
            
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            localLevel = dataArray.reduce((a, b) => a + b) / dataArray.length;
          }
        }

        // Monitor remote audio (from video element)
        if (remoteVideo && remoteVideo.srcObject) {
          const remoteStream = remoteVideo.srcObject as MediaStream;
          const remoteAudioTracks = remoteStream.getAudioTracks();
          if (remoteAudioTracks.length > 0 && remoteAudioTracks[0].enabled) {
            // Create analyser for remote audio
            const remoteAudioContext = new AudioContext();
            const remoteSource = remoteAudioContext.createMediaStreamSource(remoteStream);
            const remoteAnalyser = remoteAudioContext.createAnalyser();
            remoteAnalyser.fftSize = 256;
            remoteSource.connect(remoteAnalyser);
            
            const remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
            remoteAnalyser.getByteFrequencyData(remoteDataArray);
            remoteLevel = remoteDataArray.reduce((a, b) => a + b) / remoteDataArray.length;
            
            remoteAudioContext.close();
          }
        }

        // CRITICAL: Throttle active speaker updates to prevent re-renders
        // Only update if speaker actually changed
        const newActiveSpeaker = pinnedParticipant 
          ? pinnedParticipant
          : localLevel > remoteLevel + 5 
            ? 'local' 
            : remoteLevel > localLevel + 5 
              ? 'remote' 
              : null;
        
        // Only update state if speaker actually changed (prevents unnecessary re-renders)
        if (newActiveSpeaker !== activeSpeaker) {
          setActiveSpeaker(newActiveSpeaker);
        }
      } catch (error) {
        console.warn('⚠️ [WebRTC Call] Error monitoring audio levels:', error);
      }
    };

    // Monitor every 200ms
    audioLevelIntervalRef.current = setInterval(monitorAudioLevels, 200);
  };

  const stopAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Prevent body scroll when modal is open - CRITICAL for fullscreen modal
  // Also hide header and chat sidebar when call is active
  // Request fullscreen API on mobile for true fullscreen experience
  // CRITICAL: Use useLayoutEffect for immediate DOM manipulation to fix mobile black screen
  useLayoutEffect(() => {
    // CRITICAL: Request fullscreen on mobile browsers for true fullscreen
    const requestFullscreen = async () => {
      try {
        const modal = document.getElementById('webrtc-call-modal');
        if (modal) {
          // Try different fullscreen APIs
          if (modal.requestFullscreen) {
            await modal.requestFullscreen();
          } else if ((modal as any).webkitRequestFullscreen) {
            await (modal as any).webkitRequestFullscreen();
          } else if ((modal as any).mozRequestFullScreen) {
            await (modal as any).mozRequestFullScreen();
          } else if ((modal as any).msRequestFullscreen) {
            await (modal as any).msRequestFullscreen();
          }
          console.log('✅ [WebRTC Call] Fullscreen requested');
        }
      } catch (err) {
        console.log('⚠️ [WebRTC Call] Fullscreen not available or denied:', err);
        // Continue without fullscreen - modal will still cover viewport
      }
    };
    
    // Request fullscreen after a short delay to ensure modal is rendered
    setTimeout(requestFullscreen, 100);
    
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    
    // Get current scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Lock body scroll and position
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    
    // Also prevent scroll on html element
    const html = document.documentElement;
    const originalHtmlOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    
    // CRITICAL: Set viewport meta tag for mobile fullscreen
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    // CRITICAL: Hide header and chat sidebar when call is active
    // Add class to body to hide elements via CSS
    document.body.classList.add('video-call-active');
    
    // CRITICAL: Also add class to html element for maximum coverage
    document.documentElement.classList.add('video-call-active');
    
    // Hide header elements - CRITICAL for fullscreen - More aggressive selectors
    const headerSelectors = [
      'header',
      '[class*="Header"]',
      '[class*="header"]',
      '[class*="navbar"]',
      '[class*="Navbar"]',
      '[class*="navigation"]',
      '[class*="Navigation"]',
      '[class*="neo-glass-header"]',
      '[class*="sticky"][class*="top-0"]',
      '[class*="z-50"]', // Common header z-index
      '[class*="z-40"]',  // Common header z-index
      '[class*="PerfectHeader"]', // Specific component
      'nav[class*="fixed"]', // Fixed navigation
      'nav[class*="sticky"]', // Sticky navigation
      '[role="banner"]', // Semantic header
      '[class*="top-0"][class*="z-"]', // Any top-0 with z-index
      '[class*="fixed"][class*="top-0"]', // Fixed at top
      '[class*="sticky"][class*="top-0"]' // Sticky at top
    ];
    
    // Hide sidebar elements
    const sidebarSelectors = [
      '[class*="ChatRoomList"]',
      '[class*="chat-room-list"]',
      '[class*="sidebar"]',
      'aside',
      '[class*="w-80"]', // Common sidebar width
      '[class*="w-96"]',  // Common sidebar width
      '[class*="border-r"][class*="bg-black"]', // Chat sidebar
      '[class*="flex"][class*="flex-col"][class*="border-r"]' // Sidebar container
    ];
    
    const hiddenElements: Array<{ element: HTMLElement; originalDisplay: string; originalVisibility: string; originalZIndex: string }> = [];
    
    // Hide headers - More aggressive approach
    headerSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && htmlEl.style) {
            // Hide ALL header-like elements, not just visible ones
            const currentDisplay = htmlEl.style.display;
            const currentVisibility = htmlEl.style.visibility;
            const currentZIndex = htmlEl.style.zIndex;
            const computedStyle = window.getComputedStyle(htmlEl);
            
            // Check if element is at the top of the page (likely header)
            const rect = htmlEl.getBoundingClientRect();
            const isAtTop = rect.top <= 100; // Within 100px of top
            
            // Hide if it's a header-like element at the top
            if (isAtTop || selector === 'header' || selector.includes('Header') || selector.includes('navbar')) {
              htmlEl.style.setProperty('display', 'none', 'important');
              htmlEl.style.setProperty('visibility', 'hidden', 'important');
              htmlEl.style.setProperty('z-index', '-1', 'important');
              htmlEl.style.setProperty('opacity', '0', 'important');
              htmlEl.style.setProperty('pointer-events', 'none', 'important');
              hiddenElements.push({ 
                element: htmlEl, 
                originalDisplay: currentDisplay || computedStyle.display || '',
                originalVisibility: currentVisibility || computedStyle.visibility || '',
                originalZIndex: currentZIndex || computedStyle.zIndex || ''
              });
            }
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });
    
    // CRITICAL: Also hide header by traversing DOM tree
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl && htmlEl.style) {
        const rect = htmlEl.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(htmlEl);
        const zIndex = parseInt(computedStyle.zIndex) || 0;
        
        // Hide elements that are fixed/sticky at top with high z-index (likely header)
        if (
          (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') &&
          rect.top <= 100 &&
          zIndex >= 40 &&
          htmlEl.tagName !== 'BODY' &&
          htmlEl.tagName !== 'HTML' &&
          htmlEl.id !== 'webrtc-call-modal'
        ) {
          const currentDisplay = htmlEl.style.display;
          const currentVisibility = htmlEl.style.visibility;
          const currentZIndex = htmlEl.style.zIndex;
          
          if (currentDisplay !== 'none') {
            htmlEl.style.setProperty('display', 'none', 'important');
            htmlEl.style.setProperty('visibility', 'hidden', 'important');
            htmlEl.style.setProperty('z-index', '-1', 'important');
            htmlEl.style.setProperty('opacity', '0', 'important');
            htmlEl.style.setProperty('pointer-events', 'none', 'important');
            hiddenElements.push({ 
              element: htmlEl, 
              originalDisplay: currentDisplay || '',
              originalVisibility: currentVisibility || '',
              originalZIndex: currentZIndex || ''
            });
          }
        }
      }
    });
    
    // Hide sidebars
    sidebarSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && htmlEl.style && htmlEl.offsetParent !== null) {
            const currentDisplay = htmlEl.style.display;
            const currentVisibility = htmlEl.style.visibility;
            const currentZIndex = htmlEl.style.zIndex;
            if (currentDisplay !== 'none') {
              htmlEl.style.display = 'none';
              htmlEl.style.visibility = 'hidden';
              htmlEl.style.zIndex = '-1';
              hiddenElements.push({ 
                element: htmlEl, 
                originalDisplay: currentDisplay || '',
                originalVisibility: currentVisibility || '',
                originalZIndex: currentZIndex || ''
              });
            }
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });
    
    // CRITICAL: Verify modal covers full viewport - Optimized to prevent page freeze
    let isVerifying = false;
    let verificationTimeout: NodeJS.Timeout | null = null;
    
    const verifyFullscreen = () => {
      // Prevent multiple simultaneous verifications
      if (isVerifying) {
        return false;
      }
      isVerifying = true;
      
      // CRITICAL: Use getElementById first (more reliable than ref on initial render)
      let modal = document.getElementById('webrtc-call-modal');
      if (!modal) {
        // Try ref as fallback
        modal = modalRef.current;
      }
      if (!modal || !modal.isConnected) {
        isVerifying = false;
        return false;
      }
      
      // CRITICAL: Force modal to have dimensions immediately - Fix mobile black screen
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height || 0;
      
      if (viewportWidth === 0 || viewportHeight === 0) {
        isVerifying = false;
        return false;
      }
      
      // CRITICAL: Set dimensions BEFORE checking - ensures modal has size
      const cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: ${viewportWidth}px !important;
        height: ${viewportHeight}px !important;
        min-width: ${viewportWidth}px !important;
        min-height: ${viewportHeight}px !important;
        max-width: ${viewportWidth}px !important;
        max-height: ${viewportHeight}px !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 2147483647 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
        backface-visibility: hidden !important;
      `;
      modal.style.cssText = cssText;
      
      // Force a single reflow
      void modal.offsetHeight;
      
      // Use requestAnimationFrame to ensure browser has laid out the element
      requestAnimationFrame(() => {
        const rect = modal!.getBoundingClientRect();
        const coversViewport = rect.width >= viewportWidth - 2 && rect.height >= viewportHeight - 2;
        
        // Only check for headers/sidebars if modal doesn't cover viewport (optimization)
        if (!coversViewport || rect.width === 0 || rect.height === 0) {
          // Check for visible headers (only when needed)
          const headerEls = document.querySelectorAll('header, [class*="Header"], nav[class*="fixed"], nav[class*="sticky"]');
          headerEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const style = window.getComputedStyle(htmlEl);
            if (style.display !== 'none' && style.visibility !== 'hidden' && htmlEl.offsetParent !== null) {
              htmlEl.style.setProperty('display', 'none', 'important');
              htmlEl.style.setProperty('visibility', 'hidden', 'important');
              htmlEl.style.setProperty('z-index', '-1', 'important');
              htmlEl.style.setProperty('opacity', '0', 'important');
              htmlEl.style.setProperty('pointer-events', 'none', 'important');
            }
          });
          
          // Check for visible sidebars (only when needed)
          const sidebarEls = document.querySelectorAll('[class*="ChatRoomList"], [class*="chat-room-list"], aside[class*="sidebar"]');
          sidebarEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const style = window.getComputedStyle(htmlEl);
            if (style.display !== 'none' && style.visibility !== 'hidden' && htmlEl.offsetParent !== null) {
              htmlEl.style.setProperty('display', 'none', 'important');
              htmlEl.style.setProperty('visibility', 'hidden', 'important');
              htmlEl.style.setProperty('z-index', '-1', 'important');
              htmlEl.style.setProperty('opacity', '0', 'important');
              htmlEl.style.setProperty('pointer-events', 'none', 'important');
            }
          });
          
          // Force modal dimensions again
          modal!.style.cssText = cssText;
          void modal!.offsetHeight;
        }
        
        isVerifying = false;
      });
      
      return true;
    };
    
    // Debounced verification function
    const debouncedVerify = (delay = 100) => {
      if (verificationTimeout) {
        clearTimeout(verificationTimeout);
      }
      verificationTimeout = setTimeout(() => {
        verifyFullscreen();
      }, delay);
    };
    
    // CRITICAL: Wait for modal to be in DOM before verifying (limited attempts to prevent freeze)
    let attempts = 0;
    const maxAttempts = 2; // Reduced to prevent performance issues
    const checkModal = () => {
      attempts++;
      const modal = document.getElementById('webrtc-call-modal') || modalRef.current;
      if (modal && modal.isConnected) {
        // CRITICAL: Force dimensions immediately on mobile
        const viewportWidth = window.innerWidth || screen.width || 0;
        const viewportHeight = window.innerHeight || screen.height || 0;
        if (viewportWidth > 0 && viewportHeight > 0) {
          modal.style.width = `${viewportWidth}px`;
          modal.style.height = `${viewportHeight}px`;
          modal.style.minWidth = `${viewportWidth}px`;
          modal.style.minHeight = `${viewportHeight}px`;
          modal.style.maxWidth = `${viewportWidth}px`;
          modal.style.maxHeight = `${viewportHeight}px`;
        }
        // Modal is ready, verify it once
        verifyFullscreen();
        // Only verify once more after a delay if needed
        setTimeout(() => {
          if (!isVerifying) {
            verifyFullscreen();
          }
        }, 300);
      } else if (attempts < maxAttempts) {
        // Modal not ready yet, retry with delay
        setTimeout(checkModal, 200);
      }
    };
    
    // Start checking after a delay
    setTimeout(checkModal, 200);
    
    // CRITICAL: Use MutationObserver to catch dynamically added headers/sidebars
    // Optimized to prevent performance issues - only verify when elements are actually hidden
    const observer = new MutationObserver((mutations) => {
      let shouldVerify = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            // CRITICAL: Ensure className is always a string to prevent .includes() error
            let className = '';
            try {
              if (typeof el.className === 'string') {
                className = el.className;
              } else if (el.className && typeof el.className === 'object') {
                if ('baseVal' in el.className) {
                  className = String((el.className as any).baseVal || '');
                } else if ('value' in el.className) {
                  className = String((el.className as any).value || '');
                } else {
                  className = String(el.className || '');
                }
              } else {
                className = String(el.className || '');
              }
            } catch (e) {
              className = '';
            }
            
            // Check if it's a header-like element
            if (
              tagName === 'header' ||
              tagName === 'nav' ||
              (className && typeof className === 'string' && (
                className.includes('Header') ||
                className.includes('header') ||
                className.includes('navbar') ||
                className.includes('Navbar') ||
                className.includes('navigation') ||
                className.includes('Navigation')
              ))
            ) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 100) {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('z-index', '-1', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
                shouldVerify = true; // Only verify if we actually hid something
              }
            }
            
            // Check if it's a sidebar-like element
            if (
              tagName === 'aside' ||
              (className && typeof className === 'string' && (
                className.includes('ChatRoomList') ||
                className.includes('chat-room-list') ||
                className.includes('sidebar')
              ))
            ) {
              el.style.setProperty('display', 'none', 'important');
              el.style.setProperty('visibility', 'hidden', 'important');
              el.style.setProperty('z-index', '-1', 'important');
              el.style.setProperty('opacity', '0', 'important');
              el.style.setProperty('pointer-events', 'none', 'important');
              shouldVerify = true; // Only verify if we actually hid something
            }
          }
        });
      });
      
      // Only verify if we actually hid elements (debounced to prevent freeze)
      if (shouldVerify && !isVerifying) {
        debouncedVerify(300);
      }
    });
        
        // Observe the entire document for changes (throttled to prevent performance issues)
        observer.observe(document.body, {
          childList: true,
          subtree: false, // Only observe direct children to reduce overhead
          attributes: false // Disable attribute observation to reduce triggers
        });
        
    // Store observer for cleanup
    (window as any).__webrtcCallObserver = observer;

    return () => {
      // Exit fullscreen if active
      const exitFullscreen = async () => {
        try {
          if (document.fullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
              await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
              await (document as any).msExitFullscreen();
            }
          }
        } catch (err) {
          console.log('⚠️ [WebRTC Call] Error exiting fullscreen:', err);
        }
      };
      exitFullscreen();
      
      // Restore viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
      }
      
      // Restore original styles - variables are in scope from outer function
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      const htmlEl = document.documentElement;
      htmlEl.style.overflow = originalHtmlOverflow;
      
      // Remove video-call-active class
      document.body.classList.remove('video-call-active');
      document.documentElement.classList.remove('video-call-active');
      
      // Stop MutationObserver
      if ((window as any).__webrtcCallObserver) {
        (window as any).__webrtcCallObserver.disconnect();
        delete (window as any).__webrtcCallObserver;
      }
      
      // Clear verification timeout
      if (verificationTimeout) {
        clearTimeout(verificationTimeout);
        verificationTimeout = null;
      }
      
      // Restore hidden elements - CRITICAL: Ensure header is visible again
      hiddenElements.forEach(({ element, originalDisplay, originalVisibility, originalZIndex }) => {
        if (element && element.style) {
          element.style.removeProperty('display');
          element.style.removeProperty('visibility');
          element.style.removeProperty('z-index');
          element.style.removeProperty('opacity');
          element.style.removeProperty('pointer-events');
          element.style.removeProperty('height');
          element.style.removeProperty('max-height');
          element.style.removeProperty('overflow');
          if (originalDisplay) element.style.display = originalDisplay;
          if (originalVisibility) element.style.visibility = originalVisibility;
          if (originalZIndex) element.style.zIndex = originalZIndex;
        }
      });
      
        // CRITICAL: Force header to be visible again by removing all inline styles and CSS classes
        // Also restore chat input area and calling options
        // Use multiple timeouts to ensure restoration happens even if one fails
        const restoreUI = () => {
        // CRITICAL: Remove all inline styles from headers - ENHANCED for mobile
        const headers = document.querySelectorAll('header, [class*="Header"], [class*="PerfectHeader"], nav[class*="fixed"], nav[class*="sticky"], nav');
        headers.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl) {
            // Remove ALL inline styles completely
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            
            // Force visible with default styles
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.maxHeight = '';
            htmlEl.style.minHeight = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.style.transform = '';
            htmlEl.style.translate = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.overflow = '';
            
            // Remove all hiding classes
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0', 'opacity-0');
            
            // Force display if it was hidden
            if (htmlEl.offsetParent === null) {
              htmlEl.style.display = 'block';
              htmlEl.style.visibility = 'visible';
              htmlEl.style.opacity = '1';
              // Force a reflow
              void htmlEl.offsetHeight;
            }
          }
        });
        
        // CRITICAL: Restore chat input area (message input field) - ENHANCED for mobile
        const chatInputs = document.querySelectorAll('textarea[placeholder*="Message"], input[placeholder*="Message"], textarea[placeholder*="message"], input[placeholder*="message"], [class*="message-input"], [class*="MessageInput"], textarea, input[type="text"]');
        chatInputs.forEach((input) => {
          const htmlEl = input as HTMLElement;
          if (htmlEl && htmlEl.style) {
            // Remove all inline styles completely
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            // Force visible with default styles
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.style.transform = '';
            // Remove any classes that might hide it
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            // Force reflow
            void htmlEl.offsetHeight;
          }
        });
        
        // CRITICAL: Restore chat input containers
        const chatContainers = document.querySelectorAll('[class*="chat-input"], [class*="message-input-container"], [class*="ChatInput"], [class*="border-t"][class*="p-"], form[class*="flex"]');
        chatContainers.forEach((container) => {
          const htmlEl = container as HTMLElement;
          if (htmlEl && htmlEl.style) {
            htmlEl.style.removeProperty('display');
            htmlEl.style.removeProperty('visibility');
            htmlEl.style.removeProperty('opacity');
            htmlEl.style.removeProperty('pointer-events');
            htmlEl.style.removeProperty('z-index');
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.zIndex = '';
          }
        });
        
        // CRITICAL: Restore calling options (video/voice call buttons) - ENHANCED for mobile
        const callButtons = document.querySelectorAll('button[title*="Video"], button[title*="video"], button[title*="Voice"], button[title*="voice"], [class*="Video"], [class*="video-call"], [class*="voice-call"]');
        callButtons.forEach((button) => {
          const htmlEl = button as HTMLElement;
          if (htmlEl && htmlEl.style) {
            // Remove all inline styles completely
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            // Force visible with default styles
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.style.transform = '';
            // Remove any classes that might hide it
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            // Force reflow
            void htmlEl.offsetHeight;
          }
        });
        
        // CRITICAL: Restore ALL header buttons (bookmark, video, voice, settings, etc.)
        const headerButtons = document.querySelectorAll('header button, [class*="Header"] button, nav button, [class*="chat-header"] button, [class*="chat"] button');
        headerButtons.forEach((button) => {
          const htmlEl = button as HTMLElement;
          if (htmlEl) {
            // Remove all inline styles completely
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            // Force visible with default values
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.style.transform = '';
            htmlEl.style.translate = '';
            // Remove all hiding classes
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0', 'opacity-0');
            // Force reflow
            void htmlEl.offsetHeight;
            // Ensure button is clickable
            htmlEl.style.pointerEvents = 'auto';
          }
        });
        
        // CRITICAL: Restore chat header container
        const chatHeaderContainers = document.querySelectorAll('[class*="chat-header"], [class*="ChatHeader"], header[class*="flex"]');
        chatHeaderContainers.forEach((container) => {
          const htmlEl = container as HTMLElement;
          if (htmlEl) {
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            void htmlEl.offsetHeight;
          }
        });
        
        // CRITICAL: Restore all buttons in chat interface
        const allButtons = document.querySelectorAll('button:not(#webrtc-call-modal button)');
        allButtons.forEach((button) => {
          const htmlEl = button as HTMLElement;
          const parent = htmlEl.closest('[class*="chat"], [class*="message"], form');
          if (parent && htmlEl.style) {
            htmlEl.style.removeProperty('display');
            htmlEl.style.removeProperty('visibility');
            htmlEl.style.removeProperty('opacity');
            htmlEl.style.removeProperty('pointer-events');
            htmlEl.style.removeProperty('z-index');
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = '';
            htmlEl.style.zIndex = '';
          }
        });
        
        // ENHANCED: Restore layout and alignment properties
        // Restore chat sidebar layout
        const chatSidebars = document.querySelectorAll('[class*="ChatRoomList"], [class*="chat-room-list"], aside[class*="sidebar"]');
        chatSidebars.forEach((sidebar) => {
          const htmlEl = sidebar as HTMLElement;
          if (htmlEl && htmlEl.style) {
            htmlEl.style.removeProperty('width');
            htmlEl.style.removeProperty('max-width');
            htmlEl.style.removeProperty('min-width');
            htmlEl.style.removeProperty('display');
            htmlEl.style.removeProperty('visibility');
            htmlEl.style.removeProperty('opacity');
            htmlEl.style.removeProperty('overflow');
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.width = '';
            htmlEl.style.maxWidth = '';
            htmlEl.style.minWidth = '';
          }
        });

        // ENHANCED: Restore main content area layout
        const mainContent = document.querySelectorAll('[class*="main-content"], [class*="chat-content"], [class*="messages-content"], main[class*="flex"]');
        mainContent.forEach((content) => {
          const htmlEl = content as HTMLElement;
          if (htmlEl && htmlEl.style) {
            htmlEl.style.removeProperty('width');
            htmlEl.style.removeProperty('max-width');
            htmlEl.style.removeProperty('min-width');
            htmlEl.style.removeProperty('margin');
            htmlEl.style.removeProperty('padding');
            htmlEl.style.removeProperty('display');
            htmlEl.style.removeProperty('flex');
            htmlEl.style.removeProperty('flex-direction');
            htmlEl.style.display = '';
            htmlEl.style.width = '';
            htmlEl.style.maxWidth = '';
            htmlEl.style.minWidth = '';
          }
        });

        // ENHANCED: Restore container layouts
        const containers = document.querySelectorAll('[class*="container"], [class*="flex"][class*="h-full"]');
        containers.forEach((container) => {
          const htmlEl = container as HTMLElement;
          const isChatContainer = htmlEl.closest('[class*="chat"], [class*="message"]');
          if (isChatContainer && htmlEl.style) {
            htmlEl.style.removeProperty('display');
            htmlEl.style.removeProperty('flex');
            htmlEl.style.removeProperty('flex-direction');
            htmlEl.style.removeProperty('width');
            htmlEl.style.removeProperty('height');
            htmlEl.style.removeProperty('max-width');
            htmlEl.style.removeProperty('max-height');
            htmlEl.style.display = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
          }
        });

        // ENHANCED: Aggressively remove video-call-active class from html and body
        // Remove multiple times to ensure it's gone
        document.documentElement.classList.remove('video-call-active');
        document.body.classList.remove('video-call-active');
        
        // CRITICAL: Also remove via className manipulation as fallback
        if (document.documentElement.className && document.documentElement.className.includes('video-call-active')) {
          document.documentElement.className = document.documentElement.className.replace(/\bvideo-call-active\b/g, '').trim();
        }
        if (document.body.className && document.body.className.includes('video-call-active')) {
          document.body.className = document.body.className.replace(/\bvideo-call-active\b/g, '').trim();
        }
        
        // CRITICAL: Restore body and html styles completely - remove ALL inline styles
        document.body.removeAttribute('style');
        document.body.style.cssText = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
        document.body.style.maxWidth = '';
        document.body.style.maxHeight = '';
        document.body.style.minWidth = '';
        document.body.style.minHeight = '';
        document.body.style.transform = '';
        document.body.style.translate = '';
        
        document.documentElement.removeAttribute('style');
        document.documentElement.style.cssText = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        document.documentElement.style.maxWidth = '';
        document.documentElement.style.maxHeight = '';
        document.documentElement.style.minWidth = '';
        document.documentElement.style.minHeight = '';
        document.documentElement.style.transform = '';
        document.documentElement.style.translate = '';
        
        // CRITICAL: Remove any fixed positioning that might have been applied
        const allFixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        allFixedElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && htmlEl.id !== 'webrtc-call-modal') {
            htmlEl.style.removeProperty('position');
            htmlEl.style.removeProperty('top');
            htmlEl.style.removeProperty('left');
            htmlEl.style.removeProperty('right');
            htmlEl.style.removeProperty('bottom');
            htmlEl.style.removeProperty('z-index');
          }
        });
        
        // CRITICAL: Force reflow to ensure header is visible
        void document.body.offsetHeight; // Trigger reflow
        void document.documentElement.offsetHeight; // Trigger reflow
        
        // ENHANCED: Force layout recalculation
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('orientationchange')); // For mobile orientation changes
        
        // CRITICAL: Force all elements to recalculate their layout
        const allElements = document.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && htmlEl.id !== 'webrtc-call-modal') {
            // Trigger reflow for each element
            void htmlEl.offsetHeight;
          }
        });
      };
      
      // ENHANCED: Remove video-call-active class immediately and aggressively
      document.documentElement.classList.remove('video-call-active');
      document.body.classList.remove('video-call-active');
      
      // CRITICAL: Also remove via className manipulation as fallback
      if (document.documentElement.className.includes('video-call-active')) {
        document.documentElement.className = document.documentElement.className.replace(/\bvideo-call-active\b/g, '');
      }
      if (document.body.className.includes('video-call-active')) {
        document.body.className = document.body.className.replace(/\bvideo-call-active\b/g, '');
      }
      
      // CRITICAL: Restore body and html styles immediately
      document.body.style.cssText = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.cssText = '';
      document.documentElement.style.overflow = '';
      
      // CRITICAL: Dispatch call-ended event to notify other components
      window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
      
      // CRITICAL: Dispatch call-ended event to notify other components
      window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
      
      // Call restoreUI immediately and with delays to ensure restoration
      restoreUI();
      setTimeout(restoreUI, 50);
      setTimeout(restoreUI, 100);
      setTimeout(restoreUI, 200);
      setTimeout(restoreUI, 500);
      setTimeout(restoreUI, 1000);
      setTimeout(restoreUI, 2000); // Additional delay for mobile browsers
        
      // Double-check and force visibility after a short delay
      setTimeout(() => {
        const headers = document.querySelectorAll('header, [class*="Header"], [class*="PerfectHeader"]');
        headers.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl && htmlEl.offsetParent === null) {
            // Force visible by removing all style properties
            htmlEl.removeAttribute('style');
            // Ensure it's in the DOM and visible
            htmlEl.style.cssText = '';
            htmlEl.style.display = 'block';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
          }
        });
        
        // Force chat inputs to be visible
        const chatInputs = document.querySelectorAll('textarea[placeholder*="Message"], input[placeholder*="Message"], textarea[placeholder*="message"], input[placeholder*="message"], [class*="message-input"], [class*="MessageInput"], textarea, input[type="text"]');
        chatInputs.forEach((input) => {
          const htmlEl = input as HTMLElement;
          if (htmlEl) {
            htmlEl.style.display = '';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.zIndex = '';
            htmlEl.style.pointerEvents = 'auto';
          }
        });
        
        // Force calling buttons to be visible
        const callButtons = document.querySelectorAll('button[title*="Video"], button[title*="video"], button[title*="Voice"], button[title*="voice"], [class*="Video"], [class*="video-call"], [class*="voice-call"]');
        callButtons.forEach((button) => {
          const htmlEl = button as HTMLElement;
          if (htmlEl) {
            htmlEl.style.display = '';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.zIndex = '';
            htmlEl.style.pointerEvents = 'auto';
          }
        });
      }, 200);
      
      // Final check after longer delay - ENHANCED: More aggressive restoration
      setTimeout(() => {
        // ENHANCED: Force all headers to be visible
        const headers = document.querySelectorAll('header, [class*="Header"], [class*="PerfectHeader"], nav, [role="navigation"]');
        headers.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl) {
            // Remove all inline styles that might hide it
            htmlEl.removeAttribute('style');
            // Force visible
            htmlEl.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; z-index: auto !important;';
            htmlEl.style.display = 'block';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.zIndex = '';
            htmlEl.style.height = '';
            htmlEl.style.maxHeight = '';
            htmlEl.style.position = '';
            // Remove any classes that might hide it
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
          }
        });
        
        // ENHANCED: Force chat header to be visible (specific to chat interface)
        const chatHeaders = document.querySelectorAll('[class*="chat-header"], [class*="ChatHeader"], [class*="neo-glass-header"]');
        chatHeaders.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl) {
            htmlEl.style.display = 'flex';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.zIndex = '10';
            htmlEl.classList.remove('hidden');
          }
        });
        
        // ENHANCED: Final check for chat inputs and calling buttons - more comprehensive restoration
        const chatInputs = document.querySelectorAll('textarea[placeholder*="Message"], input[placeholder*="Message"], textarea[placeholder*="message"], input[placeholder*="message"], [class*="message-input"], [class*="MessageInput"], textarea, input[type="text"], [class*="chat-input"], [class*="ChatInput"]');
        const callButtons = document.querySelectorAll('button[title*="Video"], button[title*="video"], button[title*="Voice"], button[title*="voice"], [class*="Video"], [class*="video-call"], [class*="voice-call"], button[aria-label*="video"], button[aria-label*="Video"]');
        const chatContainers = document.querySelectorAll('[class*="chat-input"], [class*="message-input-container"], [class*="ChatInput"], [class*="border-t"][class*="p-"], form[class*="flex"], [class*="flex"][class*="items-center"][class*="p-"], [class*="sticky"][class*="bottom-"], [class*="fixed"][class*="bottom-"]');
        const headerButtons = document.querySelectorAll('header button, nav button, [class*="Header"] button, [class*="neo-glass-header"] button, button[class*="p-2"]');
        
        [...chatInputs, ...callButtons, ...chatContainers, ...headerButtons].forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl) {
            // Remove all inline styles that might hide elements
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            htmlEl.style.display = '';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.pointerEvents = 'auto';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.transform = '';
            htmlEl.style.translate = '';
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            // Force reflow
            void htmlEl.offsetHeight;
          }
        });
        
        // CRITICAL: Restore chat typing area specifically - look for form containers
        const chatTypingAreas = document.querySelectorAll('[class*="flex"][class*="items-center"][class*="gap-"], [class*="border-t"], [class*="p-4"], [class*="bg-"], form');
        chatTypingAreas.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && (htmlEl.closest('[class*="chat"]') || htmlEl.querySelector('textarea') || htmlEl.querySelector('input[type="text"]'))) {
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            htmlEl.style.display = '';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.position = '';
            htmlEl.style.zIndex = '';
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            void htmlEl.offsetHeight;
          }
        });
        
      // ENHANCED: Trigger a re-render by dispatching a custom event
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
      
      // ENHANCED: Additional layout restoration after longer delay
      setTimeout(() => {
        // Force all flex containers to recalculate
        const flexContainers = document.querySelectorAll('[class*="flex"][class*="h-full"], [class*="flex"][class*="w-full"]');
        flexContainers.forEach((container) => {
          const htmlEl = container as HTMLElement;
          if (htmlEl) {
            // Trigger reflow
            void htmlEl.offsetHeight;
            // Remove any inline styles that might affect layout
            htmlEl.style.removeProperty('width');
            htmlEl.style.removeProperty('height');
            htmlEl.style.removeProperty('max-width');
            htmlEl.style.removeProperty('max-height');
            htmlEl.style.removeProperty('min-width');
            htmlEl.style.removeProperty('min-height');
          }
        });
        
        // Force page layout recalculation
        document.body.style.display = 'none';
        void document.body.offsetHeight;
        document.body.style.display = '';
      }, 1000);
    }, 500);
      
      // ENHANCED: Additional check after 1 second to ensure everything is visible
      setTimeout(() => {
        const allHeaders = document.querySelectorAll('header, nav, [class*="Header"], [class*="PerfectHeader"]');
        allHeaders.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl) {
            // Remove ALL inline styles completely
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            
            // Force visible
            htmlEl.style.display = 'block';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.position = '';
            htmlEl.style.top = '';
            htmlEl.style.left = '';
            htmlEl.style.right = '';
            htmlEl.style.bottom = '';
            htmlEl.style.width = '';
            htmlEl.style.height = '';
            htmlEl.style.zIndex = '';
            htmlEl.style.margin = '';
            htmlEl.style.padding = '';
            htmlEl.style.transform = '';
            htmlEl.style.translate = '';
            
            // Remove all hiding classes
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            
            // Force reflow
            void htmlEl.offsetHeight;
          }
        });
        
        // CRITICAL: Also restore all header buttons again
        const allHeaderButtons = document.querySelectorAll('header button, nav button, [class*="Header"] button');
        allHeaderButtons.forEach((button) => {
          const htmlEl = button as HTMLElement;
          if (htmlEl) {
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            htmlEl.style.display = '';
            htmlEl.style.visibility = '';
            htmlEl.style.opacity = '';
            htmlEl.style.pointerEvents = 'auto';
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            void htmlEl.offsetHeight;
          }
        });
      }, 1000);
      
      // CRITICAL: Final restoration check after 2 seconds
      setTimeout(() => {
        // Force all headers to be visible one more time
        const finalHeaders = document.querySelectorAll('header, nav, [class*="Header"], [class*="PerfectHeader"]');
        finalHeaders.forEach((header) => {
          const htmlEl = header as HTMLElement;
          if (htmlEl) {
            htmlEl.removeAttribute('style');
            htmlEl.style.cssText = '';
            htmlEl.style.display = 'block';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
            void htmlEl.offsetHeight;
          }
        });
      }, 2000);
      
      // Restore scroll position
      window.scrollTo(scrollX, scrollY);
    };
  }, []);

  // CRITICAL: User interaction handler for mobile video playback
  // Mobile browsers require user interaction to play video
  const handleUserInteraction = () => {
    if (remoteVideoRef.current && remoteVideoRef.current.paused && remoteVideoRef.current.srcObject) {
      console.log('📱 [WebRTC Call] User interaction detected - triggering video play for mobile');
      safePlay(remoteVideoRef.current, 'user-interaction').catch(() => {});
    }
    if (localVideoRef.current && localVideoRef.current.paused && localVideoRef.current.srcObject) {
      console.log('📱 [WebRTC Call] User interaction detected - triggering local video play for mobile');
      localVideoRef.current.play().catch(() => {});
    }
  };

  return (
    <div 
      ref={modalRef}
      id="webrtc-call-modal"
      className="fixed inset-0 bg-black flex flex-col"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      style={{ 
        width: '100vw', 
        height: typeof window !== 'undefined' && window.innerHeight ? `${window.innerHeight}px` : '100dvh', // Use actual viewport height for mobile
        maxWidth: '100vw', 
        maxHeight: typeof window !== 'undefined' && window.innerHeight ? `${window.innerHeight}px` : '100dvh',
        minWidth: '100vw',
        minHeight: typeof window !== 'undefined' && window.innerHeight ? `${window.innerHeight}px` : '100dvh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2147483647, // CRITICAL: Maximum z-index to cover everything including browser chrome
        margin: 0,
        padding: 0,
        // CRITICAL: Force fullscreen on mobile
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        // CRITICAL: Ensure visibility - always visible
        visibility: 'visible',
        opacity: 1,
        // CRITICAL: Force dimensions on mobile
        boxSizing: 'border-box'
      }}
    >
      {/* Video Container - Zoom/Meet-like fixed layout - NO SCROLL - Perfect fit - FULL SCREEN */}
      {/* CRITICAL: Video container must fill ENTIRE available space - no black areas */}
      <div 
        className="relative bg-black"
        style={{ 
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0, // Critical for flex children to shrink
          // CRITICAL: Use 100% of available viewport minus control bar - NO BLACK SPACE
          height: 'calc(100dvh - 80px)', // Full height minus control bar
          maxHeight: 'calc(100dvh - 80px)', // Ensure it doesn't exceed
          minHeight: 'calc(100dvh - 80px)', // Ensure it fills minimum space
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch', // CRITICAL: Stretch to fill container
          justifyContent: 'stretch', // CRITICAL: Stretch to fill container
          backgroundColor: '#000000', // CRITICAL: Black background to prevent white flash
          zIndex: 10,
          // CRITICAL: Ensure container fills all available space
          boxSizing: 'border-box',
          margin: 0,
          padding: 0
        }}
      >
        {/* Remote Video (Full Screen) - Zoom/Meet-like centered and fitted - NO STRETCH */}
        {/* CRITICAL: Ensure video is always visible when stream exists - prevents black screen */}
        {/* CRITICAL: Use key to prevent re-mounting - stable video element */}
        <video
          key={`remote-video-${callId}`}
          ref={remoteVideoRef}
          autoPlay
          playsInline
          {...({ 'webkit-playsinline': 'true' } as any)} // CRITICAL: iOS Safari compatibility
          {...({ 'x5-playsinline': 'true' } as any)} // CRITICAL: Android/WeChat compatibility
          {...({ 'x5-video-player-type': 'h5' } as any)} // CRITICAL: Android fullscreen fix
          {...({ 'x5-video-player-fullscreen': 'true' } as any)} // CRITICAL: Android fullscreen fix
          {...({ 'x5-video-orientation': 'portrait' } as any)} // CRITICAL: Android orientation fix
          {...({ 'x-webkit-airplay': 'allow' } as any)} // CRITICAL: iOS AirPlay compatibility
          muted={false}
          preload="auto"
          controls={false} // CRITICAL: Disable native controls on mobile to prevent black screen
          disablePictureInPicture={true} // CRITICAL: Prevent PiP on mobile
          disableRemotePlayback={true} // CRITICAL: Prevent remote playback issues
          style={{ 
            zIndex: 20, // BELOW PiP (z-index 80) - Google Meet/Zoom style
            backgroundColor: '#000000', // Black background to prevent white flash
            display: 'block !important',
            visibility: 'visible !important',
            opacity: '1 !important', // Always fully opaque when stream exists - prevents black screen
            pointerEvents: 'auto',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover', // CRITICAL: Fill container while maintaining aspect ratio - 16:9 cropped if needed
            objectPosition: 'center',
            // CRITICAL: Ensure video always fills container - NO BLACK SPACE
            flexShrink: 0,
            flexGrow: 1,
            // CRITICAL: Additional mobile-specific styles
            WebkitTransform: 'translateZ(0)', // Force hardware acceleration
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: 'auto', // Prevent browser optimizations that might hide video
            // CRITICAL: Force video to fill entire container
            boxSizing: 'border-box',
            margin: 0,
            padding: 0,
            // CRITICAL: Disable ALL transitions and animations to prevent flickering
            transition: 'none !important',
            animation: 'none !important',
            filter: 'none !important', // CRITICAL: No CSS filters on video
            WebkitFilter: 'none !important' // CRITICAL: No CSS filters on video
          }}
          onLoadedMetadata={() => {
            console.log('✅ [WebRTC Call] Remote video metadata loaded', {
              videoWidth: remoteVideoRef.current?.videoWidth,
              videoHeight: remoteVideoRef.current?.videoHeight,
              readyState: remoteVideoRef.current?.readyState,
              paused: remoteVideoRef.current?.paused,
              muted: remoteVideoRef.current?.muted
            });
            if (remoteVideoRef.current && !callEndedRef.current) {
              const video = remoteVideoRef.current;
              const stream = video.srcObject as MediaStream;
              
              // CRITICAL: Ensure video element has all mobile attributes
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('x5-playsinline', 'true');
              video.setAttribute('x5-video-player-type', 'h5');
              video.setAttribute('x5-video-player-fullscreen', 'true');
              
              // Check if tracks are muted and wait for them to unmute
              if (stream) {
                const audioTracks = stream.getAudioTracks();
                const videoTracks = stream.getVideoTracks();
                
                // Set up unmute listeners for all tracks
                [...audioTracks, ...videoTracks].forEach(track => {
                  if (track.muted) {
                    console.log('🔧 [WebRTC Call] Track is muted in metadata, waiting for unmute:', track.kind);
                    track.onunmute = () => {
                      console.log('✅ [WebRTC Call] Track unmuted in metadata:', track.kind);
                      // Force video to play when track unmutes
                      if (video.paused && !callEndedRef.current) {
                        safePlay(video, `metadata-track-unmute-${track.kind}`).catch(() => {});
                      }
                    };
                  }
                });
              }
              
              // CRITICAL: Force video to be visible and playing on desktop AND mobile
              // Desktop browsers also need explicit styles to show video
              video.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-width: 100% !important;
                min-height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                object-fit: cover !important;
                object-position: center !important;
                background-color: #000000 !important;
                z-index: 20 !important;
                pointer-events: auto !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
                will-change: auto !important;
                transition: none !important;
                animation: none !important;
                filter: none !important;
                -webkit-filter: none !important;
              `;
              
              // CRITICAL: Force video to play immediately on desktop AND mobile
              // Desktop browsers sometimes don't autoplay WebRTC streams, especially on refresh
              if (video.paused) {
                // Use safePlay for better error handling, but also try direct play for desktop
                safePlay(video, 'onLoadedMetadata-desktop').catch(() => {
                  // If safePlay fails, try direct play (desktop browsers may need this)
                  video.play().catch((err) => {
                    console.warn('⚠️ [WebRTC Call] Video play failed in onLoadedMetadata:', err);
                    // Retry after short delay for desktop
                    setTimeout(() => {
                      if (video && !callEndedRef.current && video.paused) {
                        video.play().catch(() => {});
                      }
                    }, 100);
                  });
                });
              } else {
                // Video is already playing, but ensure it stays visible on desktop refresh
                video.style.opacity = '1';
                video.style.visibility = 'visible';
                setRemoteVideoVisible(true);
              }
              
              setRemoteVideoVisible(true);
              
              // Ensure video has dimensions (may be 0 initially for WebRTC)
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                console.log('✅ [WebRTC Call] Video has dimensions:', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight
                });
              } else {
                // CRITICAL: For WebRTC, dimensions may be 0 initially - wait for video track to produce frames
                console.log('⏳ [WebRTC Call] Video dimensions not yet available (normal for WebRTC), waiting for frames...');
              }
              
              // CRITICAL: Force video container to be visible and fill ENTIRE space - NO BLACK AREAS
              const videoContainer = video.parentElement;
              if (videoContainer) {
                videoContainer.style.cssText = `
                  position: relative !important;
                  width: 100% !important;
                  height: 100% !important;
                  min-height: 100% !important;
                  max-height: 100% !important;
                  display: flex !important;
                  align-items: stretch !important;
                  justify-content: stretch !important;
                  background-color: #000000 !important;
                  z-index: 10 !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  margin: 0 !important;
                  padding: 0 !important;
                `;
              }
              
              // CRITICAL: Ensure no other elements are covering the video on mobile
              const allOverlays = document.querySelectorAll('[style*="z-index"]:not(#webrtc-call-modal):not([id*="video"])');
              allOverlays.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (htmlEl && htmlEl.style && parseInt(htmlEl.style.zIndex || '0') > 20 && htmlEl.id !== 'webrtc-call-modal') {
                  // Lower z-index of any overlays that might be covering the video
                  const currentZ = parseInt(htmlEl.style.zIndex || '0');
                  if (currentZ >= 9999) {
                    htmlEl.style.zIndex = '1';
                  }
                }
              });
              
              // CRITICAL: Force play immediately - mobile browsers need this
              // For mobile, we need to ensure video plays even if autoplay is blocked
              // CRITICAL: Re-apply mobile attributes before playing
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('x5-playsinline', 'true');
              video.setAttribute('x5-video-player-type', 'h5');
              video.setAttribute('x5-video-player-fullscreen', 'true');
              
              safePlay(video, 'onLoadedMetadata').then(() => {
                console.log('✅ [WebRTC Call] Remote video started playing from onLoadedMetadata', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  paused: video.paused
                });
                // CRITICAL: Ensure visibility with aggressive styles for BOTH mobile AND desktop
                video.style.cssText = `
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  z-index: 20 !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  min-width: 100% !important;
                  min-height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  object-fit: cover !important;
                  object-position: center !important;
                  background-color: #000000 !important;
                  transform: translateZ(0) !important;
                  -webkit-transform: translateZ(0) !important;
                  pointer-events: auto !important;
                  transition: none !important;
                  animation: none !important;
                  filter: none !important;
                  -webkit-filter: none !important;
                `;
                
                // CRITICAL: Force play again on desktop if still paused
                if (video.paused) {
                  video.play().catch((playErr) => {
                    console.warn('⚠️ [WebRTC Call] Video play failed after onLoadedMetadata:', playErr);
                  });
                }
                
                setRemoteVideoVisible(true);
              }).catch((err) => {
                // Error already logged in safePlay, retry after short delay with more aggressive approach
                if (!callEndedRef.current) {
                  setTimeout(() => {
                    if (remoteVideoRef.current && !callEndedRef.current) {
                      const retryVideo = remoteVideoRef.current;
                      // CRITICAL: Re-set all mobile attributes
                      retryVideo.setAttribute('playsinline', 'true');
                      retryVideo.setAttribute('webkit-playsinline', 'true');
                      retryVideo.setAttribute('x5-playsinline', 'true');
                      retryVideo.setAttribute('x5-video-player-type', 'h5');
                      retryVideo.setAttribute('x5-video-player-fullscreen', 'true');
                      // Ensure video is visible
                      retryVideo.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        z-index: 20 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover !important;
                        background-color: #000000 !important;
                        transform: translateZ(0) !important;
                        -webkit-transform: translateZ(0) !important;
                        transition: none !important;
                        animation: none !important;
                        filter: none !important;
                        -webkit-filter: none !important;
                      `;
                      // Try play again
                      safePlay(retryVideo, 'onLoadedMetadata-retry').then(() => {
                        setRemoteVideoVisible(true);
                      }).catch(() => {
                        // If still failing, try one more time after longer delay
                        if (!callEndedRef.current) {
                          setTimeout(() => {
                            if (remoteVideoRef.current && !callEndedRef.current && remoteVideoRef.current.srcObject) {
                              const finalVideo = remoteVideoRef.current;
                              finalVideo.setAttribute('playsinline', 'true');
                              finalVideo.setAttribute('webkit-playsinline', 'true');
                              safePlay(finalVideo, 'onLoadedMetadata-final-retry').catch(() => {});
                            }
                          }, 500);
                        }
                      });
                    }
                  }, 100);
                }
              });
            }
          }}
          onCanPlay={() => {
            console.log('✅ [WebRTC Call] Remote video can play');
            if (remoteVideoRef.current && !callEndedRef.current) {
              const video = remoteVideoRef.current;
              
              // CRITICAL: Ensure all mobile attributes are set
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('x5-playsinline', 'true');
              
              // CRITICAL: Make visible immediately with all styles - use cssText for BOTH mobile AND desktop
              video.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-width: 100% !important;
                min-height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                z-index: 20 !important;
                background-color: #000000 !important;
                pointer-events: auto !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
                will-change: auto !important;
                object-fit: cover !important;
                object-position: center !important;
                transition: none !important;
                animation: none !important;
                filter: none !important;
                -webkit-filter: none !important;
              `;
              setRemoteVideoVisible(true);
              
              // CRITICAL: Force video container to be visible and fill ENTIRE space - NO BLACK AREAS
              const videoContainer = video.parentElement;
              if (videoContainer) {
                videoContainer.style.cssText = `
                  position: relative !important;
                  width: 100% !important;
                  height: 100% !important;
                  min-height: 100% !important;
                  max-height: 100% !important;
                  display: flex !important;
                  align-items: stretch !important;
                  justify-content: stretch !important;
                  background-color: #000000 !important;
                  z-index: 10 !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  margin: 0 !important;
                  padding: 0 !important;
                `;
              }
              
              // Always try to play using safe play mechanism
              safePlay(video, 'onCanPlay').then(() => {
                console.log('✅ [WebRTC Call] Remote video started playing from onCanPlay');
                // CRITICAL: Ensure visibility on desktop - force play if paused (especially on refresh)
                if (video.paused) {
                  // Try direct play first for desktop browsers
                  video.play().catch((playErr) => {
                    console.warn('⚠️ [WebRTC Call] Video play failed in onCanPlay:', playErr);
                    // Retry with safePlay if direct play fails
                    safePlay(video, 'onCanPlay-retry-direct').catch(() => {});
                  });
                } else {
                  // Video is playing, but ensure it's visible (desktop refresh fix)
                  video.style.opacity = '1';
                  video.style.visibility = 'visible';
                  setRemoteVideoVisible(true);
                }
                // Ensure visibility
                video.style.opacity = '1';
                video.style.visibility = 'visible';
                video.style.display = 'block';
                setRemoteVideoVisible(true);
                
                // CRITICAL: Double-check video is playing after a short delay (for desktop)
                setTimeout(() => {
                  if (video && !callEndedRef.current) {
                    if (video.paused) {
                      console.log('⚠️ [WebRTC Call] Video paused after onCanPlay, retrying...');
                      safePlay(video, 'onCanPlay-retry').catch(() => {});
                    }
                    // Force visibility again
                    video.style.cssText = `
                      display: block !important;
                      visibility: visible !important;
                      opacity: 1 !important;
                      width: 100% !important;
                      height: 100% !important;
                      object-fit: cover !important;
                      background-color: #000000 !important;
                      transition: none !important;
                      animation: none !important;
                      filter: none !important;
                      -webkit-filter: none !important;
                    `;
                    setRemoteVideoVisible(true);
                  }
                }, 100);
              }).catch(() => {
                // Error already logged in safePlay, retry
                setTimeout(() => {
                  if (remoteVideoRef.current && !callEndedRef.current) {
                    safePlay(remoteVideoRef.current, 'onCanPlay-error-retry').catch(() => {});
                  }
                }, 200);
              });
            }
          }}
          onPlay={() => {
            console.log('✅ [WebRTC Call] Remote video is now playing!');
            // CRITICAL: Ensure video is fully visible when playing (desktop AND mobile)
            if (remoteVideoRef.current && !callEndedRef.current) {
              const video = remoteVideoRef.current;
              // CRITICAL: Force all visibility styles for desktop AND mobile (especially on refresh)
              video.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 20 !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-width: 100% !important;
                min-height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                object-fit: cover !important;
                object-position: center !important;
                background-color: #000000 !important;
                pointer-events: auto !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
                transition: none !important;
                animation: none !important;
                filter: none !important;
                -webkit-filter: none !important;
              `;
              setRemoteVideoVisible(true);
              
              // CRITICAL: Ensure video container is visible and fills ENTIRE space - NO BLACK AREAS
              const container = video.parentElement;
              if (container) {
                container.style.cssText = `
                  position: relative !important;
                  width: 100% !important;
                  height: 100% !important;
                  min-height: 100% !important;
                  max-height: 100% !important;
                  display: flex !important;
                  align-items: stretch !important;
                  justify-content: stretch !important;
                  background-color: #000000 !important;
                  z-index: 10 !important;
                  overflow: hidden !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  box-sizing: border-box !important;
                  margin: 0 !important;
                  padding: 0 !important;
                `;
              }
              
              // CRITICAL: Log video state for debugging
              console.log('✅ [WebRTC Call] Video playing state:', {
                paused: video.paused,
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                srcObject: !!video.srcObject,
                opacity: video.style.opacity,
                visibility: video.style.visibility,
                clientWidth: video.clientWidth,
                clientHeight: video.clientHeight
              });
              
              // CRITICAL: If video dimensions are still 0, wait a bit more (WebRTC can be slow)
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.log('⏳ [WebRTC Call] Video playing but dimensions not yet available (normal for WebRTC)');
                setTimeout(() => {
                  if (remoteVideoRef.current && !callEndedRef.current) {
                    const checkVideo = remoteVideoRef.current;
                    if (checkVideo.videoWidth > 0 && checkVideo.videoHeight > 0) {
                      console.log('✅ [WebRTC Call] Video dimensions now available:', {
                        videoWidth: checkVideo.videoWidth,
                        videoHeight: checkVideo.videoHeight
                      });
                    }
                  }
                }, 500);
              }
            }
          }}
          onPause={() => {
            if (!callEndedRef.current) {
              console.warn('⚠️ [WebRTC Call] Remote video was paused');
              // Try to resume using safe play
              if (remoteVideoRef.current) {
                setTimeout(() => {
                  if (remoteVideoRef.current && !callEndedRef.current) {
                    safePlay(remoteVideoRef.current, 'onPause-resume').catch(() => {});
                  }
                }, 100);
              }
            }
          }}
          onLoadedData={() => {
            console.log('✅ [WebRTC Call] Remote video data loaded');
            if (remoteVideoRef.current && !callEndedRef.current) {
              const video = remoteVideoRef.current;
              video.style.opacity = '1';
              video.style.visibility = 'visible';
              setRemoteVideoVisible(true);
              safePlay(video, 'onLoadedData').then(() => {
                setRemoteVideoVisible(true);
              }).catch(() => {});
            }
          }}
        />
        
        {/* RaftAI Real-Time Detection Badge - Top Middle (Centered) - BELOW video area - Fixed Alignment - Always Visible - Mobile Optimized */}
        {/* CRITICAL: Always show RaftAI badge when call is connected, even if detection is null (shows "Verifying" state) */}
        {/* CRITICAL: Positioned BELOW video to avoid interference - Google Meet/Zoom style */}
        {enableRaftAI && type === 'video' && (callState === 'connected' || callState === 'connecting') && (
          <div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-black/95 backdrop-blur-md rounded-lg px-3 py-2 border-2 shadow-lg"
            style={{
              borderColor: raftaiDetection?.aiDetected ? '#ef4444' : raftaiDetection?.isReal ? '#10b981' : '#f59e0b',
              animation: 'none !important', // CRITICAL: Disable ALL animations to prevent blinking
              transition: 'none !important', // CRITICAL: Disable ALL transitions
              boxShadow: raftaiDetection?.aiDetected 
                ? '0 0 20px rgba(239, 68, 68, 0.5)' 
                : raftaiDetection?.isReal 
                  ? '0 0 20px rgba(16, 185, 129, 0.5)' 
                  : '0 0 20px rgba(245, 158, 11, 0.5)',
              display: 'flex !important',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 'fit-content',
              whiteSpace: 'nowrap',
              transform: 'translateX(-50%) translateZ(0)',
              visibility: 'visible !important',
              opacity: '1 !important',
              pointerEvents: 'auto !important',
              // CRITICAL: Hardware acceleration for smoother rendering
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              // CRITICAL: Ensure it's always on top - FORCE VISIBILITY
              position: 'absolute !important',
              zIndex: '100 !important',
              top: '16px !important',
              left: '50% !important',
              // CRITICAL: Mobile-specific styles to ensure visibility
              WebkitTransform: 'translateX(-50%) translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              // CRITICAL: Force visibility on mobile browsers
              WebkitAppearance: 'none',
              appearance: 'none',
              // CRITICAL: Ensure text is visible on mobile
              color: '#ffffff !important',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
            }}
            role="status"
            aria-live="polite"
            aria-label={`RaftAI Detection: ${raftaiDetection?.aiDetected ? 'AI detected' : raftaiDetection?.isReal ? 'Real person' : 'Verifying'} with ${Math.round(raftaiDetection?.confidence || 0)}% confidence`}
          >
            <div className="flex items-center gap-2 flex-nowrap">
              <div 
                className="w-2.5 h-2.5 rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: raftaiDetection?.aiDetected ? '#ef4444' : raftaiDetection?.isReal ? '#10b981' : '#f59e0b',
                  animation: 'none', // CRITICAL: Disable pulse animation to prevent blinking
                  boxShadow: raftaiDetection?.aiDetected 
                    ? '0 0 10px rgba(239, 68, 68, 0.8)' 
                    : raftaiDetection?.isReal 
                      ? '0 0 10px rgba(16, 185, 129, 0.8)' 
                      : '0 0 10px rgba(245, 158, 11, 0.8)'
                }}
              />
              <span className="text-white text-xs font-semibold whitespace-nowrap">
                {raftaiDetection?.aiDetected ? '⚠️ Live: AI' : raftaiDetection?.isReal ? '✅ Live: REAL' : '🟡 Live: VERIFYING'}
              </span>
              <span className="text-white/70 text-xs font-medium whitespace-nowrap">
                {raftaiDetection ? `(${Math.round(raftaiDetection.confidence)}%)` : '(Analyzing...)'}
              </span>
            </div>
          </div>
        )}
        
        {/* Active Speaker Indicator - Only show when not pinned - Positioned below RaftAI to prevent overlap */}
        {/* CRITICAL: Positioned BELOW video area to avoid interference - Google Meet/Zoom style */}
        {callState === 'connected' && activeSpeaker && !pinnedParticipant && (
          <div 
            className="absolute top-20 sm:top-20 left-1/2 transform -translate-x-1/2 z-[95] bg-cyan-500/90 backdrop-blur-md rounded-full px-4 py-2 border-2 border-cyan-400 shadow-lg"
            style={{ 
              animation: 'none !important', // CRITICAL: Disable ALL animations
              transition: 'none !important', // CRITICAL: Disable ALL transitions
              display: 'flex !important',
              visibility: 'visible !important',
              opacity: '1 !important',
              position: 'absolute !important',
              top: '80px !important', // Position below RaftAI badge
              left: '50% !important',
              transform: 'translateX(-50%) translateZ(0) !important',
              zIndex: '95 !important',
              pointerEvents: 'auto !important',
              willChange: 'transform'
            }}
            role="status"
            aria-live="polite"
          >
            <span className="text-white text-xs font-semibold">
              🎤 {activeSpeaker === 'local' ? 'You are speaking' : `${remoteUserName || 'Remote'} is speaking`}
            </span>
          </div>
        )}
        
        {/* Pin/Unpin Button for Remote Video */}
        {type === 'video' && callState === 'connected' && (
          <button
            onClick={() => {
              if (pinnedParticipant === 'remote') {
                setPinnedParticipant(null);
              } else {
                setPinnedParticipant('remote');
              }
            }}
            className="absolute top-4 right-20 z-40 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md rounded-lg p-2 border border-cyan-500/30 shadow-lg transition-all"
            title={pinnedParticipant === 'remote' ? 'Unpin Remote Video' : 'Pin Remote Video'}
            aria-label={pinnedParticipant === 'remote' ? 'Unpin Remote Video' : 'Pin Remote Video'}
          >
            {pinnedParticipant === 'remote' ? (
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 5H17a1 1 0 010 2h-2.854l-1.179 2.256A1 1 0 0112 10H8a1 1 0 01-.967-1.744L8.854 7H6a1 1 0 110-2h2.854l1.179-2.256A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </button>
        )}
        
        {/* Fallback background when no video stream or video is off */}
        {callState === 'connected' && type === 'video' && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center transition-opacity duration-300"
            style={{ 
              zIndex: 1, // CRITICAL: Lower z-index than video (9999) to ensure video is on top
              display: (() => {
                // CRITICAL: Completely hide fallback if video element has stream with video tracks AND is visible
                if (remoteVideoRef.current?.srcObject) {
                  const stream = remoteVideoRef.current.srcObject as MediaStream;
                  const videoTracks = stream.getVideoTracks();
                  const hasVideo = videoTracks.length > 0 && videoTracks[0]?.readyState === 'live';
                  const videoOpacity = parseFloat(remoteVideoRef.current.style.opacity || '1');
                  const videoDisplay = remoteVideoRef.current.style.display || 'block';
                  const videoVisibility = remoteVideoRef.current.style.visibility || 'visible';
                  const videoPaused = remoteVideoRef.current.paused;
                  // CRITICAL: Only show fallback if video is truly not visible or not playing
                  if (hasVideo && videoOpacity > 0.5 && videoDisplay !== 'none' && videoVisibility !== 'hidden' && !videoPaused) {
                    return 'none'; // Completely hide fallback
                  }
                  return remoteVideoVisible ? 'none' : 'flex'; // Show fallback if video not visible
                }
                return remoteVideoVisible ? 'none' : 'flex'; // Show fallback if no stream
              })(),
              opacity: (() => {
                // CRITICAL: Hide fallback completely if video element has stream with video tracks AND is visible
                if (remoteVideoRef.current?.srcObject) {
                  const stream = remoteVideoRef.current.srcObject as MediaStream;
                  const videoTracks = stream.getVideoTracks();
                  const hasVideo = videoTracks.length > 0 && videoTracks[0]?.readyState === 'live';
                  const videoOpacity = parseFloat(remoteVideoRef.current.style.opacity || '1');
                  const videoDisplay = remoteVideoRef.current.style.display || 'block';
                  const videoVisibility = remoteVideoRef.current.style.visibility || 'visible';
                  const videoPaused = remoteVideoRef.current.paused;
                  // CRITICAL: Only show fallback if video is truly not visible or not playing
                  if (hasVideo && videoOpacity > 0.5 && videoDisplay !== 'none' && videoVisibility !== 'hidden' && !videoPaused) {
                    return 0; // Completely hide fallback
                  }
                  return remoteVideoVisible ? 0 : 1; // Show fallback if video not visible
                }
                return remoteVideoVisible ? 0 : 1; // Show fallback if no stream
              })(),
              visibility: (() => {
                // CRITICAL: Hide fallback completely if video element has stream with video tracks AND is visible
                if (remoteVideoRef.current?.srcObject) {
                  const stream = remoteVideoRef.current.srcObject as MediaStream;
                  const videoTracks = stream.getVideoTracks();
                  const hasVideo = videoTracks.length > 0 && videoTracks[0]?.readyState === 'live';
                  const videoOpacity = parseFloat(remoteVideoRef.current.style.opacity || '1');
                  const videoDisplay = remoteVideoRef.current.style.display || 'block';
                  const videoVisibility = remoteVideoRef.current.style.visibility || 'visible';
                  const videoPaused = remoteVideoRef.current.paused;
                  // CRITICAL: Only show fallback if video is truly not visible or not playing
                  if (hasVideo && videoOpacity > 0.5 && videoDisplay !== 'none' && videoVisibility !== 'hidden' && !videoPaused) {
                    return 'hidden'; // Completely hide fallback
                  }
                  return remoteVideoVisible ? 'hidden' : 'visible'; // Show fallback if video not visible
                }
                return remoteVideoVisible ? 'hidden' : 'visible'; // Show fallback if no stream
              })(),
              pointerEvents: (() => {
                if (remoteVideoRef.current?.srcObject) {
                  const stream = remoteVideoRef.current.srcObject as MediaStream;
                  const videoTracks = stream.getVideoTracks();
                  const hasVideo = videoTracks.length > 0 && videoTracks[0]?.readyState === 'live';
                  const videoOpacity = parseFloat(remoteVideoRef.current.style.opacity || '1');
                  const videoPaused = remoteVideoRef.current.paused;
                  // CRITICAL: Disable pointer events if video is active and playing
                  if (hasVideo && videoOpacity > 0.5 && !videoPaused) {
                    return 'none';
                  }
                }
                return remoteVideoVisible ? 'none' : 'auto';
              })()
            }}
          >
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/30" style={{ animation: 'none' }}>
                <span className="text-cyan-400 text-4xl font-semibold">
                  {remoteUserName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <p className="text-white/60 text-sm">{remoteUserName || 'Connecting...'}</p>
              <p className="text-white/40 text-xs mt-2">Waiting for video...</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - Google Meet/Zoom style - BOTTOM-RIGHT thumbnail - Always visible - No Overlap */}
        {type === 'video' && (
          <div 
            className="absolute bottom-20 right-4 sm:bottom-20 sm:right-4 bg-gray-900/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-500/40 z-[80]"
            style={{
              // CRITICAL: Google Meet/Zoom style - SMALL thumbnail in bottom-right corner
              width: 'clamp(120px, 20vw, 240px)', // Google Meet style size
              height: 'clamp(90px, 15vw, 180px)', // Maintain 16:9 aspect ratio
              aspectRatio: '16/9',
              maxWidth: '240px', // Maximum width for PiP
              maxHeight: '180px', // Maximum height for PiP
              // CRITICAL: Ensure it's always visible on mobile AND desktop - FORCE VISIBILITY
              display: 'block !important',
              visibility: 'visible !important',
              opacity: '1 !important',
              pointerEvents: 'auto !important',
              position: 'absolute !important',
              bottom: '100px !important', // Position above control bar (80px + 20px gap)
              right: '16px !important',
              zIndex: '80 !important',
              // CRITICAL: Mobile-specific styles to ensure visibility
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              willChange: 'transform',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              transition: 'none', // Disable transitions to prevent blinking
              animation: 'none' // Disable animations
            }}
          >
            <video
              key={`local-video-${callId}`}
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{
                width: '100% !important',
                height: '100% !important',
                objectFit: 'cover !important',
                objectPosition: 'center !important',
                display: 'block !important',
                visibility: 'visible !important',
                opacity: isVideoOff ? '0.3' : '1 !important',
                // CRITICAL: Mobile-specific styles to ensure visibility
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                willChange: 'transform',
                position: 'relative',
                zIndex: '1 !important',
                transition: 'none !important', // CRITICAL: Disable ALL transitions to prevent blinking
                animation: 'none !important', // CRITICAL: Disable ALL animations
                filter: 'none !important', // CRITICAL: No CSS filters on video
                WebkitFilter: 'none !important' // CRITICAL: No CSS filters on video
              }}
              onLoadedMetadata={() => {
                if (localVideoRef.current) {
                  // CRITICAL: Re-apply mobile attributes
                  localVideoRef.current.setAttribute('playsinline', 'true');
                  localVideoRef.current.setAttribute('webkit-playsinline', 'true');
                  localVideoRef.current.setAttribute('x5-playsinline', 'true');
                  localVideoRef.current.style.display = 'block';
                  localVideoRef.current.style.visibility = 'visible';
                  localVideoRef.current.style.opacity = isVideoOff ? '0.3' : '1';
                  // CRITICAL: Force play on mobile
                  if (localVideoRef.current.paused) {
                    localVideoRef.current.play().catch(() => {});
                  }
                }
              }}
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800/95 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-2 border-2 border-cyan-400/50">
                    <span className="text-white text-2xl font-semibold">
                      {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs font-medium">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Call UI (No Video) */}
        {type === 'voice' && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-cyan-500/30" style={{ animation: 'none' }}>
                <PhoneIcon className="w-16 h-16 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Voice Call</h2>
              <p className="text-white/60">{remoteUserName || 'Connected'}</p>
            </div>
          </div>
        )}

        {/* Call State Overlay */}
        {callState !== 'connected' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              {callState === 'initializing' && (
                <>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg">Initializing call...</p>
                </>
              )}
              {callState === 'connecting' && (
                <>
                  <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg">Connecting...</p>
                </>
              )}
              {callState === 'failed' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
                    <XMarkIcon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white text-lg mb-2 font-semibold">Connection Failed</p>
                  <div className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                    {error && error.split('\n').map((line, idx) => (
                      <p key={idx} className={idx === 0 ? 'mb-2' : 'mb-1'}>{line}</p>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={async () => {
                        // Try to request permissions again
                        try {
                          setError(null);
                          setCallState('initializing');
                          
                          // Request permissions first
                          if (type === 'video') {
                            const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                            // Stop the test stream
                            testStream.getTracks().forEach(track => track.stop());
                          } else {
                            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            // Stop the test stream
                            testStream.getTracks().forEach(track => track.stop());
                          }
                          
                          // If successful, recreate the manager and retry
                          if (webrtcManagerRef.current) {
                            await webrtcManagerRef.current.endCall(false);
                          }
                          
                          const newManager = new WebRTCManager(currentUserId, currentUserName, roomId);
                          webrtcManagerRef.current = newManager;
                          
                          // Set up event handlers
                          newManager.onLocalStream((stream) => {
                            if (localVideoRef.current && type === 'video') {
                              localVideoRef.current.srcObject = stream;
                            }
                          });
                          
                          newManager.onRemoteStream((stream) => {
                            if (remoteVideoRef.current) {
                              remoteVideoRef.current.srcObject = stream;
                            }
                          });
                          
                          newManager.onConnectionState((state) => {
                            if (state === 'connecting') {
                              setCallState('connecting');
                            } else if (state === 'connected') {
                              setCallState('connected');
                            } else if (state === 'failed' || state === 'disconnected') {
                              setCallState('failed');
                              setError('Connection failed. Please try again.');
                            }
                          });
                          
                          newManager.onError((err) => {
                            console.error('❌ [WebRTC Call] Error:', err);
                            setError(err.message);
                            setCallState('failed');
                          });
                          
                          // Re-initialize call
                          const mediaConfig = {
                            audio: true,
                            video: type === 'video'
                          };
                          
                          if (isInitiator) {
                            await newManager.startCall(callId, mediaConfig);
                          } else {
                            await newManager.joinCall(callId, mediaConfig);
                          }
                        } catch (retryError: any) {
                          console.error('❌ [WebRTC Call] Retry failed:', retryError);
                          let errorMsg = retryError?.message || 'Failed to access camera/microphone. Please check permissions.';
                          if (retryError?.name === 'NotAllowedError' || retryError?.name === 'PermissionDeniedError') {
                            errorMsg = 'Camera/microphone permission denied.\n\nPlease:\n1. Click the lock icon (🔒) in your browser\'s address bar\n2. Allow camera and microphone access\n3. Refresh the page and try again';
                          }
                          setError(errorMsg);
                          setCallState('failed');
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={endCall}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Back to Chat Button - Top Left - Fixed Alignment - Always visible - No Overlap - Mobile Optimized */}
        <button
          onClick={endCall}
              className="absolute top-4 left-4 z-[100] bg-gray-900/90 hover:bg-gray-800/95 backdrop-blur-md rounded-lg px-3 py-2 sm:px-4 sm:py-2 border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20 flex items-center gap-2 touch-manipulation min-w-[44px] min-h-[44px]"
          style={{
            // CRITICAL: Hardware acceleration for smoother rendering
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            // CRITICAL: Ensure no overlap with other elements
            marginRight: 'auto',
            marginBottom: 'auto',
            // CRITICAL: Always visible on mobile AND desktop - FORCE VISIBILITY
            display: 'flex !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            pointerEvents: 'auto !important',
            position: 'absolute !important',
            zIndex: '100 !important',
            top: '16px !important',
            left: '16px !important',
            // CRITICAL: Mobile-specific styles to ensure visibility
            WebkitTransform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            // CRITICAL: Force visibility on mobile browsers
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          title="Back to Chat"
          aria-label="Back to Chat"
        >
          <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
          <span className="text-white text-xs sm:text-sm font-medium hidden sm:inline" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }}>Back</span>
        </button>

        {/* Call Info Overlay - Fixed Alignment - Below Back Button - No Overlap - Always Visible - Mobile Optimized */}
        {callState === 'connected' && (
          <div className="absolute top-16 left-4 sm:top-16 sm:left-4 space-y-2 z-[90]" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            gap: '8px',
            // CRITICAL: Ensure no overlap with Back button
            marginTop: '8px',
            // CRITICAL: Always visible on mobile AND desktop
            visibility: 'visible',
            opacity: 1,
            pointerEvents: 'auto',
            position: 'absolute',
            zIndex: 90,
            // CRITICAL: Mobile-specific styles
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}>
            {/* Call Duration - Fixed Alignment */}
            <div className="bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-2 border border-cyan-500/30 shadow-lg shadow-cyan-500/10" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" style={{ animation: 'none' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">Duration: {formatTime(callDuration)}</p>
                <p className="text-white/60 text-xs whitespace-nowrap">Time left: {formatTime(timeRemaining)}</p>
              </div>
            </div>
            
            {/* Remote User Info - Fixed Alignment */}
            {remoteUserName && (
              <div className="bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-2 border border-cyan-500/30 shadow-lg shadow-cyan-500/10" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 'fit-content' }}>
                <p className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">{remoteUserName}</p>
                {remoteUserRole && (
                  <p className="text-cyan-400/80 text-xs whitespace-nowrap capitalize">
                    {remoteUserRole === 'vc' ? 'VC' : 
                     remoteUserRole === 'ido' ? 'IDO' : 
                     remoteUserRole.charAt(0).toUpperCase() + remoteUserRole.slice(1)}
                  </p>
                )}
              </div>
            )}
            
            {/* RaftAI Analysis Indicator - Fixed Alignment */}
            {raftaiAnalyzing && type === 'video' && (
              <div className="bg-gradient-to-r from-cyan-600/80 to-blue-600/80 backdrop-blur-md rounded-lg px-3 py-2 border border-cyan-400/30 shadow-lg shadow-cyan-500/20" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
                <SparklesIcon className="w-4 h-4 text-cyan-300 flex-shrink-0" style={{ animation: 'none' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <p className="text-white text-xs font-medium whitespace-nowrap">🤖 RaftAI Analyzing</p>
                  <p className="text-white/80 text-xs whitespace-nowrap">Facial recognition & emotion detection</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Controls Panel - Ultra Compact - Always Visible - NO SCROLL - Mobile responsive */}
      <div 
        className="bg-gradient-to-t from-gray-900/95 via-gray-900/98 to-gray-900/95 backdrop-blur-xl p-2 sm:p-3 border-t border-cyan-500/30 shadow-2xl shadow-cyan-500/10"
        style={{
          flexShrink: 0,
          flexGrow: 0,
          height: 'auto',
          minHeight: 'fit-content',
          maxHeight: '80px', // CRITICAL: Ultra compact - maximum video space (like Zoom/Meet)
          overflow: 'visible',
          // CRITICAL: Fixed position at bottom to prevent movement - FORCE VISIBILITY
          position: 'fixed !important',
          bottom: '0 !important',
          left: '0 !important',
          right: '0 !important',
          width: '100% !important',
          zIndex: '10000 !important', // CRITICAL: Higher z-index to ensure it's always on top
          display: 'flex !important',
          visibility: 'visible !important',
          opacity: '1 !important',
          pointerEvents: 'auto !important',
          transition: 'none',
          animation: 'none',
          transform: 'translateZ(0)',
          boxSizing: 'border-box',
          margin: 0,
          padding: '8px 12px'
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Control Buttons - Responsive for mobile - Horizontal on desktop, centered on mobile - Ultra Compact */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 mb-1 flex-wrap w-full" style={{ display: 'flex !important', visibility: 'visible !important', opacity: '1 !important' }}>
            {/* Mute/Unmute - Enhanced - Mobile responsive - Minimum 44px touch target - Ultra Compact */}
            <button
              onClick={toggleMute}
              className={`group p-2.5 sm:p-3 rounded-full shadow-lg border-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                isMuted 
                  ? 'bg-red-600/90 hover:bg-red-700 shadow-red-500/50 border-red-400/50' 
                  : 'bg-gray-800/80 hover:bg-gray-700/80 shadow-cyan-500/20 border-cyan-500/30'
              }`}
              style={{ 
                display: 'flex !important', 
                visibility: 'visible !important', 
                opacity: '1 !important', 
                pointerEvents: 'auto !important',
                transition: 'none', // Disable transitions to prevent blinking
                animation: 'none' // Disable animations
              }}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              aria-pressed={isMuted}
            >
              <MicrophoneIcon className={`w-6 h-6 sm:w-7 sm:h-7 text-white ${isMuted ? 'line-through' : ''}`} style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important', transition: 'none', animation: 'none' }} />
            </button>

            {/* Video Toggle - Enhanced (only for video calls) - Mobile responsive - Minimum 44px touch target - Ultra Compact */}
            {type === 'video' && (
              <button
                onClick={toggleVideo}
                className={`group p-2.5 sm:p-3 rounded-full shadow-lg border-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  isVideoOff 
                    ? 'bg-red-600/90 hover:bg-red-700 shadow-red-500/50 border-red-400/50' 
                    : 'bg-gray-800/80 hover:bg-gray-700/80 shadow-cyan-500/20 border-cyan-500/30'
                }`}
                style={{ 
                  display: 'flex !important', 
                  visibility: 'visible !important', 
                  opacity: '1 !important', 
                  pointerEvents: 'auto !important',
                  transition: 'none', // Disable transitions to prevent blinking
                  animation: 'none' // Disable animations
                }}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                aria-label={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                aria-pressed={isVideoOff}
              >
                {isVideoOff ? (
                  <VideoCameraSlashIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
                ) : (
                  <VideoCameraIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
                )}
              </button>
            )}

            {/* End Call - Large & Prominent - Mobile responsive - Minimum 44px touch target - Ultra Compact */}
            <button
              onClick={endCall}
              className="p-3 sm:p-5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full shadow-2xl shadow-red-500/50 border-2 border-red-400/50 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ 
                display: 'flex !important', 
                visibility: 'visible !important', 
                opacity: '1 !important', 
                pointerEvents: 'auto !important',
                transition: 'none', // Disable transitions to prevent blinking
                animation: 'none' // Disable animations
              }}
              title="End Call"
              aria-label="End Call"
            >
              <PhoneIcon className="w-7 h-7 sm:w-9 sm:h-9 text-white rotate-[135deg]" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
            </button>

            {/* Speaker Toggle - Enhanced - Mobile responsive - Minimum 44px touch target - Ultra Compact */}
            <button
              onClick={toggleSpeaker}
              className={`group p-2.5 sm:p-3 rounded-full shadow-lg border-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                !isSpeakerOn 
                  ? 'bg-red-600/90 hover:bg-red-700 shadow-red-500/50 border-red-400/50' 
                  : 'bg-gray-800/80 hover:bg-gray-700/80 shadow-cyan-500/20 border-cyan-500/30'
              }`}
              style={{ 
                display: 'flex !important', 
                visibility: 'visible !important', 
                opacity: '1 !important', 
                pointerEvents: 'auto !important',
                transition: 'none', // Disable transitions to prevent blinking
                animation: 'none' // Disable animations
              }}
              title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              aria-label={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              aria-pressed={!isSpeakerOn}
            >
              {isSpeakerOn ? (
                <SpeakerWaveIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
              ) : (
                <SpeakerXMarkIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" style={{ display: 'block !important', visibility: 'visible !important', opacity: '1 !important' }} />
              )}
            </button>

            {/* Advanced Controls for Desktop (Video Only) */}
            {type === 'video' && (
              <>
                {/* Video Quality Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-5 rounded-full bg-gray-800/80 hover:bg-gray-700/80 shadow-lg transition-all transform hover:scale-110 border-2 border-cyan-500/30"
                    title="Video Quality"
                  >
                    <SignalIcon className="w-7 h-7 text-cyan-400" />
                  </button>
                  
                  {/* Quality Menu */}
                  {showQualityMenu && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl rounded-xl p-2 shadow-2xl border border-cyan-500/30 min-w-[140px]">
                      {(['4K', '1080p', '720p', '480p', 'auto'] as const).map((quality) => (
                        <button
                          key={quality}
                          onClick={() => {
                            changeVideoQuality(quality);
                            setShowQualityMenu(false);
                          }}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                            videoQuality === quality
                              ? 'bg-cyan-600/80 text-white border border-cyan-400/50'
                              : 'text-white/80 hover:bg-gray-800/80'
                          }`}
                        >
                          {quality === 'auto' ? '🤖 Auto' : `📹 ${quality}`}
                          {videoQuality === quality && ' ✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="hidden md:block p-5 rounded-full bg-gray-800/80 hover:bg-gray-700/80 shadow-lg transition-all transform hover:scale-110 border-2 border-cyan-500/30"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <ArrowsPointingOutIcon className="w-7 h-7 text-cyan-400" />
                </button>
              </>
            )}
          </div>

          {/* Status Labels - Hidden on mobile, compact on desktop - REMOVED to save space */}
          {/* Status labels removed to maximize video space - controls show state via button colors */}
        </div>
      </div>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
        
        /* CRITICAL: Hide header when video call is active - MUST cover header area */
        html.video-call-active header,
        html.video-call-active [class*="Header"],
        html.video-call-active [class*="header"],
        html.video-call-active [class*="navbar"],
        html.video-call-active [class*="Navbar"],
        html.video-call-active [class*="navigation"],
        html.video-call-active [class*="Navigation"],
        html.video-call-active [class*="neo-glass-header"],
        html.video-call-active [class*="sticky"][class*="top-0"],
        html.video-call-active [class*="PerfectHeader"],
        html.video-call-active nav[class*="fixed"],
        html.video-call-active nav[class*="sticky"],
        html.video-call-active [role="banner"],
        html.video-call-active [class*="top-0"][class*="z-50"],
        html.video-call-active [class*="top-0"][class*="z-40"],
        html.video-call-active [class*="fixed"][class*="top-0"],
        html.video-call-active [class*="sticky"][class*="top-0"],
        body.video-call-active header,
        body.video-call-active [class*="Header"],
        body.video-call-active [class*="header"],
        body.video-call-active [class*="navbar"],
        body.video-call-active [class*="Navbar"],
        body.video-call-active [class*="navigation"],
        body.video-call-active [class*="Navigation"],
        body.video-call-active [class*="neo-glass-header"],
        body.video-call-active [class*="sticky"][class*="top-0"],
        body.video-call-active [class*="PerfectHeader"],
        body.video-call-active nav[class*="fixed"],
        body.video-call-active nav[class*="sticky"],
        body.video-call-active [role="banner"],
        body.video-call-active [class*="top-0"][class*="z-50"],
        body.video-call-active [class*="top-0"][class*="z-40"],
        body.video-call-active [class*="fixed"][class*="top-0"],
        body.video-call-active [class*="sticky"][class*="top-0"] {
          display: none !important;
          visibility: hidden !important;
          z-index: -1 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
          overflow: hidden !important;
          max-height: 0 !important;
        }
        
        /* CRITICAL: Hide chat sidebar when video call is active - BUT NOT chat input */
        html.video-call-active [class*="ChatRoomList"],
        html.video-call-active [class*="chat-room-list"],
        html.video-call-active aside[class*="sidebar"]:not([class*="input"]):not([class*="Input"]),
        html.video-call-active [class*="w-80"][class*="border-r"]:not([class*="input"]):not([class*="Input"]),
        html.video-call-active [class*="w-96"][class*="border-r"]:not([class*="input"]):not([class*="Input"]),
        html.video-call-active [class*="border-r"][class*="bg-black"]:not([class*="input"]):not([class*="Input"]),
        html.video-call-active [class*="flex"][class*="flex-col"][class*="border-r"][class*="w-80"]:not([class*="input"]):not([class*="Input"]),
        html.video-call-active [class*="flex"][class*="flex-col"][class*="border-r"][class*="w-96"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="ChatRoomList"],
        body.video-call-active [class*="chat-room-list"],
        body.video-call-active aside[class*="sidebar"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="w-80"][class*="border-r"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="w-96"][class*="border-r"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="border-r"][class*="bg-black"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="flex"][class*="flex-col"][class*="border-r"][class*="w-80"]:not([class*="input"]):not([class*="Input"]),
        body.video-call-active [class*="flex"][class*="flex-col"][class*="border-r"][class*="w-96"]:not([class*="input"]):not([class*="Input"]) {
          display: none !important;
          visibility: hidden !important;
          z-index: -1 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          max-width: 0 !important;
          overflow: hidden !important;
        }
        
        /* CRITICAL: Ensure chat input and calling options are visible after call ends */
        html:not(.video-call-active) textarea[placeholder*="Message"],
        html:not(.video-call-active) input[placeholder*="Message"],
        html:not(.video-call-active) [class*="message-input"],
        html:not(.video-call-active) [class*="MessageInput"],
        html:not(.video-call-active) [class*="chat-input"],
        html:not(.video-call-active) button[title*="Video"],
        html:not(.video-call-active) button[title*="video"],
        html:not(.video-call-active) button[title*="Voice"],
        html:not(.video-call-active) button[title*="voice"],
        html:not(.video-call-active) [class*="Video"],
        html:not(.video-call-active) [class*="video-call"],
        html:not(.video-call-active) [class*="voice-call"],
        body:not(.video-call-active) textarea[placeholder*="Message"],
        body:not(.video-call-active) input[placeholder*="Message"],
        body:not(.video-call-active) [class*="message-input"],
        body:not(.video-call-active) [class*="MessageInput"],
        body:not(.video-call-active) [class*="chat-input"],
        body:not(.video-call-active) button[title*="Video"],
        body:not(.video-call-active) button[title*="video"],
        body:not(.video-call-active) button[title*="Voice"],
        body:not(.video-call-active) button[title*="voice"],
        body:not(.video-call-active) [class*="Video"],
        body:not(.video-call-active) [class*="video-call"],
        body:not(.video-call-active) [class*="voice-call"] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: auto !important;
        }
        
        /* CRITICAL: Ensure all buttons in chat interface are visible after call ends */
        html:not(.video-call-active) form button,
        html:not(.video-call-active) [class*="chat"] button:not(#webrtc-call-modal button),
        body:not(.video-call-active) form button,
        body:not(.video-call-active) [class*="chat"] button:not(#webrtc-call-modal button) {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        
        /* CRITICAL: Ensure modal covers entire viewport including header area and browser chrome */
        #webrtc-call-modal {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          width: 100% !important; /* Fallback for older browsers */
          height: 100dvh !important; /* Use dvh for mobile browser chrome */
          height: 100vh !important; /* Fallback for older browsers */
          max-width: 100vw !important;
          max-width: 100% !important; /* Fallback */
          max-height: 100dvh !important;
          max-height: 100vh !important; /* Fallback */
          min-width: 100vw !important;
          min-width: 100% !important; /* Fallback */
          min-height: 100dvh !important;
          min-height: 100vh !important; /* Fallback */
          z-index: 2147483647 !important; /* Maximum z-index */
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          display: flex !important; /* CRITICAL: Ensure flex layout */
          visibility: visible !important; /* CRITICAL: Ensure visibility */
          opacity: 1 !important; /* CRITICAL: Ensure opacity */
          /* Force fullscreen on mobile */
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: none !important;
          /* Hide browser UI on mobile */
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          /* CRITICAL: Hardware acceleration for smoother rendering */
          transform: translateZ(0) !important;
          will-change: transform !important;
          backface-visibility: hidden !important;
          /* CRITICAL: Ensure box-sizing for accurate dimensions */
          box-sizing: border-box !important;
        }
        
        /* Force fullscreen on iOS Safari */
        @supports (-webkit-touch-callout: none) {
          #webrtc-call-modal {
            height: -webkit-fill-available !important;
            min-height: -webkit-fill-available !important;
          }
        }
        
        /* CRITICAL: Ensure modal container covers full viewport */
        #webrtc-call-modal > div {
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Responsive breakpoints */
        /* Mobile (< 768px) - WhatsApp/Telegram-like interface */
        @media (max-width: 767px) {
          /* CRITICAL: Force fullscreen on mobile - cover entire screen including browser chrome */
          html.video-call-active,
          body.video-call-active {
            position: fixed !important;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            height: -webkit-fill-available !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          /* Ensure modal covers full mobile viewport including browser chrome */
          #webrtc-call-modal {
            width: 100vw !important;
            width: 100% !important; /* Fallback */
            height: 100vh !important;
            height: 100dvh !important;
            max-width: 100vw !important;
            max-width: 100% !important; /* Fallback */
            max-height: 100vh !important;
            max-height: 100dvh !important;
            min-width: 100vw !important;
            min-width: 100% !important; /* Fallback */
            min-height: 100vh !important;
            min-height: 100dvh !important;
            /* iOS Safari fullscreen */
            height: -webkit-fill-available !important;
            min-height: -webkit-fill-available !important;
            max-height: -webkit-fill-available !important;
            /* Position to cover entire screen */
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            /* CRITICAL: Force dimensions - Fix mobile black screen */
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            z-index: 2147483647 !important;
            /* CRITICAL: Hardware acceleration */
            transform: translateZ(0) !important;
            will-change: transform !important;
            backface-visibility: hidden !important;
          }
          
          /* Video container height adjustment for mobile - MAXIMUM video space (like Zoom/Meet) - NO BLACK SPACE */
          #webrtc-call-modal > div:first-child {
            height: calc(100dvh - 80px) !important;
            min-height: calc(100dvh - 80px) !important;
            max-height: calc(100dvh - 80px) !important;
            /* iOS Safari */
            height: calc(-webkit-fill-available - 80px) !important;
            min-height: calc(-webkit-fill-available - 80px) !important;
            max-height: calc(-webkit-fill-available - 80px) !important;
            /* CRITICAL: Ensure container fills entire space */
            width: 100% !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Larger touch targets for mobile (minimum 44px) */
          #webrtc-call-modal button {
            min-width: 44px !important;
            min-height: 44px !important;
            padding: 10px !important;
          }
          
          /* Control bar padding on mobile - ULTRA COMPACT for maximum video space */
          #webrtc-call-modal > div:last-child {
            padding: 6px 10px !important;
            max-height: 80px !important;
          }
          
          /* Center controls on mobile - CRITICAL FIX */
          #webrtc-call-modal .flex-wrap,
          #webrtc-call-modal .flex-row,
          #webrtc-call-modal > div:last-child > div > div:first-child {
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
          
          /* CRITICAL: Ensure REMOTE video (main video) is always visible and fills container - BIG like Zoom/Meet */
          #webrtc-call-modal video:not(.mirror) {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            background-color: #000000 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 20 !important; /* BELOW PiP (z-index 80) */
            pointer-events: auto !important;
            /* CRITICAL: Force video to render on mobile */
            -webkit-transform: translateZ(0) !important;
            transform: translateZ(0) !important;
            -webkit-backface-visibility: hidden !important;
            backface-visibility: hidden !important;
            will-change: transform !important;
          }
          
          /* CRITICAL: Ensure video container is visible and fills ENTIRE space - NO BLACK AREAS */
          #webrtc-call-modal > div:first-child {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #000000 !important;
            position: relative !important;
            width: 100% !important;
            height: calc(100dvh - 80px) !important;
            min-height: calc(100dvh - 80px) !important;
            max-height: calc(100dvh - 80px) !important;
            overflow: hidden !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* CRITICAL: Force video stream to be attached and playing */
          #webrtc-call-modal video[srcObject] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* CRITICAL: Fix mobile black screen - ensure controls are visible */
          #webrtc-call-modal > div:last-child {
            background: linear-gradient(to top, rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.98), rgba(17, 24, 39, 0.95)) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 10000 !important; /* CRITICAL: Higher z-index to ensure it's always on top */
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            transition: none !important;
            animation: none !important;
            transform: translateZ(0) !important;
          }
          
          /* Ensure control buttons are visible on mobile */
          #webrtc-call-modal > div:last-child button,
          #webrtc-call-modal > div:last-child button * {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          
          /* CRITICAL: Ensure back button is always visible */
          #webrtc-call-modal button[aria-label="Back to Chat"],
          #webrtc-call-modal button[aria-label*="Back"] {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            position: absolute !important;
            top: 16px !important;
            left: 16px !important;
            pointer-events: auto !important;
          }
          
        /* CRITICAL: Ensure RaftAI badge is always visible - Positioned at top center */
        #webrtc-call-modal [aria-label*="RaftAI"],
        #webrtc-call-modal [role="status"][aria-live="polite"][aria-label*="RaftAI"] {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 100 !important;
          position: absolute !important;
          top: 16px !important;
          left: 50% !important;
          transform: translateX(-50%) translateZ(0) !important;
          pointer-events: auto !important;
          transition: none !important;
          animation: none !important;
        }
        
        /* CRITICAL: Ensure Active Speaker Indicator is always visible - Positioned below RaftAI */
        #webrtc-call-modal [role="status"][aria-live="polite"]:not([aria-label*="RaftAI"]) {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 95 !important;
          position: absolute !important;
          top: 80px !important;
          left: 50% !important;
          transform: translateX(-50%) translateZ(0) !important;
          pointer-events: auto !important;
          transition: none !important;
          animation: none !important;
        }
        
          /* CRITICAL: Ensure local video (PiP) is always visible - Positioned at BOTTOM-RIGHT - Google Meet/Zoom style */
          #webrtc-call-modal video.mirror {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            position: relative !important;
            z-index: 1 !important;
            transition: none !important;
            animation: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          }
          
          /* CRITICAL: Ensure local video container is always visible - BOTTOM-RIGHT position - Google Meet/Zoom style */
          #webrtc-call-modal > div:has(video.mirror),
          #webrtc-call-modal video.mirror + div,
          #webrtc-call-modal video.mirror ~ div {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 80 !important;
            position: absolute !important;
            bottom: 100px !important; /* Position above control bar - Google Meet style */
            right: 16px !important;
            width: clamp(120px, 20vw, 240px) !important; /* Google Meet style size */
            height: clamp(90px, 15vw, 180px) !important; /* Google Meet style size */
            max-width: 240px !important; /* Maximum PiP width */
            max-height: 180px !important; /* Maximum PiP height */
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* Hide browser address bar and navigation on mobile */
          body.video-call-active {
            position: fixed !important;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            height: -webkit-fill-available !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            -webkit-overflow-scrolling: touch !important;
            /* Prevent address bar from showing */
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Hide any browser UI elements */
          body.video-call-active > *:not(#webrtc-call-modal) {
            display: none !important;
            visibility: hidden !important;
          }
        }
        
        /* Tablet (768px - 1024px) */
        @media (min-width: 768px) and (max-width: 1024px) {
          /* Tablet-specific adjustments */
          #webrtc-call-modal button {
            min-width: 48px;
            min-height: 48px;
          }
          
          /* Video container height for tablet - MAXIMUM video space - NO BLACK SPACE */
          #webrtc-call-modal > div:first-child {
            height: calc(100dvh - 80px) !important;
            min-height: calc(100dvh - 80px) !important;
            max-height: calc(100dvh - 80px) !important;
            width: 100% !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Control bar padding on tablet - ULTRA COMPACT */
          #webrtc-call-modal > div:last-child {
            padding: 8px 12px !important;
            max-height: 80px !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 10000 !important; /* CRITICAL: Higher z-index */
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* Ensure all buttons are visible on tablet */
          #webrtc-call-modal > div:last-child button,
          #webrtc-call-modal > div:last-child button * {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* CRITICAL: Ensure local video (PiP) is always visible on tablet - BOTTOM-RIGHT - Google Meet/Zoom style */
          #webrtc-call-modal video.mirror {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            position: relative !important;
            z-index: 1 !important;
            transition: none !important;
            animation: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          }
          
          /* CRITICAL: Ensure local video container is always visible on tablet - BOTTOM-RIGHT position */
          #webrtc-call-modal > div:has(video.mirror),
          #webrtc-call-modal video.mirror + div,
          #webrtc-call-modal video.mirror ~ div {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 80 !important;
            position: absolute !important;
            bottom: 100px !important; /* Position above control bar - Google Meet style */
            right: 16px !important;
            width: clamp(140px, 22vw, 260px) !important; /* Google Meet style size for tablet */
            height: clamp(105px, 16.5vw, 195px) !important; /* Google Meet style size for tablet */
            max-width: 260px !important;
            max-height: 195px !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* Desktop (> 1024px) - Zoom/Google Meet-like interface */
        @media (min-width: 1025px) {
          /* Desktop: Use vh instead of dvh for consistency */
          #webrtc-call-modal {
            height: 100vh !important;
            min-height: 100vh !important;
            max-height: 100vh !important;
          }
          
          /* Video container height for desktop - MAXIMUM video space (like Zoom/Meet) - NO BLACK SPACE */
          #webrtc-call-modal > div:first-child {
            height: calc(100vh - 80px) !important;
            min-height: calc(100vh - 80px) !important;
            max-height: calc(100vh - 80px) !important;
            width: 100% !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Control bar padding on desktop - ULTRA COMPACT */
          #webrtc-call-modal > div:last-child {
            padding: 8px 16px !important;
            max-height: 80px !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 10000 !important; /* CRITICAL: Higher z-index */
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* Ensure all buttons are visible on desktop */
          #webrtc-call-modal > div:last-child button,
          #webrtc-call-modal > div:last-child button * {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          
          /* CRITICAL: Ensure back button is always visible on desktop */
          #webrtc-call-modal button[aria-label="Back to Chat"],
          #webrtc-call-modal button[aria-label*="Back"] {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            position: absolute !important;
            top: 16px !important;
            left: 16px !important;
            pointer-events: auto !important;
          }
          
          /* CRITICAL: Ensure RaftAI badge is always visible on desktop - Positioned at top center */
          #webrtc-call-modal [aria-label*="RaftAI"],
          #webrtc-call-modal [role="status"][aria-live="polite"][aria-label*="RaftAI"] {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            position: absolute !important;
            top: 16px !important;
            left: 50% !important;
            transform: translateX(-50%) translateZ(0) !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* CRITICAL: Ensure Active Speaker Indicator is always visible on desktop - Positioned below RaftAI */
          #webrtc-call-modal [role="status"][aria-live="polite"]:not([aria-label*="RaftAI"]) {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 95 !important;
            position: absolute !important;
            top: 80px !important;
            left: 50% !important;
            transform: translateX(-50%) translateZ(0) !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* CRITICAL: Ensure local video (PiP) is always visible on desktop - BOTTOM-RIGHT - Google Meet/Zoom style */
          #webrtc-call-modal video.mirror {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            position: relative !important;
            z-index: 1 !important;
            transition: none !important;
            animation: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          }
          
          /* CRITICAL: Ensure local video container is always visible on desktop - BOTTOM-RIGHT position - Google Meet/Zoom style */
          #webrtc-call-modal > div:has(video.mirror),
          #webrtc-call-modal video.mirror + div,
          #webrtc-call-modal video.mirror ~ div {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 80 !important;
            position: absolute !important;
            bottom: 100px !important; /* Position above control bar - Google Meet style */
            right: 24px !important; /* Slightly more spacing on desktop */
            width: 240px !important; /* Google Meet style size for desktop */
            height: 180px !important; /* Google Meet style size for desktop (16:9 aspect ratio) */
            max-width: 240px !important;
            max-height: 180px !important;
            pointer-events: auto !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* CRITICAL: Ensure REMOTE video (main video) displays properly on desktop - FILLS ENTIRE SCREEN - 16:9 aspect ratio */
          #webrtc-call-modal video:not(.mirror) {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: cover !important; /* CRITICAL: 16:9 aspect ratio, cropped if needed - Google Meet/Zoom style */
            object-position: center !important;
            background-color: #000000 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 20 !important; /* BELOW PiP (z-index 80) */
            pointer-events: auto !important;
            /* CRITICAL: Disable ALL transitions and animations to prevent flickering */
            transition: none !important;
            animation: none !important;
            filter: none !important;
            -webkit-filter: none !important;
          }
          
          /* Ensure video container is visible and fills ENTIRE space on desktop - NO BLACK AREAS */
          #webrtc-call-modal > div:first-child {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #000000 !important;
            height: calc(100vh - 80px) !important;
            min-height: calc(100vh - 80px) !important;
            max-height: calc(100vh - 80px) !important;
            width: 100% !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        /* Touch-friendly buttons */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}

