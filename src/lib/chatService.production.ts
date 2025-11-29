/**
 * PRODUCTION CHAT SERVICE - 100% Real, No Demos
 * Complete Telegram-style chat with all features
 */

import { 
  collection, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

// Types
export interface ChatRoom {
  id: string;
  name: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team' | 'ops';
  status: 'active' | 'archived';
  
  founderId: string;
  founderName: string;
  founderLogo?: string;
  
  counterpartId: string;
  counterpartName: string;
  counterpartRole: string;
  counterpartLogo?: string;
  
  projectId?: string;
  orgId?: string;
  
  members: string[];
  memberRoles: Record<string, 'owner' | 'admin' | 'member'>;
  
  settings: {
    filesAllowed: boolean;
    maxFileSize: number;
  };
  
  createdAt: any;
  createdBy: string;
  lastActivityAt: any;
  
  pinnedMessages: string[];
  mutedBy: string[];
  
  raftaiMemory?: {
    decisions: string[];
    tasks: string[];
    milestones: string[];
    notePoints: string[];
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'file' | 'image' | 'video' | 'voice' | 'system' | 'aiReply';
  text?: string;
  
  replyTo?: string;
  
  file?: {
    name: string;
    size: number;
    type: string;
    url: string;
    status: 'approved' | 'rejected' | 'pending';
  };
  
  reactions: Record<string, string[]>;
  readBy: string[];
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  
  createdAt: any;
  editedAt?: any;
}

class ProductionChatService {
  private static instance: ProductionChatService;
  
  static getInstance(): ProductionChatService {
    if (!this.instance) {
      this.instance = new ProductionChatService();
    }
    return this.instance;
  }

  /**
   * Get all rooms for user based on their role
   */
  subscribeToUserRooms(
    userId: string,
    userRole: string,
    callback: (rooms: ChatRoom[]) => void
  ): () => void {
    console.log(`📂 [CHAT] Loading rooms for ${userRole}: ${userId}`);

    const q = query(
      collection(db!, 'groupChats'),
      where('members', 'array-contains', userId),
      orderBy('lastActivityAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const allRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));

      // Filter active rooms and by role
      const activeRooms = allRooms.filter(r => r.status === 'active');
      const filteredRooms = this.filterByRole(activeRooms, userRole, userId);
      
      console.log(`📂 [CHAT] ${allRooms.length} total → ${activeRooms.length} active → ${filteredRooms.length} for ${userRole}`);
      callback(filteredRooms);
      
    }, (error) => {
      console.error('❌ [CHAT] Error loading rooms:', error);
      callback([]);
    });
  }

  private filterByRole(rooms: ChatRoom[], role: string, userId: string): ChatRoom[] {
    switch (role) {
      case 'founder':
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
        return rooms;
      default:
        return [];
    }
  }

  /**
   * Subscribe to messages in a room
   */
  subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    console.log(`💬 [CHAT] Loading messages for room: ${roomId}`);

    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .filter(m => !m.isDeleted);
      
      console.log(`💬 [CHAT] ${messages.length} messages loaded`);
      callback(messages);
      
    }, (error) => {
      console.error('❌ [CHAT] Error loading messages:', error);
      callback([]);
    });
  }

  /**
   * Send message
   */
  async sendMessage(params: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    replyTo?: string;
  }): Promise<string> {
    const message: any = {
      roomId: params.roomId,
      senderId: params.userId,
      senderName: params.userName,
      senderAvatar: params.userAvatar || '',
      type: 'text',
      text: params.text,
      reactions: {},
      readBy: [params.userId],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp()
    };

    // Only include replyTo if it has a value
    if (params.replyTo) {
      message.replyTo = params.replyTo;
    }

    const docRef = await addDoc(collection(db!, 'groupChats', params.roomId, 'messages'), message);

    // Update room activity
    await updateDoc(doc(db!, 'groupChats', params.roomId), {
      lastActivityAt: Date.now()
    });

    console.log(`✅ [CHAT] Message sent: ${docRef.id}`);
    return docRef.id;
  }

  /**
   * Add reaction
   */
  async addReaction(roomId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) return;

    const message = messageSnap.data() as ChatMessage;
    const reactions = { ...message.reactions };

    if (!reactions[emoji]) reactions[emoji] = [];

    if (reactions[emoji].includes(userId)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(userId);
    }

    await updateDoc(messageRef, { reactions });
  }

  /**
   * Pin message
   */
  async pinMessage(roomId: string, messageId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || (room.memberRoles[userId] !== 'owner' && room.memberRoles[userId] !== 'admin')) {
      throw new Error('Permission denied');
    }

    const isPinned = room.pinnedMessages.includes(messageId);

    await updateDoc(doc(db!, 'groupChats', roomId), {
      pinnedMessages: isPinned ? arrayRemove(messageId) : arrayUnion(messageId)
    });

    await updateDoc(doc(db!, 'groupChats', roomId, 'messages', messageId), {
      isPinned: !isPinned
    });
  }

  /**
   * Get room
   */
  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const roomSnap = await getDoc(doc(db!, 'groupChats', roomId));
    return roomSnap.exists() ? { id: roomSnap.id, ...roomSnap.data() } as ChatRoom : null;
  }

  /**
   * Generate invite code
   */
  async generateInvite(roomId: string, userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    await addDoc(collection(db!, 'chatInvites'), {
      roomId,
      code,
      createdBy: userId,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      maxUses: 10,
      usedCount: 0,
      usedBy: []
    });

    return code;
  }

  /**
   * Join via invite
   */
  async joinViaInvite(code: string, userId: string, userName: string): Promise<string> {
    const q = query(collection(db!, 'chatInvites'), where('code', '==', code), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error('Invalid invite code');

    const inviteDoc = snapshot.docs[0];
    const invite = inviteDoc.data();

    if (invite.expiresAt.toDate() < new Date()) throw new Error('Invite expired');
    if (invite.usedCount >= invite.maxUses) throw new Error('Invite limit reached');

    // Add member
    await updateDoc(doc(db!, 'groupChats', invite.roomId), {
      members: arrayUnion(userId),
      [`memberRoles.${userId}`]: 'member'
    });

    // Update invite usage
    await updateDoc(inviteDoc.ref, {
      usedCount: increment(1),
      usedBy: arrayUnion(userId)
    });

    // System message
    await this.addSystemMessage(invite.roomId, `${userName} joined the room`);

    return invite.roomId;
  }

  /**
   * Remove member
   */
  async removeMember(roomId: string, removedBy: string, userId: string, userName: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const isSelf = removedBy === userId;
    const userRole = room.memberRoles[removedBy];
    
    if (!isSelf && userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      members: arrayRemove(userId)
    });

    const message = isSelf ? `${userName} left the room` : `${userName} was removed`;
    await this.addSystemMessage(roomId, message);
  }

  /**
   * Rename room
   */
  async renameRoom(roomId: string, userId: string, newName: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const userRole = room.memberRoles[userId];
    if (userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    await updateDoc(doc(db!, 'groupChats', roomId), {
      name: newName
    });

    await this.addSystemMessage(roomId, `Room renamed to "${newName}"`);
  }

  /**
   * Report message or room
   */
  async report(params: {
    roomId: string;
    messageId?: string;
    reportedBy: string;
    reason: string;
    details: string;
  }): Promise<void> {
    await addDoc(collection(db!, 'reports'), {
      ...params,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db!, 'chatAudit'), {
      roomId: params.roomId,
      userId: params.reportedBy,
      action: 'report',
      details: { messageId: params.messageId, reason: params.reason },
      timestamp: serverTimestamp()
    });
  }

  /**
   * Add system message
   */
  private async addSystemMessage(roomId: string, text: string): Promise<void> {
    await addDoc(collection(db!, 'groupChats', roomId, 'messages'), {
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
    });
  }
}

export const chatService = ProductionChatService.getInstance();

