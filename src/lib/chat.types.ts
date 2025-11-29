// Chat Room Types
export type RoomType = 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team' | 'ops';

export type RoomStatus = 'active' | 'closed' | 'archived';

export type MessageType = 'text' | 'file' | 'image' | 'video' | 'voice' | 'poll' | 'task' | 'event' | 'aiReply' | 'system';

export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  projectId?: string;
  orgId?: string;
  members: string[];
  ownerId: string;
  createdAt: any;
  lastActivityAt: any;
  privacy: {
    inviteOnly: boolean;
    disappearing?: {
      seconds?: number;
    };
  };
  settings: {
    slowMode?: number; // seconds
    filesAllowed: boolean;
    calls: boolean;
    reactions: boolean;
    threads: boolean;
    polls: boolean;
    tasks: boolean;
    events: boolean;
  };
  status: RoomStatus;
  pinnedMessages?: string[];
  metadata?: {
    dealAmount?: number;
    listingDate?: any;
    campaignBudget?: number;
    proposalStatus?: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachments?: MessageAttachment[];
  threadOf?: string; // parent message ID for threads
  reactions?: Record<string, string[]>; // emoji -> user IDs
  readBy: string[];
  createdAt: any;
  editedAt?: any;
  deletedAt?: any;
  metadata?: {
    aiCommand?: string;
    pollData?: PollData;
    taskData?: TaskData;
    eventData?: EventData;
    fileInfo?: FileInfo;
  };
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'voice';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface PollData {
  question: string;
  options: string[];
  multipleChoice: boolean;
  anonymous: boolean;
  expiresAt?: any;
  votes: Record<string, string[]>; // option index -> user IDs
}

export interface TaskData {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: any;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  tags?: string[];
}

export interface EventData {
  title: string;
  description?: string;
  startTime: any;
  endTime: any;
  location?: string;
  attendees: string[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: any;
  };
  icsData?: string;
}

export interface FileInfo {
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: any;
}

// Room Creation Context
export interface RoomCreationContext {
  type: RoomType;
  projectId?: string;
  orgId?: string;
  participants: string[];
  metadata?: any;
}

// AI Command Types
export type AICommand = 
  | 'summarize'
  | 'risks'
  | 'draft'
  | 'action-items'
  | 'translate'
  | 'compliance'
  | 'redact'
  | 'brief';

export interface AICommandRequest {
  command: AICommand;
  context?: string;
  tone?: string;
  language?: string;
  messageIds?: string[];
}

// Notification Types
export interface ChatNotification {
  id: string;
  userId: string;
  roomId: string;
  messageId?: string;
  type: 'mention' | 'message' | 'reaction' | 'task_assigned' | 'event_reminder';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: any;
}

// User Chat Preferences
export interface ChatPreferences {
  userId: string;
  notifications: {
    enabled: boolean;
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
    perRoom: Record<string, {
      enabled: boolean;
      mentionsOnly: boolean;
    }>;
    emailFallback: boolean;
    emailDelay: number; // hours
  };
  privacy: {
    lockChats: boolean;
    hidePreviews: boolean;
    screenshotWarning: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    showTimestamps: boolean;
    showReadReceipts: boolean;
  };
}

// Search and Filter Types
export interface ChatSearchFilters {
  roomId?: string;
  from?: string;
  hasFile?: boolean;
  hasImage?: boolean;
  hasPoll?: boolean;
  hasTask?: boolean;
  before?: any;
  after?: any;
  type?: MessageType;
}

// Moderation Types
export interface ModerationAction {
  id: string;
  roomId: string;
  moderatorId: string;
  action: 'mute' | 'kick' | 'close' | 'slow_mode' | 'retention' | 'redact';
  targetUserId?: string;
  reason?: string;
  duration?: number; // for temporary actions
  createdAt: any;
  metadata?: any;
}

// WebRTC Call Types
export interface CallRoom {
  id: string;
  roomId: string;
  participants: string[];
  startedBy: string;
  startedAt: any;
  endedAt?: any;
  type: 'audio' | 'video' | 'screen_share';
  recording?: {
    enabled: boolean;
    url?: string;
  };
}

