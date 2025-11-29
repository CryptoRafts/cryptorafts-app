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
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase.client";
import { ChatRoom, ChatMessage, ChatUser, RoomCreationContext } from "./chatTypes";

export class ChatService {
  private static instance: ChatService;
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Room Management
  async createRoom(context: RoomCreationContext): Promise<string> {
    const roomData: Omit<ChatRoom, "id"> = {
      name: context.name,
      type: context.type,
      projectId: context.projectId,
      orgId: context.orgId,
      members: context.participants,
      ownerId: context.ownerId,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      privacy: {
        inviteOnly: true,
        ...context.privacy
      },
      settings: {
        filesAllowed: true,
        calls: true,
        ...context.settings
      },
      status: "active"
    };

    const docRef = await addDoc(collection(db!, "groupChats"), {
      ...roomData,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    });

    return docRef.id;
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const docRef = doc(db!, "groupChats", roomId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: this.safeToDate(data.createdAt),
        lastActivityAt: this.safeToDate(data.lastActivityAt)
      } as ChatRoom;
    }
    
    return null;
  }

  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    console.log("ChatService.getUserRooms: Loading rooms for user:", userId);
    try {
      const q = query(
        collection(db!, "groupChats"),
        where("members", "array-contains", userId),
        where("status", "==", "active"),
        orderBy("lastActivityAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const rooms: ChatRoom[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rooms.push({
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt),
          lastActivityAt: this.safeToDate(data.lastActivityAt)
        } as ChatRoom);
      });

      console.log("ChatService.getUserRooms: Found", rooms.length, "rooms");
      return rooms;
    } catch (error) {
      console.error("ChatService.getUserRooms: Error loading rooms:", error);
      return [];
    }
  }

  async updateRoomActivity(roomId: string): Promise<void> {
    const roomRef = doc(db!, "groupChats", roomId);
    await updateDoc(roomRef, {
      lastActivityAt: serverTimestamp()
    });
  }

  async addMemberToRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db!, "groupChats", roomId);
    const room = await this.getRoom(roomId);
    
    if (room && !room.members.includes(userId)) {
      await updateDoc(roomRef, {
        members: [...room.members, userId]
      });
    }
  }

  async removeMemberFromRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db!, "groupChats", roomId);
    const room = await this.getRoom(roomId);
    
    if (room) {
      const updatedMembers = room.members.filter(id => id !== userId);
      await updateDoc(roomRef, {
        members: updatedMembers
      });
    }
  }

  // Message Management
  async sendMessage(roomId: string, message: Omit<ChatMessage, "id" | "roomId" | "createdAt">): Promise<string> {
    const messageData = {
      ...message,
      roomId,
      createdAt: serverTimestamp(),
      readBy: [message.senderId] // Sender has read their own message
    };

    const docRef = await addDoc(collection(db!, "groupChats", roomId, "messages"), messageData);
    
    // Update room activity
    await this.updateRoomActivity(roomId);
    
    return docRef.id;
  }

  async getMessages(roomId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    const q = query(
      collection(db!, "groupChats", roomId, "messages"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include messages that are not deleted
        if (!data.deletedAt) {
          messages.push({
            id: doc.id,
            roomId,
            ...data,
            createdAt: this.safeToDate(data.createdAt),
            editedAt: data.editedAt ? this.safeToDate(data.editedAt) : undefined,
            deletedAt: data.deletedAt ? this.safeToDate(data.deletedAt) : undefined
          } as ChatMessage);
        }
      });

    return messages.reverse(); // Return in chronological order
  }

  async markMessageAsRead(roomId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db!, "groupChats", roomId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const data = messageDoc.data();
      const readBy = data.readBy || [];
      
      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId]
        });
      }
    }
  }

  async addReaction(roomId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    const messageRef = doc(db!, "groupChats", roomId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const data = messageDoc.data();
      const reactions = data.reactions || {};
      
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      } else {
        // Remove reaction if already exists
        reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }
      
      await updateDoc(messageRef, { reactions });
    }
  }

  // Real-time subscriptions
  subscribeToRoom(roomId: string, callback: (room: ChatRoom) => void): () => void {
    const roomRef = doc(db!, "groupChats", roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt),
          lastActivityAt: this.safeToDate(data.lastActivityAt)
        } as ChatRoom);
      }
    });
  }

  subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    console.log("ChatService: Setting up message subscription for room:", roomId);
    const q = query(
      collection(db!, "groupChats", roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    return onSnapshot(q, (querySnapshot) => {
      console.log("ChatService: Snapshot received with", querySnapshot.size, "documents");
      const messages: ChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("ChatService: Processing message:", doc.id, data);
        
        // FIXED: Safely convert timestamps - handle both Firestore Timestamps and numbers
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
        
        // Only include messages that are not deleted
        if (!data.deletedAt) {
          messages.push({
            id: doc.id,
            roomId,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(data.createdAt || Date.now()),
            editedAt: safeToDate(data.editedAt),
            deletedAt: safeToDate(data.deletedAt)
          } as ChatMessage);
        }
      });
      
      console.log("ChatService: Returning", messages.length, "messages");
      callback(messages); // Already in chronological order
    }, (error) => {
      console.error("ChatService: Error in message subscription:", error);
    });
  }

  subscribeToRoomMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    return this.subscribeToMessages(roomId, callback);
  }

  subscribeToUserRooms(userId: string, callback: (rooms: ChatRoom[]) => void): () => void {
    console.log("ChatService.subscribeToUserRooms: Setting up subscription for user:", userId);
    
    const q = query(
      collection(db!, "groupChats"),
      where("members", "array-contains", userId),
      where("status", "==", "active"),
      orderBy("lastActivityAt", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
      console.log("ChatService.subscribeToUserRooms: Snapshot received with", querySnapshot.size, "rooms");
      const rooms: ChatRoom[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("ChatService.subscribeToUserRooms: Room:", doc.id, data.name, "Type:", data.type);
        rooms.push({
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt),
          lastActivityAt: this.safeToDate(data.lastActivityAt)
        } as ChatRoom);
      });
      
      console.log("ChatService.subscribeToUserRooms: Returning", rooms.length, "rooms");
      callback(rooms);
    }, (error) => {
      console.error("ChatService.subscribeToUserRooms: Error:", error);
      callback([]); // Return empty array on error
    });
  }

  async markAsRead(roomId: string, messageId: string, userId: string): Promise<void> {
    return this.markMessageAsRead(roomId, messageId, userId);
  }

  // AI Commands
  async processAICommand(roomId: string, command: any, userId: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          command: typeof command === 'string' ? command : command.command,
          userId,
          context: command.context,
          messageIds: command.messageIds
        })
      });
      
      if (!response.ok) {
        throw new Error('AI command failed');
      }
      
      const data = await response.json();
      
      // Send AI response as a message
      await this.sendMessage(roomId, {
        senderId: 'raftai',
        type: 'aiReply',
        text: data.response || 'AI processing complete',
        readBy: []
      });
      
      return data.response || 'AI processing complete';
    } catch (error) {
      console.error('AI command error:', error);
      return 'AI command failed. Please try again.';
    }
  }

  // Room-specific creation helpers
  async createDealRoom(founderId: string, vcId: string, projectId: string): Promise<string> {
    return this.createRoom({
      type: "deal",
      projectId,
      participants: [founderId, vcId],
      ownerId: founderId,
      name: `Deal Room - Project ${projectId}`
    });
  }

  async createListingRoom(founderId: string, exchangeId: string, projectId: string): Promise<string> {
    return this.createRoom({
      type: "listing",
      projectId,
      participants: [founderId, exchangeId],
      ownerId: founderId,
      name: `Listing Room - Project ${projectId}`
    });
  }

  async createIDORoom(founderId: string, idoId: string, projectId: string): Promise<string> {
    return this.createRoom({
      type: "ido",
      projectId,
      participants: [founderId, idoId],
      ownerId: founderId,
      name: `IDO Room - Project ${projectId}`
    });
  }

  async createCampaignRoom(founderId: string, influencerId: string, projectId: string): Promise<string> {
    return this.createRoom({
      type: "campaign",
      projectId,
      participants: [founderId, influencerId],
      ownerId: founderId,
      name: `Campaign Room - Project ${projectId}`
    });
  }

  async createProposalRoom(founderId: string, agencyId: string, projectId: string): Promise<string> {
    return this.createRoom({
      type: "proposal",
      projectId,
      participants: [founderId, agencyId],
      ownerId: founderId,
      name: `Proposal Room - Project ${projectId}`
    });
  }
}

export const chatService = ChatService.getInstance();
