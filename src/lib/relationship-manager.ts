"use client";

import { db } from './firebase.client';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team';
  projectId: string;
  members: Array<{
    uid: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: any;
    lastSeenAt?: any;
  }>;
  ownerId: string;
  status: 'active' | 'archived' | 'closed';
  metadata: {
    dealType?: 'seed' | 'series_a' | 'series_b' | 'strategic';
    listingType?: 'spot' | 'futures' | 'derivatives';
    idoType?: 'public' | 'private' | 'whitelist';
    campaignType?: 'social' | 'content' | 'influencer';
    proposalType?: 'marketing' | 'development' | 'advisory';
  };
  settings: {
    disappearing: 'off' | '1h' | '24h' | '7d';
    slowMode: boolean;
    slowModeDelay: number; // seconds
    allowFileUploads: boolean;
    allowPolls: boolean;
    allowTasks: boolean;
    allowEvents: boolean;
  };
  createdAt: any;
  lastActivityAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'file' | 'image' | 'video' | 'voice' | 'poll' | 'task' | 'event' | 'aiReply' | 'system';
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileUrl?: string;
    pollOptions?: string[];
    pollResults?: { [option: string]: number };
    taskAssignee?: string;
    taskDueDate?: any;
    taskStatus?: 'todo' | 'doing' | 'done';
    eventStart?: any;
    eventEnd?: any;
    eventAttendees?: string[];
    aiCommand?: string;
    aiResponse?: string;
  };
  replyTo?: string;
  reactions: { [emoji: string]: string[] }; // emoji -> array of user IDs
  readBy: { [userId: string]: any }; // userId -> timestamp
  pinned: boolean;
  edited: boolean;
  editedAt?: any;
  deleted: boolean;
  deletedAt?: any;
  deletedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export interface RelationshipTrigger {
  type: 'vc_accept' | 'exchange_interest' | 'ido_onboard' | 'influencer_accept' | 'agency_propose';
  projectId: string;
  initiatorId: string;
  targetId: string;
  metadata: any;
}

export class RelationshipManager {
  private static instance: RelationshipManager;
  
  public static getInstance(): RelationshipManager {
    if (!RelationshipManager.instance) {
      RelationshipManager.instance = new RelationshipManager();
    }
    return RelationshipManager.instance;
  }

  /**
   * Create room from relationship trigger
   */
  async createRoomFromTrigger(trigger: RelationshipTrigger): Promise<string> {
    try {
      const roomRef = doc(collection(db!, 'rooms'));
      const roomName = this.generateRoomName(trigger);
      const roomType = this.getRoomTypeFromTrigger(trigger);
      
      // Get project details
      const projectDoc = await getDoc(doc(db!, 'projects', trigger.projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      
      // Create room
      const room: Room = {
        id: roomRef.id,
        name: roomName,
        type: roomType,
        projectId: trigger.projectId,
        members: [
          {
            uid: project.founderId,
            role: 'owner',
            joinedAt: serverTimestamp()
          },
          {
            uid: trigger.targetId,
            role: 'member',
            joinedAt: serverTimestamp()
          }
        ],
        ownerId: project.founderId,
        status: 'active',
        metadata: this.getRoomMetadata(trigger),
        settings: {
          disappearing: 'off',
          slowMode: false,
          slowModeDelay: 0,
          allowFileUploads: true,
          allowPolls: true,
          allowTasks: true,
          allowEvents: true
        },
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db!, 'rooms'), room);

      // Create welcome message
      await this.createWelcomeMessage(roomRef.id, trigger, project);

      // Update project interest counters
      await this.updateProjectInterestCounters(trigger.projectId, trigger.type);

      return roomRef.id;

    } catch (error) {
      console.error('Error creating room from trigger:', error);
      throw error;
    }
  }

  /**
   * Get rooms for user
   */
  async getUserRooms(uid: string): Promise<Room[]> {
    try {
      const roomsQuery = query(
        collection(db!, 'rooms'),
        where('members', 'array-contains', { uid }),
        where('status', '==', 'active'),
        orderBy('lastActivityAt', 'desc')
      );

      const snapshot = await getDocs(roomsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));

    } catch (error) {
      console.error('Error getting user rooms:', error);
      throw error;
    }
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const roomDoc = await getDoc(doc(db!, 'rooms', roomId));
      if (!roomDoc.exists()) {
        return null;
      }

      return { id: roomDoc.id, ...roomDoc.data() } as Room;

    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  /**
   * Add member to room
   */
  async addMemberToRoom(roomId: string, uid: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if user is already a member
      const existingMember = room.members.find(m => m.uid === uid);
      if (existingMember) {
        throw new Error('User is already a member of this room');
      }

      // Add new member
      const updatedMembers = [
        ...room.members,
        {
          uid,
          role,
          joinedAt: serverTimestamp()
        }
      ];

      await updateDoc(doc(db!, 'rooms', roomId), {
        members: updatedMembers,
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create system message
      await this.createSystemMessage(roomId, `User joined the room`);

    } catch (error) {
      console.error('Error adding member to room:', error);
      throw error;
    }
  }

  /**
   * Remove member from room
   */
  async removeMemberFromRoom(roomId: string, uid: string): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Filter out the member
      const updatedMembers = room.members.filter(m => m.uid !== uid);

      await updateDoc(doc(db!, 'rooms', roomId), {
        members: updatedMembers,
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create system message
      await this.createSystemMessage(roomId, `User left the room`);

    } catch (error) {
      console.error('Error removing member from room:', error);
      throw error;
    }
  }

  /**
   * Archive room
   */
  async archiveRoom(roomId: string, archivedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db!, 'rooms', roomId), {
        status: 'archived',
        archivedBy,
        archivedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create system message
      await this.createSystemMessage(roomId, `Room archived`);

    } catch (error) {
      console.error('Error archiving room:', error);
      throw error;
    }
  }

  /**
   * Generate room name from trigger
   */
  private generateRoomName(trigger: RelationshipTrigger): string {
    switch (trigger.type) {
      case 'vc_accept':
        return 'Deal Room';
      case 'exchange_interest':
        return 'Listing Room';
      case 'ido_onboard':
        return 'IDO Room';
      case 'influencer_accept':
        return 'Campaign Room';
      case 'agency_propose':
        return 'Proposal Room';
      default:
        return 'Project Room';
    }
  }

  /**
   * Get room type from trigger
   */
  private getRoomTypeFromTrigger(trigger: RelationshipTrigger): Room['type'] {
    switch (trigger.type) {
      case 'vc_accept':
        return 'deal';
      case 'exchange_interest':
        return 'listing';
      case 'ido_onboard':
        return 'ido';
      case 'influencer_accept':
        return 'campaign';
      case 'agency_propose':
        return 'proposal';
      default:
        return 'team';
    }
  }

  /**
   * Get room metadata from trigger
   */
  private getRoomMetadata(trigger: RelationshipTrigger): Room['metadata'] {
    switch (trigger.type) {
      case 'vc_accept':
        return {
          dealType: trigger.metadata?.dealType || 'seed'
        };
      case 'exchange_interest':
        return {
          listingType: trigger.metadata?.listingType || 'spot'
        };
      case 'ido_onboard':
        return {
          idoType: trigger.metadata?.idoType || 'public'
        };
      case 'influencer_accept':
        return {
          campaignType: trigger.metadata?.campaignType || 'social'
        };
      case 'agency_propose':
        return {
          proposalType: trigger.metadata?.proposalType || 'marketing'
        };
      default:
        return {};
    }
  }

  /**
   * Create welcome message
   */
  private async createWelcomeMessage(roomId: string, trigger: RelationshipTrigger, project: any): Promise<void> {
    try {
      const messageRef = doc(collection(db!, 'messages'));
      const welcomeText = this.generateWelcomeMessage(trigger, project);
      
      const message: Message = {
        id: messageRef.id,
        roomId,
        senderId: 'system',
        type: 'system',
        content: welcomeText,
        reactions: {},
        readBy: {},
        pinned: false,
        edited: false,
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db!, 'messages'), message);

    } catch (error) {
      console.error('Error creating welcome message:', error);
      throw error;
    }
  }

  /**
   * Create system message
   */
  private async createSystemMessage(roomId: string, content: string): Promise<void> {
    try {
      const messageRef = doc(collection(db!, 'messages'));
      
      const message: Message = {
        id: messageRef.id,
        roomId,
        senderId: 'system',
        type: 'system',
        content,
        reactions: {},
        readBy: {},
        pinned: false,
        edited: false,
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db!, 'messages'), message);

    } catch (error) {
      console.error('Error creating system message:', error);
      throw error;
    }
  }

  /**
   * Generate welcome message
   */
  private generateWelcomeMessage(trigger: RelationshipTrigger, project: any): string {
    switch (trigger.type) {
      case 'vc_accept':
        return `🎉 Welcome to the Deal Room for ${project.name}! This is where we'll discuss the investment opportunity, due diligence, and next steps.`;
      case 'exchange_interest':
        return `🚀 Welcome to the Listing Room for ${project.name}! Let's discuss listing requirements, integration, and market making.`;
      case 'ido_onboard':
        return `💎 Welcome to the IDO Room for ${project.name}! This is where we'll plan the token launch and community engagement.`;
      case 'influencer_accept':
        return `📢 Welcome to the Campaign Room for ${project.name}! Let's create amazing content and reach the community.`;
      case 'agency_propose':
        return `🤝 Welcome to the Proposal Room for ${project.name}! This is where we'll discuss services and collaboration.`;
      default:
        return `👋 Welcome to the project room for ${project.name}!`;
    }
  }

  /**
   * Update project interest counters
   */
  private async updateProjectInterestCounters(projectId: string, triggerType: string): Promise<void> {
    try {
      const projectDoc = await getDoc(doc(db!, 'projects', projectId));
      if (!projectDoc.exists()) return;

      const project = projectDoc.data();
      const interest = project.interest || { vcs: 0, exchanges: 0, idos: 0, influencers: 0, agencies: 0 };

      switch (triggerType) {
        case 'vc_accept':
          interest.vcs += 1;
          break;
        case 'exchange_interest':
          interest.exchanges += 1;
          break;
        case 'ido_onboard':
          interest.idos += 1;
          break;
        case 'influencer_accept':
          interest.influencers += 1;
          break;
        case 'agency_propose':
          interest.agencies += 1;
          break;
      }

      await updateDoc(doc(db!, 'projects', projectId), {
        interest,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating project interest counters:', error);
      throw error;
    }
  }
}

export const relationshipManager = RelationshipManager.getInstance();
