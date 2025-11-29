# CryptoRafts Chat System

## Overview

The CryptoRafts chat system is a comprehensive, role-based messaging platform designed for secure communication between different stakeholders in the crypto ecosystem. It features strict role isolation, rich messaging capabilities, AI integration, and enterprise-grade security.

## Key Features

### 🔒 **Security & Privacy**
- **Private by default**: Every room is invite-only
- **Role isolation**: Users only see rooms relevant to their role
- **TLS encryption**: All data encrypted in transit
- **Encrypted at rest**: Firebase handles encryption at rest
- **Optional disappearing messages**: Self-destruct timers
- **Device screen-lock support**: Optional chat locking
- **Screenshot warnings**: Optional deterrent banners

### 👥 **Role-Based Access Control**

#### **Founder Access**
- Deal Rooms (with VCs)
- Listing Rooms (with Exchanges) 
- IDO Rooms (with IDO Platforms)
- Campaign Rooms (with Influencers)
- Proposal Rooms (with Agencies)
- Team Rooms (internal)

#### **VC Access**
- Deal Rooms (with Founders)
- Operations Rooms (internal)

#### **Exchange Access**
- Listing Rooms (with Founders)
- Operations Rooms (internal)

#### **IDO Platform Access**
- IDO Rooms (with Founders)
- Operations Rooms (internal)

#### **Influencer Access**
- Campaign Rooms (with Founders)

#### **Agency Access**
- Proposal Rooms (with Founders)

#### **Admin Access**
- All Rooms (full access)

### 💬 **Rich Messaging Features**

#### **Core Features**
- Instant send with message cache
- Typing indicators
- Read receipts (per-message)
- Quick reply and swipe to reply (mobile)
- Message threads
- Pinned messages
- Reactions (👍, ❤️, 😂, 😢, 😡)
- @mentions with notifications

#### **Advanced Features**
- File uploads (images, videos, documents, voice notes)
- Polls (single/multi-choice, anonymous options)
- Tasks (assignable with due dates)
- Events (.ics calendar integration)
- Group calls (WebRTC + screen share)
- Message search with filters

### 🤖 **AI Integration**

#### **Available Commands**
- `/raftai summarize` - Summarize recent conversation
- `/raftai risks` - Analyze potential risks
- `/raftai draft [tone]` - Draft responses with specified tone
- `/raftai action-items` - Extract action items and tasks
- `/raftai translate [language]` - Translate text
- `/raftai compliance` - Check for compliance issues
- `/raftai redact` - Identify sensitive information
- `/raftai brief` - Create comprehensive briefs

### 🔔 **Notifications**

#### **Smart Notification System**
- Push notifications + in-app notifications
- Quiet hours (configurable)
- Per-room mute settings
- Mentions override quiet hours (optional)
- Email fallback for offline users
- Real-time unread counts

### 🔍 **Search & Discovery**

#### **Search Features**
- Full-text search within rooms
- Advanced filters:
  - `from:@user` - Messages from specific user
  - `has:file` - Messages with attachments
  - `has:image` - Messages with images
  - `has:poll` - Messages with polls
  - `has:task` - Messages with tasks
  - `before/after:date` - Date range filtering
- Jump to message in context
- Search results with snippets

### ⚙️ **Moderation & Administration**

#### **Room Owner Controls**
- Invite/remove members
- Set retention policies
- Enable slow mode
- Close/archive rooms
- Export conversations
- Pin important messages

#### **Admin Controls**
- Enter any room in moderation mode
- Perform redactions with tombstones
- Close rooms
- Audit all actions
- Global moderation tools

## Technical Architecture

### **Data Models**

#### **ChatRoom**
```typescript
interface ChatRoom {
  id: string;
  name: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team' | 'ops';
  projectId?: string;
  orgId?: string;
  members: string[];
  ownerId: string;
  createdAt: any;
  lastActivityAt: any;
  privacy: {
    inviteOnly: boolean;
    disappearing?: { seconds?: number };
  };
  settings: {
    slowMode?: number;
    filesAllowed: boolean;
    calls: boolean;
    reactions: boolean;
    threads: boolean;
    polls: boolean;
    tasks: boolean;
    events: boolean;
  };
  status: 'active' | 'closed' | 'archived';
  pinnedMessages?: string[];
  metadata?: any;
}
```

#### **ChatMessage**
```typescript
interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'file' | 'image' | 'video' | 'voice' | 'poll' | 'task' | 'event' | 'aiReply' | 'system';
  text?: string;
  attachments?: MessageAttachment[];
  threadOf?: string;
  reactions?: Record<string, string[]>;
  readBy: string[];
  createdAt: any;
  editedAt?: any;
  deletedAt?: any;
  metadata?: any;
}
```

### **Firebase Collections**

#### **Firestore Collections**
- `groupChats` - Chat rooms
- `groupChats/{roomId}/messages` - Room messages
- `chat_notifications` - User notifications
- `chat_preferences` - User preferences
- `moderation_actions` - Moderation logs
- `call_rooms` - WebRTC call sessions

#### **Storage Buckets**
- `/avatars/{userId}` - User avatars
- `/orgs/{orgId}/logo` - Organization logos
- `/projects/{projectId}/logo` - Project logos
- `/uploads/{userId}/` - User file uploads
- `/kyc/{userId}/` - KYC documents
- `/kyb/{orgId}/` - KYB documents
- `/pitches/{projectId}/` - Pitch documents
- `/campaigns/{campaignId}/` - Campaign assets

### **Security Rules**

#### **Firestore Rules**
- Role-based access control
- User isolation (users only see their own data)
- Room membership validation
- Admin override capabilities
- Secure message access

#### **Storage Rules**
- File type validation
- Size limits (10MB max)
- Role-based upload permissions
- Secure file access patterns

## Usage Examples

### **Creating a Room**
```typescript
const roomId = await chatService.createRoom({
  type: 'deal',
  projectId: 'project123',
  participants: ['vc1', 'vc2'],
  metadata: { dealAmount: 1000000 }
}, 'founder123');
```

### **Sending a Message**
```typescript
const messageId = await chatService.sendMessage(
  roomId, 
  userId, 
  'Hello, let\'s discuss the investment terms',
  'text'
);
```

### **AI Command**
```typescript
const response = await chatService.processAICommand(roomId, {
  command: 'summarize',
  context: 'investment discussion',
  messageIds: recentMessageIds
}, userId);
```

### **Adding Reactions**
```typescript
await chatService.addReaction(roomId, messageId, userId, '👍');
```

## Room Types & Use Cases

### **Deal Rooms (Founder × VC)**
- **Purpose**: Investment discussions, due diligence, term sheets
- **Features**: File sharing, AI compliance checks, meeting scheduling
- **Privacy**: Only VC team + Founder team

### **Listing Rooms (Founder × Exchange)**
- **Purpose**: Listing coordination, technical integration, market making
- **Features**: Technical checklist, API integration, compliance monitoring
- **Privacy**: Only Exchange team + Founder team

### **IDO Rooms (Founder × IDO Platform)**
- **Purpose**: Token sale coordination, vesting, KYC/KYB
- **Features**: Sale timeline, whitelist management, announcements
- **Privacy**: Only IDO team + Founder team

### **Campaign Rooms (Founder × Influencer)**
- **Purpose**: Campaign briefs, creative approvals, tracking
- **Features**: Content approval, milestone tracking, payment status
- **Privacy**: Only Influencer + Founder team

### **Proposal Rooms (Founder × Agency)**
- **Purpose**: Proposal discussions, scope definition, contract negotiations
- **Features**: SOW management, budget tracking, risk analysis
- **Privacy**: Only Agency + Founder team

### **Team Rooms (Internal)**
- **Purpose**: Internal coordination, co-founder discussions
- **Features**: Private team communication, not visible to external parties
- **Privacy**: Only team members

### **Operations Rooms (Internal)**
- **Purpose**: Platform operations, internal coordination
- **Features**: Admin tools, system monitoring, internal processes
- **Privacy**: Role-specific access (VC/Exchange/IDO/Admin)

## Security Considerations

### **Data Protection**
- All messages encrypted in transit and at rest
- User data isolation enforced at database level
- Role-based access control prevents unauthorized access
- Audit logs for all administrative actions

### **Privacy Features**
- Disappearing messages with configurable timers
- Optional chat locking with device authentication
- Screenshot detection warnings
- Export controls with watermarking

### **Compliance**
- AI-powered compliance monitoring
- Automatic risk detection
- Sensitive information redaction
- Audit trail maintenance

## Performance Optimizations

### **Real-time Updates**
- Efficient Firebase listeners
- Optimized query patterns
- Minimal database reads
- Smart caching strategies

### **Scalability**
- Horizontal scaling with Firebase
- Efficient indexing for search
- Pagination for large conversations
- Background processing for AI commands

## Future Enhancements

### **Planned Features**
- Voice message transcription
- Advanced file preview
- Video message support
- Integration with external calendars
- Advanced analytics dashboard
- Mobile app optimization
- End-to-end encryption options

### **Integration Opportunities**
- CRM system integration
- Document management systems
- Payment processing
- Legal document automation
- Compliance reporting tools

## Getting Started

1. **Authentication**: Users must be logged in with a valid role
2. **Room Access**: Rooms are automatically created based on business logic
3. **Messaging**: Start conversations with rich features
4. **AI Commands**: Use `/raftai` commands for assistance
5. **Moderation**: Room owners can manage their spaces
6. **Notifications**: Configure preferences for optimal experience

The CryptoRafts chat system provides a secure, feature-rich communication platform that respects role boundaries while enabling productive collaboration across the crypto ecosystem.
