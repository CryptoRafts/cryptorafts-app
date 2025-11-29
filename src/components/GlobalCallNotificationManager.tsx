'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import simpleFirebaseCallManager from '@/lib/simpleFirebaseCallManager';
import CallNotification from './CallNotification';
import { SimpleFirebaseCall } from '@/lib/simpleFirebaseCallManager';
import { useRouter } from 'next/navigation';
import { callSoundManager } from '@/lib/call-sound-manager';

/**
 * Global Call Notification Manager
 * Works for ALL user roles (founder, vc, exchange, ido, influencer, agency, admin)
 * Displays incoming call notifications regardless of current page
 */
export default function GlobalCallNotificationManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<SimpleFirebaseCall | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Track accepted/declined calls to prevent showing notification again
  const handledCallsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.uid) {
      console.log('📞 [GLOBAL CALL] No user, skipping call listener setup');
      return;
    }

    console.log(`📞 [GLOBAL CALL] Setting up global incoming call listener for user: ${user.uid} (role: ${user.role || 'unknown'})`);

    // Subscribe to incoming calls for this user (works for ALL roles)
    const unsubscribe = simpleFirebaseCallManager.subscribeToIncomingCalls(user.uid, (call) => {
      // CRITICAL: Filter out stale/ended calls immediately
      if (!call || call.status === 'ended' || call.status === 'connected') {
        console.log(`⏭️ [GLOBAL CALL] Call ${call?.id} is stale/ended (status: ${call?.status}), skipping`);
        return;
      }
      
      // CRITICAL: Check if call is too old (more than 5 minutes) - likely stale
      if (call.createdAt) {
        const callAge = Date.now() - (call.createdAt.toMillis ? call.createdAt.toMillis() : call.createdAt);
        if (callAge > 5 * 60 * 1000) { // 5 minutes
          console.log(`⏭️ [GLOBAL CALL] Call ${call.id} is too old (${Math.round(callAge / 1000)}s), skipping stale call`);
          return;
        }
      }
      
      // CRITICAL: Prevent duplicate notifications - check if we already have this call
      if (incomingCall && incomingCall.id === call.id) {
        console.log(`⏭️ [GLOBAL CALL] Call ${call.id} already being handled, skipping duplicate`);
        return;
      }
      
      // CRITICAL: Check if this call was already accepted/declined
      if (handledCallsRef.current.has(call.id)) {
        console.log(`⏭️ [GLOBAL CALL] Call ${call.id} was already handled, skipping`);
        return;
      }
      
      // CRITICAL: Only show notification if call is still ringing
      if (call.status !== 'ringing') {
        console.log(`⏭️ [GLOBAL CALL] Call ${call.id} is not ringing (status: ${call.status}), skipping`);
        return;
      }
      
      console.log(`📞 [GLOBAL CALL] Incoming call received for ${user.uid}:`, call.id);
      console.log(`📞 [GLOBAL CALL] Caller: ${call.callerName}, Type: ${call.callType}`);
      console.log(`📞 [GLOBAL CALL] User role: ${user.role || 'unknown'}`);
      
      // Show notification for ALL roles
      setIncomingCall(call);
      setShowNotification(true);
    });

    return () => {
      console.log(`📞 [GLOBAL CALL] Unsubscribing from incoming calls for user: ${user.uid}`);
      if (unsubscribe) {
        simpleFirebaseCallManager.unsubscribe(`incoming_${user.uid}`);
      }
    };
  }, [user?.uid, user?.role]);

  const [isAccepting, setIsAccepting] = useState(false);
  
  const handleAccept = async () => {
    if (!incomingCall || !user?.uid || isAccepting) {
      if (isAccepting) {
        console.log('⏭️ [GLOBAL CALL] Already accepting call, skipping duplicate');
      }
      return;
    }

    // CRITICAL: Store call info BEFORE setting state to null
    const callIdToHandle = incomingCall.id;
    const callTypeToHandle = incomingCall.callType;
    const roomIdToHandle = incomingCall.roomId;
    const callerIdToHandle = incomingCall.callerId;
    const callerNameToHandle = incomingCall.callerName;
    
    // CRITICAL: Mark call as handled immediately to prevent showing notification again
    handledCallsRef.current.add(callIdToHandle);
    
    // Stop ringing sound immediately when accepting
    callSoundManager.stopRinging();
    
    // CRITICAL: Hide notification immediately before async operations
    setShowNotification(false);
    setIncomingCall(null);
    
    setIsAccepting(true);
    
    try {
      console.log(`📞 [GLOBAL CALL] Accepting call: ${callIdToHandle}`);
      await simpleFirebaseCallManager.joinCall(callIdToHandle, user.uid);
      
      // CRITICAL: Store call info in sessionStorage so ChatInterfaceTelegramFixed can detect it
      const callInfo = {
        callId: callIdToHandle,
        callType: callTypeToHandle,
        roomId: roomIdToHandle,
        remoteUserId: callerIdToHandle,
        remoteUserName: callerNameToHandle,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingCall', JSON.stringify(callInfo));
      
      // Navigate to chat room if we have roomId - ENHANCED: Route based on user role
      if (roomIdToHandle) {
        // Determine correct route based on user role
        const userRole = user?.role || 'user';
        let messageRoute = '/messages';
        if (userRole === 'founder') {
          messageRoute = '/founder/messages';
        } else if (userRole === 'vc') {
          messageRoute = '/vc/messages';
        } else if (userRole === 'exchange') {
          messageRoute = '/exchange/messages';
        } else if (userRole === 'ido') {
          messageRoute = '/ido/messages';
        } else if (userRole === 'agency') {
          messageRoute = '/agency/messages';
        } else if (userRole === 'influencer') {
          messageRoute = '/influencer/messages';
        }
        
        router.push(`${messageRoute}?room=${roomIdToHandle}&call=${callIdToHandle}`);
      }
    } catch (error) {
      console.error('❌ [GLOBAL CALL] Error accepting call:', error);
      // Remove from handled set on error so user can retry
      handledCallsRef.current.delete(callIdToHandle);
      setIsAccepting(false); // Reset on error so user can retry
    }
  };

  const handleDecline = async () => {
    if (!incomingCall || !user?.uid) return;

    // CRITICAL: Mark call as handled immediately to prevent showing notification again
    const callIdToHandle = incomingCall.id;
    handledCallsRef.current.add(callIdToHandle);

    // Stop ringing sound immediately when declining
    callSoundManager.stopRinging();

    // CRITICAL: Hide notification immediately before async operations
    setShowNotification(false);
    setIncomingCall(null);

    try {
      console.log(`📞 [GLOBAL CALL] Declining call: ${callIdToHandle}`);
      await simpleFirebaseCallManager.endCall(callIdToHandle);
    } catch (error) {
      console.error('❌ [GLOBAL CALL] Error declining call:', error);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
    setIncomingCall(null);
  };

  // Render notification if we have an incoming call
  if (!showNotification || !incomingCall) {
    return null;
  }

  return (
    <CallNotification
      callId={incomingCall.id}
      callerName={incomingCall.callerName}
      callType={incomingCall.callType}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}

