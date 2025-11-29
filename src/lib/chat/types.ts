// Complete Chat System Types - Production Ready

export type RoomType = 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team' | 'ops';
export type RoomStatus = 'active' | 'archived' | 'closed';
export type MessageType = 'text' | 'file' | 'image' | 'video' | 'voice' | 'system' | 'aiReply';
export type MemberRole = 'owner' | 'admin' | 'member';
export type FileStatus = 'pending' | 'approved' | 'rejected';

// Room with complete data
export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  
  // Participants
  founderId: string;
  founderName: string;
  founderLogo?: string;
  counterpartId: string;
  counterpartName: string;
  counterpartRole: string; // 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency'
  counterpartLogo?: string;
  
  // Members with roles
  members: string[]; // All member UIDs
  memberRoles: Record<string, MemberRole>; // uid -> role
  
  // Project/Org links
  projectId?: string;
  orgId?: string;
  
  // Settings
  settings: {
    filesAllowed: boolean;
    maxFileSize: number; // in MB
    allowedFileTypes: string[];
    requireFileReview: boolean;
  };
  
  // Timestamps
  createdAt: any;
  createdBy: string;
  lastActivityAt: any;
  
  // Features
  pinnedMessages: string[];
  mutedBy: string[];
  
  // Metadata
  inviteCode?: string;
  inviteExpiry?: any;
  
  // RaftAI Memory
  raftaiMemory?: {
    decisions: string[];
    tasks: string[];
    milestones: string[];
    notePoints: string[];
  };
}

// Message with all features
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  text?: string;
  
  // Thread support
  replyTo?: string; // Message ID being replied to
  threadId?: string; // Thread root message ID
  
  // File attachment
  file?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number; // for audio/video
    status: FileStatus;
    reviewedBy?: string;
    reviewNote?: string;
  };
  
  // Reactions
  reactions: Record<string, string[]>; // emoji -> [userIds]
  
  // Status
  readBy: string[];
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  
  // Timestamps
  createdAt: any;
  editedAt?: any;
  deletedAt?: any;
  
  // Metadata
  metadata?: {
    aiCommand?: string;
    aiResponse?: any;
    systemEvent?: string;
  };
}

// Invite system
export interface ChatInvite {
  id: string;
  roomId: string;
  code: string;
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
}

// File upload
export interface FileUpload {
  id: string;
  roomId: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: FileStatus;
  uploadedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewNote?: string;
  url?: string;
  thumbnailUrl?: string;
}

// Audit log
export interface AuditLog {
  id: string;
  roomId: string;
  userId: string;
  action: 'join' | 'leave' | 'rename' | 'add_member' | 'remove_member' | 'pin' | 'unpin' | 'file_upload' | 'file_approve' | 'file_reject' | 'report';
  details: any;
  timestamp: any;
}

// Report
export interface Report {
  id: string;
  roomId: string;
  messageId?: string;
  reportedBy: string;
  reportedUser?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  resolution?: string;
}

// Typing indicator
export interface TypingIndicator {
  roomId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

// Presence
export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: any;
}

