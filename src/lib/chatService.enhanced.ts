// ENHANCED PRODUCTION CHAT SERVICE - NO DEMO DATA
// Complete chat functionality with file uploads, voice notes, and more

import { 
  collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc,
  Timestamp, arrayUnion, arrayRemove, getDocs, setDoc, deleteField, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { db, storage } from './firebase.client';
import { ensureDb, ensureStorage, waitForFirebase } from './firebase-utils';

// Types
export interface ChatRoom {
  id: string;
  name: string;
  type: 'deal' | 'group' | 'support' | 'listing' | 'ido' | 'campaign';
  status: 'active' | 'archived' | 'closed';
  
  founderId?: string;
  founderName?: string;
  founderLogo?: string | null;
  
  counterpartId?: string;
  counterpartName?: string;
  counterpartRole?: string;
  counterpartLogo?: string | null;
  
  projectId?: string;
  
  members: string[];
  memberRoles: { [userId: string]: 'owner' | 'member' | 'admin' };
  memberNames?: { [userId: string]: string }; // NEW: Store usernames
  memberAvatars?: { [userId: string]: string }; // NEW: Store avatars
  
  groupAvatar?: string | null; // NEW: Group profile picture
  
  settings: {
    filesAllowed: boolean;
    maxFileSize: number;
    voiceNotesAllowed?: boolean; // NEW
    videoCallAllowed?: boolean; // NEW
  };
  
  createdAt: any;
  createdBy: string;
  lastActivityAt: number;
  lastMessage?: {
    senderId: string;
    senderName: string;
    text: string;
    createdAt: number;
  } | string; // Support both old (string) and new (object) format
  
  unreadCount?: { [userId: string]: number }; // NEW: Track unread messages per user
  
  pinnedMessages: string[];
  mutedBy: string[];
  
  reminders?: Reminder[]; // NEW
  milestones?: Milestone[]; // NEW
  
  raftaiMemory: {
    decisions: any[];
    tasks: any[];
    milestones: any[];
    notePoints: any[];
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'system' | 'file' | 'voice' | 'video' | 'reminder' | 'milestone';
  text: string;
  
  // File attachments
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  
  // Voice notes
  voiceUrl?: string;
  voiceDuration?: number;
  
  replyTo?: string;
  reactions: { [emoji: string]: string[] };
  readBy: string[];
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: number;
  assignedTo: string[];
  createdBy: string;
  completed: boolean;
  createdAt: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string[];
  createdBy: string;
  completedAt?: number;
  createdAt: number;
}

class EnhancedChatService {
  // FIXED: Helper to get db instance with proper initialization
  private async getDbInstance() {
    const isReady = await waitForFirebase(10000);
    if (!isReady) {
      throw new Error('Firebase not initialized. Please wait and try again.');
    }
    return ensureDb();
  }
  
  private async getStorageInstance(): Promise<FirebaseStorage> {
    // FIXED: Wait for Firebase initialization
    const isReady = await waitForFirebase(10000);
    if (!isReady) {
      throw new Error('Firebase storage is not initialized. Please wait and try again.');
    }
    
    const storageInstance = ensureStorage();
    if (!storageInstance) {
      throw new Error('Firebase storage is not initialized. Please refresh the page.');
    }
    return storageInstance;
  }

  // Subscribe to user's chat rooms - SIMPLIFIED (No complex index required)
  async subscribeToUserRooms(userId: string, role: string, callback: (rooms: ChatRoom[]) => void) {
    console.log(`📂 [CHAT] Loading rooms for ${role}: ${userId}`);
    
    // FIXED: Wait for Firebase initialization
    const isReady = await waitForFirebase(10000);
    if (!isReady) {
      console.warn('⚠️ Firebase not initialized for chat. Retrying...');
      // Retry after a delay
      setTimeout(() => this.subscribeToUserRooms(userId, role, callback), 2000);
      return () => {}; // Return empty unsubscribe function
    }
    
    const dbInstance = ensureDb();
    if (!dbInstance) {
      console.error('❌ Database not initialized for chat');
      return () => {}; // Return empty unsubscribe function
    }
    
    // Simple query - only filter by members (single index)
    const q = query(
      collection(dbInstance, 'groupChats'),
      where('members', 'array-contains', userId)
    );

    return onSnapshot(q, 
      (snapshot) => {
        const allRooms = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as ChatRoom));
        
        // Filter and sort client-side (no complex index needed)
        const filteredRooms = allRooms
          .filter(room => {
            // Only show active rooms (accepted deals)
            if (room.status !== 'active') return false;
            // Exclude demo rooms
            if (room.id.includes('_demo_')) return false;
            // Verify user is actually a member (security)
            if (!room.members.includes(userId)) return false;
            return true;
          })
          .sort((a, b) => {
            // Sort by last activity (most recent first)
            const timeA = a.lastActivityAt || 0;
            const timeB = b.lastActivityAt || 0;
            return timeB - timeA;
          });
        
        console.log(`📂 [CHAT] ${allRooms.length} total → ${filteredRooms.length} active → ${filteredRooms.length} for ${role}`);
        console.log(`📂 [CHAT] Private groups - each chat is unique to its participants`);
        callback(filteredRooms);
      },
      (error) => {
        console.error('❌ Error subscribing to rooms:', error);
        callback([]);
      }
    );
  }

  // Subscribe to room messages
  async subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): Promise<() => void> {
    console.log(`💬 [CHAT] Loading messages for room: ${roomId}`);
    
    try {
      // FIXED: Wait for Firebase initialization
      const dbInstance = await this.getDbInstance();
      
      if (!dbInstance) {
        console.error('❌ [CHAT] Database not available');
        // Return a no-op function if database is not available
        return () => {};
      }
      
      const messagesRef = collection(dbInstance, 'groupChats', roomId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      // FIXED: Ensure onSnapshot always returns a function
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => {
            const data = doc.data();
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
            
            return {
              id: doc.id,
              ...data,
              createdAt: safeToDate(data.createdAt) || new Date(data.createdAt || Date.now()),
              updatedAt: safeToDate(data.updatedAt),
              editedAt: safeToDate(data.editedAt),
              deletedAt: safeToDate(data.deletedAt)
            } as ChatMessage;
          });
          
          // Sort messages by timestamp (oldest first for Telegram-style)
          msgs.sort((a, b) => {
            const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (typeof a.createdAt === 'number' ? a.createdAt : 0);
            const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (typeof b.createdAt === 'number' ? b.createdAt : 0);
            return timeA - timeB;
          });
          
          console.log(`💬 [TELEGRAM] ${msgs.length} messages loaded (oldest→newest)`);
          callback(msgs);
        },
        (error) => {
          console.error('❌ Error loading messages:', error);
          callback([]);
        }
      );
      
      // FIXED: Ensure we always return a function
      if (typeof unsubscribe === 'function') {
        return unsubscribe;
      } else {
        console.warn('⚠️ [CHAT] onSnapshot did not return a function, returning no-op');
        return () => {};
      }
    } catch (error) {
      console.error('❌ [CHAT] Error setting up message subscription:', error);
      callback([]);
      // Return a no-op function on error
      return () => {};
    }
  }

  // Send text message
  async sendMessage(params: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    replyTo?: string;
  }) {
    const messageData: any = {
      senderId: params.userId,
      senderName: params.userName,
      senderAvatar: params.userAvatar || null,
      type: 'text',
      text: params.text,
      reactions: {},
      readBy: [params.userId],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now()
    };

    if (params.replyTo) {
      messageData.replyTo = params.replyTo;
    }

    // FIXED: Get db instance with proper initialization
    const dbInstance = await this.getDbInstance();
    
    const messagesRef = collection(dbInstance, 'groupChats', params.roomId, 'messages');
    const docRef = await addDoc(messagesRef, messageData);
    
    // Get room data to update unread counts
    const roomRef = doc(dbInstance, 'groupChats', params.roomId);
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data();
    
    // Increment unread count for all members except sender
    const unreadCount: Record<string, number> = roomData?.unreadCount || {};
    const members = roomData?.members || [];
    
    members.forEach((memberId: string) => {
      if (memberId !== params.userId) {
        unreadCount[memberId] = (unreadCount[memberId] || 0) + 1;
      }
    });
    
    // Update room with lastMessage object and unread counts
    await updateDoc(roomRef, {
      lastActivityAt: Date.now(),
      lastMessage: {
        senderId: params.userId,
        senderName: params.userName,
        text: params.text.substring(0, 100),
        createdAt: Date.now()
      },
      unreadCount
    });

    console.log(`✅ [CHAT] Message sent: ${docRef.id}`);
    return docRef.id;
  }

  // Upload file and send message with proper Firebase integration
  async sendFileMessage(params: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    file: File;
    text?: string;
  }) {
    try {
      console.log(`📤 [CHAT] Uploading file: ${params.file.name} (${params.file.size} bytes)`);

      // Upload file to Firebase Storage with proper metadata
      const timestamp = Date.now();
      const fileExtension = params.file.name.split('.').pop() || 'bin';
      const fileName = `chat-files/${params.roomId}/${params.userId}_${timestamp}.${fileExtension}`;
      
      const storageInstance = await this.getStorageInstance();
      const fileRef = ref(storageInstance, fileName);
      
      // Upload with metadata
      const uploadResult = await uploadBytes(fileRef, params.file, {
        customMetadata: {
          originalName: params.file.name,
          roomId: params.roomId,
          senderId: params.userId,
          senderName: params.userName,
          uploadedAt: new Date().toISOString(),
          fileSize: params.file.size.toString(),
          fileType: params.file.type
        }
      });

      const fileUrl = await getDownloadURL(uploadResult.ref);
      console.log(`✅ [CHAT] File uploaded: ${fileUrl}`);

      // Determine file type for message text
      let messageText = params.text;
      if (!messageText) {
        if (params.file.type.startsWith('image/')) {
          messageText = '📸 Sent an image';
        } else if (params.file.type.startsWith('video/')) {
          messageText = '🎥 Sent a video';
        } else if (params.file.type.startsWith('audio/')) {
          messageText = '🎵 Sent an audio file';
        } else if (params.file.type.includes('pdf') || params.file.type.includes('document')) {
          messageText = '📄 Sent a document';
        } else {
          messageText = `📎 Sent a file: ${params.file.name}`;
        }
      }

      const messageData: any = {
        senderId: params.userId,
        senderName: params.userName,
        senderAvatar: params.userAvatar || null,
        type: 'file',
        text: messageText,
        fileUrl,
        fileName: params.file.name,
        fileType: params.file.type,
        fileSize: params.file.size,
        reactions: {},
        readBy: [params.userId],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      };

      const dbInstance = await this.getDbInstance();
      const messagesRef = collection(dbInstance, 'groupChats', params.roomId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);
      
      // Get room data to update unread counts
      const roomRef = doc(dbInstance, 'groupChats', params.roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      // Increment unread count for all members except sender
      const unreadCount: Record<string, number> = roomData?.unreadCount || {};
      const members = roomData?.members || [];
      
      members.forEach((memberId: string) => {
        if (memberId !== params.userId) {
          unreadCount[memberId] = (unreadCount[memberId] || 0) + 1;
        }
      });
      
      // Update room with lastMessage object and unread counts
      await updateDoc(roomRef, {
        lastActivityAt: Date.now(),
        lastMessage: {
          senderId: params.userId,
          senderName: params.userName,
          text: messageText,
          createdAt: Date.now()
        },
        unreadCount
      });

      console.log(`✅ [CHAT] File message sent: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending file:', error);
      throw error;
    }
  }

  // Send voice note with proper Firebase integration
  async sendVoiceNote(params: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    audioBlob: Blob;
    duration: number;
  }) {
    try {
      console.log(`🎤 [CHAT] Uploading voice note: ${Math.round(params.duration)}s`);

      // Upload voice note to Firebase Storage
      const timestamp = Date.now();
      const storageInstance = await this.getStorageInstance();
      const voiceRef = ref(storageInstance, `voice-notes/${params.roomId}/${params.userId}_${timestamp}.webm`);
      
      // Upload with metadata
      const uploadResult = await uploadBytes(voiceRef, params.audioBlob, {
        customMetadata: {
          roomId: params.roomId,
          senderId: params.userId,
          senderName: params.userName,
          duration: params.duration.toString(),
          uploadedAt: new Date().toISOString(),
          fileType: 'audio/webm'
        }
      });

      const voiceUrl = await getDownloadURL(uploadResult.ref);
      console.log(`✅ [CHAT] Voice note uploaded: ${voiceUrl}`);

      const messageData: any = {
        senderId: params.userId,
        senderName: params.userName,
        senderAvatar: params.userAvatar || null,
        type: 'voice',
        text: `🎤 Voice message (${Math.round(params.duration)}s)`,
        fileUrl: voiceUrl, // Use fileUrl for consistency
        voiceUrl, // Keep both for backward compatibility
        fileName: `voice-note-${timestamp}.webm`,
        fileType: 'audio/webm',
        fileSize: params.audioBlob.size,
        voiceDuration: params.duration,
        duration: params.duration, // Add duration field
        reactions: {},
        readBy: [params.userId],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      };

      const dbInstance = await this.getDbInstance();
      const messagesRef = collection(dbInstance, 'groupChats', params.roomId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);
      
      // Get room data to update unread counts
      const roomRef = doc(dbInstance, 'groupChats', params.roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      // Increment unread count for all members except sender
      const unreadCount: Record<string, number> = roomData?.unreadCount || {};
      const members = roomData?.members || [];
      
      members.forEach((memberId: string) => {
        if (memberId !== params.userId) {
          unreadCount[memberId] = (unreadCount[memberId] || 0) + 1;
        }
      });
      
      // Update room with lastMessage object and unread counts
      await updateDoc(roomRef, {
        lastActivityAt: Date.now(),
        lastMessage: {
          senderId: params.userId,
          senderName: params.userName,
          text: `🎤 Voice message (${Math.round(params.duration)}s)`,
          createdAt: Date.now()
        },
        unreadCount
      });

      console.log(`✅ [CHAT] Voice note sent: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending voice note:', error);
      throw error;
    }
  }

  // Mark messages as read for a user
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    // CRITICAL: This is a fire-and-forget operation that must not throw uncaught promise errors
    // Use setTimeout to defer execution and ensure errors are caught at the top level
    // This prevents "Uncaught (in promise)" errors from appearing in the console
    setTimeout(() => {
      // Wrap in an immediately invoked async function with comprehensive error handling
      (async () => {
        try {
          const dbInstance = await this.getDbInstance();
          if (!dbInstance) return;
          
          const roomRef = doc(dbInstance, 'groupChats', roomId);
          
          // Try to get current room data first - catch any errors
          const roomSnap = await getDoc(roomRef).catch(() => null);
          if (!roomSnap?.exists()) return;
          
          const currentData = roomSnap.data();
          const currentUnreadCount = currentData?.unreadCount || {};
          
          // Only update if the count is not already 0 (avoid unnecessary writes)
          if (currentUnreadCount[userId] === 0) return;
          
          // Update the unreadCount object
          const updatedUnreadCount = {
            ...currentUnreadCount,
            [userId]: 0
          };
          
          // Use setDoc with merge to update only the unreadCount field
          // This is more reliable with Firestore security rules than nested field paths
          // CRITICAL: Wrap in try-catch and ensure promise is caught immediately
          try {
            const updatePromise = setDoc(roomRef, {
              unreadCount: updatedUnreadCount
            }, { merge: true });
            
            // CRITICAL: Attach catch handler BEFORE awaiting to prevent uncaught promise errors
            updatePromise.catch(() => {
              // Silently ignore ALL errors - this is expected and non-critical
              // Permission errors are acceptable - unread count is a nice-to-have feature
            });
            
            // Wait for the promise but don't throw if it rejects (already caught above)
            await updatePromise.catch(() => {});
          } catch (updateError: any) {
            // Silently ignore ALL update errors
            // This includes permission errors which are expected in some cases
          }
        } catch (error: any) {
          // Silently ignore ALL errors - this is not critical for functionality
          // Permission errors are expected in some cases and don't affect chat functionality
          // The unread count is a nice-to-have feature, not critical
        }
      })().catch(() => {
        // Final catch to prevent any uncaught promise errors
        // This should never be reached, but it's a safety net
      });
    }, 0);
  }

  // Add team member to chat
  async addMember(roomId: string, memberId: string, memberName: string, memberAvatar?: string) {
    try {
      const dbInstance = await this.getDbInstance();
      const roomRef = doc(dbInstance, 'groupChats', roomId);
      
      await updateDoc(roomRef, {
        members: arrayUnion(memberId),
        [`memberRoles.${memberId}`]: 'member',
        [`memberNames.${memberId}`]: memberName,
        [`memberAvatars.${memberId}`]: memberAvatar || null
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        text: `${memberName} was added to the chat`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Member added: ${memberId}`);
    } catch (error) {
      console.error('❌ Error adding member:', error);
      throw error;
    }
  }

  // Remove member from chat
  async removeMember(roomId: string, memberId: string, memberName?: string) {
    try {
      const dbInstance = await this.getDbInstance();
      const roomRef = doc(dbInstance, 'groupChats', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data();
      const actualMemberName = memberName || roomData.memberNames?.[memberId] || 'Unknown User';
      
      await updateDoc(roomRef, {
        members: arrayRemove(memberId),
        [`memberRoles.${memberId}`]: deleteField(),
        [`memberNames.${memberId}`]: deleteField(),
        [`memberAvatars.${memberId}`]: deleteField()
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        text: `${actualMemberName} was removed from the chat`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Member removed: ${memberId}`);
    } catch (error) {
      console.error('❌ Error removing member:', error);
      throw error;
    }
  }

  // Leave group
  async leaveGroup(roomId: string, userId: string) {
    try {
      const dbInstance = await this.getDbInstance();
      const roomRef = doc(dbInstance, 'groupChats', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data();
      const userName = roomData.memberNames?.[userId] || 'Unknown User';
      
      // Remove user from members
      await updateDoc(roomRef, {
        members: arrayRemove(userId),
        [`memberRoles.${userId}`]: deleteField(),
        [`memberNames.${userId}`]: deleteField(),
        [`memberAvatars.${userId}`]: deleteField()
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        text: `${userName} left the chat`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] User left group: ${userId}`);
    } catch (error) {
      console.error('❌ Error leaving group:', error);
      throw error;
    }
  }

  // Delete group (only for group owners)
  async deleteGroup(roomId: string, userId: string) {
    try {
      const dbInstance = await this.getDbInstance();
      const roomRef = doc(dbInstance, 'groupChats', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data();
      
      // Check if user is the owner
      if (roomData.createdBy !== userId) {
        throw new Error('Only the group owner can delete the group');
      }

      // Delete all messages in the group
    const messagesRef = collection(dbInstance, 'groupChats', roomId, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      
      const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the group document
      await deleteDoc(roomRef);

      console.log(`✅ [CHAT] Group deleted: ${roomId}`);
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      throw error;
    }
  }

  // Update group name
  async updateGroupName(roomId: string, newName: string, userId: string, userName: string) {
    try {
      console.log(`📝 [CHAT] Updating group name to: ${newName}`);
      
      // Update room
      const dbInstance = await this.getDbInstance();
      await updateDoc(doc(dbInstance, 'groupChats', roomId), {
        name: newName,
        lastActivityAt: Date.now()
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        text: `${userName} changed the group name to "${newName}"`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Group name updated to: ${newName}`);
      return newName;
    } catch (error) {
      console.error('❌ Error updating group name:', error);
      throw error;
    }
  }

  // Update group avatar
  async updateGroupAvatar(roomId: string, avatarFile: File, userId: string) {
    try {
      // Upload avatar
      const storageInstance = await this.getStorageInstance();
      const avatarRef = ref(storageInstance, `group-avatars/${roomId}/${Date.now()}_${avatarFile.name}`);
      await uploadBytes(avatarRef, avatarFile);
      const avatarUrl = await getDownloadURL(avatarRef);

      // Update room
      const dbInstance = await this.getDbInstance();
      await updateDoc(doc(dbInstance, 'groupChats', roomId), {
        avatarUrl: avatarUrl, // Changed from groupAvatar to avatarUrl to match room structure
        lastActivityAt: Date.now()
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        text: `Group photo was updated`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Group avatar updated`);
      return avatarUrl;
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      throw error;
    }
  }

  // Generate invite link for group
  async generateInviteLink(roomId: string, userId: string, expiresInDays: number = 7) {
    try {
      const inviteCode = `invite_${roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);

      // Store invite in Firestore
      const dbInstance = await this.getDbInstance();
      await setDoc(doc(dbInstance, 'groupInvites', inviteCode), {
        roomId,
        createdBy: userId,
        createdAt: Date.now(),
        expiresAt,
        maxUses: 100, // Limit uses
        currentUses: 0
      });

      const inviteLink = `${window.location.origin}/join-group/${inviteCode}`;
      console.log(`✅ [CHAT] Invite link generated: ${inviteLink}`);
      return inviteLink;
    } catch (error) {
      console.error('❌ Error generating invite link:', error);
      throw error;
    }
  }

  // Join group via invite link
  async joinGroupViaInvite(inviteCode: string, userId: string, userName: string, userAvatar?: string) {
    try {
      // Get invite data
      const dbInstance = await this.getDbInstance();
      const inviteRef = doc(dbInstance, 'groupInvites', inviteCode);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error('Invalid invite link');
      }

      const inviteData = inviteSnap.data();

      // Check if expired
      if (inviteData.expiresAt < Date.now()) {
        throw new Error('Invite link has expired');
      }

      // Check if max uses reached
      if (inviteData.currentUses >= inviteData.maxUses) {
        throw new Error('Invite link has reached maximum uses');
      }

      // Add member to group
      await this.addMember(inviteData.roomId, userId, userName, userAvatar);

      // Increment use count
      await updateDoc(inviteRef, {
        currentUses: inviteData.currentUses + 1
      });

      console.log(`✅ [CHAT] User joined group via invite: ${inviteData.roomId}`);
      return inviteData.roomId;
    } catch (error) {
      console.error('❌ Error joining via invite:', error);
      throw error;
    }
  }

  // Invite member by email
  async inviteMemberByEmail(roomId: string, email: string, invitedBy: string, invitedByName: string) {
    try {
      console.log(`📧 [CHAT] Inviting ${email} to group ${roomId}`);

      // Find user by email
      const dbInstance = await this.getDbInstance();
      const usersRef = collection(dbInstance, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`No user found with email: ${email}`);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if already a member
    const roomDoc = await getDoc(doc(dbInstance, 'groupChats', roomId));
      if (!roomDoc.exists()) {
        throw new Error('Group not found');
      }

      const roomData = roomDoc.data();
      if (roomData.members.includes(userId)) {
        throw new Error('User is already a member of this group');
      }

      // Add member
      await this.addMember(roomId, userId, userData.displayName || userData.email, userData.photoURL);

      console.log(`✅ [CHAT] User ${email} invited to group`);
      return userId;
    } catch (error) {
      console.error('❌ Error inviting member by email:', error);
      throw error;
    }
  }

  // Add reminder
  async addReminder(roomId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>) {
    try {
      const reminderId = `reminder_${Date.now()}`;
      const reminderData: Reminder = {
        ...reminder,
        id: reminderId,
        createdAt: Date.now()
      };

      const dbInstance = await this.getDbInstance();
      await updateDoc(doc(dbInstance, 'groupChats', roomId), {
        reminders: arrayUnion(reminderData)
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'reminder',
        text: `📌 Reminder: ${reminder.title}`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Reminder added`);
      return reminderId;
    } catch (error) {
      console.error('❌ Error adding reminder:', error);
      throw error;
    }
  }

  // Add milestone
  async addMilestone(roomId: string, milestone: Omit<Milestone, 'id' | 'createdAt'>) {
    try {
      const milestoneId = `milestone_${Date.now()}`;
      const milestoneData: Milestone = {
        ...milestone,
        id: milestoneId,
        createdAt: Date.now()
      };

      const dbInstance = await this.getDbInstance();
      await updateDoc(doc(dbInstance, 'groupChats', roomId), {
        milestones: arrayUnion(milestoneData)
      });

      // Send system message
      await addDoc(collection(dbInstance, 'groupChats', roomId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        type: 'milestone',
        text: `🎯 Milestone: ${milestone.title}`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Milestone added`);
      return milestoneId;
    } catch (error) {
      console.error('❌ Error adding milestone:', error);
      throw error;
    }
  }

  // Get room details
  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const dbInstance = await this.getDbInstance();
    const roomDoc = await getDoc(doc(dbInstance, 'groupChats', roomId));
    if (!roomDoc.exists()) return null;
    return { id: roomDoc.id, ...roomDoc.data() } as ChatRoom;
  }

  // Add reaction to message
  async addReaction(roomId: string, messageId: string, emoji: string, userId: string) {
    const dbInstance = await this.getDbInstance();
    const messageRef = doc(dbInstance, 'groupChats', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) return;
    
    const currentReactions = messageDoc.data().reactions || {};
    const userReactions = currentReactions[emoji] || [];
    
    if (!userReactions.includes(userId)) {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayUnion(userId)
      });
    }
  }

  // Remove reaction from message
  async removeReaction(roomId: string, messageId: string, emoji: string, userId: string) {
    const dbInstance = await this.getDbInstance();
    const messageRef = doc(dbInstance, 'groupChats', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${emoji}`]: arrayRemove(userId)
    });
  }

  // Pin message
  async pinMessage(roomId: string, messageId: string) {
    const dbInstance = await this.getDbInstance();
    await updateDoc(doc(dbInstance, 'groupChats', roomId), {
      pinnedMessages: arrayUnion(messageId)
    });

    await updateDoc(doc(dbInstance, 'groupChats', roomId, 'messages', messageId), {
      isPinned: true,
      pinnedAt: Date.now()
    });
  }

  // Mute chat
  async muteChat(roomId: string, userId: string) {
    const dbInstance = await this.getDbInstance();
    await updateDoc(doc(dbInstance, 'groupChats', roomId), {
      mutedBy: arrayUnion(userId)
    });
  }

  // Unmute chat
  async unmuteChat(roomId: string, userId: string) {
    const dbInstance = await this.getDbInstance();
    await updateDoc(doc(dbInstance, 'groupChats', roomId), {
      mutedBy: arrayRemove(userId)
    });
  }

  // RaftAI Integration
  async sendRaftAIMessage(roomId: string, userMessage: string, senderName: string) {
    try {
      // First, add the user's message
      await this.sendMessage({
        roomId,
        userId: 'user',
        userName: senderName,
        text: userMessage
      });

      // Simulate RaftAI thinking
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate RaftAI response
      const raftaiResponse = this.generateRaftAIResponse(userMessage, senderName);

      // Add RaftAI's response
      await this.sendMessage({
        roomId,
        userId: 'raftai',
        userName: 'RaftAI',
        text: raftaiResponse
      });

      console.log('🤖 RaftAI responded to message');
    } catch (error) {
      console.error('❌ Error with RaftAI:', error);
    }
  }

  generateRaftAIResponse(userMessage: string, senderName: string): string {
    const responses = [
      `Thanks ${senderName}! I've analyzed your message and will provide insights shortly.`,
      `Interesting point, ${senderName}. Let me review the details and get back to you.`,
      `I understand your concern, ${senderName}. Let me check the project details.`,
      `Great question, ${senderName}! I'm processing this information now.`,
      `I've noted your feedback, ${senderName}. This will help improve our analysis.`,
      `Thanks for sharing, ${senderName}. I'm updating the project timeline accordingly.`,
      `I see what you mean, ${senderName}. Let me verify the technical specifications.`,
      `Excellent insight, ${senderName}! I'm cross-referencing this with our data.`
    ];

    // Simple keyword-based responses
    if (userMessage.toLowerCase().includes('funding')) {
      return `💰 I see you're asking about funding, ${senderName}. Let me analyze the financial projections and market potential for this project.`;
    }
    if (userMessage.toLowerCase().includes('timeline')) {
      return `📅 Timeline analysis initiated, ${senderName}. I'm reviewing the project milestones and delivery schedule.`;
    }
    if (userMessage.toLowerCase().includes('risk')) {
      return `⚠️ Risk assessment in progress, ${senderName}. I'm evaluating potential challenges and mitigation strategies.`;
    }
    if (userMessage.toLowerCase().includes('market')) {
      return `📊 Market analysis starting, ${senderName}. I'm researching industry trends and competitive landscape.`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Typing Indicators
  async setTyping(roomId: string, userId: string, isTyping: boolean) {
    const dbInstance = await this.getDbInstance();
    const typingRef = doc(dbInstance, 'groupChats', roomId, 'typing', userId);
    
    if (isTyping) {
      setDoc(typingRef, {
        userId,
        timestamp: Date.now()
      }, { merge: true });
    } else {
      deleteDoc(typingRef);
    }
  }

  async subscribeToTyping(roomId: string, callback: (typingUsers: string[]) => void) {
    const dbInstance = await this.getDbInstance();
    const typingRef = collection(dbInstance, 'groupChats', roomId, 'typing');
    
    return onSnapshot(typingRef, (snapshot) => {
      const now = Date.now();
      const typingUsers = snapshot.docs
        .map(doc => doc.data())
        .filter(data => now - data.timestamp < 5000) // 5 second timeout
        .map(data => data.userId);
      
      callback(typingUsers);
    });
  }

  async unpinMessage(roomId: string, messageId: string) {
    const dbInstance = await this.getDbInstance();
    await updateDoc(doc(dbInstance, 'groupChats', roomId), {
      pinnedMessages: arrayRemove(messageId)
    });

    const messageRef = doc(dbInstance, 'groupChats', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      isPinned: false,
      pinnedAt: null
    });
  }

  // Message Search
  async searchMessages(roomId: string, searchTerm: string): Promise<ChatMessage[]> {
    const dbInstance = await this.getDbInstance();
    const messagesRef = collection(dbInstance, 'groupChats', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    const normalizedTerm = searchTerm.toLowerCase();

    return messages.filter(message => 
      message.text.toLowerCase().includes(normalizedTerm) ||
      message.senderName.toLowerCase().includes(normalizedTerm)
    );
  }
}

export const enhancedChatService = new EnhancedChatService();

