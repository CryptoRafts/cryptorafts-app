// Firebase Call Manager - Real-time call management with Firebase
// Handles call state, notifications, and participant management

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

export interface CallParticipant {
  userId: string;
  userName: string;
  status: 'ringing' | 'connected' | 'disconnected';
  joinedAt?: Timestamp;
  leftAt?: Timestamp;
}

export interface FirebaseCall {
  id: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  participants: CallParticipant[];
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class FirebaseCallManager {
  private callListeners: Map<string, () => void> = new Map();

  // Start a new call
  async startCall(params: {
    roomId: string;
    callerId: string;
    callerName: string;
    callType: 'voice' | 'video';
    participants: string[];
  }): Promise<string> {
    try {
      const callId = `call_${Date.now()}_${params.callerId}`;
      
      const call: FirebaseCall = {
        id: callId,
        roomId: params.roomId,
        callerId: params.callerId,
        callerName: params.callerName,
        callType: params.callType,
        participants: params.participants.map(name => ({
          userId: `user_${name}`,
          userName: name,
          status: 'ringing'
        })),
        startTime: serverTimestamp() as Timestamp,
        status: 'ringing',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Save call to Firebase
      await setDoc(doc(db!, 'calls', callId), call);
      
      console.log(`📞 [FIREBASE CALL] Started ${params.callType} call: ${callId}`);
      console.log(`📞 [FIREBASE CALL] Participants: ${params.participants.join(', ')}`);
      
      return callId;
    } catch (error) {
      console.error('❌ Error starting Firebase call:', error);
      throw error;
    }
  }

  // Update call status
  async updateCallStatus(callId: string, status: FirebaseCall['status']) {
    try {
      const callRef = doc(db!, 'calls', callId);
      await updateDoc(callRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [FIREBASE CALL] Call ${callId} status updated: ${status}`);
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
      
      const call = callSnap.data() as FirebaseCall;
      const updatedParticipants = call.participants.map(p => 
        p.userId === userId 
          ? { ...p, status: 'connected' as const, joinedAt: serverTimestamp() as Timestamp }
          : p
      );
      
      await updateDoc(callRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [FIREBASE CALL] User ${userId} joined call ${callId}`);
    } catch (error) {
      console.error('❌ Error joining call:', error);
      throw error;
    }
  }

  // Participant leaves call
  async leaveCall(callId: string, userId: string) {
    try {
      const callRef = doc(db!, 'calls', callId);
      const callSnap = await getDoc(callRef);
      
      if (!callSnap.exists()) {
        throw new Error('Call not found');
      }
      
      const call = callSnap.data() as FirebaseCall;
      const updatedParticipants = call.participants.map(p => 
        p.userId === userId 
          ? { ...p, status: 'disconnected' as const, leftAt: serverTimestamp() as Timestamp }
          : p
      );
      
      await updateDoc(callRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [FIREBASE CALL] User ${userId} left call ${callId}`);
    } catch (error) {
      console.error('❌ Error leaving call:', error);
      throw error;
    }
  }

  // End call
  async endCall(callId: string) {
    try {
      const callRef = doc(db!, 'calls', callId);
      await updateDoc(callRef, {
        status: 'ended',
        endTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`📞 [FIREBASE CALL] Call ${callId} ended`);
      
      // Delete call after 1 minute
      setTimeout(async () => {
        try {
          await deleteDoc(callRef);
          console.log(`🗑️ [FIREBASE CALL] Call ${callId} deleted`);
        } catch (error) {
          console.error('Error deleting call:', error);
        }
      }, 60000);
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }

  // Subscribe to call updates
  subscribeToCall(callId: string, callback: (call: FirebaseCall | null) => void): () => void {
    const callRef = doc(db!, 'calls', callId);
    
    const unsubscribe = onSnapshot(callRef, (doc) => {
      if (doc.exists()) {
        const call = { id: doc.id, ...doc.data() } as FirebaseCall;
        callback(call);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to call:', error);
      callback(null);
    });
    
    this.callListeners.set(callId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.callListeners.delete(callId);
    };
  }

  // Subscribe to incoming calls for a user
  subscribeToIncomingCalls(userId: string, callback: (call: FirebaseCall) => void): () => void {
    console.log(`📞 [FIREBASE CALL] Setting up incoming call listener for user: ${userId}`);
    
    // Listen to all calls and filter for incoming calls to this user
    const callsQuery = query(
      collection(db!, 'calls'),
      where('status', 'in', ['ringing', 'connecting'])
    );
    
    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const call = { id: change.doc.id, ...change.doc.data() } as FirebaseCall;
          
          // Check if user is being called (but not the caller)
          const userParticipant = call.participants.find(p => p.userId === userId);
          const isCaller = call.callerId === userId;
          
          if (userParticipant && !isCaller && call.status === 'ringing') {
            console.log(`📞 [FIREBASE CALL] Incoming call for ${userId}: ${call.id}`);
            console.log(`📞 [FIREBASE CALL] Caller: ${call.callerName}`);
            console.log(`📞 [FIREBASE CALL] Call type: ${call.callType}`);
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
  async getCall(callId: string): Promise<FirebaseCall | null> {
    try {
      const callRef = doc(db!, 'calls', callId);
      const callSnap = await getDoc(callRef);
      
      if (callSnap.exists()) {
        return { id: callSnap.id, ...callSnap.data() } as FirebaseCall;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting call:', error);
      return null;
    }
  }

  // Get active calls for a user
  async getActiveCallsForUser(userId: string): Promise<FirebaseCall[]> {
    try {
      const callsQuery = query(
        collection(db!, 'calls'),
        where('participants', 'array-contains', { userId, userName: '', status: 'connected' }),
        where('status', 'in', ['ringing', 'connecting', 'connected'])
      );
      
      // This would need to be implemented with a proper query
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting active calls:', error);
      return [];
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

export const firebaseCallManager = new FirebaseCallManager();
export default firebaseCallManager;
