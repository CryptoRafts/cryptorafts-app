import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase.client';
import { 
  DealRoom, 
  DealRoomMessage, 
  VCTermSheetTemplate,
  VCAISession 
} from './vc-data-models';

export class VCDealRoomManager {
  private static instance: VCDealRoomManager;
  private listeners = new Map<string, Unsubscribe>();

  static getInstance(): VCDealRoomManager {
    if (!VCDealRoomManager.instance) {
      VCDealRoomManager.instance = new VCDealRoomManager();
    }
    return VCDealRoomManager.instance;
  }

  /**
   * Subscribe to deal room messages (real-time)
   */
  subscribeToRoomMessages(
    roomId: string,
    callback: (messages: DealRoomMessage[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `room_messages_${roomId}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const q = query(
      collection(db!, 'groupChats', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as DealRoomMessage[];
          callback(messages);
        } catch (error) {
          console.error('Error processing room messages:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('Room messages listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to deal room info (real-time)
   */
  subscribeToRoomInfo(
    roomId: string,
    callback: (room: DealRoom | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const listenerKey = `room_info_${roomId}`;
    
    // Clean up existing listener
    this.cleanupListener(listenerKey);

    const roomRef = doc(db!, 'groupChats', roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          
          const room = {
            id: roomId,
            ...snapshot.data()
          } as DealRoom;
          
          callback(room);
        } catch (error) {
          console.error('Error processing room info:', error);
          if (onError) onError(error as Error);
        }
      },
      (error) => {
        console.error('Room info listener error:', error);
        if (onError) onError(error);
      }
    );

    this.listeners.set(listenerKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Send message to deal room
   */
  async sendMessage(
    roomId: string,
    content: string,
    authorId: string,
    type: DealRoomMessage['type'] = 'text',
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
      size: number;
    }>,
    threadOf?: string
  ): Promise<string> {
    const messageRef = doc(collection(db!, 'groupChats', roomId, 'messages'));
    const messageId = messageRef.id;
    
    const message: DealRoomMessage = {
      id: messageId,
      roomId,
      type,
      content,
      attachments,
      threadOf,
      authorId,
      reactions: [],
      mentions: [],
      readBy: [{
        userId: authorId,
        readAt: serverTimestamp()
      }],
      pinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(messageRef, message);

    // Update room last activity
    await updateDoc(doc(db!, 'groupChats', roomId), {
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('message_sent', {
      roomId,
      messageId,
      authorId,
      type
    });

    return messageId;
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    roomId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data() as DealRoomMessage;
    const reactions = messageData.reactions || [];
    
    // Find existing reaction or create new one
    const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
    
    if (existingReactionIndex >= 0) {
      // Add user to existing reaction if not already there
      const reaction = reactions[existingReactionIndex];
      if (!reaction.userIds.includes(userId)) {
        reaction.userIds.push(userId);
        reactions[existingReactionIndex] = reaction;
      }
    } else {
      // Create new reaction
      reactions.push({
        emoji,
        userIds: [userId]
      });
    }

    await updateDoc(messageRef, {
      reactions,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(
    roomId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data() as DealRoomMessage;
    const reactions = messageData.reactions || [];
    
    // Find and update reaction
    const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex >= 0) {
      const reaction = reactions[reactionIndex];
      reaction.userIds = reaction.userIds.filter(id => id !== userId);
      
      if (reaction.userIds.length === 0) {
        // Remove reaction if no users left
        reactions.splice(reactionIndex, 1);
      } else {
        reactions[reactionIndex] = reaction;
      }
    }

    await updateDoc(messageRef, {
      reactions,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(
    roomId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data() as DealRoomMessage;
    const readBy = messageData.readBy || [];
    
    // Check if already marked as read
    const alreadyRead = readBy.some(r => r.userId === userId);
    if (alreadyRead) return;

    // Add read entry
    readBy.push({
      userId,
      readAt: serverTimestamp()
    });

    await updateDoc(messageRef, {
      readBy,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Pin/unpin message
   */
  async toggleMessagePin(
    roomId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db!, 'groupChats', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data() as DealRoomMessage;
    
    // Check if user is room owner
    const roomDoc = await getDoc(doc(db!, 'groupChats', roomId));
    const roomData = roomDoc.data() as DealRoom;
    
    if (roomData.ownerId !== userId) {
      throw new Error('Only room owner can pin messages');
    }

    await updateDoc(messageRef, {
      pinned: !messageData.pinned,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Upload file to deal room
   */
  async uploadFile(
    roomId: string,
    file: File,
    userId: string
  ): Promise<string> {
    // Upload file to storage
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        return formData;
      })()
    });

    const { url } = await response.json();

    // Send file message
    const messageId = await this.sendMessage(
      roomId,
      file.name,
      userId,
      'file',
      [{
        type: file.type,
        url,
        name: file.name,
        size: file.size
      }]
    );

    return messageId;
  }

  /**
   * Create term sheet
   */
  async createTermSheet(
    roomId: string,
    templateId: string,
    data: any,
    userId: string
  ): Promise<void> {
    // Get template
    const templateDoc = await getDoc(doc(db!, 'vcTermSheetTemplates', templateId));
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const template = templateDoc.data() as VCTermSheetTemplate;
    
    // Generate term sheet content
    const content = this.generateTermSheetContent(template, data);
    
    // Update room with term sheet
    const roomRef = doc(db!, 'groupChats', roomId);
    await updateDoc(roomRef, {
      termSheet: {
        status: 'draft',
        amount: data.amount,
        valuation: data.valuation,
        equity: data.equity,
        vesting: data.vesting,
        rights: data.rights || [],
        versions: [{
          version: 1,
          content,
          createdAt: serverTimestamp(),
          createdBy: userId
        }],
        signatures: []
      },
      updatedAt: serverTimestamp()
    });

    // Send system message
    await this.sendMessage(
      roomId,
      'Term sheet created and shared',
      'system',
      'system'
    );
  }

  /**
   * Update term sheet status
   */
  async updateTermSheetStatus(
    roomId: string,
    status: DealRoom['termSheet']['status'],
    userId: string
  ): Promise<void> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'draft': ['shared'],
      'shared': ['agreed_in_principle', 'draft'],
      'agreed_in_principle': ['legal_review', 'shared'],
      'legal_review': ['signed', 'agreed_in_principle'],
      'signed': ['funded'],
      'funded': ['closed']
    };

    const currentStatus = roomData.termSheet.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    await updateDoc(roomRef, {
      'termSheet.status': status,
      updatedAt: serverTimestamp()
    });

    // Send system message
    await this.sendMessage(
      roomId,
      `Term sheet status updated to: ${status}`,
      'system',
      'system'
    );

    // Log audit event
    await this.logAuditEvent('term_sheet_status_updated', {
      roomId,
      status,
      userId
    });
  }

  /**
   * Sign term sheet
   */
  async signTermSheet(
    roomId: string,
    signature: string,
    userId: string
  ): Promise<void> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    if (roomData.termSheet.status !== 'legal_review') {
      throw new Error('Term sheet must be in legal review status to sign');
    }

    // Check if already signed
    const alreadySigned = roomData.termSheet.signatures?.some(s => s.userId === userId);
    if (alreadySigned) {
      throw new Error('Term sheet already signed by this user');
    }

    const signatures = roomData.termSheet.signatures || [];
    signatures.push({
      userId,
      signedAt: serverTimestamp(),
      signature
    });

    await updateDoc(roomRef, {
      'termSheet.signatures': signatures,
      updatedAt: serverTimestamp()
    });

    // Check if all required signatures are collected
    const requiredSignatures = roomData.members.length;
    if (signatures.length >= requiredSignatures) {
      await this.updateTermSheetStatus(roomId, 'signed', userId);
    }

    // Send system message
    await this.sendMessage(
      roomId,
      `Term sheet signed by user ${userId}`,
      'system',
      'system'
    );
  }

  /**
   * Execute AI command
   */
  async executeAICommand(
    roomId: string,
    command: string,
    input: string,
    userId: string,
    orgId: string
  ): Promise<string> {
    // Create AI session
    const sessionRef = doc(collection(db!, 'vcAISessions'));
    const sessionId = sessionRef.id;
    
    const session: VCAISession = {
      id: sessionId,
      roomId,
      command,
      context: {
        userId,
        orgId
      },
      input,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    await setDoc(sessionRef, session);

    // Call AI service
    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          sessionId,
          command,
          input,
          context: {
            roomId,
            userId,
            orgId
          }
        })
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update session with result
      await updateDoc(sessionRef, {
        output: result.output,
        status: 'completed',
        processingTime: result.processingTime,
        completedAt: serverTimestamp()
      });

      // Send AI response as message
      await this.sendMessage(
        roomId,
        result.output,
        'ai',
        'ai'
      );

      return result.output;
    } catch (error) {
      // Update session with error
      await updateDoc(sessionRef, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: serverTimestamp()
      });

      throw error;
    }
  }

  /**
   * Generate term sheet content from template
   */
  private generateTermSheetContent(template: VCTermSheetTemplate, data: any): string {
    let content = '';
    
    for (const section of template.template.sections) {
      content += `## ${section.title}\n\n`;
      
      let sectionContent = section.content;
      
      // Replace variables
      for (const variable of section.variables) {
        const value = data[variable] || template.template.variables[variable]?.defaultValue || '';
        sectionContent = sectionContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
      
      content += sectionContent + '\n\n';
    }
    
    return content;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, data: any): Promise<void> {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Clean up listener
   */
  private cleanupListener(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanupAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

export const vcDealRoomManager = VCDealRoomManager.getInstance();
