"use client";

import { db, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from './firebase.client';
import { raftAIService } from './raftai.service';

export interface DealRoom {
  id: string;
  type: 'vc_deal' | 'exchange_listing' | 'ido_launch' | 'influencer_campaign' | 'agency_proposal';
  title: string;
  description: string;
  participants: string[];
  projectId?: string;
  status: 'active' | 'completed' | 'archived';
  metadata: {
    dealAmount?: number;
    currency?: string;
    timeline?: string;
    requirements?: string[];
    milestones?: any[];
  };
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userDisplayName: string;
  message: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: any;
  metadata?: any;
}

export interface DealRoomFile {
  id: string;
  roomId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: any;
  metadata?: any;
}

export interface DealRoomTask {
  id: string;
  roomId: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: any;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

class DealRoomService {
  // Create a new deal room
  public async createDealRoom(roomData: Omit<DealRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db!, 'deal_rooms'), {
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create initial system message
      await this.sendSystemMessage(docRef.id, `Deal room "${roomData.title}" has been created.`);

      // Trigger RaftAI analysis for the deal room
      await raftAIService.createDealRoom({
        type: roomData.type,
        participants: roomData.participants,
        projectId: roomData.projectId,
        metadata: roomData.metadata
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating deal room:', error);
      throw error;
    }
  }

  // Update deal room
  public async updateDealRoom(roomId: string, updates: Partial<DealRoom>): Promise<void> {
    try {
      await updateDoc(doc(db!, 'deal_rooms', roomId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating deal room:', error);
      throw error;
    }
  }

  // Get deal room
  public async getDealRoom(roomId: string): Promise<DealRoom | null> {
    try {
      const docRef = doc(db!, 'deal_rooms', roomId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as DealRoom;
      }
      return null;
    } catch (error) {
      console.error('Error getting deal room:', error);
      return null;
    }
  }

  // Subscribe to deal room updates
  public subscribeToDealRoom(roomId: string, callback: (room: DealRoom | null) => void): () => void {
    const docRef = doc(db!, 'deal_rooms', roomId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as DealRoom);
      } else {
        callback(null);
      }
    });
  }

  // Subscribe to user's deal rooms
  public subscribeToUserDealRooms(userId: string, callback: (rooms: DealRoom[]) => void): () => void {
    const q = query(
      collection(db!, 'deal_rooms'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DealRoom[];
      callback(rooms);
    });
  }

  // Send chat message
  public async sendMessage(roomId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db!, 'deal_rooms', roomId, 'messages'), {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Update room's last activity
      await updateDoc(doc(db!, 'deal_rooms', roomId), {
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send system message
  public async sendSystemMessage(roomId: string, message: string): Promise<string> {
    return await this.sendMessage(roomId, {
      roomId,
      userId: 'system',
      userDisplayName: 'System',
      message,
      type: 'system'
    });
  }

  // Subscribe to chat messages
  public subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db!, 'deal_rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    });
  }

  // Upload file to deal room
  public async uploadFile(roomId: string, fileData: Omit<DealRoomFile, 'id' | 'uploadedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db!, 'deal_rooms', roomId, 'files'), {
        ...fileData,
        uploadedAt: serverTimestamp()
      });

      // Send system message about file upload
      await this.sendSystemMessage(roomId, `${fileData.uploadedBy} uploaded ${fileData.fileName}`);

      return docRef.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Subscribe to deal room files
  public subscribeToFiles(roomId: string, callback: (files: DealRoomFile[]) => void): () => void {
    const q = query(
      collection(db!, 'deal_rooms', roomId, 'files'),
      orderBy('uploadedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DealRoomFile[];
      callback(files);
    });
  }

  // Create task in deal room
  public async createTask(roomId: string, taskData: Omit<DealRoomTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db!, 'deal_rooms', roomId, 'tasks'), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send system message about task creation
      await this.sendSystemMessage(roomId, `Task "${taskData.title}" has been created by ${taskData.createdBy}`);

      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update task
  public async updateTask(roomId: string, taskId: string, updates: Partial<DealRoomTask>): Promise<void> {
    try {
      await updateDoc(doc(db!, 'deal_rooms', roomId, 'tasks', taskId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Subscribe to deal room tasks
  public subscribeToTasks(roomId: string, callback: (tasks: DealRoomTask[]) => void): () => void {
    const q = query(
      collection(db!, 'deal_rooms', roomId, 'tasks'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DealRoomTask[];
      callback(tasks);
    });
  }

  // Auto-create deal room based on action
  public async autoCreateDealRoom(action: {
    type: 'vc_accept' | 'exchange_interest' | 'ido_onboard' | 'influencer_accept' | 'agency_proposal';
    participants: string[];
    projectId?: string;
    metadata?: any;
  }): Promise<string> {
    try {
      let roomType: DealRoom['type'];
      let title: string;
      let description: string;

      switch (action.type) {
        case 'vc_accept':
          roomType = 'vc_deal';
          title = 'VC Deal Discussion';
          description = 'Discussion room for VC deal negotiations and due diligence.';
          break;
        case 'exchange_interest':
          roomType = 'exchange_listing';
          title = 'Exchange Listing Process';
          description = 'Coordination room for exchange listing requirements and process.';
          break;
        case 'ido_onboard':
          roomType = 'ido_launch';
          title = 'IDO Launch Coordination';
          description = 'Coordination room for IDO launch preparation and execution.';
          break;
        case 'influencer_accept':
          roomType = 'influencer_campaign';
          title = 'Influencer Campaign';
          description = 'Collaboration room for influencer marketing campaign.';
          break;
        case 'agency_proposal':
          roomType = 'agency_proposal';
          title = 'Agency Proposal';
          description = 'Discussion room for agency services and proposal.';
          break;
        default:
          throw new Error('Invalid action type');
      }

      return await this.createDealRoom({
        type: roomType,
        title,
        description,
        participants: action.participants,
        projectId: action.projectId,
        status: 'active',
        metadata: action.metadata || {},
        createdBy: action.participants[0] // First participant is the creator
      });
    } catch (error) {
      console.error('Error auto-creating deal room:', error);
      throw error;
    }
  }

  // Archive deal room
  public async archiveDealRoom(roomId: string): Promise<void> {
    try {
      await updateDoc(doc(db!, 'deal_rooms', roomId), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });

      await this.sendSystemMessage(roomId, 'This deal room has been archived.');
    } catch (error) {
      console.error('Error archiving deal room:', error);
      throw error;
    }
  }

  // Complete deal room
  public async completeDealRoom(roomId: string): Promise<void> {
    try {
      await updateDoc(doc(db!, 'deal_rooms', roomId), {
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      await this.sendSystemMessage(roomId, 'This deal has been completed successfully!');
    } catch (error) {
      console.error('Error completing deal room:', error);
      throw error;
    }
  }
}

export const dealRoomService = new DealRoomService();
