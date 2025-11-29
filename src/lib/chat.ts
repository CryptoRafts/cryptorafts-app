import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.client';
import { logger } from './logger';

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'private' | 'project' | 'group';
  members: string[];
  projectId?: string;
  createdBy: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Timestamp;
  editedAt?: Timestamp;
  replyTo?: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Timestamp;
}

// Chat room management
export class ChatService {
  // Create a new chat room
  static async createRoom(
    name: string,
    type: ChatRoom['type'],
    members: string[],
    createdBy: string,
    projectId?: string,
    description?: string
  ): Promise<string> {
    try {
      const roomData: Omit<ChatRoom, 'id'> = {
        name,
        description,
        type,
        members: [...new Set(members)], // Remove duplicates
        projectId,
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lastActivityAt: serverTimestamp() as Timestamp,
        isActive: true
      };

      const docRef = await addDoc(collection(db!, 'rooms'), roomData);
      
      logger.info('Chat room created', {
        roomId: docRef.id,
        type,
        memberCount: members.length,
        createdBy
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to create chat room', { error: formatError(error) });
      throw error;
    }
  }

  // Get user's chat rooms
  static async getUserRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db!, 'rooms'),
        where('members', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastActivityAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
    } catch (error) {
      logger.error('Failed to get user rooms', { error: formatError(error), userId });
      throw error;
    }
  }

  // Get room details
  static async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const roomRef = doc(db!, 'rooms', roomId);
      const snapshot = await getDocs(query(collection(db!, 'rooms'), where('__name__', '==', roomId)));
      
      if (snapshot.empty) return null;
      
      const roomDoc = snapshot.docs[0];
      return {
        id: roomDoc.id,
        ...roomDoc.data()
      } as ChatRoom;
    } catch (error) {
      logger.error('Failed to get room', { error: formatError(error), roomId });
      throw error;
    }
  }

  // Add member to room
  static async addMember(roomId: string, userId: string, addedBy: string): Promise<void> {
    try {
      const roomRef = doc(db!, 'rooms', roomId);
      const room = await this.getRoom(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      if (!room.members.includes(userId)) {
        await updateDoc(roomRef, {
          members: [...room.members, userId],
          lastActivityAt: serverTimestamp()
        });

        // Add system message
        await this.sendMessage(roomId, addedBy, 'System', `${userId} was added to the room`, 'system');
      }
    } catch (error) {
      logger.error('Failed to add member to room', { error: formatError(error), roomId, userId });
      throw error;
    }
  }

  // Remove member from room
  static async removeMember(roomId: string, userId: string, removedBy: string): Promise<void> {
    try {
      const roomRef = doc(db!, 'rooms', roomId);
      const room = await this.getRoom(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      const updatedMembers = room.members.filter(id => id !== userId);
      await updateDoc(roomRef, {
        members: updatedMembers,
        lastActivityAt: serverTimestamp()
      });

      // Add system message
      await this.sendMessage(roomId, removedBy, 'System', `${userId} was removed from the room`, 'system');
    } catch (error) {
      logger.error('Failed to remove member from room', { error: formatError(error), roomId, userId });
      throw error;
    }
  }

  // Send a message
  static async sendMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    replyTo?: string,
    attachments?: ChatMessage['attachments']
  ): Promise<string> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        roomId,
        senderId,
        senderName,
        content,
        type,
        timestamp: serverTimestamp() as Timestamp,
        replyTo,
        attachments
      };

      const docRef = await addDoc(collection(db!, 'messages'), messageData);

      // Update room's last activity
      const roomRef = doc(db!, 'rooms', roomId);
      await updateDoc(roomRef, {
        lastActivityAt: serverTimestamp()
      });

      logger.info('Message sent', {
        messageId: docRef.id,
        roomId,
        senderId,
        type
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to send message', { error: formatError(error), roomId, senderId });
      throw error;
    }
  }

  // Get messages for a room
  static async getMessages(roomId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db!, 'messages'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse(); // Reverse to get chronological order
    } catch (error) {
      logger.error('Failed to get messages', { error: formatError(error), roomId });
      throw error;
    }
  }

  // Subscribe to room messages
  static subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db!, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse();
      
      callback(messages);
    }, (error) => {
      logger.error('Failed to subscribe to messages', { error: formatError(error), roomId });
    });
  }

  // Subscribe to user's rooms
  static subscribeToUserRooms(
    userId: string,
    callback: (rooms: ChatRoom[]) => void
  ): () => void {
    const q = query(
      collection(db!, 'rooms'),
      where('members', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('lastActivityAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
      
      callback(rooms);
    }, (error) => {
      logger.error('Failed to subscribe to user rooms', { error: formatError(error), userId });
    });
  }

  // Edit a message
  static async editMessage(messageId: string, newContent: string, editedBy: string): Promise<void> {
    try {
      const messageRef = doc(db!, 'messages', messageId);
      await updateDoc(messageRef, {
        content: newContent,
        editedAt: serverTimestamp()
      });

      logger.info('Message edited', { messageId, editedBy });
    } catch (error) {
      logger.error('Failed to edit message', { error: formatError(error), messageId });
      throw error;
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string, deletedBy: string): Promise<void> {
    try {
      const messageRef = doc(db!, 'messages', messageId);
      await deleteDoc(messageRef);

      logger.info('Message deleted', { messageId, deletedBy });
    } catch (error) {
      logger.error('Failed to delete message', { error: formatError(error), messageId });
      throw error;
    }
  }

  // Check if user is member of room
  static async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.members.includes(userId) : false;
    } catch (error) {
      logger.error('Failed to check room membership', { error: formatError(error), roomId, userId });
      return false;
    }
  }
}
