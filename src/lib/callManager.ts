// Simple Call Manager Service
// Handles call notifications without Firebase complexity

export interface IncomingCall {
  id: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  roomId: string;
  timestamp: number;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
}

class CallManager {
  private callListeners: { [key: string]: () => void } = {};
  private onCallReceived?: (call: IncomingCall) => void;

  // Subscribe to incoming calls for a user (simplified)
  subscribeToIncomingCalls(userId: string, onCallReceived: (call: IncomingCall) => void) {
    this.onCallReceived = onCallReceived;
    
    // Simple mock implementation - in real app, this would connect to Firebase
    console.log(`📞 CallManager: Subscribed to calls for user ${userId}`);
    
    // Return a mock unsubscribe function
    const unsubscribe = () => {
      console.log(`📞 CallManager: Unsubscribed from calls for user ${userId}`);
    };

    this.callListeners[userId] = unsubscribe;
    return unsubscribe;
  }

  // Start a call (simplified)
  async startCall(callerId: string, callerName: string, callType: 'voice' | 'video', roomId: string) {
    try {
      const callId = `call_${Date.now()}_${callerId}`;
      console.log(`📞 CallManager: Started ${callType} call from ${callerName} to room ${roomId}`);
      
      // In a real app, this would create a Firebase document
      // For now, just return a mock call ID
      return callId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Accept a call (simplified)
  async acceptCall(callId: string) {
    try {
      console.log(`📞 CallManager: Call ${callId} accepted`);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  }

  // Decline a call (simplified)
  async declineCall(callId: string) {
    try {
      console.log(`📞 CallManager: Call ${callId} declined`);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  }

  // End a call (simplified)
  async endCall(callId: string) {
    try {
      console.log(`📞 CallManager: Call ${callId} ended`);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  // Cleanup
  unsubscribe(userId: string) {
    if (this.callListeners[userId]) {
      this.callListeners[userId]();
      delete this.callListeners[userId];
    }
  }

  // Cleanup all
  unsubscribeAll() {
    Object.values(this.callListeners).forEach(unsubscribe => unsubscribe());
    this.callListeners = {};
  }
}

export const callManager = new CallManager();
