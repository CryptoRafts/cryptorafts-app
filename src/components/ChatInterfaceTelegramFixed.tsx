"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import type { ChatRoom, ChatMessage } from "@/lib/chatService.enhanced";
// Import component normally - Next.js will handle bundling
import MessageBubbleWorkingComponent from "./MessageBubbleWorking";
import VoiceRecorderFixed from "./VoiceRecorderFixed";
import PinnedMessagesBanner from "./PinnedMessagesBanner";
import FileUploadModal from "./FileUploadModal";
import CallModalWorking from "./CallModalWorking";
import WebRTCCallModal from "./WebRTCCallModal";
import GroupSettingsWorking from "./GroupSettingsWorking";
import CallNotification from "./CallNotification";
import { simpleFirebaseCallManager, type SimpleFirebaseCall } from "@/lib/simpleFirebaseCallManager";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  room: ChatRoom | null;
  currentUserId: string;
  onBack: () => void;
}

export default function ChatInterfaceTelegramFixed({ room, currentUserId, onBack }: Props) {
  // Track if component is mounted to prevent rendering during unmount
  const isMountedRef = useRef(true);
  const roomIdRef = useRef<string | null>(null);
  // Track handled calls to prevent duplicate notifications
  const handledCallsRef = useRef<Set<string>>(new Set());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isNavigatingBackRef = useRef(false);
  
  // Validate props with better error handling
  if (!room || !room.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Chat Room Selected</h2>
          <p className="text-white/60">Please select a chat room to start messaging</p>
        </div>
      </div>
    );
  }

  if (!currentUserId || typeof currentUserId !== 'string') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-white/60">Please log in to access chat</p>
        </div>
      </div>
    );
  }

  // Ensure onBack is a function
  const handleBack = typeof onBack === 'function' ? onBack : () => {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showWebRTCCall, setShowWebRTCCall] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('voice');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState<SimpleFirebaseCall | null>(null);
  const [showCallNotification, setShowCallNotification] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [remoteUserRole, setRemoteUserRole] = useState<string>('participant');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Stable empty callback to prevent re-renders
  const emptyReplyCallback = useCallback(() => {}, []);
  
  // CRITICAL: Fetch remote user role from Firestore for ALL roles
  // ENHANCED: Better role detection for all role types (founder, vc, exchange, ido, influencer, agency, admin)
  useEffect(() => {
    if (!room || !currentUserId || !db) return;
    
    const fetchRemoteUserRole = async () => {
      try {
        // Determine remote user ID
        const remoteUserId = room.founderId === currentUserId 
          ? room.counterpartId 
          : room.founderId;
        
        if (!remoteUserId) {
          // Fallback to room data
          const roleFromRoom = room.founderId === currentUserId 
            ? (room.counterpartRole || 'participant')
            : (room.founderRole || 'founder');
          console.log(`✅ [CHAT] Using room data for remote role: ${roleFromRoom}`);
          setRemoteUserRole(roleFromRoom);
          return;
        }
        
        // Fetch user document from Firestore
        const userDocRef = doc(db, 'users', remoteUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // ENHANCED: Check multiple possible role fields for all role types
          const role = userData.role 
            || userData.role_type 
            || userData.userRole
            || userData.user_role
            || (userData.isAdmin ? 'admin' : null)
            || (userData.isVC ? 'vc' : null)
            || (userData.isFounder ? 'founder' : null)
            || (userData.isExchange ? 'exchange' : null)
            || (userData.isIDO ? 'ido' : null)
            || (userData.isInfluencer ? 'influencer' : null)
            || (userData.isAgency ? 'agency' : null)
            || 'participant'; // Final fallback
          
          console.log(`✅ [CHAT] Fetched remote user role: ${role} for user: ${remoteUserId}`);
          setRemoteUserRole(role);
        } else {
          // Fallback to room data if user doc doesn't exist
          const roleFromRoom = room.founderId === currentUserId 
            ? (room.counterpartRole || 'participant')
            : (room.founderRole || 'founder');
          console.log(`⚠️ [CHAT] User doc not found, using room data: ${roleFromRoom}`);
          setRemoteUserRole(roleFromRoom);
        }
      } catch (error) {
        console.error('❌ [CHAT] Error fetching remote user role:', error);
        // Fallback to room data on error
        const roleFromRoom = room.founderId === currentUserId 
          ? (room.counterpartRole || 'participant')
          : (room.founderRole || 'founder');
        console.log(`✅ [CHAT] Using fallback role after error: ${roleFromRoom}`);
        setRemoteUserRole(roleFromRoom);
      }
    };
    
    fetchRemoteUserRole();
  }, [room?.id, room?.founderId, room?.counterpartId, currentUserId, db]);

  // Memoize the empty reply handler to prevent re-renders
  const handleReply = useCallback(() => {}, []);

  // CRITICAL: Check for pending call from GlobalCallNotificationManager when component mounts or URL changes
  useEffect(() => {
    if (!room?.id || !currentUserId) return;
    
    // Check URL params for call ID
    const urlParams = new URLSearchParams(window.location.search);
    const callIdFromUrl = urlParams.get('call');
    
    // Check sessionStorage for pending call
    const pendingCallStr = sessionStorage.getItem('pendingCall');
    let pendingCall: any = null;
    if (pendingCallStr) {
      try {
        pendingCall = JSON.parse(pendingCallStr);
        // Check if call is still recent (within 10 seconds)
        if (pendingCall.timestamp && Date.now() - pendingCall.timestamp < 10000) {
          // Call info is recent, use it
        } else {
          // Call info is too old, clear it
          sessionStorage.removeItem('pendingCall');
          pendingCall = null;
        }
      } catch (e) {
        console.error('Error parsing pending call:', e);
        sessionStorage.removeItem('pendingCall');
      }
    }
    
    // If we have a call ID from URL or sessionStorage, open the call modal
    const callIdToOpen = callIdFromUrl || pendingCall?.callId;
    if (callIdToOpen && !showWebRTCCall && !currentCallId) {
      console.log(`📞 [CHAT] Opening call modal from navigation: ${callIdToOpen}`);
      
      // CRITICAL: Verify call exists and is not ended BEFORE opening modal
      simpleFirebaseCallManager.getCall(callIdToOpen).then((call) => {
        // CRITICAL: Only open if call exists and is not ended
        if (!call) {
          console.warn(`⚠️ [CHAT] Call not found: ${callIdToOpen}`);
          // Clear sessionStorage and URL params
          sessionStorage.removeItem('pendingCall');
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('call');
            window.history.replaceState({}, '', url.toString());
          }
          return;
        }
        
        if (call.status === 'ended') {
          console.warn(`⚠️ [CHAT] Call already ended: ${callIdToOpen}`);
          // Clear sessionStorage and URL params
          sessionStorage.removeItem('pendingCall');
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('call');
            window.history.replaceState({}, '', url.toString());
          }
          return;
        }
        
        // CRITICAL: Open call modal IMMEDIATELY with verified data
          const callTypeToUse = call.callType || pendingCall?.callType || 'video';
          
        // Set up call state immediately
          setCallType(callTypeToUse);
          setCurrentCallId(callIdToOpen);
          setIsCallInitiator(false); // We're joining, not initiating
          setShowWebRTCCall(true);
          
        console.log(`✅ [CHAT] Call modal opened immediately for: ${callIdToOpen}`);
          
        // Clear pending call from sessionStorage after opening
          sessionStorage.removeItem('pendingCall');
      }).catch((error) => {
        console.error('❌ [CHAT] Error getting call info:', error);
        // Clear sessionStorage and URL params on error
        sessionStorage.removeItem('pendingCall');
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('call');
          window.history.replaceState({}, '', url.toString());
        }
      });
    }
  }, [room?.id, currentUserId, showWebRTCCall, currentCallId]);

  // Track room changes and reset state when room changes
  useEffect(() => {
    if (room?.id && room.id !== roomIdRef.current) {
      // Room changed - reset state
      roomIdRef.current = room.id;
      setMessages([]);
      setPinnedMessages([]);
      setText("");
      setShowVoiceRecorder(false);
      setShowFileUpload(false);
      setShowSettings(false);
      setShowCall(false);
      // Don't reset showWebRTCCall here - let the pending call check handle it
      setIncomingCall(null);
      setShowCallNotification(false);
    }
  }, [room?.id]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingBackRef.current = false;
    roomIdRef.current = room?.id || null;
    return () => {
      isMountedRef.current = false;
      isNavigatingBackRef.current = false;
      roomIdRef.current = null;
      
      // Cleanup subscriptions
      if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.warn('Error cleaning up subscription:', err);
        }
        unsubscribeRef.current = null;
      }
    };
  }, [room?.id]);

  // Memoize message rendering to prevent unnecessary re-renders and errors
  const renderedMessages = useMemo(() => {
    // Don't render if component is unmounting or navigating back
    if (!isMountedRef.current || isNavigatingBackRef.current) {
      return [];
    }
    
    // Don't render if room changed
    if (room?.id !== roomIdRef.current) {
      return [];
    }
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    return messages.map((message, index) => {
      // Early return for invalid messages
      if (!message || !message.id || typeof message.id !== 'string') {
        return null;
      }

      try {
        const isOwn = message.senderId === currentUserId;
        const prevMessage = index > 0 ? messages[index - 1] : undefined;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
        
        // Show avatar only on last message from same sender
        const showAvatar = !nextMessage || nextMessage.senderId !== message.senderId;
        const showName = !prevMessage || prevMessage.senderId !== message.senderId;
        
        // Get sender avatar from room memberAvatars if not in message
        const senderAvatar = message.senderAvatar || room?.memberAvatars?.[message.senderId] || null;
        
        // Create a safe message object with all required fields
        const messageWithAvatar = {
          ...message,
          senderAvatar,
          id: String(message.id),
          senderId: String(message.senderId || ''),
          text: String(message.text || ''),
          type: String(message.type || 'text'),
          createdAt: message.createdAt || Date.now()
        };

        // Component is imported, no need to validate here

        // Render with ErrorBoundary wrapper
        // Ensure all props are valid before rendering
        try {
          // Component is imported, proceed with rendering

          // Validate all required props before rendering
          if (!messageWithAvatar || !messageWithAvatar.id) {
            console.error('Invalid message data:', messageWithAvatar);
            return (
              <div key={message.id || index} className="p-2 text-white/60 text-sm">
                Invalid message
              </div>
            );
          }

          // Ensure all props are valid
          const safeProps = {
            message: messageWithAvatar,
            isOwn: Boolean(isOwn),
            onReply: typeof emptyReplyCallback === 'function' ? emptyReplyCallback : (() => {}),
            roomId: String(room?.id || ''),
            currentUserId: String(currentUserId || ''),
            showAvatar: Boolean(showAvatar),
            showName: Boolean(showName),
            isFirstInGroup: Boolean(showName),
            isLastInGroup: Boolean(showAvatar)
          };

          // Render message with fallback if component fails
          // Use a simple inline component as fallback
          const FallbackMessage = ({ message, isOwn }: { message: any; isOwn: boolean }) => (
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isOwn 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                  : 'bg-gray-700/50 text-gray-100'
              }`}>
                <p className="text-sm">{message.text || 'Message'}</p>
                {message.senderName && (
                  <p className="text-xs opacity-70 mt-1">{message.senderName}</p>
                )}
              </div>
            </div>
          );

          // Use the imported component directly with JSX
          // This is the most reliable way in Next.js production builds
          // Check if component is actually a function before using it
          if (!MessageBubbleWorkingComponent || typeof MessageBubbleWorkingComponent !== 'function') {
            console.warn('⚠️ MessageBubbleWorkingComponent is not a function, using fallback');
            return (
              <div key={message.id} id={`message-${message.id}`}>
                <FallbackMessage message={safeProps.message} isOwn={safeProps.isOwn} />
              </div>
            );
          }

          try {
            return (
              <div key={message.id} id={`message-${message.id}`}>
                <ErrorBoundary fallback={
                  <FallbackMessage message={safeProps.message} isOwn={safeProps.isOwn} />
                }>
                  <MessageBubbleWorkingComponent
                    message={safeProps.message}
                    isOwn={safeProps.isOwn}
                    onReply={safeProps.onReply}
                    roomId={safeProps.roomId}
                    currentUserId={safeProps.currentUserId}
                    showAvatar={safeProps.showAvatar}
                    showName={safeProps.showName}
                    isFirstInGroup={safeProps.isFirstInGroup}
                    isLastInGroup={safeProps.isLastInGroup}
                  />
                </ErrorBoundary>
              </div>
            );
          } catch (renderError) {
            console.error('Error rendering message:', renderError);
            // Use fallback component instead of showing error
            return (
              <div key={message.id} id={`message-${message.id}`}>
                <FallbackMessage message={safeProps.message} isOwn={safeProps.isOwn} />
              </div>
            );
          }
        } catch (renderError) {
          console.error('Error rendering message bubble:', renderError, message);
          // Don't render error messages - return null to filter out
          return null;
        }
      } catch (error) {
        console.error('Error rendering message:', error, message);
        // Don't render error messages - just return null to filter out
        return null;
      }
    }).filter(Boolean); // Remove null entries (errors and invalid messages)
  }, [messages, currentUserId, room?.id, room?.memberAvatars, emptyReplyCallback]);

  // Subscribe to messages - FIXED ORDER: old up, new down
  useEffect(() => {
    if (!room || !room.id || !currentUserId || !isMountedRef.current) return;
    
    // Only subscribe if this is the current room
    if (room.id !== roomIdRef.current) return;

    // Mark messages as read when opening this room
    enhancedChatService.markMessagesAsRead(room.id, currentUserId);

    // FIXED: Handle async subscribeToMessages properly
    let isSubscribed = true;
    
    (async () => {
      try {
        const unsubscribe = await enhancedChatService.subscribeToMessages(
          room.id,
          (newMessages) => {
            // Don't update state if component is unmounting, navigating back, or room changed
            if (!isMountedRef.current || isNavigatingBackRef.current || !isSubscribed) return;
            if (room.id !== roomIdRef.current) return;
            
            // Sort messages: oldest first (will display at top, new at bottom)
            const sortedMessages = [...newMessages].sort((a, b) => {
              // Ensure we have timestamps
              const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (typeof a.createdAt === 'number' ? a.createdAt : 0);
              const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (typeof b.createdAt === 'number' ? b.createdAt : 0);
              return timeA - timeB; // Oldest first (ascending order)
            });
            
            // Extract pinned messages
            const pinned = sortedMessages.filter(msg => msg.isPinned);
            
            // Only update state if still mounted and same room
            if (isMountedRef.current && !isNavigatingBackRef.current && room.id === roomIdRef.current && isSubscribed) {
              setPinnedMessages(pinned);
              setMessages(sortedMessages);
              
              // Mark messages as read when new messages arrive (we're viewing them)
              enhancedChatService.markMessagesAsRead(room.id, currentUserId);
              
              // Auto-scroll to bottom (newest messages)
              setTimeout(() => {
                if (isMountedRef.current && !isNavigatingBackRef.current && room.id === roomIdRef.current && isSubscribed) {
                  scrollToBottom();
                }
              }, 100);
            }
          }
        );

        // Store unsubscribe function only if it's actually a function
        if (isSubscribed && unsubscribe && typeof unsubscribe === 'function') {
          unsubscribeRef.current = unsubscribe;
        } else if (isSubscribed) {
          console.warn('⚠️ [CHAT] subscribeToMessages did not return a function');
          unsubscribeRef.current = null;
        }
      } catch (error) {
        console.error('❌ [CHAT] Error subscribing to messages:', error);
        if (isSubscribed) {
          unsubscribeRef.current = null;
        }
      }
    })();

    return () => {
      isSubscribed = false;
      if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.warn('Error unsubscribing in cleanup:', err);
        }
      }
      unsubscribeRef.current = null;
    };
  }, [room, currentUserId]);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!currentUserId || !isMountedRef.current) return;

    console.log(`📞 [CHAT] Setting up incoming call listener for user: ${currentUserId}`);

    const unsubscribe = simpleFirebaseCallManager.subscribeToIncomingCalls(currentUserId, (call) => {
      if (!isMountedRef.current) return;
      
      // CRITICAL: Prevent duplicate notifications - check if we already have this call
      if (incomingCall && incomingCall.id === call.id) {
        console.log(`⏭️ [CHAT] Call ${call.id} already being handled, skipping duplicate`);
        return;
      }
      
      // CRITICAL: Check if this call was already accepted/declined
      if (handledCallsRef.current.has(call.id)) {
        console.log(`⏭️ [CHAT] Call ${call.id} was already handled, skipping`);
        return;
      }
      
      // CRITICAL: Only show notification if call is still ringing
      if (call.status !== 'ringing') {
        console.log(`⏭️ [CHAT] Call ${call.id} is not ringing (status: ${call.status}), skipping`);
        return;
      }
      
      console.log(`📞 [CHAT] Incoming call received: ${call.id}`);
      console.log(`📞 [CHAT] Caller: ${call.callerName}, Type: ${call.callType}`);
      setIncomingCall(call);
      setShowCallNotification(true);
    });

    return () => {
      console.log(`📞 [CHAT] Unsubscribing from incoming calls for user: ${currentUserId}`);
      if (unsubscribe) {
        simpleFirebaseCallManager.unsubscribe(`incoming_${currentUserId}`);
      }
    };
  }, [currentUserId, incomingCall]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async () => {
    if (!room || !text.trim()) return;

    const messageText = text.trim();
    setText("");
    
    try {
      await enhancedChatService.sendMessage({
        roomId: room.id,
        userId: currentUserId,
        userName: room.memberNames?.[currentUserId] || 'Unknown',
        userAvatar: room.memberAvatars?.[currentUserId] || undefined,
        text: messageText
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!room) return;

    try {
      console.log(`🎤 [CHAT] Uploading voice note: ${Math.round(duration)}s (${audioBlob.size} bytes)`);
      
      // Use the enhanced chat service to upload voice note to Firebase Storage
      await enhancedChatService.sendVoiceNote({
        roomId: room.id,
        userId: currentUserId,
        userName: room.memberNames?.[currentUserId] || 'Unknown',
        userAvatar: room.memberAvatars?.[currentUserId] || undefined,
        audioBlob: audioBlob,
        duration: duration
      });

      console.log('✅ Voice note uploaded to Firebase Storage and sent');
    } catch (error) {
      console.error('❌ Error sending voice note:', error);
      // Show error message to user
      alert('Failed to send voice note. Please try again.');
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'document') => {
    if (!room) return;

    try {
      console.log(`📤 [CHAT] Uploading ${type}: ${file.name} (${file.size} bytes)`);
      
      // Use the enhanced chat service to upload file to Firebase Storage
      await enhancedChatService.sendFileMessage({
        roomId: room.id,
        userId: currentUserId,
        userName: room.memberNames?.[currentUserId] || 'Unknown',
        userAvatar: room.memberAvatars?.[currentUserId] || undefined,
        file: file,
        text: type === 'image' ? '📸 Sent an image' : 
              type === 'video' ? '🎥 Sent a video' : 
              '📄 Sent a document'
      });
      
      console.log('✅ File uploaded to Firebase Storage and message sent');
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      // Show error message to user
      alert('Failed to upload file. Please try again.');
    }
  };

  const startCall = async (type: 'video' | 'voice') => {
    if (!room) return;
    
    try {
      // Create call in Firebase for signaling
      const callId = await simpleFirebaseCallManager.startCall({
        roomId: room.id,
        callerId: currentUserId,
        callerName: room.memberNames?.[currentUserId] || 'Unknown',
        callType: type,
        participants: room.members
      });
      
      // Start WebRTC call
      setCallType(type);
      setCurrentCallId(callId);
      setIsCallInitiator(true);
      setShowWebRTCCall(true);
      
      console.log(`📞 [Chat] Starting WebRTC ${type} call:`, callId);
    } catch (error) {
      console.error('❌ [Chat] Error starting call:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const [isAcceptingCall, setIsAcceptingCall] = useState(false);
  const acceptingCallIdRef = useRef<string | null>(null); // Track which call is being accepted
  
  const handleAcceptCall = async () => {
    if (!incomingCall) {
      return;
    }

    // Prevent duplicate acceptance attempts for the same call
    if (isAcceptingCall && acceptingCallIdRef.current === incomingCall.id) {
      console.log('⏭️ [CHAT] Already accepting this call, skipping duplicate');
      return;
    }
    
    // CRITICAL: Mark call as handled immediately to prevent showing notification again
    const callIdToAccept = incomingCall.id;
    const callTypeToAccept = incomingCall.callType;
    const roomIdToAccept = incomingCall.roomId || room?.id;
    
    handledCallsRef.current.add(callIdToAccept);
    
    // Set accepting state BEFORE async operations
    setIsAcceptingCall(true);
    acceptingCallIdRef.current = callIdToAccept;
    
    // CRITICAL: Hide notification immediately before async operations
    setShowCallNotification(false);
    setIncomingCall(null);
    
    try {
      console.log(`📞 [CHAT] Accepting call: ${callIdToAccept}`);
      
      // CRITICAL: Verify call exists and is still active before opening modal
      const call = await simpleFirebaseCallManager.getCall(callIdToAccept);
      if (!call) {
        console.error('❌ [CHAT] Call not found:', callIdToAccept);
        alert('Call not found. It may have been cancelled.');
        setIsAcceptingCall(false);
        acceptingCallIdRef.current = null;
        handledCallsRef.current.delete(callIdToAccept);
        return;
      }
      if (call.status === 'ended') {
        console.error('❌ [CHAT] Call already ended:', callIdToAccept);
        alert('Call has already ended.');
        setIsAcceptingCall(false);
        acceptingCallIdRef.current = null;
        handledCallsRef.current.delete(callIdToAccept);
        return;
      }
      
      // CRITICAL: Open call modal IMMEDIATELY after verification
      // This ensures the UI responds instantly to user action
      setCallType(callTypeToAccept);
      setCurrentCallId(callIdToAccept);
      setIsCallInitiator(false);
      setShowWebRTCCall(true);
      
      console.log(`✅ [CHAT] Call modal opened immediately for: ${callIdToAccept}`);
      
      // Join call in Firebase (async, but UI is already updated)
      await simpleFirebaseCallManager.joinCall(callIdToAccept, currentUserId);
      
      console.log(`✅ [CHAT] Successfully joined call in Firebase: ${callIdToAccept}`);
      
      // CRITICAL: Ensure call modal is still open after Firebase join
      // Use a callback to ensure state is updated correctly
      setTimeout(() => {
        setShowWebRTCCall(true);
        setCurrentCallId(callIdToAccept);
        setCallType(callTypeToAccept);
        setIsCallInitiator(false);
      }, 50);
      
      // Reset accepting state after a short delay to allow UI to update
      setTimeout(() => {
        setIsAcceptingCall(false);
        acceptingCallIdRef.current = null;
      }, 1000);
    } catch (error) {
      console.error('❌ [CHAT] Error accepting call:', error);
      // Remove from handled set on error so user can retry
      handledCallsRef.current.delete(callIdToAccept);
      // Reset on error so user can retry
      setIsAcceptingCall(false);
      acceptingCallIdRef.current = null;
      // Close call modal on error
      setShowWebRTCCall(false);
      setCurrentCallId(null);
      alert('Failed to accept call. Please try again.');
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      // CRITICAL: Mark call as handled immediately to prevent showing notification again
      const callIdToDecline = incomingCall.id;
      handledCallsRef.current.add(callIdToDecline);
      
      // CRITICAL: Hide notification immediately before async operations
      setShowCallNotification(false);
      setIncomingCall(null);
      
      console.log(`📞 [CHAT] Declining call: ${callIdToDecline}`);
      await simpleFirebaseCallManager.endCall(callIdToDecline);
    }
  };

  // Additional safety check (redundant but safe)
  if (!room || !room.id || !room.members) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Chat Selected</h2>
          <p className="text-white/60">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  // Prevent duplicate rendering - ensure only one instance
  if (isNavigatingBackRef.current) {
    return (
      <div className="flex flex-col h-full bg-black items-center justify-center">
        <p className="text-white/60 text-sm">Navigating back...</p>
      </div>
    );
  }

  // CRITICAL: Restore UI on page load/visibility change (in case call ended before page refresh)
  useEffect(() => {
    const restoreUIOnLoad = () => {
      // Check if video-call-active class is still present (stale state)
      if (document.documentElement.classList.contains('video-call-active') || 
          document.body.classList.contains('video-call-active')) {
        console.log('🔄 [CHAT] Detected stale video-call-active state on page load - restoring UI');
        document.documentElement.classList.remove('video-call-active');
        document.body.classList.remove('video-call-active');
        
        // Restore headers immediately
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
        
        // Hide any stale modals
        const modal = document.getElementById('webrtc-call-modal');
        if (modal) {
          modal.style.display = 'none';
          modal.style.visibility = 'hidden';
          modal.style.opacity = '0';
          modal.style.pointerEvents = 'none';
        }
      }
    };
    
    // Run on mount
    restoreUIOnLoad();
    
    // Also run on visibility change (when user switches back to tab)
    document.addEventListener('visibilitychange', restoreUIOnLoad);
    
    return () => {
      document.removeEventListener('visibilitychange', restoreUIOnLoad);
    };
  }, []);

  // ENHANCED: Listen for call-ended event to restore header visibility and fix alignment
  useEffect(() => {
    const handleCallEnded = () => {
      console.log('🔄 [CHAT] Call ended event received - restoring UI');
      
      // CRITICAL: Clear sessionStorage and URL params immediately to prevent reopening
      sessionStorage.removeItem('pendingCall');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('call');
        window.history.replaceState({}, '', url.toString());
      }
      
      // CRITICAL: Clear call state to prevent reopening
      setShowWebRTCCall(false);
      setCurrentCallId(null);
      setIsCallInitiator(false);
      
      // CRITICAL: Remove video-call-active class immediately
      document.documentElement.classList.remove('video-call-active');
      document.body.classList.remove('video-call-active');
      
      // CRITICAL: Hide modal if it still exists (don't remove - let React handle it)
      const modal = document.getElementById('webrtc-call-modal');
      if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        // Don't remove from DOM - React will handle unmounting to avoid removeChild errors
      }
      
      // ENHANCED: Comprehensive UI restoration including alignment fix
      const restoreUI = () => {
        // CRITICAL: Check if document is available and elements exist before manipulation
        if (typeof document === 'undefined') return;
        
        // CRITICAL: Defer all DOM manipulation to avoid conflicts with React reconciliation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              // CRITICAL: Restore chat header with complete style reset
              const chatHeaders = document.querySelectorAll('[class*="neo-glass-header"], [class*="chat-header"], [class*="ChatHeader"]');
              chatHeaders.forEach((header) => {
                const htmlEl = header as HTMLElement;
                // CRITICAL: Check if element exists in DOM and is still connected before manipulation
                if (htmlEl && htmlEl.isConnected && htmlEl.parentNode && document.body.contains(htmlEl)) {
                  try {
                    // Defer style changes to avoid React conflicts
                    requestAnimationFrame(() => {
                      if (htmlEl.isConnected && htmlEl.parentNode) {
                        htmlEl.removeAttribute('style');
                        htmlEl.style.cssText = '';
                        htmlEl.style.display = 'flex';
                        htmlEl.style.visibility = 'visible';
                        htmlEl.style.opacity = '1';
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
                        htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
                        void htmlEl.offsetHeight;
                      }
                    });
                  } catch (e) {
                    console.warn('Error restoring chat header:', e);
                  }
                }
              });
              
              // CRITICAL: Restore main header with complete style reset
              const mainHeaders = document.querySelectorAll('header, [class*="PerfectHeader"], nav, [role="navigation"], [class*="header"], [class*="Header"]');
              mainHeaders.forEach((header) => {
                const htmlEl = header as HTMLElement;
                if (htmlEl && htmlEl.isConnected && htmlEl.parentNode && document.body.contains(htmlEl)) {
                  try {
                    requestAnimationFrame(() => {
                      if (htmlEl.isConnected && htmlEl.parentNode) {
                        htmlEl.removeAttribute('style');
                        htmlEl.style.cssText = '';
                        htmlEl.style.display = htmlEl.tagName === 'NAV' ? 'flex' : 'block';
                        htmlEl.style.visibility = 'visible';
                        htmlEl.style.opacity = '1';
                        htmlEl.style.position = '';
                        htmlEl.style.top = '';
                        htmlEl.style.left = '';
                        htmlEl.style.right = '';
                        htmlEl.style.bottom = '';
                        htmlEl.style.width = '';
                        htmlEl.style.height = '';
                        htmlEl.style.margin = '';
                        htmlEl.style.padding = '';
                        htmlEl.style.zIndex = '';
                        htmlEl.style.transform = '';
                        htmlEl.style.translate = '';
                        htmlEl.style.pointerEvents = 'auto';
                        htmlEl.classList.remove('hidden', 'invisible', 'opacity-0', 'video-call-active');
                        void htmlEl.offsetHeight;
                      }
                    });
                  } catch (e) {
                    console.warn('Error restoring main header:', e);
                  }
                }
              });
              
              // CRITICAL: Also restore any elements that might be hiding headers (overlays, modals, etc.)
              const potentialOverlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="backdrop"]');
              potentialOverlays.forEach((overlay) => {
                const htmlEl = overlay as HTMLElement;
                if (htmlEl && htmlEl.id !== 'webrtc-call-modal' && htmlEl.isConnected && htmlEl.parentNode && document.body.contains(htmlEl)) {
                  try {
                    const rect = htmlEl.getBoundingClientRect();
                    if (rect.top <= 100 && rect.height > 50) {
                      const computedZ = parseInt(window.getComputedStyle(htmlEl).zIndex) || 0;
                      if (computedZ > 50) {
                        htmlEl.style.zIndex = '1';
                      }
                    }
                  } catch (e) {
                    // Silently ignore DOM errors
                  }
                }
              });
              
              // CRITICAL: Also restore ALL buttons in headers
              const allHeaderButtons = document.querySelectorAll('header button, nav button, [class*="Header"] button, [class*="header"] button');
              allHeaderButtons.forEach((btn) => {
                const htmlEl = btn as HTMLElement;
                if (htmlEl && htmlEl.isConnected && htmlEl.parentNode && document.body.contains(htmlEl)) {
                  try {
                    requestAnimationFrame(() => {
                      if (htmlEl.isConnected && htmlEl.parentNode) {
                        htmlEl.removeAttribute('style');
                        htmlEl.style.cssText = '';
                        htmlEl.style.display = '';
                        htmlEl.style.visibility = 'visible';
                        htmlEl.style.opacity = '1';
                        htmlEl.style.pointerEvents = 'auto';
                        htmlEl.style.position = '';
                        htmlEl.style.zIndex = '';
                        htmlEl.classList.remove('hidden', 'invisible', 'opacity-0');
                        void htmlEl.offsetHeight;
                      }
                    });
                  } catch (e) {
                    // Silently ignore DOM errors
                  }
                }
              });
              
              // ENHANCED: Restore body and html alignment
              document.body.style.cssText = '';
              document.body.style.overflow = '';
              document.body.style.position = '';
              document.body.style.width = '';
              document.body.style.height = '';
              document.body.style.margin = '';
              document.body.style.padding = '';
              if (document.documentElement) {
                document.documentElement.style.cssText = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.position = '';
                document.documentElement.style.width = '';
                document.documentElement.style.height = '';
              }
              
              // Force reflow
              void document.body.offsetHeight;
            } catch (e) {
              console.warn('Error in restoreUI inner:', e);
            }
          });
        });
      };
      
      // CRITICAL: Defer restoration to avoid React reconciliation conflicts
      // Use multiple requestAnimationFrame calls to ensure it happens after React's render cycle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreUI();
          // Force all elements to recalculate
          window.dispatchEvent(new Event('resize'));
          
          // Single delayed retry to ensure everything is restored
          setTimeout(() => {
            requestAnimationFrame(() => {
              restoreUI();
              // Ensure modal is hidden (don't remove - React handles it)
              const modal = document.getElementById('webrtc-call-modal');
              if (modal) {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
              }
            });
          }, 300);
        });
      });
      
      // Store timeout for cleanup - deferred to avoid React conflicts
      (handleCallEnded as any).timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          restoreUI();
        });
      }, 500);
    };
    
    window.addEventListener('call-ended', handleCallEnded);
    
    // Also listen for resize events to restore headers and alignment
    const handleResize = () => {
      const chatHeader = document.querySelector('[class*="neo-glass-header"]');
      if (chatHeader && (chatHeader as HTMLElement).offsetParent === null) {
        (chatHeader as HTMLElement).style.display = 'flex';
        (chatHeader as HTMLElement).style.visibility = 'visible';
        (chatHeader as HTMLElement).style.opacity = '1';
      }
      // Force reflow to fix alignment
      void document.body.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('call-ended', handleCallEnded);
      window.removeEventListener('resize', handleResize);
      // Cleanup any pending timeout
      if ((handleCallEnded as any).timeout) {
        clearTimeout((handleCallEnded as any).timeout);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-black relative z-[90]" key={`chat-${room.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20 neo-glass-header backdrop-blur-sm sticky top-0 z-[99]">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Set navigation flag immediately
              isNavigatingBackRef.current = true;
              isMountedRef.current = false;
              
              // Unsubscribe from messages immediately
              if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                try {
                  unsubscribeRef.current();
                } catch (err) {
                  console.warn('Error unsubscribing:', err);
                }
                unsubscribeRef.current = null;
              }
              
              // Clear all state
              setMessages([]);
              setPinnedMessages([]);
              setText("");
              setShowVoiceRecorder(false);
              setShowFileUpload(false);
              setShowSettings(false);
              setShowCall(false);
              setShowWebRTCCall(false);
              setIncomingCall(null);
              setShowCallNotification(false);
              
              // Navigate back
              handleBack();
            }}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="arrow-left" size={20} className="text-white" />
          </button>
          
          {/* Group Avatar */}
          {room.groupAvatar ? (
            <img
              src={room.groupAvatar}
              alt={room.name || 'Chat Room'}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Fallback Avatar */}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ${room.groupAvatar ? 'hidden' : ''}`}>
            <span className="text-white font-semibold">
              {typeof room?.name === 'string' && room.name.length > 0 ? room.name.charAt(0).toUpperCase() : 'C'}
            </span>
          </div>

          <div>
            <h2 className="font-semibold text-white">{room?.name || 'Unnamed Room'}</h2>
            <p className="text-sm text-white/60">
              {Array.isArray(room?.members) ? room.members.length : 0} member{(Array.isArray(room?.members) ? room.members.length : 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bookmark/Pin Button */}
          <button
            onClick={() => {
              // TODO: Implement bookmark/pin functionality
              console.log('Bookmark/Pin room:', room.id);
            }}
            className="p-2 hover:bg-yellow-500/20 rounded-lg transition-all group relative border border-transparent hover:border-yellow-500/30"
            title="Bookmark this room"
          >
            <NeonCyanIcon type="flag" size={20} className="text-yellow-400 group-hover:text-yellow-300" />
          </button>

          {/* Voice Call Button - Proper Phone Icon */}
          <button
            onClick={() => startCall('voice')}
            className="p-2 hover:bg-green-500/20 rounded-lg transition-all group relative border border-transparent hover:border-green-500/30"
            title="Voice Call (30 min limit)"
          >
            <NeonCyanIcon type="phone" size={20} className="text-green-400 group-hover:text-green-300" />
          </button>

          {/* Video Call Button */}
          <button
            onClick={() => startCall('video')}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-all group relative border border-transparent hover:border-blue-500/30"
            title="Video Call (30 min limit)"
          >
            <NeonCyanIcon type="video" size={20} className="text-blue-400 group-hover:text-blue-300" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="cog" size={20} className="text-white/70 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <PinnedMessagesBanner
          pinnedMessages={pinnedMessages}
          onUnpin={async (messageId) => {
            await enhancedChatService.unpinMessage(room.id, messageId);
          }}
          onJumpToMessage={(messageId) => {
            const element = document.getElementById(`message-${messageId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}

      {/* Messages - FIXED: OLD UP, NEW DOWN */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-black custom-scrollbar"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2306b6d4\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          // Custom scrollbar styling - ensure it's visible
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(6, 182, 212, 0.3) transparent',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {isMountedRef.current && !isNavigatingBackRef.current && room?.id === roomIdRef.current ? (
          <>
            {Array.isArray(renderedMessages) && renderedMessages.length > 0 ? renderedMessages : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/60 text-sm">Loading messages...</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-cyan-400/20 neo-glass-header backdrop-blur-sm">
        <div className="flex items-end gap-3">
          {/* File Upload */}
          <button 
            onClick={() => setShowFileUpload(true)}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors flex-shrink-0 border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="paper-clip" size={20} className="text-white" />
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${room.name || 'Room'}...`}
              className="w-full px-4 py-3 bg-white/5 border border-cyan-400/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none min-h-[44px] max-h-32"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Voice/Send Button */}
          {text.trim() ? (
            <button
              onClick={sendMessage}
              className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-full transition-all flex-shrink-0 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              <NeonCyanIcon type="paper-airplane" size={20} className="text-white" />
            </button>
          ) : (
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-3 hover:bg-cyan-500/20 rounded-full transition-all flex-shrink-0 border border-transparent hover:border-cyan-400/30"
            >
              <NeonCyanIcon type="microphone" size={20} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showVoiceRecorder && (
        <VoiceRecorderFixed
          onSend={handleVoiceSend}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {showFileUpload && (
        <FileUploadModal
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
          roomId={room?.id || ''}
          senderId={currentUserId}
          senderName={room?.memberNames?.[currentUserId] || 'Unknown'}
        />
      )}

      {showSettings && (
        <GroupSettingsWorking
          room={room}
          currentUserId={currentUserId}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={async (settings) => {
            try {
              console.log('⚙️ [GROUP] Update settings:', settings);
              // Update room settings in Firebase
              if (!db || !room?.id) {
                console.error('Database not available or invalid room');
                return;
              }
              await updateDoc(doc(db!, 'groupChats', room.id), {
                settings: settings,
                lastActivityAt: Date.now()
              });
              console.log('✅ [GROUP] Settings updated successfully');
            } catch (error) {
              console.error('❌ [GROUP] Failed to update settings:', error);
              alert('Failed to update settings. Please try again.');
            }
          }}
          onAddMembers={async (memberIds) => {
            try {
              console.log('➕ [GROUP] Add members:', memberIds);
              for (const memberId of memberIds) {
                await enhancedChatService.addMember(room.id, memberId, 'New Member');
              }
              console.log('✅ [GROUP] Members added successfully');
            } catch (error) {
              console.error('❌ [GROUP] Failed to add members:', error);
              alert('Failed to add members. Please try again.');
            }
          }}
          onRemoveMember={async (memberId) => {
            try {
              console.log('🗑️ [GROUP] Removing member:', memberId);
              await enhancedChatService.removeMember(room.id, memberId);
              console.log('✅ [GROUP] Member removed successfully');
            } catch (error) {
              console.error('❌ [GROUP] Failed to remove member:', error);
              alert('Failed to remove member. Please try again.');
            }
          }}
          onChangeAvatar={async (file: File) => {
            try {
              console.log('📸 [GROUP] Change avatar');
              await enhancedChatService.updateGroupAvatar(room.id, file, currentUserId);
              console.log('✅ [GROUP] Avatar updated successfully');
            } catch (error) {
              console.error('❌ [GROUP] Failed to update avatar:', error);
              alert('Failed to update avatar. Please try again.');
            }
          }}
          onLeaveGroup={async () => {
            try {
              if (confirm('Are you sure you want to leave this group? You will no longer receive messages from this chat.')) {
                console.log('👋 [GROUP] Leaving group:', room.id);
                await enhancedChatService.leaveGroup(room.id, currentUserId);
                console.log('✅ [GROUP] Left group successfully');
                onBack(); // Go back to chat list
              }
            } catch (error) {
              console.error('❌ [GROUP] Error leaving group:', error);
              alert('Failed to leave group. Please try again.');
            }
          }}
          onDeleteGroup={async () => {
            try {
              console.log('🗑️ [GROUP] Deleting group:', room.id);
              await enhancedChatService.deleteGroup(room.id, currentUserId);
              console.log('✅ [GROUP] Group deleted successfully');
              onBack(); // Go back to chat list
            } catch (error) {
              console.error('❌ [GROUP] Error deleting group:', error);
              alert('Failed to delete group. Please try again.');
            }
          }}
        />
      )}

      {showWebRTCCall && currentCallId && (
        <WebRTCCallModal
          type={callType}
          roomId={room.id}
          callId={currentCallId}
          currentUserId={currentUserId}
          currentUserName={room.memberNames?.[currentUserId] || 'Unknown'}
          isInitiator={isCallInitiator}
          onEnd={() => {
            // CRITICAL: Clear all call-related state immediately
            setShowWebRTCCall(false);
            setCurrentCallId(null);
            setIsCallInitiator(false);
            
            // CRITICAL: Clear sessionStorage to prevent reopening
            sessionStorage.removeItem('pendingCall');
            
            // CRITICAL: Remove call parameter from URL to prevent reopening
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('call');
              window.history.replaceState({}, '', url.toString());
            }
            
            console.log('✅ [CHAT] Call modal closed and all state cleared');
          }}
          // RaftAI Analysis - Enhanced role detection for ALL roles (founder, vc, exchange, ido, influencer, agency, admin)
          remoteUserId={room.founderId === currentUserId ? room.counterpartId : room.founderId}
          remoteUserName={room.founderId === currentUserId ? room.counterpartName : room.founderName}
          remoteUserRole={remoteUserRole} // Use fetched role from Firestore
          enableRaftAI={true}
        />
      )}

      {showCallNotification && incomingCall && (
        <CallNotification
          callId={incomingCall.id}
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </div>
  );
}
