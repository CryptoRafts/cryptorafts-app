// Chat Room Data Model Types

export type MessageType = "text" | "file" | "image" | "video" | "voice" | "poll" | "task" | "event" | "aiReply" | "system";
export type RoomType = "deal" | "listing" | "ido" | "campaign" | "proposal" | "team" | "ops";

export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  projectId?: string;
  orgId?: string;
  members: string[]; // Array of user UIDs
  ownerId: string;
  createdAt: Date;
  lastActivityAt: Date;
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
    reactions?: boolean;
    threads?: boolean;
    polls?: boolean;
    tasks?: boolean;
    events?: boolean;
  };
  pinnedMessages?: string[];
  status: "active" | "closed" | "archived";
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
  threadOf?: string; // Parent message ID for threads
  reactions?: {
    [emoji: string]: string[]; // emoji -> array of user UIDs
  };
  readBy: string[]; // Array of user UIDs who have read this message
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface ChatUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "founder" | "vc" | "exchange" | "ido" | "influencer" | "agency" | "admin";
  orgId?: string;
  orgName?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface ChatNotification {
  id: string;
  userId: string;
  roomId: string;
  messageId?: string;
  type: "mention" | "message" | "reaction" | "thread" | "call";
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

// Role-based room access types
export interface RoleRoomAccess {
  founder: {
    deal: boolean; // Deal Room (Founder × VC)
    listing: boolean; // Listing Room (Founder × Exchange)
    ido: boolean; // IDO Room (Founder × IDO Platform)
    campaign: boolean; // Campaign Room (Founder × Influencer)
    proposal: boolean; // Proposal Room (Founder × Agency)
    team: boolean; // Founder Team Room (internal)
  };
  vc: {
    deal: boolean; // Deal Room (VC × Founder)
    internal: boolean; // VC Internal Rooms
  };
  exchange: {
    listing: boolean; // Listing Room (Exchange × Founder)
    ops: boolean; // Exchange Ops (internal)
  };
  ido: {
    ido: boolean; // IDO Room (IDO × Founder)
  };
  influencer: {
    campaign: boolean; // Campaign Room (Influencer × Founder)
  };
  agency: {
    proposal: boolean; // Proposal Room (Agency × Founder)
  };
}

// AI Command types
export interface AICommand {
  command: string;
  params: string[];
  roomId: string;
  messageId?: string;
  userId: string;
}

export type AICommandType = 
  | "summarize"
  | "risks"
  | "draft"
  | "action-items"
  | "translate"
  | "compliance"
  | "redact";

// Chat room creation context
export interface RoomCreationContext {
  type: ChatRoom["type"];
  projectId?: string;
  orgId?: string;
  participants: string[];
  ownerId: string;
  name: string;
  settings?: Partial<ChatRoom["settings"]>;
  privacy?: Partial<ChatRoom["privacy"]>;
}
