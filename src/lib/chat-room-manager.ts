// Chat room management utility
export interface ChatRoom {
  id: string;
  name: string;
  type: 'deal_room' | 'group' | 'direct';
  avatar?: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
    isRead: boolean;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  members: string[];
  status: 'active' | 'inactive';
  projectId?: string;
  founderName?: string;
  founderLogo?: string;
  vcName?: string;
  vcLogo?: string;
  createdAt?: Date;
}

class ChatRoomManager {
  private static instance: ChatRoomManager;
  private chatRooms: ChatRoom[] = [];
  private listeners: ((rooms: ChatRoom[]) => void)[] = [];

  constructor() {
    // Clear any existing test/demo data on initialization
    this.clearChatRooms();
    // Clear test rooms from localStorage
    this.clearTestRooms();
  }

  static getInstance(): ChatRoomManager {
    if (!ChatRoomManager.instance) {
      ChatRoomManager.instance = new ChatRoomManager();
    }
    return ChatRoomManager.instance;
  }

  // Subscribe to chat room updates
  subscribe(callback: (rooms: ChatRoom[]) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.chatRooms);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Add a new chat room (when project is accepted)
  addChatRoom(room: ChatRoom): void {
    // Check if room already exists by ID
    const existingIndex = this.chatRooms.findIndex(r => r.id === room.id);
    if (existingIndex > -1) {
      // Update existing room
      this.chatRooms[existingIndex] = room;
      console.log('Updated existing chat room:', room.id);
    } else {
      // Check for duplicate by name (same founder/VC pair)
      const duplicateIndex = this.chatRooms.findIndex(r => 
        r.name === room.name && r.type === 'deal_room'
      );
      
      if (duplicateIndex > -1) {
        // Reuse existing room (idempotent)
        console.log('Reusing existing deal room for pair:', room.name);
        this.chatRooms[duplicateIndex] = room;
      } else {
        // Add new room
        this.chatRooms.unshift(room); // Add to beginning
        console.log('Added new chat room:', room.id);
      }
    }
    
    // Immediately save to localStorage
    this.saveToStorage();
    
    // Notify all listeners
    this.notifyListeners();
    
    console.log('Chat rooms saved to localStorage. Total rooms:', this.chatRooms.length);
  }

  // Remove a chat room
  removeChatRoom(roomId: string): void {
    this.chatRooms = this.chatRooms.filter(r => r.id !== roomId);
    this.notifyListeners();
  }

  // Update a chat room
  updateChatRoom(roomId: string, updates: Partial<ChatRoom>): void {
    const index = this.chatRooms.findIndex(r => r.id === roomId);
    if (index > -1) {
      this.chatRooms[index] = { ...this.chatRooms[index], ...updates };
      this.notifyListeners();
    }
  }

  // Get all chat rooms
  getChatRooms(): ChatRoom[] {
    return [...this.chatRooms];
  }

  // Get chat room by ID
  getChatRoom(roomId: string): ChatRoom | undefined {
    return this.chatRooms.find(r => r.id === roomId);
  }

  // Create a deal room from project acceptance
  createDealRoomFromProject(project: {
    id: string;
    title: string;
    logoUrl?: string;
    founderName?: string;
    founderLogo?: string;
  }, vcInfo: {
    name: string;
    logo?: string;
  }): ChatRoom {
    const roomId = `deal-room-${project.id}-${Date.now()}`;
    const founderName = project.founderName || 'Project Founder';
    const vcName = vcInfo.name;
    
    return {
      id: roomId,
      name: `${founderName} / ${vcName}`, // Proper naming format
      type: 'deal_room',
      avatar: project.logoUrl || '/cryptorafts.logo.png', // Project logo as primary avatar
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      members: ['user1', 'user2', 'founder-1', 'raftai'], // Include RaftAI bot
      status: 'active',
      projectId: project.id,
      founderName: founderName,
      founderLogo: project.founderLogo || '/cryptorafts.logo.png', // Dual logos support
      vcName: vcName,
      vcLogo: vcInfo.logo || '/cryptorafts.logo.png',
      createdAt: new Date(),
      lastMessage: {
        content: `RaftAI created this deal room for ${founderName} / ${vcName}.`,
        sender: 'RaftAI',
        timestamp: new Date(),
        isRead: false
      }
    };
  }

  // Clear all chat rooms
  clearChatRooms(): void {
    this.chatRooms = [];
    this.notifyListeners();
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatRooms');
    }
  }

  // Clear test/demo rooms from localStorage
  clearTestRooms(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chatRooms');
        if (stored) {
          const rooms = JSON.parse(stored);
          const filteredRooms = rooms.filter((room: ChatRoom) => {
            // Remove test rooms
            return !room.id.includes('test') && 
                   !room.id.includes('demo') && 
                   !room.name.includes('Test') && 
                   !room.name.includes('Demo');
          });
          
          if (filteredRooms.length !== rooms.length) {
            localStorage.setItem('chatRooms', JSON.stringify(filteredRooms));
            console.log('🧹 Removed test rooms from localStorage');
          }
        }
      }
    } catch (error) {
      console.error('Error clearing test rooms:', error);
    }
  }

  // Force refresh from localStorage
  refreshFromStorage(): void {
    this.loadFromStorage();
    this.notifyListeners();
    console.log('Chat rooms refreshed from localStorage. Total rooms:', this.chatRooms.length);
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.chatRooms]);
      } catch (error) {
        console.error('Error notifying chat room listener:', error);
      }
    });
  }

  // Load chat rooms from localStorage (for demo purposes)
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('chatRooms');
      if (stored) {
        this.chatRooms = JSON.parse(stored).map((room: any) => ({
          ...room,
          createdAt: room.createdAt ? new Date(room.createdAt) : new Date(),
          lastMessage: room.lastMessage ? {
            ...room.lastMessage,
            timestamp: new Date(room.lastMessage.timestamp)
          } : undefined
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading chat rooms from storage:', error);
    }
  }

  // Save chat rooms to localStorage (for demo purposes)
  saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatRooms', JSON.stringify(this.chatRooms));
      }
    } catch (error) {
      console.error('Error saving chat rooms to storage:', error);
    }
  }
}

export const chatRoomManager = ChatRoomManager.getInstance();

// Initialize on client side only
if (typeof window !== 'undefined') {
  // Load from localStorage on initialization
  chatRoomManager.loadFromStorage();
  
  // Auto-save to localStorage when rooms change (only once)
  let autoSaveSubscribed = false;
  if (!autoSaveSubscribed) {
    autoSaveSubscribed = true;
    chatRoomManager.subscribe((rooms) => {
      chatRoomManager.saveToStorage();
    });
  }
  
  // Production utilities only
  (window as any).chatRoomManager = {
    refresh: () => {
      chatRoomManager.refreshFromStorage();
      console.log('Chat rooms refreshed from localStorage');
    },
    status: () => {
      const rooms = chatRoomManager.getChatRooms();
      console.log('📊 Chat Room Status:');
      console.log(`- Total rooms: ${rooms.length}`);
      console.log(`- localStorage key: chatRooms`);
      console.log(`- Rooms:`, rooms);
      return rooms;
    },
    deleteRoom: (roomId: string) => {
      chatRoomManager.removeChatRoom(roomId);
      console.log(`🗑️ Deleted chat room: ${roomId}`);
      console.log('Remaining rooms:', chatRoomManager.getChatRooms().length);
    }
  };
  
  console.log('🛠️ Chat room manager loaded!');
  console.log('Available commands:');
  console.log('- chatRoomManager.refresh() - Refresh rooms from localStorage');
  console.log('- chatRoomManager.status() - Show detailed status');
  console.log('- chatRoomManager.deleteRoom("roomId") - Delete specific room');
}
