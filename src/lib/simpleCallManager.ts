// Simple Call Manager - Works without Firebase complexity
// Handles call state in memory for real-time communication

export interface CallParticipant {
  userId: string;
  userName: string;
  status: 'ringing' | 'connected' | 'disconnected';
  joinedAt?: number;
}

export interface ActiveCall {
  id: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  participants: CallParticipant[];
  startTime: number;
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
}

class SimpleCallManager {
  private activeCalls: Map<string, ActiveCall> = new Map();
  private callCallbacks: Map<string, (call: ActiveCall) => void> = new Map();

  // Start a new call
  startCall(params: {
    roomId: string;
    callerId: string;
    callerName: string;
    callType: 'voice' | 'video';
    participants: string[];
  }): string {
    const callId = `call_${Date.now()}_${params.callerId}`;
    
    const call: ActiveCall = {
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
      startTime: Date.now(),
      status: 'ringing'
    };

    this.activeCalls.set(callId, call);
    
    console.log(`📞 [CALL MANAGER] Started ${params.callType} call`);
    console.log(`📞 [CALL MANAGER] Call ID: ${callId}`);
    console.log(`📞 [CALL MANAGER] Participants: ${params.participants.join(', ')}`);
    
    // Notify all subscribers about the new call
    this.notifyCallUpdate(callId);
    
    return callId;
  }

  // Update call status
  updateCallStatus(callId: string, status: ActiveCall['status']) {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = status;
      console.log(`📞 [CALL MANAGER] Call ${callId} status: ${status}`);
      this.notifyCallUpdate(callId);
    }
  }

  // Participant accepts call
  acceptCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    if (call) {
      const participant = call.participants.find(p => p.userId === userId);
      if (participant) {
        participant.status = 'connected';
        participant.joinedAt = Date.now();
        console.log(`📞 [CALL MANAGER] ${participant.userName} accepted call`);
        this.notifyCallUpdate(callId);
      }
    }
  }

  // End call
  endCall(callId: string) {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'ended';
      console.log(`📞 [CALL MANAGER] Call ${callId} ended`);
      this.notifyCallUpdate(callId);
      
      // Remove call after 5 seconds
      setTimeout(() => {
        this.activeCalls.delete(callId);
        this.callCallbacks.delete(callId);
      }, 5000);
    }
  }

  // Get active call
  getCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  // Subscribe to call updates
  subscribeToCall(callId: string, callback: (call: ActiveCall) => void): () => void {
    this.callCallbacks.set(callId, callback);
    
    // Immediately call with current state if call exists
    const call = this.activeCalls.get(callId);
    if (call) {
      callback(call);
    }
    
    // Return unsubscribe function
    return () => {
      this.callCallbacks.delete(callId);
    };
  }

  // Notify all subscribers of a call update
  private notifyCallUpdate(callId: string) {
    const call = this.activeCalls.get(callId);
    const callback = this.callCallbacks.get(callId);
    
    if (call && callback) {
      callback(call);
    }
  }

  // Get all active calls
  getActiveCalls(): ActiveCall[] {
    return Array.from(this.activeCalls.values());
  }

  // Check if user has active calls
  hasActiveCalls(userId: string): boolean {
    return Array.from(this.activeCalls.values()).some(
      call => call.callerId === userId || call.participants.some(p => p.userId === userId)
    );
  }
}

export const simpleCallManager = new SimpleCallManager();
