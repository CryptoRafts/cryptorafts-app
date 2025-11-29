import { db } from '@/lib/firebase.client';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc
} from 'firebase/firestore';

export interface DealRoomMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: Date;
  permissions: {
    canInvite: boolean;
    canRemove: boolean;
    canRename: boolean;
    canManageFiles: boolean;
    canStartCalls: boolean;
    canCreateNotePoints: boolean;
    canModerate: boolean;
  };
  notificationSettings: {
    mute: boolean;
    mentionsOnly: boolean;
    allMessages: boolean;
  };
}

export interface DealRoomMessage {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'call_start' | 'call_end' | 'summary' | 'system';
  senderId: string;
  senderName: string;
  timestamp: Date;
  replyTo?: string;
  reactions: { [userId: string]: string };
  pinned: boolean;
  edited?: boolean;
  editedAt?: Date;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  metadata?: {
    callDuration?: number;
    callType?: 'voice' | 'video';
    summaryType?: 'call' | 'daily' | 'weekly';
  };
}

export interface NotePoint {
  id: string;
  content: string;
  type: 'decision' | 'action' | 'risk' | 'question' | 'milestone';
  status: 'open' | 'in_progress' | 'done';
  assignedTo?: string;
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  source?: {
    type: 'chat' | 'call' | 'manual';
    reference?: string;
  };
  tags: string[];
  followers: string[];
}

export interface DealRoom {
  id: string;
  name: string;
  projectId: string;
  founderId: string;
  founderName: string;
  founderLogo?: string;
  vcId: string;
  vcName: string;
  vcLogo?: string;
  members: DealRoomMember[];
  messages: DealRoomMessage[];
  notePoints: NotePoint[];
  milestones?: any[];
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  status: 'active' | 'archived';
  settings: {
    allowFileUploads: boolean;
    allowCalls: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  auditLog: {
    id: string;
    action: string;
    actor: string;
    target?: string;
    timestamp: Date;
    metadata: any;
  }[];
}

export interface CallSession {
  id: string;
  roomId: string;
  type: 'voice' | 'video';
  participants: string[];
  startTime: Date;
  endTime?: Date;
  duration: number;
  maxDuration: number; // 30 minutes in seconds
  status: 'active' | 'ended' | 'cancelled';
  summary?: string;
}

class DealRoomManager {
  private static instance: DealRoomManager;
  private activeCalls: Map<string, CallSession> = new Map();
  private callTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DealRoomManager {
    if (!DealRoomManager.instance) {
      DealRoomManager.instance = new DealRoomManager();
    }
    return DealRoomManager.instance;
  }

  // Create a new deal room
  async createDealRoom(
    projectId: string,
    founderId: string,
    founderName: string,
    vcId: string,
    vcName: string,
    founderLogo?: string,
    vcLogo?: string
  ): Promise<{ success: boolean; dealRoomId?: string; error?: string }> {
    try {
      // Check if deal room already exists for this project + VC pair
      const existingRoom = await this.getExistingDealRoom(projectId, vcId);
      if (existingRoom) {
        return {
          success: true,
          dealRoomId: existingRoom.id,
          error: 'Deal room already exists, returning existing room'
        };
      }

      const dealRoomData = {
        name: `${founderName.toUpperCase()} / ${vcName.toUpperCase()}`,
        projectId,
        founderId,
        founderName,
        founderLogo,
        vcId,
        vcName,
        vcLogo,
        // Privacy Settings
        privacy: {
          type: 'private',
          isPrivate: true,
          allowedUsers: [founderId, vcId], // Main founder and VC can always access
          canInviteFounderTeam: true, // Founder can add their team members
          canInviteVCTeam: true, // VC can add their team members
          requireApproval: false // No approval needed for team members
        },
        // Team Management
        teamSettings: {
          founderCanAddTeam: true,
          vcCanAddTeam: true,
          maxTeamMembers: 10, // Limit team size
          allowedRoles: ['member', 'admin'], // Roles team members can have
          requireEmailVerification: true // Team members need verified emails
        },
        members: [
          {
            id: founderId,
            name: founderName,
            email: '', // Will be filled from user data
            role: 'owner' as const,
            avatar: founderLogo,
            joinedAt: new Date(),
            teamType: 'founder', // Identifies this as a founder
            permissions: {
              canInvite: true, // Founder can invite their team
              canRemove: true, // Can remove team members
              canRename: true,
              canManageFiles: true,
              canStartCalls: true,
              canCreateNotePoints: true,
              canModerate: true,
              canInviteTeam: true, // Can invite founder team members
              canInviteVCTeam: false, // Cannot invite VC team members
            },
            notificationSettings: {
              mute: false,
              mentionsOnly: false,
              allMessages: true,
            }
          },
          {
            id: vcId,
            name: vcName,
            email: '', // Will be filled from user data
            role: 'owner' as const,
            avatar: vcLogo,
            joinedAt: new Date(),
            teamType: 'vc', // Identifies this as a VC
            permissions: {
              canInvite: true, // VC can invite their team
              canRemove: true, // Can remove team members
              canRename: true,
              canManageFiles: true,
              canStartCalls: true,
              canCreateNotePoints: true,
              canModerate: true,
              canInviteTeam: true, // Can invite VC team members
              canInviteFounderTeam: false, // Cannot invite founder team members
            },
            notificationSettings: {
              mute: false,
              mentionsOnly: false,
              allMessages: true,
            }
          },
          {
            id: 'raftai-bot',
            name: 'RaftAI',
            email: 'raftai@cryptorafts.com',
            role: 'admin' as const,
            avatar: '/raftai-logo.png',
            joinedAt: new Date(),
            permissions: {
              canInvite: false,
              canRemove: false,
              canRename: false,
              canManageFiles: false,
              canStartCalls: false,
              canCreateNotePoints: true,
              canModerate: true,
            },
            notificationSettings: {
              mute: true,
              mentionsOnly: false,
              allMessages: false,
            }
          }
        ],
        messages: [],
        notePoints: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        status: 'active' as const,
        settings: {
          allowFileUploads: true,
          allowCalls: true,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
        },
        auditLog: [
          {
            id: `audit-${Date.now()}`,
            action: 'room_created',
            actor: vcId,
            target: projectId,
            timestamp: new Date(),
            metadata: { founderId, founderName, vcName }
          }
        ]
      };

      const docRef = await addDoc(collection(db!, 'dealRooms'), dealRoomData);
      
      // Add system message
      await this.addMessage(docRef.id, {
        content: `RaftAI created this deal room for ${founderName.toUpperCase()} / ${vcName.toUpperCase()}.`,
        type: 'system',
        senderId: 'raftai-bot',
        senderName: 'RaftAI'
      });

      return { success: true, dealRoomId: docRef.id };
    } catch (error) {
      console.error('Error creating deal room:', error);
      return { success: false, error: error.message };
    }
  }

  // Get existing deal room for project + VC pair
  private async getExistingDealRoom(projectId: string, vcId: string): Promise<DealRoom | null> {
    try {
      const q = query(
        collection(db!, 'dealRooms'),
        where('projectId', '==', projectId),
        where('vcId', '==', vcId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as DealRoom;
      }
      return null;
    } catch (error) {
      console.error('Error checking existing deal room:', error);
      return null;
    }
  }

  // Get deal room by ID
  async getDealRoom(roomId: string): Promise<{ success: boolean; dealRoom?: DealRoom; error?: string }> {
    try {
      const docRef = doc(db!, 'dealRooms', roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const dealRoom = { id: docSnap.id, ...docSnap.data() } as DealRoom;
        return { success: true, dealRoom };
      } else {
        return { success: false, error: 'Deal room not found' };
      }
    } catch (error) {
      console.error('Error getting deal room:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user can access deal room (privacy check)
  async canUserAccessDealRoom(roomId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const roomRef = doc(db!, 'dealRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return { success: false, error: 'Deal room not found' };
      }
      
      const roomData = roomDoc.data();
      
      // Check if user is the main founder or VC (primary users)
      if (roomData.founderId === userId || roomData.vcId === userId) {
        return { success: true };
      }
      
      // Check if user is in allowed users list (backup check)
      if (roomData.privacy?.allowedUsers?.includes(userId)) {
        return { success: true };
      }
      
      // Check if user is a member of the room (team member)
      const member = roomData.members?.find((m: any) => m.id === userId);
      if (member) {
        return { success: true };
      }
      
      // For demo purposes, allow access if no strict privacy is set
      if (!roomData.privacy || !roomData.privacy.isPrivate) {
        return { success: true };
      }
      
      return { success: false, error: 'Access denied. You are not authorized to view this private chat room.' };
    } catch (error) {
      console.error('Error checking deal room access:', error);
      return { success: false, error: 'Failed to verify access permissions' };
    }
  }

  // Generate invitation code
  private generateInvitationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Add team member with invitation system
  async addTeamMember(
    roomId: string, 
    inviterId: string, 
    newMemberEmail: string, 
    newMemberRole: 'member' | 'admin' = 'member'
  ): Promise<{ success: boolean; error?: string; invitationCode?: string; invitation?: any; member?: any }> {
    try {
      const roomRef = doc(db!, 'dealRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return { success: false, error: 'Deal room not found' };
      }
      
      const roomData = roomDoc.data();
      
      // Check if inviter has permission to invite
      const inviter = roomData.members?.find((m: any) => m.id === inviterId);
      if (!inviter || !inviter.permissions?.canInviteTeam) {
        return { success: false, error: 'You do not have permission to invite team members' };
      }
      
      // Check if room has reached max team members
      const currentTeamMembers = roomData.members?.filter((m: any) => m.teamType && m.teamType === inviter.teamType) || [];
      if (currentTeamMembers.length >= roomData.teamSettings?.maxTeamMembers) {
        return { success: false, error: `Maximum team members reached (${roomData.teamSettings.maxTeamMembers})` };
      }
      
      // Generate invitation code
      const invitationCode = this.generateInvitationCode();
      
      // Create pending invitation
      const invitation = {
        id: `invitation-${Date.now()}`,
        email: newMemberEmail.trim(),
        inviterId: inviterId,
        inviterName: inviter.name,
        roomId: roomId,
        roomName: roomData.name,
        invitationCode: invitationCode,
        role: newMemberRole,
        teamType: inviter.teamType,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        permissions: {
          canInvite: false,
          canRemove: false,
          canRename: false,
          canManageFiles: true,
          canStartCalls: true,
          canCreateNotePoints: true,
          canModerate: newMemberRole === 'admin',
          canInviteTeam: false,
          canInviteFounderTeam: false,
          canInviteVCTeam: false,
        }
      };
      
      // Store invitation in Firestore
      const invitationRef = doc(collection(db!, 'teamInvitations'));
      await setDoc(invitationRef, invitation);
      
      // Add to room pending invitations
      await updateDoc(roomRef, {
        pendingInvitations: arrayUnion(invitation),
        updatedAt: serverTimestamp()
      });
      
      // Add system message
      await this.addMessage(roomId, {
        content: `${inviter.name} sent an invitation to ${newMemberEmail.trim()}. Invitation code: ${invitationCode}`,
        type: 'system',
        senderId: 'system',
        senderName: 'System'
      });
      
      return { 
        success: true, 
        invitationCode: invitationCode,
        invitation: invitation
      };
    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  }

  // Accept invitation and join team
  async acceptTeamInvitation(
    invitationCode: string,
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; error?: string; dealRoomId?: string }> {
    try {
      // Find invitation by code
      const invitationsRef = collection(db!, 'teamInvitations');
      const q = query(
        invitationsRef,
        where('invitationCode', '==', invitationCode),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Invalid or expired invitation code' };
      }
      
      const invitationDoc = querySnapshot.docs[0];
      const invitation = invitationDoc.data();
      
      // Check if invitation is expired
      if (new Date() > invitation.expiresAt.toDate()) {
        return { success: false, error: 'Invitation has expired' };
      }
      
      // Check if email matches
      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        return { success: false, error: 'This invitation is for a different email address' };
      }
      
      // Get deal room
      const roomRef = doc(db!, 'dealRooms', invitation.roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return { success: false, error: 'Deal room not found' };
      }
      
      const roomData = roomDoc.data();
      
      // Create team member
      const newMember = {
        id: userId,
        name: userName,
        email: userEmail,
        role: invitation.role,
        teamType: invitation.teamType,
        avatar: null,
        joinedAt: new Date(),
        permissions: invitation.permissions,
        notificationSettings: {
          mute: false,
          mentionsOnly: false,
          allMessages: true,
        }
      };
      
      // Add to room members
      await updateDoc(roomRef, {
        members: arrayUnion(newMember),
        updatedAt: serverTimestamp()
      });
      
      // Update invitation status
      await updateDoc(doc(db!, 'teamInvitations', invitationDoc.id), {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: userId
      });
      
      // Remove from pending invitations
      await updateDoc(roomRef, {
        pendingInvitations: arrayRemove(invitation),
        updatedAt: serverTimestamp()
      });
      
      // Add system message
      await this.addMessage(invitation.roomId, {
        content: `${userName} joined the team using invitation code`,
        type: 'system',
        senderId: 'system',
        senderName: 'System'
      });
      
      return { 
        success: true, 
        dealRoomId: invitation.roomId
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  // Add message to deal room
  async addMessage(
    roomId: string, 
    messageData: Omit<DealRoomMessage, 'id' | 'timestamp' | 'reactions' | 'pinned'>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = {
        ...messageData,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        reactions: {},
        pinned: false
      };

      const roomRef = doc(db!, 'dealRooms', roomId);
      await updateDoc(roomRef, {
        messages: arrayUnion(message),
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add to audit log
      await this.addAuditLog(roomId, {
        action: 'message_sent',
        actor: message.senderId,
        target: message.id,
        timestamp: new Date(),
        metadata: { type: message.type, contentLength: message.content.length }
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('Error adding message:', error);
      return { success: false, error: error.message };
    }
  }

  // Add audit log entry
  private async addAuditLog(roomId: string, logEntry: Omit<DealRoom['auditLog'][0], 'id'>): Promise<void> {
    try {
      const roomRef = doc(db!, 'dealRooms', roomId);
      await updateDoc(roomRef, {
        auditLog: arrayUnion({
          ...logEntry,
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
      });
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  }

  // Add member to deal room
  async addMember(
    roomId: string,
    member: Omit<DealRoomMember, 'joinedAt' | 'permissions' | 'notificationSettings'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const newMember: DealRoomMember = {
        ...member,
        joinedAt: new Date(),
        permissions: {
          canInvite: false,
          canRemove: false,
          canRename: false,
          canManageFiles: true,
          canStartCalls: true,
          canCreateNotePoints: true,
          canModerate: false,
        },
        notificationSettings: {
          mute: false,
          mentionsOnly: false,
          allMessages: true,
        }
      };

      const roomRef = doc(db!, 'dealRooms', roomId);
      await updateDoc(roomRef, {
        members: arrayUnion(newMember),
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add system message
      await this.addMessage(roomId, {
        content: `${member.name} joined the deal room.`,
        type: 'system',
        senderId: 'raftai-bot',
        senderName: 'RaftAI'
      });

      // Add to audit log
      await this.addAuditLog(roomId, {
        action: 'member_added',
        actor: 'system',
        target: member.id,
        timestamp: new Date(),
        metadata: { memberName: member.name, memberEmail: member.email }
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding member:', error);
      return { success: false, error: error.message };
    }
  }

  // Create deal room if it doesn't exist
  async createDealRoomIfNotExists(roomId: string, dealRoomData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const roomRef = doc(db!, 'dealRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        await setDoc(roomRef, {
          ...dealRoomData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActivity: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creating deal room if not exists:', error);
      return { success: false, error: error.message };
    }
  }

  // Rename room
  async renameRoom(roomId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!db) {
        return { success: false, error: 'Database not available' };
      }
      const roomRef = doc(db!, 'dealRooms', roomId);
      await updateDoc(roomRef, {
        name: newName,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error renaming room:', error);
      return { success: false, error: error.message };
    }
  }

  // Start a call session
  async startCall(
    roomId: string,
    type: 'voice' | 'video',
    participants: string[]
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      if (this.activeCalls.has(roomId)) {
        return { success: false, error: 'Call already active in this room' };
      }

      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const callSession: CallSession = {
        id: callId,
        roomId,
        type,
        participants,
        startTime: new Date(),
        duration: 0,
        maxDuration: 30 * 60, // 30 minutes in seconds
        status: 'active'
      };

      this.activeCalls.set(roomId, callSession);

      // Start countdown timer
      const timer = setInterval(() => {
        this.updateCallTimer(roomId);
      }, 1000);
      this.callTimers.set(roomId, timer);

      // Add call start message
      await this.addMessage(roomId, {
        content: `${type === 'voice' ? 'Voice' : 'Video'} call started with ${participants.length} participants.`,
        type: 'call_start',
        senderId: 'system',
        senderName: 'System',
        metadata: {
          callDuration: 0,
          callType: type
        }
      });

      // Add to audit log
      await this.addAuditLog(roomId, {
        action: 'call_started',
        actor: participants[0], // First participant is the caller
        target: callId,
        timestamp: new Date(),
        metadata: { type, participants: participants.length }
      });

      return { success: true, callId };
    } catch (error) {
      console.error('Error starting call:', error);
      return { success: false, error: error.message };
    }
  }

  // Update call timer
  private async updateCallTimer(roomId: string): Promise<void> {
    const call = this.activeCalls.get(roomId);
    if (!call) return;

    call.duration++;

    // Check for warnings
    const remaining = call.maxDuration - call.duration;
    if (remaining === 5 * 60) { // 5 minutes warning
      await this.addMessage(roomId, {
        content: '⚠️ 5 minutes remaining in call.',
        type: 'system',
        senderId: 'system',
        senderName: 'System'
      });
    } else if (remaining === 60) { // 1 minute warning
      await this.addMessage(roomId, {
        content: '⚠️ 1 minute remaining in call.',
        type: 'system',
        senderId: 'system',
        senderName: 'System'
      });
    } else if (remaining <= 0) { // Time up
      await this.endCall(roomId, 'time_limit');
    }
  }

  // End call session
  async endCall(roomId: string, reason: 'manual' | 'time_limit' | 'error'): Promise<{ success: boolean; error?: string }> {
    try {
      const call = this.activeCalls.get(roomId);
      if (!call) {
        return { success: false, error: 'No active call found' };
      }

      call.status = 'ended';
      call.endTime = new Date();

      // Clear timer
      const timer = this.callTimers.get(roomId);
      if (timer) {
        clearInterval(timer);
        this.callTimers.delete(roomId);
      }

      // Add call end message
      const endReason = reason === 'time_limit' ? 'Call ended automatically at 30:00 (limit reached).' : 'Call ended.';
      await this.addMessage(roomId, {
        content: endReason,
        type: 'call_end',
        senderId: 'system',
        senderName: 'System',
        metadata: {
          callDuration: call.duration,
          callType: call.type
        }
      });

      // Generate AI summary
      await this.generateCallSummary(roomId, call);

      // Remove from active calls
      this.activeCalls.delete(roomId);

      // Add to audit log
      await this.addAuditLog(roomId, {
        action: 'call_ended',
        actor: 'system',
        target: call.id,
        timestamp: new Date(),
        metadata: { reason, duration: call.duration, type: call.type }
      });

      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate AI call summary
  private async generateCallSummary(roomId: string, call: CallSession): Promise<void> {
    try {
      // Simulate AI processing delay
      setTimeout(async () => {
        const summary = `Call Summary (${Math.floor(call.duration / 60)}m ${call.duration % 60}s):
• Participants: ${call.participants.length}
• Duration: ${Math.floor(call.duration / 60)} minutes ${call.duration % 60} seconds
• Type: ${call.type === 'voice' ? 'Voice' : 'Video'} call
• Key discussion points and action items will be extracted and added to Note Points.

RaftAI posted a summary to Note Points.`;

        await this.addMessage(roomId, {
          content: summary,
          type: 'summary',
          senderId: 'raftai-bot',
          senderName: 'RaftAI',
          metadata: {
            summaryType: 'call'
          }
        });

        // Add note points based on call
        await this.addNotePoint(roomId, {
          content: `Review call recording and extract key decisions`,
          type: 'action',
          status: 'open',
          createdBy: 'raftai-bot',
          source: {
            type: 'call',
            reference: call.id
          },
          tags: ['call', 'review'],
          followers: []
        });
      }, 2000);
    } catch (error) {
      console.error('Error generating call summary:', error);
    }
  }

  // Add note point
  async addNotePoint(
    roomId: string,
    noteData: Omit<NotePoint, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; noteId?: string; error?: string }> {
    try {
      const note: NotePoint = {
        ...noteData,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const roomRef = doc(db!, 'dealRooms', roomId);
      await updateDoc(roomRef, {
        notePoints: arrayUnion(note),
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, noteId: note.id };
    } catch (error) {
      console.error('Error adding note point:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active call for room
  getActiveCall(roomId: string): CallSession | null {
    return this.activeCalls.get(roomId) || null;
  }

  // Get remaining call time
  getRemainingCallTime(roomId: string): number {
    const call = this.activeCalls.get(roomId);
    if (!call) return 0;
    return Math.max(0, call.maxDuration - call.duration);
  }

  // Subscribe to deal room updates
  subscribeToDealRoom(roomId: string, callback: (dealRoom: DealRoom) => void): () => void {
    const roomRef = doc(db!, 'dealRooms', roomId);
    
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const dealRoom = { id: doc.id, ...doc.data() } as DealRoom;
        callback(dealRoom);
      }
    });
  }

  // Get deal rooms for user
  async getUserDealRooms(userId: string): Promise<{ success: boolean; rooms?: DealRoom[]; error?: string }> {
    try {
      const q = query(
        collection(db!, 'dealRooms'),
        where('members', 'array-contains-any', [{ id: userId }]),
        where('status', '==', 'active'),
        orderBy('lastActivity', 'desc')
      );

      const snapshot = await getDocs(q);
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DealRoom));

      return { success: true, rooms };
    } catch (error) {
      console.error('Error getting user deal rooms:', error);
      return { success: false, error: error.message };
    }
  }
}

export const dealRoomManager = DealRoomManager.getInstance();
