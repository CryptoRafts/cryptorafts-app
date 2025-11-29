// Real-time Chat System with Advanced Features
import { vcAuthManager } from './vc-auth';

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'call_start' | 'call_end';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  editedAt?: Date;
  replyTo?: string; // Message ID being replied to
  reactions: MessageReaction[];
  readReceipts: ReadReceipt[];
  isPinned: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    linkPreview?: LinkPreview;
  };
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

export interface LinkPreview {
  title: string;
  description: string;
  image?: string;
  url: string;
  domain: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'deal_room' | 'direct' | 'group';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Date;
}

class RealTimeChatManager {
  private messages: Map<string, ChatMessage[]> = new Map(); // roomId -> messages
  private rooms: Map<string, ChatRoom> = new Map();
  private typingUsers: Map<string, Set<TypingIndicator>> = new Map(); // roomId -> typing users
  private messageCache: Map<string, ChatMessage> = new Map(); // messageId -> message

  // Send a message
  async sendMessage(
    roomId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    replyTo?: string,
    metadata?: any
  ): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    try {
      const user = await vcAuthManager.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const message: ChatMessage = {
        id: messageId,
        roomId,
        content: content.trim(),
        type,
        senderId: user.uid,
        senderName: user.displayName || user.email || 'Unknown User',
        senderAvatar: user.photoURL,
        timestamp: new Date(),
        reactions: [],
        readReceipts: [],
        isPinned: false,
        replyTo,
        metadata
      };

      // Add to messages
      const roomMessages = this.messages.get(roomId) || [];
      roomMessages.push(message);
      this.messages.set(roomId, roomMessages);
      this.messageCache.set(messageId, message);

      // Update room last message
      await this.updateRoomLastMessage(roomId, message);

      // Generate link preview for text messages with URLs
      if (type === 'text' && this.containsUrl(content)) {
        await this.generateLinkPreview(messageId);
      }

      // Log the event
      await this.logChatEvent('message_sent', {
        messageId,
        roomId,
        senderId: user.uid,
        type,
        hasReply: !!replyTo
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Get messages for a room with pagination
  async getMessages(
    roomId: string,
    limit: number = 50,
    before?: string
  ): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      const roomMessages = this.messages.get(roomId) || [];
      
      let filteredMessages = roomMessages;
      if (before) {
        const beforeIndex = roomMessages.findIndex(m => m.id === before);
        if (beforeIndex !== -1) {
          filteredMessages = roomMessages.slice(0, beforeIndex);
        }
      }

      // Sort by timestamp (newest first) and limit
      const sortedMessages = filteredMessages
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
        .reverse(); // Reverse to show oldest first

      return { success: true, messages: sortedMessages };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  // Add reaction to message
  async addReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.messageCache.get(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(r => r.userId !== userId);
      
      // Add new reaction
      message.reactions.push({
        emoji,
        userId,
        timestamp: new Date()
      });

      // Update in cache
      this.messageCache.set(messageId, message);

      // Update in room messages
      const roomMessages = this.messages.get(message.roomId) || [];
      const messageIndex = roomMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = message;
        this.messages.set(message.roomId, roomMessages);
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove reaction from message
  async removeReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.messageCache.get(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      message.reactions = message.reactions.filter(
        r => !(r.emoji === emoji && r.userId === userId)
      );

      // Update in cache
      this.messageCache.set(messageId, message);

      // Update in room messages
      const roomMessages = this.messages.get(message.roomId) || [];
      const messageIndex = roomMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = message;
        this.messages.set(message.roomId, roomMessages);
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark message as read
  async markAsRead(
    roomId: string,
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.messageCache.get(messageId);
      if (!message || message.roomId !== roomId) {
        return { success: false, error: 'Message not found' };
      }

      // Remove existing read receipt from this user
      message.readReceipts = message.readReceipts.filter(r => r.userId !== userId);
      
      // Add new read receipt
      message.readReceipts.push({
        userId,
        readAt: new Date()
      });

      // Update in cache
      this.messageCache.set(messageId, message);

      // Update in room messages
      const roomMessages = this.messages.get(roomId) || [];
      const messageIndex = roomMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = message;
        this.messages.set(roomId, roomMessages);
      }

      // Update room unread count
      await this.updateRoomUnreadCount(roomId, userId);

      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Pin/unpin message
  async togglePinMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.messageCache.get(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      // Check if user has permission to pin messages
      const hasPermission = await this.checkPinPermission(message.roomId, userId);
      if (!hasPermission) {
        return { success: false, error: 'No permission to pin messages' };
      }

      // Unpin any existing pinned message in this room
      if (!message.isPinned) {
        const roomMessages = this.messages.get(message.roomId) || [];
        roomMessages.forEach(m => {
          if (m.isPinned && m.id !== messageId) {
            m.isPinned = false;
            this.messageCache.set(m.id, m);
          }
        });
        this.messages.set(message.roomId, roomMessages);
      }

      // Toggle pin status
      message.isPinned = !message.isPinned;

      // Update in cache
      this.messageCache.set(messageId, message);

      // Update in room messages
      const roomMessages = this.messages.get(message.roomId) || [];
      const messageIndex = roomMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = message;
        this.messages.set(message.roomId, roomMessages);
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling pin message:', error);
      return { success: false, error: error.message };
    }
  }

  // Set typing indicator
  async setTyping(
    roomId: string,
    userId: string,
    isTyping: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await vcAuthManager.getCurrentUser();
      if (!user || user.uid !== userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const typingUsers = this.typingUsers.get(roomId) || new Set();
      
      if (isTyping) {
        typingUsers.add({
          userId,
          userName: user.displayName || user.email || 'Unknown User',
          timestamp: new Date()
        });
      } else {
        // Remove this user's typing indicator
        const userTyping = Array.from(typingUsers).find(t => t.userId === userId);
        if (userTyping) {
          typingUsers.delete(userTyping);
        }
      }

      this.typingUsers.set(roomId, typingUsers);

      // Clean up old typing indicators (older than 10 seconds)
      setTimeout(() => {
        const currentTyping = this.typingUsers.get(roomId);
        if (currentTyping) {
          const now = new Date();
          const filteredTyping = new Set(
            Array.from(currentTyping).filter(
              t => now.getTime() - t.timestamp.getTime() < 10000
            )
          );
          this.typingUsers.set(roomId, filteredTyping);
        }
      }, 10000);

      return { success: true };
    } catch (error) {
      console.error('Error setting typing:', error);
      return { success: false, error: error.message };
    }
  }

  // Get typing indicators for a room
  getTypingUsers(roomId: string): TypingIndicator[] {
    const typingUsers = this.typingUsers.get(roomId);
    if (!typingUsers) return [];

    // Filter out old indicators
    const now = new Date();
    return Array.from(typingUsers).filter(
      t => now.getTime() - t.timestamp.getTime() < 10000
    );
  }

  // Search messages
  async searchMessages(
    roomId: string,
    query: string,
    limit: number = 20
  ): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      const roomMessages = this.messages.get(roomId) || [];
      const searchQuery = query.toLowerCase();

      const matchingMessages = roomMessages
        .filter(message => 
          message.content.toLowerCase().includes(searchQuery) ||
          message.senderName.toLowerCase().includes(searchQuery)
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      return { success: true, messages: matchingMessages };
    } catch (error) {
      console.error('Error searching messages:', error);
      return { success: false, error: error.message };
    }
  }

  // Create or get chat room
  async getOrCreateRoom(
    roomId: string,
    name: string,
    type: 'deal_room' | 'direct' | 'group' = 'deal_room',
    participants: string[] = []
  ): Promise<{ success: boolean; room?: ChatRoom; error?: string }> {
    try {
      let room = this.rooms.get(roomId);
      
      if (!room) {
        room = {
          id: roomId,
          name,
          type,
          participants,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.rooms.set(roomId, room);
      }

      return { success: true, room };
    } catch (error) {
      console.error('Error getting or creating room:', error);
      return { success: false, error: error.message };
    }
  }

  // Get chat rooms for a user
  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    return Array.from(this.rooms.values())
      .filter(room => room.participants.includes(userId))
      .sort((a, b) => (b.lastMessage?.timestamp || b.updatedAt).getTime() - (a.lastMessage?.timestamp || a.updatedAt).getTime());
  }

  // Private methods
  private async updateRoomLastMessage(roomId: string, message: ChatMessage): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastMessage = message;
      room.updatedAt = new Date();
      this.rooms.set(roomId, room);
    }
  }

  private async updateRoomUnreadCount(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      // Count unread messages for this user
      const roomMessages = this.messages.get(roomId) || [];
      const unreadCount = roomMessages.filter(message => 
        message.senderId !== userId && 
        !message.readReceipts.some(receipt => receipt.userId === userId)
      ).length;
      
      room.unreadCount = unreadCount;
      this.rooms.set(roomId, room);
    }
  }

  private containsUrl(text: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  }

  private async generateLinkPreview(messageId: string): Promise<void> {
    try {
      const message = this.messageCache.get(messageId);
      if (!message || message.type !== 'text') return;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.content.match(urlRegex);
      
      if (urls && urls.length > 0) {
        const url = urls[0];
        
        // In a real implementation, this would fetch the URL and extract metadata
        const linkPreview: LinkPreview = {
          title: 'Link Preview',
          description: 'Preview of the linked content',
          url,
          domain: new URL(url).hostname
        };

        message.metadata = { ...message.metadata, linkPreview };
        this.messageCache.set(messageId, message);

        // Update in room messages
        const roomMessages = this.messages.get(message.roomId) || [];
        const messageIndex = roomMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          roomMessages[messageIndex] = message;
          this.messages.set(message.roomId, roomMessages);
        }
      }
    } catch (error) {
      console.error('Error generating link preview:', error);
    }
  }

  private async checkPinPermission(roomId: string, userId: string): Promise<boolean> {
    // In a real implementation, this would check user permissions
    // For now, allow all authenticated users to pin messages
    return true;
  }

  private async logChatEvent(event: string, data: any): Promise<void> {
    try {
      console.log('Chat Event:', { event, data, timestamp: new Date() });
      // In a real implementation, this would save to Firebase
    } catch (error) {
      console.error('Error logging chat event:', error);
    }
  }
}

// Export singleton instance
export const realTimeChatManager = new RealTimeChatManager();

