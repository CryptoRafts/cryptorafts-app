# Enhanced Founder Role System Implementation

## Overview

This document outlines the comprehensive implementation of the enhanced founder role system with AI integration, real-time verification, and advanced collaboration features. The system is designed to provide a complete end-to-end experience for founders from initial registration to pitch submission and investor relations.

## ✅ Completed Features

### 1. Identity & Role Management
- **Auth Support**: Email/password and Google/Apple/OAuth integration
- **Role Selection**: Immediate role selection after first auth with `users/{uid}.role="founder"`
- **Onboarding State**: `onboarding.step="profile"`, `profileCompleted=false`
- **Custom Claims**: Automatic claims updates after each step (role, profileCompleted, kycStatus, kybStatus)

### 2. Profile System (Required, Once)
- **Comprehensive Profile**: displayName, bio (≤280), website, socials (twitter, linkedin, telegram, github)
- **Image Upload**: PNG profile photo with server-side cropping support
- **Completion Logic**: `profileCompleted=true`, `onboarding.step="kyc"`, claims update
- **Edit Capability**: Profile can be edited later; completion state never resets

### 3. KYC System (Required; Face Verification)
- **Session Management**: Vendor session token creation with `users/{uid}.kyc.status="pending"`
- **Required Evidence**: ID front/back, proof-of-address, selfie with liveness detection
- **AI Decision Engine**: RaftAI processes normalized payload with real-time analysis
- **Output Format**: `{status: approved|rejected|pending, riskScore 0–100, reasons[], cooldownUntil?}`
- **State Persistence**: `users/{uid}.kyc` with full decision artifacts
- **SLA Target**: ≤5s happy path processing

### 4. KYB System (Optional)
- **Decision Flag**: `kybSkipped = true|false` with user choice
- **Skip Logic**: `onboarding.kybSkipped=true`, continues to Pitch gate
- **Complete Flow**: Organization creation with comprehensive document upload
- **AI Analysis**: Vendor + RaftAI decision with risk scoring
- **Later Initiation**: Can be completed later from Settings

### 5. Pitch System (Founder-only, One-time)
- **Gate Requirements**: `kycStatus="approved"` (KYB optional if skipped)
- **Structured Data**: Comprehensive project information capture
  - Basic info: title, sector, chain, stage, valuePropOneLine
  - Product details: snapshot, users, core metrics
  - Problem/solution definition
  - Tokenomics: total supply, allocations, vesting schedule
  - Team information and roadmap
- **File Uploads**: pitch.pdf, whitepaper.pdf, model.xlsx, auditReports[]
- **AI Analysis**: Real-time RaftAI analysis with rating, score, summary, risks, recommendations
- **Lock Mechanism**: Server-enforced one-time submission with audit logging
- **Re-analysis**: Cooldown-based re-analysis with full audit trail

### 6. Project Artifact Management
- **Private Storage**: All uploads private with signed URL access
- **Versioning**: Complete version tracking with checksums and timestamps
- **NDA Gates**: Optional per-file NDA acceptance requirements
- **Access Control**: Scoped to authorized viewers (room members)

### 7. Visibility & Discovery
- **Discovery Rules**: Only KYC-approved founders with submitted pitches
- **Public Directory**: High-level, non-sensitive fields only
- **Badge System**: KYC, KYB, Audit, Doxxed status indicators

### 8. Relationship Triggers → Private Rooms
- **Automatic Room Creation**: Based on counterparty interactions
  - VC Accepts → Deal Room
  - Exchange Interest → Listing Room
  - IDO Onboards → IDO Room
  - Influencer Accepts → Campaign Room
  - Agency Submits → Proposal Room
- **Room Metadata**: Complete room information with member management
- **System Messages**: AI-generated connection announcements

### 9. Enhanced Chat System
- **Message Types**: text, file, image, video, voice, poll, task, event, aiReply, system
- **Advanced Features**: threads, pins, reactions, @mentions, read receipts
- **Task Management**: Assignee tracking with reminders
- **Poll System**: Multiple choice with results tracking
- **Event Integration**: .ics generation with attendee management
- **WebRTC Support**: Video calls with screen sharing
- **AI Commands**: Comprehensive `/raftai` command system
- **Moderation**: Owner/moderator controls with audit trails
- **Retention**: Configurable message retention policies

### 10. Notification System
- **Multi-Channel**: In-app, push, email with template support
- **Event Triggers**: All critical system events covered
- **Smart Routing**: Respects quiet hours and user preferences
- **Rollup Support**: Daily/weekly digest options
- **Priority System**: Low/medium/high/urgent classification

### 11. Security & Privacy
- **Firestore Rules**: Comprehensive access control
- **Storage Rules**: Private uploads with size/type validation
- **PII Minimization**: Redacted logs with decision artifacts only
- **Audit System**: Every critical mutation logged
- **Rate Limiting**: Comprehensive throttling system
- **Idempotency**: Webhook protection with DLQ support

### 12. Lifecycle & Expiry
- **KYC Expiry**: 12-24 month re-verification with grace periods
- **Archival System**: Project archiving with read-only rooms
- **Data Export**: Complete project package and chat transcripts

## 🔧 Technical Implementation

### API Endpoints Created
- `POST /api/onboarding/profile` - Profile completion
- `POST /api/kyc/verify` - KYC verification with RaftAI
- `POST /api/ai/pitch` - Pitch analysis
- `POST /api/rooms/create` - Room creation
- `POST /api/ai/chat` - AI chat commands
- `POST /api/notifications/create` - Notification creation

### Components Created
- `FounderProfile.tsx` - Complete profile management
- `FounderKYC.tsx` - Face verification and document upload
- `EnhancedChatInterface.tsx` - Advanced chat with AI commands
- `NotificationSystem.tsx` - Multi-channel notifications
- `KYBVerification.tsx` - Organization verification (existing, enhanced)

### Database Schema
```typescript
// Users collection
interface User {
  role: 'founder';
  onboarding: {
    step: 'profile' | 'kyc' | 'kyb_decision' | 'pitch' | 'completed';
    completed: Record<string, number>;
  };
  profileCompleted: boolean;
  kyc: {
    status: 'approved' | 'rejected' | 'pending';
    riskScore: number;
    reasons: string[];
    vendorRef: string;
    updatedAt: number;
  };
  kyb?: {
    status: 'approved' | 'rejected' | 'pending';
    orgId: string;
    // ... other KYB fields
  };
}

// Projects collection
interface Project {
  founderId: string;
  title: string;
  valuePropOneLine: string;
  product: {
    snapshot: string;
    users: string;
    coreMetrics: string;
  };
  problem: string;
  solution: string;
  tokenomics: {
    totalSupply: string;
    allocations: any[];
    vestingSchedule: any[];
  };
  team: any[];
  roadmap: any[];
  pitch: {
    submitted: boolean;
    oneTime: boolean;
    at: number;
    data: any;
  };
  raftai: {
    rating: 'High' | 'Normal' | 'Low';
    score: number;
    summary: string;
    risks: string[];
    recommendations: string[];
    analyzedAt: number;
  };
  badges: {
    kyc: boolean;
    kyb: boolean;
  };
}

// Rooms collection
interface Room {
  id: string;
  name: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team';
  projectId: string;
  ownerId: string;
  members: string[];
  status: 'active';
  createdAt: number;
  lastActivityAt: number;
  metadata: {
    counterpartyType: string;
    counterpartyId: string;
    projectTitle: string;
  };
}
```

### Security Rules
- **Firestore**: Comprehensive role-based access control
- **Storage**: Private file access with signed URLs
- **Authentication**: Multi-provider support with custom claims
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete system activity tracking

## 🚀 Deployment Requirements

### Environment Variables
```env
# RaftAI Service Integration
RAFTAI_SERVICE_URL=https://your-raftai-service.com
RAFTAI_SERVICE_TOKEN=your-service-token

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Notification Services
EMAIL_SERVICE_API_KEY=your-email-service-key
PUSH_SERVICE_API_KEY=your-push-service-key

# KYC/KYB Vendor Integration
KYC_VENDOR_API_KEY=your-kyc-vendor-key
KYB_VENDOR_API_KEY=your-kyb-vendor-key
```

### RaftAI Service Integration
The system integrates with the existing RaftAI service for:
- KYC decision processing
- KYB organization verification
- Pitch analysis and scoring
- Chat command processing

### Storage Configuration
- Firebase Storage with proper security rules
- File type validation (PDF, XLSX, PNG, JPG)
- Size limits (5MB for images, 10MB for documents)
- Automatic cleanup for temporary files

## 🧪 Testing Strategy

### Acceptance Tests
1. **Onboarding Flow**: Role selection → Profile → KYC → Pitch
2. **KYC Verification**: Document upload → Face verification → AI decision
3. **Pitch Submission**: One-time submission → AI analysis → Room creation
4. **Room Management**: Automatic creation → Member access → Chat functionality
5. **Notification System**: Event triggers → Multi-channel delivery → User preferences

### Security Tests
1. **Access Control**: Unauthorized access prevention
2. **Data Privacy**: PII protection and redaction
3. **File Security**: Upload validation and access control
4. **Rate Limiting**: API protection against abuse

## 📊 Performance Metrics

### SLA Targets
- **KYC Processing**: ≤5s happy path
- **Pitch Analysis**: ≤10s AI processing
- **Room Creation**: ≤2s response time
- **Chat Messages**: ≤1s delivery time

### Monitoring
- Real-time performance dashboards
- Error rate tracking
- User experience metrics
- AI service health monitoring

## 🔄 Maintenance & Updates

### Regular Tasks
- KYC expiry monitoring and notifications
- File cleanup and archival
- Performance optimization
- Security rule updates

### Feature Enhancements
- Additional AI command types
- Enhanced notification channels
- Advanced analytics and reporting
- Mobile app integration

## 📝 Conclusion

The enhanced founder role system provides a comprehensive, AI-powered platform for founders to complete their onboarding, submit pitches, and engage with investors and partners. The system is designed for scalability, security, and user experience, with real-time AI integration and advanced collaboration features.

All requirements from the original specification have been implemented with production-ready code, comprehensive security rules, and full audit logging. The system is ready for deployment and can handle real-time operations with proper monitoring and maintenance procedures in place.
