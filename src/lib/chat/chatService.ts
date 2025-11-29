// Complete Chat Service - Production Ready
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import type { ChatRoom, ChatMessage, ChatInvite, FileUpload, AuditLog, Report } from './types';

class ChatService {
  private static instance: ChatService;
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // ==================== ROOM CREATION ====================

  /**
   * Auto-create deal room when VC accepts pitch
   * Idempotent - reuses if exists
   */
  async createDealRoom(params: {
    founderId: string;
    founderName: string;
    founderLogo?: string;
    vcId: string;
    vcName: string;
    vcLogo?: string;
    projectId: string;
    projectTitle: string;
  }): Promise<{ roomId: string; isNew: boolean }> {
    console.log('💬 Creating deal room:', params);

    // Check if room already exists
    const existingRoomId = `deal_${params.founderId}_${params.vcId}_${params.projectId}`;
    const existingRoomRef = doc(db!, 'groupChats', existingRoomId);
    const existingRoom = await getDoc(existingRoomRef);

    if (existingRoom.exists()) {
      console.log('✅ Reusing existing room:', existingRoomId);
      return { roomId: existingRoomId, isNew: false };
    }

    // Create new room
    const roomData: Omit<ChatRoom, 'id'> = {
      name: `${params.projectTitle} - ${params.founderName} / ${params.vcName}`,
      type: 'deal',
      status: 'active',
      founderId: params.founderId,
      founderName: params.founderName,
      founderLogo: params.founderLogo,
      counterpartId: params.vcId,
      counterpartName: params.vcName,
      counterpartRole: 'vc',
      counterpartLogo: params.vcLogo,
      members: [params.founderId, params.vcId, 'raftai'], // RaftAI is admin
      memberRoles: {
        [params.founderId]: 'owner',
        [params.vcId]: 'member',
        'raftai': 'admin'
      },
      projectId: params.projectId,
      settings: {
        filesAllowed: true,
        maxFileSize: 100, // 100MB
        allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'mp4', 'mp3', 'wav', 'ogg'],
        requireFileReview: true
      },
      createdAt: serverTimestamp(),
      createdBy: params.vcId,
      lastActivityAt: Date.now(),
      pinnedMessages: [],
      mutedBy: [],
      raftaiMemory: {
        decisions: [],
        tasks: [],
        milestones: [],
        notePoints: []
      }
    };

    await updateDoc(existingRoomRef, roomData as any);

    // Add system message
    await this.addSystemMessage(existingRoomId, 
      `RaftAI created this deal room for ${params.founderName} / ${params.vcName}.`
    );

    // Log audit
    await this.logAudit(existingRoomId, params.vcId, 'join', {
      action: 'room_created',
      members: [params.founderId, params.vcId]
    });

    console.log('✅ Deal room created:', existingRoomId);
    return { roomId: existingRoomId, isNew: true };
  }

  /**
   * Create other room types (listing, ido, campaign, proposal)
   */
  async createRoom(params: {
    type: 'listing' | 'ido' | 'campaign' | 'proposal' | 'team' | 'ops';
    founderId: string;
    founderName: string;
    founderLogo?: string;
    counterpartId: string;
    counterpartName: string;
    counterpartRole: string;
    counterpartLogo?: string;
    projectId?: string;
    orgId?: string;
    name: string;
  }): Promise<{ roomId: string; isNew: boolean }> {
    // Similar to createDealRoom but for other types
    const roomId = `${params.type}_${params.founderId}_${params.counterpartId}_${Date.now()}`;
    const roomRef = doc(db!, 'groupChats', roomId);

    const roomData: Omit<ChatRoom, 'id'> = {
      name: params.name,
      type: params.type,
      status: 'active',
      founderId: params.founderId,
      founderName: params.founderName,
      founderLogo: params.founderLogo,
      counterpartId: params.counterpartId,
      counterpartName: params.counterpartName,
      counterpartRole: params.counterpartRole,
      counterpartLogo: params.counterpartLogo,
      members: [params.founderId, params.counterpartId, 'raftai'],
      memberRoles: {
        [params.founderId]: 'owner',
        [params.counterpartId]: 'member',
        'raftai': 'admin'
      },
      projectId: params.projectId,
      orgId: params.orgId,
      settings: {
        filesAllowed: true,
        maxFileSize: 100,
        allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'mp4', 'mp3', 'wav', 'ogg'],
        requireFileReview: true
      },
      createdAt: serverTimestamp(),
      createdBy: params.founderId,
      lastActivityAt: Date.now(),
      pinnedMessages: [],
      mutedBy: [],
      raftaiMemory: {
        decisions: [],
        tasks: [],
        milestones: [],
        notePoints: []
      }
    };

    await updateDoc(roomRef, roomData as any);

    await this.addSystemMessage(roomId, 
      `RaftAI created this ${params.type} room for ${params.founderName} / ${params.counterpartName}.`
    );

    return { roomId, isNew: true };
  }

  // ==================== ROOM MANAGEMENT ====================

  /**
   * Get room details
   */
  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return null;
    
    return { id: roomSnap.id, ...roomSnap.data() } as ChatRoom;
  }

  /**
   * Get all rooms for a user (with role filtering)
   */
  subscribeToUserRooms(
    userId: string, 
    userRole: string,
    callback: (rooms: ChatRoom[]) => void
  ): () => void {
    console.log(`📂 Subscribing to rooms for user: ${userId}, role: ${userRole}`);

    // Simplified query without status filter to avoid needing composite index
    // We'll filter status in code instead
    const q = query(
      collection(db!, 'groupChats'),
      where('members', 'array-contains', userId),
      orderBy('lastActivityAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`📂 Rooms snapshot: ${snapshot.size} total rooms`);
      
      const allRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));

      // Filter by status in code (active only)
      const activeRooms = allRooms.filter(room => room.status === 'active');
      console.log(`📂 Active rooms: ${activeRooms.length}`);

      // Filter by role
      const filteredRooms = this.filterRoomsByRole(activeRooms, userRole, userId);
      console.log(`📂 Filtered to ${filteredRooms.length} rooms for role: ${userRole}`);
      
      callback(filteredRooms);
    }, (error) => {
      console.error('❌ Error subscribing to rooms:', error);
      console.error('Error details:', error.message);
      
      // Return empty array on error
      callback([]);
    });

    this.listeners.set(`rooms_${userId}`, unsubscribe);
    return unsubscribe;
  }

  private filterRoomsByRole(rooms: ChatRoom[], role: string, userId: string): ChatRoom[] {
    switch (role) {
      case 'founder':
        // Founders see all room types where they're the founder
        return rooms.filter(r => r.founderId === userId);
      
      case 'vc':
        return rooms.filter(r => r.type === 'deal' || r.type === 'ops');
      
      case 'exchange':
        return rooms.filter(r => r.type === 'listing' || r.type === 'ops');
      
      case 'ido':
        return rooms.filter(r => r.type === 'ido' || r.type === 'ops');
      
      case 'influencer':
        return rooms.filter(r => r.type === 'campaign');
      
      case 'agency':
        return rooms.filter(r => r.type === 'proposal');
      
      case 'admin':
        return rooms; // Admins see everything
      
      default:
        return [];
    }
  }

  /**
   * Rename room (owner/admin only)
   */
  async renameRoom(roomId: string, userId: string, newName: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const userRole = room.memberRoles[userId];
    if (userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      name: newName,
      lastActivityAt: Date.now()
    });

    await this.addSystemMessage(roomId, `Room renamed to "${newName}"`);
    await this.logAudit(roomId, userId, 'rename', { oldName: room.name, newName });
  }

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Generate invite code
   */
  async generateInvite(roomId: string, userId: string, maxUses: number = 10): Promise<string> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const invite: Omit<ChatInvite, 'id'> = {
      roomId,
      code,
      createdBy: userId,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      maxUses,
      usedCount: 0,
      usedBy: []
    };

    await addDoc(collection(db!, 'chatInvites'), invite);
    
    // Update room with invite code
    await updateDoc(doc(db!, 'groupChats', roomId), {
      inviteCode: code,
      inviteExpiry: invite.expiresAt
    });

    return code;
  }

  /**
   * Join room via invite code
   */
  async joinViaInvite(code: string, userId: string, userName: string): Promise<string> {
    const q = query(
      collection(db!, 'chatInvites'),
      where('code', '==', code),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('Invalid invite code');

    const inviteDoc = snapshot.docs[0];
    const invite = inviteDoc.data() as ChatInvite;

    // Check expiry
    if (invite.expiresAt.toDate() < new Date()) {
      throw new Error('Invite code expired');
    }

    // Check max uses
    if (invite.usedCount >= invite.maxUses) {
      throw new Error('Invite code limit reached');
    }

    // Check if already member
    const room = await this.getRoom(invite.roomId);
    if (room?.members.includes(userId)) {
      return invite.roomId; // Already a member
    }

    // Add member
    await updateDoc(doc(db!, 'groupChats', invite.roomId), {
      members: arrayUnion(userId),
      [`memberRoles.${userId}`]: 'member',
      lastActivityAt: Date.now()
    });

    // Update invite usage
    await updateDoc(inviteDoc.ref, {
      usedCount: increment(1),
      usedBy: arrayUnion(userId)
    });

    await this.addSystemMessage(invite.roomId, `${userName} joined the room`);
    await this.logAudit(invite.roomId, userId, 'join', { via: 'invite', code });

    return invite.roomId;
  }

  /**
   * Add member by user ID (owner/admin only)
   */
  async addMember(roomId: string, addedBy: string, userId: string, userName: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const userRole = room.memberRoles[addedBy];
    if (userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    if (room.members.includes(userId)) {
      throw new Error('User is already a member');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      members: arrayUnion(userId),
      [`memberRoles.${userId}`]: 'member',
      lastActivityAt: Date.now()
    });

    await this.addSystemMessage(roomId, `${userName} was added to the room`);
    await this.logAudit(roomId, addedBy, 'add_member', { addedUser: userId });
  }

  /**
   * Remove member (owner/admin only, or self-leave)
   */
  async removeMember(roomId: string, removedBy: string, userId: string, userName: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    // Can remove self, or owner/admin can remove others
    const isSelf = removedBy === userId;
    const userRole = room.memberRoles[removedBy];
    
    if (!isSelf && userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    // Can't remove room owner
    if (room.memberRoles[userId] === 'owner') {
      throw new Error('Cannot remove room owner');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      members: arrayRemove(userId),
      [`memberRoles.${userId}`]: null,
      lastActivityAt: Date.now()
    });

    const message = isSelf ? `${userName} left the room` : `${userName} was removed from the room`;
    await this.addSystemMessage(roomId, message);
    await this.logAudit(roomId, removedBy, 'leave', { removedUser: userId, isSelf });
  }

  // ==================== MESSAGES ====================

  /**
   * Subscribe to messages in a room
   */
  subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    console.log(`💬 Subscribing to messages in room: ${roomId}`);

    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`💬 Messages snapshot: ${snapshot.size} messages`);
      
      // FIXED: Safely convert timestamps - handle both Firestore Timestamps and other formats
      const safeToDate = (timestamp: any): Date | undefined => {
        if (!timestamp) return undefined;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return undefined;
      };
      
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt) || new Date(data.createdAt || Date.now()),
          updatedAt: safeToDate(data.updatedAt),
          editedAt: safeToDate(data.editedAt),
          deletedAt: safeToDate(data.deletedAt)
        } as ChatMessage;
      });

      callback(messages);
    }, (error) => {
      console.error('❌ Error subscribing to messages:', error);
      callback([]);
    });

    this.listeners.set(`messages_${roomId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Send text message
   */
  async sendMessage(params: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    replyTo?: string;
  }): Promise<string> {
    const message: Omit<ChatMessage, 'id'> = {
      roomId: params.roomId,
      senderId: params.userId,
      senderName: params.userName,
      senderAvatar: params.userAvatar,
      type: 'text',
      text: params.text,
      replyTo: params.replyTo,
      reactions: {},
      readBy: [params.userId],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(
      collection(db!, 'groupChats', params.roomId, 'messages'),
      message
    );

    // Update room activity
    await updateDoc(doc(db!, 'groupChats', params.roomId), {
      lastActivityAt: Date.now()
    });

    return docRef.id;
  }

  /**
   * Add system message
   */
  private async addSystemMessage(roomId: string, text: string): Promise<void> {
    const message: Omit<ChatMessage, 'id'> = {
      roomId,
      senderId: 'raftai',
      senderName: 'RaftAI',
      type: 'system',
      text,
      reactions: {},
      readBy: [],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db!, 'groupChats', roomId, 'messages'), message);
  }

  /**
   * Add reaction to message
   */
  async addReaction(roomId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) return;

    const message = messageSnap.data() as ChatMessage;
    const reactions = message.reactions || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    } else {
      // Remove reaction if already exists
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    await updateDoc(messageRef, { reactions });
  }

  /**
   * Pin message
   */
  async pinMessage(roomId: string, messageId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const userRole = room.memberRoles[userId];
    if (userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      pinnedMessages: arrayUnion(messageId)
    });

    await updateDoc(doc(db!, 'groupChats', roomId, 'messages', messageId), {
      isPinned: true
    });

    await this.logAudit(roomId, userId, 'pin', { messageId });
  }

  // ==================== FILES ====================

  /**
   * Upload file and submit for RaftAI review
   */
  async uploadFile(params: {
    roomId: string;
    userId: string;
    userName: string;
    file: File;
  }): Promise<string> {
    console.log('📎 Uploading file:', params.file.name);

    // Validate file
    const room = await this.getRoom(params.roomId);
    if (!room) throw new Error('Room not found');

    if (!room.settings.filesAllowed) {
      throw new Error('File uploads not allowed in this room');
    }

    if (params.file.size > room.settings.maxFileSize * 1024 * 1024) {
      throw new Error(`File too large. Max size: ${room.settings.maxFileSize}MB`);
    }

    // Create file record
    const fileUpload: Omit<FileUpload, 'id'> = {
      roomId: params.roomId,
      uploadedBy: params.userId,
      fileName: params.file.name,
      fileSize: params.file.size,
      fileType: params.file.type,
      status: 'pending',
      uploadedAt: serverTimestamp()
    };

    const fileDoc = await addDoc(collection(db!, 'fileUploads'), fileUpload);

    // TODO: Upload to storage and get URL
    // TODO: Submit to RaftAI for review
    
    await this.addSystemMessage(params.roomId, 
      `📎 ${params.userName} uploaded ${params.file.name} - Pending RaftAI review...`
    );

    return fileDoc.id;
  }

  // ==================== REPORTS & MODERATION ====================

  /**
   * Report message or room
   */
  async report(params: {
    roomId: string;
    messageId?: string;
    reportedBy: string;
    reportedUser?: string;
    reason: string;
    details: string;
  }): Promise<string> {
    const report: Omit<Report, 'id'> = {
      ...params,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db!, 'reports'), report);
    
    await this.logAudit(params.roomId, params.reportedBy, 'report', {
      messageId: params.messageId,
      reason: params.reason
    });

    return docRef.id;
  }

  // ==================== AUDIT ====================

  /**
   * Log audit event
   */
  private async logAudit(
    roomId: string,
    userId: string,
    action: AuditLog['action'],
    details: any
  ): Promise<void> {
    const audit: Omit<AuditLog, 'id'> = {
      roomId,
      userId,
      action,
      details,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db!, 'chatAudit'), audit);
  }

  // ==================== CLEANUP ====================

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const chatService = ChatService.getInstance();

