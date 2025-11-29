// Simple Firebase Call Manager - Works without complex indexes
// Uses basic Firestore operations for call management

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

export interface SimpleCallParticipant {
  userId: string;
  userName: string;
  status: 'ringing' | 'connected' | 'disconnected';
  joinedAt?: Timestamp;
}

export interface SimpleFirebaseCall {
  id: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  participants: SimpleCallParticipant[];
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Add participant IDs for easy querying
  participantIds: string[];
}

class SimpleFirebaseCallManager {
  private callListeners: Map<string, () => void> = new Map();

  // Start a new call
  async startCall(params: {
    roomId: string;
    callerId: string;
    callerName: string;
    callType: 'voice' | 'video';
    participants: string[]; // Array of user IDs
  }): Promise<string> {
    try {
      const callId = `call_${Date.now()}_${params.callerId}`;
      
      const call: SimpleFirebaseCall = {
        id: callId,
        roomId: params.roomId,
        callerId: params.callerId,
        callerName: params.callerName,
        callType: params.callType,
        participants: params.participants.map(userId => ({
          userId: userId,
          userName: userId === params.callerId ? params.callerName : 'Unknown User', // Placeholder
          status: userId === params.callerId ? 'connected' : 'ringing'
        })),
        participantIds: params.participants,
        startTime: serverTimestamp() as Timestamp,
        status: 'ringing',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Save call to Firebase
      await setDoc(doc(db!, 'calls', callId), call);
      
      console.log(`📞 [SIMPLE CALL] Started ${params.callType} call: ${callId}`);
      console.log(`📞 [SIMPLE CALL] Participants: ${params.participants.join(', ')}`);
      
      // ENHANCED: Create Firebase notifications for all participants (except caller)
      const otherParticipants = params.participants.filter(id => id !== params.callerId);
      if (otherParticipants.length > 0) {
        try {
          const { collection: firestoreCollection, addDoc } = await import('firebase/firestore');
          const notificationsRef = firestoreCollection(db!, 'notifications');
          
          // Create notification for each participant
          const notificationPromises = otherParticipants.map(async (participantId) => {
            // Get user role to determine correct message route
            const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
            const userDoc = await getDoc(firestoreDoc(db!, 'users', participantId));
            const userRole = userDoc.data()?.role || 'user';
            
            // Determine correct route based on role
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
            
            await addDoc(notificationsRef, {
              userId: participantId,
              type: 'call',
              title: `📞 Incoming ${params.callType === 'video' ? 'Video' : 'Voice'} Call`,
              message: `${params.callerName} is calling you`,
              source: 'call',
              read: false,
              timestamp: Date.now(),
              createdAt: serverTimestamp(),
              data: {
                callId: callId,
                roomId: params.roomId,
                callerId: params.callerId,
                callerName: params.callerName,
                callType: params.callType,
                url: `${messageRoute}?room=${params.roomId}`
              }
            });
          });
          
          await Promise.all(notificationPromises);
          console.log(`✅ [SIMPLE CALL] Created notifications for ${otherParticipants.length} participants`);
        } catch (error) {
          console.error('❌ [SIMPLE CALL] Error creating call notifications:', error);
          // Don't throw - call should still proceed even if notifications fail
        }
      }
      
      // Send system message to chat room (only once, in background)
      setTimeout(async () => {
        try {
          const { collection: firestoreCollection, addDoc, getDocs, query: firestoreQuery, where: firestoreWhere } = await import('firebase/firestore');
          const messagesRef = firestoreCollection(db, 'groupChats', params.roomId, 'messages');
          
          // Check if message already exists for this call
          const existingMessagesQuery = firestoreQuery(
            messagesRef,
            firestoreWhere('metadata.callId', '==', callId),
            firestoreWhere('metadata.action', '==', 'call_started')
          );
          const existingMessages = await getDocs(existingMessagesQuery);
          
          if (existingMessages.empty) {
            await addDoc(messagesRef, {
              senderId: 'system',
              senderName: 'System',
              type: 'system',
              text: `📞 ${params.callerName} started a ${params.callType} call`,
              reactions: {},
              readBy: [],
              isPinned: false,
              isEdited: false,
              isDeleted: false,
              createdAt: Date.now(),
              metadata: {
                callId: callId,
                callType: params.callType,
                action: 'call_started'
              }
            });
            console.log(`✅ [CALL] System message sent for call ${callId}`);
          } else {
            console.log(`⏭️ [CALL] System message already exists for call ${callId}`);
          }
        } catch (error) {
          console.error('Error sending call start message:', error);
        }
      }, 100); // Small delay to prevent race conditions
      
      return callId;
    } catch (error) {
      console.error('❌ Error starting simple call:', error);
      throw error;
    }
  }

  // Update call status
  async updateCallStatus(callId: string, status: SimpleFirebaseCall['status']) {
    try {
      const callRef = doc(db!, 'calls', callId);
      await updateDoc(callRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [SIMPLE CALL] Call ${callId} status updated: ${status}`);
    } catch (error) {
      console.error('❌ Error updating call status:', error);
      throw error;
    }
  }

  // Participant joins call
  async joinCall(callId: string, userId: string) {
    try {
      const callRef = doc(db!, 'calls', callId);
      const callSnap = await getDoc(callRef);
      
      if (!callSnap.exists()) {
        throw new Error('Call not found');
      }
      
      const call = callSnap.data() as SimpleFirebaseCall;
      
      // CRITICAL: Validate call data before accessing participants
      if (!call || !call.participants || !Array.isArray(call.participants)) {
        console.error('❌ [SIMPLE CALL] Invalid call data - missing participants array:', call);
        throw new Error('Invalid call data: participants array is missing or invalid');
      }
      
      const updatedParticipants = call.participants.map(p => 
        p && p.userId === userId 
          ? { ...p, status: 'connected' as const, joinedAt: Timestamp.now() }
          : p
      );
      
      await updateDoc(callRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [SIMPLE CALL] User ${userId} joined call ${callId}`);
    } catch (error) {
      console.error('❌ Error joining call:', error);
      throw error;
    }
  }

  // End call
  async endCall(callId: string) {
    try {
      const callRef = doc(db!, 'calls', callId);
      
      // Get call data before ending
      const callSnap = await getDoc(callRef);
      let roomId = '';
      let callerName = '';
      let callType: 'voice' | 'video' = 'voice';
      
      // FIXED: Only update if document exists
      if (!callSnap.exists()) {
        console.warn(`⚠️ [SIMPLE CALL] Call document ${callId} does not exist, skipping update`);
        return;
      }
      
      const callData = callSnap.data() as SimpleFirebaseCall;
      roomId = callData.roomId;
      callerName = callData.callerName;
      callType = callData.callType;
      
      // Update status to ended - this will trigger listeners on both sides
      // FIXED: Wrap in try-catch to handle case where document is deleted between check and update
      try {
        await updateDoc(callRef, {
          status: 'ended',
          endTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`📞 [SIMPLE CALL] Call ${callId} status updated to 'ended' - both sides will close`);
      } catch (updateError: any) {
        // If document doesn't exist or was deleted, that's okay - call is already ended
        if (updateError?.code === 'not-found' || updateError?.message?.includes('No document to update')) {
          console.log(`ℹ️ [SIMPLE CALL] Call document ${callId} was already deleted or doesn't exist - call already ended`);
          return; // Exit early - call is already ended
        }
        // Re-throw other errors
        throw updateError;
      }
      
      // Send system message to chat room (only once)
      if (roomId) {
        setTimeout(async () => {
          try {
            const { collection: firestoreCollection, addDoc, getDocs, query: firestoreQuery, where: firestoreWhere } = await import('firebase/firestore');
            const messagesRef = firestoreCollection(db, 'groupChats', roomId, 'messages');
            
            // Check if end message already exists for this call
            const existingMessagesQuery = firestoreQuery(
              messagesRef,
              firestoreWhere('metadata.callId', '==', callId),
              firestoreWhere('metadata.action', '==', 'call_ended')
            );
            const existingMessages = await getDocs(existingMessagesQuery);
            
            if (existingMessages.empty) {
              await addDoc(messagesRef, {
                senderId: 'system',
                senderName: 'System',
                type: 'system',
                text: `📞 ${callType === 'video' ? 'Video' : 'Voice'} call ended`,
                reactions: {},
                readBy: [],
                isPinned: false,
                isEdited: false,
                isDeleted: false,
                createdAt: Date.now(),
                metadata: {
                  callId: callId,
                  callType: callType,
                  action: 'call_ended'
                }
              });
              console.log(`✅ [CALL] End message sent for call ${callId}`);
            } else {
              console.log(`⏭️ [CALL] End message already exists for call ${callId}`);
            }
          } catch (error) {
            console.error('Error sending call end message:', error);
          }
        }, 100);
      }
      
      // Delete call after 5 seconds (gives both sides time to receive 'ended' status)
      setTimeout(async () => {
        try {
          await deleteDoc(callRef);
          console.log(`🗑️ [SIMPLE CALL] Call ${callId} deleted after status propagation`);
        } catch (error) {
          console.error('Error deleting call:', error);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }

  // Subscribe to call updates
  subscribeToCall(callId: string, callback: (call: SimpleFirebaseCall | null) => void): () => void {
    const callRef = doc(db!, 'calls', callId);
    
    const unsubscribe = onSnapshot(callRef, (snapshot) => {
      if (snapshot.exists()) {
        const callData = snapshot.data();
        // CRITICAL: Validate call data structure before calling callback
        if (!callData || !callData.participants || !Array.isArray(callData.participants)) {
          console.warn('⚠️ [SIMPLE CALL] Invalid call data structure in subscription:', callData);
          callback(null);
          return;
        }
        const call = { id: snapshot.id, ...callData } as SimpleFirebaseCall;
        callback(call);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to call:', error);
      callback(null);
    });
    
    this.callListeners.set(callId, unsubscribe);
    return unsubscribe;
  }

  // Global set to track all notified calls across all subscriptions
  private static globalNotifiedCalls = new Set<string>();
  private static invalidCallsLogged = new Set<string>();
  
  // Subscribe to incoming calls for a user (real-time)
  subscribeToIncomingCalls(userId: string, callback: (call: SimpleFirebaseCall) => void): () => void {
    console.log(`📞 [SIMPLE CALL] Setting up incoming call listener for user: ${userId}`);
    
    // Track notified calls to prevent duplicates (per subscription)
    const notifiedCalls = new Set<string>();
    
    // Listen to all calls and filter client-side to avoid index issues
    const callsRef = collection(db!, 'calls');
    
    const unsubscribe = onSnapshot(callsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Only process 'added' changes to prevent duplicate notifications
        if (change.type === 'added') {
          const call = { id: change.doc.id, ...change.doc.data() } as SimpleFirebaseCall;
          
          // CRITICAL: Skip if we've already notified about this call (global check)
          if (SimpleFirebaseCallManager.globalNotifiedCalls.has(call.id)) {
            console.log(`⏭️ [SIMPLE CALL] Call ${call.id} already notified globally, skipping`);
            return;
          }
          
          // Skip if this subscription already notified about this call
          if (notifiedCalls.has(call.id)) {
            console.log(`⏭️ [SIMPLE CALL] Call ${call.id} already notified in this subscription, skipping`);
            return;
          }
          
          // CRITICAL: Check if call data is valid before accessing participants
          // Also check if call data exists and has required fields
          if (!call || typeof call !== 'object') {
            console.warn('⚠️ [SIMPLE CALL] Invalid call data - call is null or not an object:', call);
            return;

          }
          if (!call.participants || !Array.isArray(call.participants)) {
            // Only log once per call ID to reduce console noise
            if (!SimpleFirebaseCallManager.invalidCallsLogged.has(call.id)) {
              console.debug('⚠️ [SIMPLE CALL] Invalid call data - missing participants array:', call.id);
              SimpleFirebaseCallManager.invalidCallsLogged.add(call.id);
              // Clean up after 5 minutes
              setTimeout(() => {
                SimpleFirebaseCallManager.invalidCallsLogged.delete(call.id);
              }, 5 * 60 * 1000);
            }
            return;
          }
          // Additional validation: ensure participants array is not empty and has valid structure
          if (call.participants.length === 0) {
            console.warn('⚠️ [SIMPLE CALL] Invalid call data - participants array is empty:', call);
            return;
          }
          
          // Client-side filtering to find calls for this user
          const userParticipant = call.participants.find(p => p && p.userId === userId);
          const isCaller = call.callerId === userId;
          
          // Only notify if this is an incoming call (not outgoing) and status is ringing
          if (userParticipant && !isCaller && call.status === 'ringing') {
            console.log(`📞 [SIMPLE CALL] Incoming call for ${userId}: ${call.id}`);
            console.log(`📞 [SIMPLE CALL] Caller: ${call.callerName}`);
            console.log(`📞 [SIMPLE CALL] Call type: ${call.callType}`);
            
            // Mark as notified in both local and global sets
            notifiedCalls.add(call.id);
            SimpleFirebaseCallManager.globalNotifiedCalls.add(call.id);
            
            // Remove from global set after 5 minutes to allow re-notification if needed
            setTimeout(() => {
              SimpleFirebaseCallManager.globalNotifiedCalls.delete(call.id);
            }, 5 * 60 * 1000);
            
            callback(call);
          }
        }
      });
    }, (error) => {
      console.error('Error listening to incoming calls:', error);
    });
    
    this.callListeners.set(`incoming_${userId}`, unsubscribe);
    
    return () => {
      unsubscribe();
      this.callListeners.delete(`incoming_${userId}`);
    };
  }

  // Get active call
  async getCall(callId: string): Promise<SimpleFirebaseCall | null> {
    try {
      const callRef = doc(db!, 'calls', callId);
      const callSnap = await getDoc(callRef);
      
      if (callSnap.exists()) {
        const callData = callSnap.data();
        // CRITICAL: Validate call data structure before returning
        if (!callData || !callData.participants || !Array.isArray(callData.participants)) {
          console.warn('⚠️ [SIMPLE CALL] Invalid call data structure:', callData);
          return null;
        }
        return { id: callSnap.id, ...callData } as SimpleFirebaseCall;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting call:', error);
      return null;
    }
  }

  // Cleanup
  unsubscribe(callId: string) {
    const unsubscribe = this.callListeners.get(callId);
    if (unsubscribe) {
      unsubscribe();
      this.callListeners.delete(callId);
    }
  }

  // Cleanup all
  unsubscribeAll() {
    this.callListeners.forEach(unsubscribe => unsubscribe());
    this.callListeners.clear();
  }
}

export const simpleFirebaseCallManager = new SimpleFirebaseCallManager();
export default simpleFirebaseCallManager;

