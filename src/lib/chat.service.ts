import { 
  db, 
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
  serverTimestamp
} from '@/lib/firebase.client';
import { arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { 
  ChatRoom, 
  ChatMessage, 
  RoomCreationContext, 
  RoomType, 
  MessageType,
  AICommandRequest,
  ChatSearchFilters,
  ModerationAction,
  CallRoom
} from './chat.types';

export class ChatService {
  private static instance: ChatService;
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Room Management
  async createRoom(context: RoomCreationContext, creatorId: string): Promise<string> {
    const roomData: Omit<ChatRoom, 'id'> = {
      name: this.generateRoomName(context),
      type: context.type,
      projectId: context.projectId,
      orgId: context.orgId,
      members: [...context.participants, creatorId],
      ownerId: creatorId,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      privacy: {
        inviteOnly: true
      },
      settings: {
        filesAllowed: true,
        calls: true,
        reactions: true,
        threads: true,
        polls: true,
        tasks: true,
        events: true
      },
      status: 'active',
      metadata: context.metadata
    };

    const docRef = await addDoc(collection(db!, 'groupChats'), roomData);
    return docRef.id;
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const docRef = doc(db!, 'groupChats', roomId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ChatRoom;
    }
    return null;
  }

  async getUserRooms(userId: string, userRole: string): Promise<ChatRoom[]> {
    const q = query(
      collection(db!, 'groupChats'),
      where('members', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('lastActivityAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const rooms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatRoom[];

    // Filter rooms based on role isolation rules
    return this.filterRoomsByRole(rooms, userRole, userId);
  }

  async addMemberToRoom(roomId: string, userId: string, inviterId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room || room.ownerId !== inviterId) {
      return false;
    }

    const roomRef = doc(db!, 'groupChats', roomId);
    await updateDoc(roomRef, {
      members: arrayUnion(userId),
      lastActivityAt: serverTimestamp()
    });

    // Add system message
    await this.sendSystemMessage(roomId, `${userId} was added to the room`);
    return true;
  }

  async removeMemberFromRoom(roomId: string, userId: string, removerId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room || (room.ownerId !== removerId && removerId !== userId)) {
      return false;
    }

    const roomRef = doc(db!, 'groupChats', roomId);
    await updateDoc(roomRef, {
      members: arrayRemove(userId),
      lastActivityAt: serverTimestamp()
    });

    // Add system message
    await this.sendSystemMessage(roomId, `${userId} left the room`);
    return true;
  }

  // Message Management
  async sendMessage(
    roomId: string, 
    senderId: string, 
    content: string, 
    type: MessageType = 'text',
    metadata?: any
  ): Promise<string> {
    const messageData: Omit<ChatMessage, 'id'> = {
      roomId,
      senderId,
      type,
      text: content,
      readBy: [senderId],
      createdAt: serverTimestamp(),
      metadata
    };

    const docRef = await addDoc(collection(db!, 'groupChats', roomId, 'messages'), messageData);
    
    // Update room's last activity
    const roomRef = doc(db!, 'groupChats', roomId);
    await updateDoc(roomRef, {
      lastActivityAt: serverTimestamp()
    });

    return docRef.id;
  }

  async sendSystemMessage(roomId: string, content: string): Promise<string> {
    return this.sendMessage(roomId, 'system', content, 'system');
  }

  async getMessages(roomId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
  }

  async markAsRead(roomId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
  }

  async addReaction(roomId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const message = await getDoc(messageRef);
    
    if (message.exists()) {
      const data = message.data();
      const reactions = data.reactions || {};
      
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      }
      
      await updateDoc(messageRef, { reactions });
    }
  }

  async removeReaction(roomId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const message = await getDoc(messageRef);
    
    if (message.exists()) {
      const data = message.data();
      const reactions = data.reactions || {};
      
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }
      
      await updateDoc(messageRef, { reactions });
    }
  }

  // AI Integration
  async processAICommand(roomId: string, command: AICommandRequest, userId: string): Promise<string> {
    // This would integrate with your RaftAI service
    const aiResponse = await this.callRaftAI(command);
    
    return this.sendMessage(
      roomId, 
      'raftai', 
      aiResponse, 
      'aiReply',
      { command: command.command, originalCommand: command }
    );
  }

  private async callRaftAI(command: AICommandRequest): Promise<string> {
    // Integration with your existing RaftAI service
    // This is a placeholder - implement based on your raftai.service.ts
    return `AI Response for ${command.command} command`;
  }

  // Search
  async searchMessages(filters: ChatSearchFilters, userId: string): Promise<ChatMessage[]> {
    let q = query(collection(db!, 'messages'));
    
    if (filters.roomId) {
      q = query(q, where('roomId', '==', filters.roomId));
    }
    
    if (filters.from) {
      q = query(q, where('senderId', '==', filters.from));
    }
    
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    if (filters.before) {
      q = query(q, where('createdAt', '<', filters.before));
    }
    
    if (filters.after) {
      q = query(q, where('createdAt', '>', filters.after));
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(100));
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    // Filter by user access
    return this.filterMessagesByAccess(messages, userId);
  }

  // Moderation
  async performModerationAction(action: Omit<ModerationAction, 'id' | 'createdAt'>): Promise<string> {
    const actionData: Omit<ModerationAction, 'id'> = {
      ...action,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db!, 'moderation_actions'), actionData);
    
    // Apply the moderation action
    await this.applyModerationAction(action);
    
    return docRef.id;
  }

  private async applyModerationAction(action: Omit<ModerationAction, 'id' | 'createdAt'>): Promise<void> {
    const roomRef = doc(db!, 'groupChats', action.roomId);
    
    switch (action.action) {
      case 'close':
        await updateDoc(roomRef, { status: 'closed' });
        break;
      case 'slow_mode':
        await updateDoc(roomRef, { 
          'settings.slowMode': action.duration || 30 
        });
        break;
      case 'retention':
        await updateDoc(roomRef, { 
          'privacy.disappearing': { seconds: action.duration || 86400 } 
        });
        break;
    }
  }

  // Real-time subscriptions
  subscribeToRoom(roomId: string, callback: (room: ChatRoom) => void): () => void {
    const roomRef = doc(db!, 'groupChats', roomId);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as ChatRoom);
      }
    });
  }

  subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages.reverse());
    });
  }

  // Helper methods
  private generateRoomName(context: RoomCreationContext): string {
    const typeNames = {
      deal: 'Deal Room',
      listing: 'Listing Room',
      ido: 'IDO Room',
      campaign: 'Campaign Room',
      proposal: 'Proposal Room',
      team: 'Team Room',
      ops: 'Operations Room'
    };
    
    return typeNames[context.type] || 'Chat Room';
  }

  private filterRoomsByRole(rooms: ChatRoom[], userRole: string, userId: string): ChatRoom[] {
    return rooms.filter(room => {
      // Role isolation rules
      switch (userRole) {
        case 'founder':
          return ['deal', 'listing', 'ido', 'campaign', 'proposal', 'team'].includes(room.type);
        case 'vc':
          return room.type === 'deal' || room.type === 'ops';
        case 'exchange':
          return room.type === 'listing' || room.type === 'ops';
        case 'ido':
          return room.type === 'ido' || room.type === 'ops';
        case 'influencer':
          return room.type === 'campaign';
        case 'agency':
          return room.type === 'proposal';
        case 'admin':
          return true; // Admins can see all rooms
        default:
          return false;
      }
    });
  }

  private async filterMessagesByAccess(messages: ChatMessage[], userId: string): Promise<ChatMessage[]> {
    // Filter messages based on user's room access
    const userRooms = await this.getUserRooms(userId, '');
    const accessibleRoomIds = userRooms.map(room => room.id);
    
    return messages.filter(message => accessibleRoomIds.includes(message.roomId));
  }
}

export const chatService = ChatService.getInstance();
