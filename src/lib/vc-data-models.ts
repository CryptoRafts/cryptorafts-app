export interface Project {
  id: string;
  title: string;
  description?: string;
  valuePropOneLine?: string;
  website?: string;
  logoUrl?: string;
  sector: string;
  chain: string;
  stage: string;
  country?: string;
  tags?: string[];
  founderId: string;
  founderName?: string;
  badges: {
    kyc: boolean;
    kyb: boolean;
    audit?: boolean;
    doxxed?: boolean;
    pitchSubmitted?: boolean;
  };
  raftai?: {
    rating: 'High' | 'Normal' | 'Low';
    score: number;
    risks?: string[];
    opportunities?: string[];
    summary?: string;
  };
  traction?: {
    users?: number;
    revenue?: number;
    partnerships?: string[];
    milestones?: string[];
  };
  tokenomics?: {
    totalSupply?: number;
    tokenDistribution?: Array<{
      category: string;
      percentage: number;
      vesting?: string;
    }>;
    anomalies?: string[];
  };
  team?: Array<{
    name: string;
    role: string;
    experience?: string;
    linkedin?: string;
  }>;
  uploads?: {
    pitchDeck?: string;
    whitepaper?: string;
    tokenModel?: string;
    audits?: string[];
    ndaRequired?: boolean;
  };
  createdAt: any;
  updatedAt: any;
  lastUpdatedAt?: any;
}

export interface VCPipelineItem {
  id: string;
  projectId: string;
  projectTitle: string;
  founderName?: string;
  stage: 'new' | 'under_review' | 'approved' | 'ongoing' | 'on_hold' | 'archived';
  addedAt: any;
  lastActivity?: any;
  lastUpdatedAt?: any;
  watchers: string[];
  notes: Array<{
    id: string;
    content: string;
    authorId: string;
    createdAt: any;
    updatedAt: any;
  }>;
  orgId: string;
}

export interface DealRoom {
  id: string;
  name: string;
  type: 'deal';
  projectId: string;
  orgId: string;
  members: string[];
  ownerId: string;
  createdAt: any;
  lastActivityAt: any;
  status: 'active' | 'archived' | 'closed';
  privacy: {
    inviteOnly: boolean;
  };
  settings: {
    calls: boolean;
    filesAllowed: boolean;
  };
  nda?: {
    required: boolean;
    acceptedBy: string[];
    documentUrl?: string;
  };
}

export interface VCTermSheetTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  template: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      order?: number;
      variables: string[];
      subsections?: Array<{
        id: string;
        title: string;
        content: string;
        variables?: string[];
      }>;
    }>;
    variables: Record<
      string,
      {
        label?: string;
        type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'percentage' | 'currency';
        required?: boolean;
        options?: string[];
        defaultValue?: string;
        placeholder?: string;
        description?: string;
        helperText?: string;
      }
    >;
    metadata?: {
      version?: number;
      lastUpdated?: any;
      createdBy?: string;
    };
  };
  isDefault?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DealRoomMessage {
  id: string;
  roomId: string;
  type: 'text' | 'system' | 'file' | 'image' | 'video' | 'voice';
  content: string;
  authorId: string;
  createdAt: any;
  updatedAt: any;
  replyTo?: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    createdAt: any;
  }>;
  readBy?: Array<{
    userId: string;
    readAt: any;
  }>;
}

export interface VCMetrics {
  orgId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  projectsViewed: number;
  meetingsScheduled: number;
  totalCommitted: number;
  avgRaftAIScore: number;
  successRate: number;
  timeToClose: number;
  activeDeals: number;
  totalInvested: number;
  averageDealSize: number;
  winRate: number;
  avgTimeInStage: Record<string, number>;
  conversionRate: Record<string, number>;
  sectorBreakdown: Record<string, number>;
  chainBreakdown: Record<string, number>;
  stageBreakdown: Record<string, number>;
}

export interface VCNotification {
  id: string;
  userId: string;
  orgId: string;
  type: 'project_accepted' | 'project_declined' | 'deal_room_created' | 'message_received' | 'file_uploaded' | 'meeting_scheduled' | 'term_sheet_updated' | 'kyb_approved' | 'kyc_approved';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: any;
}

export interface TermSheet {
  id: string;
  roomId: string;
  projectId: string;
  orgId: string;
  state: 'draft' | 'shared' | 'agreed_in_principle' | 'legal_review' | 'signed' | 'funded' | 'closed';
  terms: {
    investmentAmount: number;
    valuation: number;
    equityPercentage?: number;
    tokenPercentage?: number;
    instrument: 'SAFE' | 'Token' | 'Equity' | 'Convertible Note';
    currency: string;
    tranches?: Array<{
      amount: number;
      milestone: string;
      date?: any;
    }>;
    vesting?: {
      cliff: number; // months
      duration: number; // months
    };
    rights?: string[];
    liquidationPreference?: number;
    antiDilution?: string;
    boardSeats?: number;
    informationRights?: boolean;
    proRataRights?: boolean;
  };
  legalDocuments?: {
    termSheetUrl?: string;
    legalReviewUrl?: string;
    signedDocumentUrl?: string;
  };
  signatures?: Array<{
    signatoryId: string;
    signatoryName: string;
    signedAt: any;
    signatureUrl?: string;
  }>;
  fundingProof?: {
    transactionHash?: string;
    bankConfirmation?: string;
    amount: number;
    currency: string;
    fundedAt: any;
  };
  createdAt: any;
  updatedAt: any;
  closedAt?: any;
}

export interface VCAuditEvent {
  id: string;
  action: string;
  userId: string;
  orgId: string;
  data: any;
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface VCOrganization {
  id: string;
  type: 'vc';
  name: string;
  website?: string;
  logoUrl?: string;
  country: string;
  thesis: {
    stages: string[];
    sectors: string[];
    chains: string[];
  };
  aum?: number;
  contactEmail: string;
  members: Array<{
    uid: string;
    role: 'owner' | 'admin' | 'viewer';
    joinedAt: any;
  }>;
  kyb?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt: any;
  };
  createdAt: any;
  updatedAt: any;
}

export interface VCUser {
  uid: string;
  role: 'vc';
  profileCompleted: boolean;
  orgId?: string;
  onboarding: {
    step: 'profile' | 'verification' | 'done';
    completedAt?: any;
  };
  kyc?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt: any;
  };
  createdAt: any;
  updatedAt: any;
}
