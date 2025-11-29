// Live Calls System with 30-minute hard cap
import { vcAuthManager } from './vc-auth';

export interface CallSession {
  id: string;
  type: 'voice' | 'video';
  roomId: string;
  participants: string[];
  startTime: Date;
  endTime: Date | null;
  status: 'active' | 'ended' | 'paused';
  duration: number; // in seconds
  maxDuration: number; // 30 minutes = 1800 seconds
}

export interface CallParticipant {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

class LiveCallsManager {
  private activeCalls: Map<string, CallSession> = new Map();
  private callTimers: Map<string, NodeJS.Timeout> = new Map();
  private participants: Map<string, CallParticipant[]> = new Map();

  // Start a new call
  async startCall(
    roomId: string, 
    type: 'voice' | 'video', 
    participants: string[]
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      // Check if call already exists for this room
      const existingCall = Array.from(this.activeCalls.values())
        .find(call => call.roomId === roomId && call.status === 'active');
      
      if (existingCall) {
        return {
          success: true,
          callId: existingCall.id,
          error: 'Call already active for this room'
        };
      }

      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const callSession: CallSession = {
        id: callId,
        type,
        roomId,
        participants,
        startTime: new Date(),
        endTime: null,
        status: 'active',
        duration: 0,
        maxDuration: 1800 // 30 minutes
      };

      this.activeCalls.set(callId, callSession);
      this.participants.set(callId, []);

      // Start the 30-minute timer
      this.startCallTimer(callId);

      // Initialize participants
      await this.initializeParticipants(callId, participants);

      return { success: true, callId };
    } catch (error) {
      console.error('Error starting call:', error);
      return { success: false, error: error.message };
    }
  }

  // Join an existing call
  async joinCall(callId: string, participantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const call = this.activeCalls.get(callId);
      if (!call) {
        return { success: false, error: 'Call not found' };
      }

      if (call.status !== 'active') {
        return { success: false, error: 'Call is not active' };
      }

      // Add participant to the call
      const participant = await this.getParticipantInfo(participantId);
      if (!participant) {
        return { success: false, error: 'Participant not found' };
      }

      const currentParticipants = this.participants.get(callId) || [];
      const existingParticipant = currentParticipants.find(p => p.id === participantId);
      
      if (!existingParticipant) {
        currentParticipants.push({
          ...participant,
          joinedAt: new Date(),
          isMuted: false,
          isVideoEnabled: call.type === 'video',
          connectionStatus: 'connected'
        });
        
        this.participants.set(callId, currentParticipants);
      }

      return { success: true };
    } catch (error) {
      console.error('Error joining call:', error);
      return { success: false, error: error.message };
    }
  }

  // End a call
  async endCall(callId: string, reason: 'manual' | 'timeout' | 'error' = 'manual'): Promise<{ success: boolean; error?: string }> {
    try {
      const call = this.activeCalls.get(callId);
      if (!call) {
        return { success: false, error: 'Call not found' };
      }

      // Clear timer
      const timer = this.callTimers.get(callId);
      if (timer) {
        clearInterval(timer);
        this.callTimers.delete(callId);
      }

      // Update call status
      call.status = 'ended';
      call.endTime = new Date();
      call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);

      // Log call end event
      await this.logCallEvent(callId, 'call_ended', {
        reason,
        duration: call.duration,
        participants: this.participants.get(callId)?.length || 0
      });

      // Clean up
      this.activeCalls.delete(callId);
      this.participants.delete(callId);

      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      return { success: false, error: error.message };
    }
  }

  // Get call status
  getCallStatus(callId: string): CallSession | null {
    return this.activeCalls.get(callId) || null;
  }

  // Get call participants
  getCallParticipants(callId: string): CallParticipant[] {
    return this.participants.get(callId) || [];
  }

  // Get remaining time for a call
  getRemainingTime(callId: string): number {
    const call = this.activeCalls.get(callId);
    if (!call) return 0;

    const elapsed = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
    return Math.max(0, call.maxDuration - elapsed);
  }

  // Format call time for display
  formatCallTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Private methods
  private startCallTimer(callId: string): void {
    const timer = setInterval(async () => {
      const call = this.activeCalls.get(callId);
      if (!call) {
        clearInterval(timer);
        return;
      }

      const elapsed = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
      call.duration = elapsed;

      // Check if time limit reached
      if (elapsed >= call.maxDuration) {
        await this.endCall(callId, 'timeout');
        
        // Post timeout message to chat
        await this.postCallTimeoutMessage(call.roomId);
      }
    }, 1000);

    this.callTimers.set(callId, timer);
  }

  private async initializeParticipants(callId: string, participantIds: string[]): Promise<void> {
    const participants: CallParticipant[] = [];
    
    for (const participantId of participantIds) {
      const participant = await this.getParticipantInfo(participantId);
      if (participant) {
        participants.push({
          ...participant,
          joinedAt: new Date(),
          isMuted: false,
          isVideoEnabled: false,
          connectionStatus: 'connecting'
        });
      }
    }

    this.participants.set(callId, participants);
  }

  private async getParticipantInfo(participantId: string): Promise<CallParticipant | null> {
    try {
      // Get user info from auth manager
      const userInfo = await vcAuthManager.getVCUser(participantId);
      if (!userInfo) {
        // Fallback: return basic info
        return {
          id: participantId,
          name: 'Unknown User',
          email: '',
          role: 'member',
          joinedAt: new Date(),
          isMuted: false,
          isVideoEnabled: false,
          connectionStatus: 'connected'
        };
      }

      // VCUser doesn't have name/email, use uid as fallback
      // Map VC role to CallParticipant role
      const callRole: 'owner' | 'admin' | 'member' = 'member';
      return {
        id: participantId,
        name: `User ${participantId.substring(0, 8)}`,
        email: '',
        role: callRole,
        joinedAt: new Date(),
        isMuted: false,
        isVideoEnabled: false,
        connectionStatus: 'connected'
      };
    } catch (error) {
      console.error('Error getting participant info:', error);
      return null;
    }
  }

  private async logCallEvent(callId: string, event: string, data: any): Promise<void> {
    try {
      // Log to audit system
      console.log('Call Event:', { callId, event, data, timestamp: new Date() });
      
      // In a real implementation, this would save to Firebase
      // await auditLogger.log('call_event', { callId, event, data });
    } catch (error) {
      console.error('Error logging call event:', error);
    }
  }

  private async postCallTimeoutMessage(roomId: string): Promise<void> {
    try {
      // Post timeout message to chat
      const messageData = {
        content: 'Call ended automatically at 30:00 (limit reached).',
        type: 'system',
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date()
      };

      // In a real implementation, this would save to Firebase
      console.log('Posting call timeout message:', { roomId, messageData });
    } catch (error) {
      console.error('Error posting call timeout message:', error);
    }
  }

  // Get all active calls for a room
  getActiveCallsForRoom(roomId: string): CallSession[] {
    return Array.from(this.activeCalls.values())
      .filter(call => call.roomId === roomId && call.status === 'active');
  }

  // Check if user is in an active call
  isUserInCall(userId: string): CallSession | null {
    for (const call of this.activeCalls.values()) {
      if (call.participants.includes(userId) && call.status === 'active') {
        return call;
      }
    }
    return null;
  }
}

// Export singleton instance
export const liveCallsManager = new LiveCallsManager();

