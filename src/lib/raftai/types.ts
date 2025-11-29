/**
 * RaftAI - Complete Type Definitions
 * All interfaces and types for the RaftAI Intelligence & Compliance Engine
 */

// ==================== CORE TYPES ====================

export type DecisionStatus = 'approved' | 'pending' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PitchRating = 'high' | 'normal' | 'low';
export type VerificationStatus = 'verified' | 'pending' | 'suspicious' | 'rejected';

// ==================== KYC TYPES ====================

export interface KYCRequest {
  userId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    phone: string;
    email: string;
  };
  documents: {
    idDocument: {
      type: 'passport' | 'drivers_license' | 'national_id';
      number: string;
      issueDate: string;
      expiryDate: string;
      issuingCountry: string;
      documentUrl?: string;
    };
    proofOfAddress?: {
      type: 'utility_bill' | 'bank_statement' | 'rental_agreement';
      documentUrl: string;
      issueDate: string;
    };
    selfieUrl?: string;
  };
  biometricData?: {
    faceImage: string;
    livenessVideo?: string;
  };
}

export interface KYCResult {
  requestId: string;
  userId: string;
  status: DecisionStatus;
  riskScore: number; // 0-100
  confidence: number; // 0-100
  reasons: string[];
  cooldownUntil?: number;
  timestamp: number;
  processingTime: number;
  checks: {
    faceMatch: { passed: boolean; confidence: number; };
    liveness: { passed: boolean; confidence: number; };
    idVerification: { passed: boolean; confidence: number; };
    addressVerification: { passed: boolean; confidence: number; };
    sanctionsCheck: { passed: boolean; found: boolean; };
    pepCheck: { passed: boolean; found: boolean; };
    amlCheck: { passed: boolean; riskLevel: RiskLevel; };
    adverseMedia: { passed: boolean; found: boolean; };
  };
  evidenceHash: string;
  auditable: AuditEntry;
}

// ==================== KYB TYPES ====================

export interface KYBRequest {
  organizationId: string;
  companyInfo: {
    legalName: string;
    tradingName?: string;
    registrationNumber: string;
    taxId: string;
    jurisdiction: string;
    incorporationDate: string;
    businessType: string;
    industry: string;
    address: string;
    website?: string;
    phone: string;
    email: string;
  };
  ownership: {
    beneficialOwners: Array<{
      name: string;
      ownershipPercentage: number;
      nationality: string;
      dateOfBirth: string;
      address: string;
    }>;
    directors: Array<{
      name: string;
      title: string;
      nationality: string;
      appointmentDate: string;
    }>;
  };
  documents: {
    registrationCertificate?: string;
    articlesOfAssociation?: string;
    shareholderRegistry?: string;
    taxRegistration?: string;
    proofOfAddress?: string;
  };
}

export interface KYBResult {
  requestId: string;
  organizationId: string;
  status: DecisionStatus;
  riskScore: number;
  confidence: number;
  reasons: string[];
  cooldownUntil?: number;
  timestamp: number;
  processingTime: number;
  checks: {
    entityVerification: { passed: boolean; confidence: number; };
    directorsCheck: { passed: boolean; confidence: number; };
    registryVerification: { passed: boolean; confidence: number; };
    sanctionsCheck: { passed: boolean; found: boolean; };
    pepCheck: { passed: boolean; found: boolean; };
    amlCheck: { passed: boolean; riskLevel: RiskLevel; };
    ownershipTransparency: { passed: boolean; score: number; };
    financialStability: { passed: boolean; score: number; };
  };
  evidenceHash: string;
  auditable: AuditEntry;
}

// ==================== PITCH INTELLIGENCE TYPES ====================

export interface PitchAnalysisRequest {
  projectId: string;
  founderId: string;
  pitch: {
    title: string;
    description: string;
    problem: string;
    solution: string;
    targetMarket: string;
    businessModel: string;
    tokenomics?: {
      totalSupply: number;
      allocation: Record<string, number>;
      vestingSchedule?: string;
      utility: string;
    };
    team: Array<{
      name: string;
      role: string;
      experience: string;
      linkedIn?: string;
    }>;
    roadmap: Array<{
      milestone: string;
      date: string;
      status: 'completed' | 'in-progress' | 'planned';
    }>;
    financials: {
      fundingTarget: number;
      currentFunding: number;
      burnRate?: number;
      revenue?: number;
    };
  };
  documents?: {
    whitepaper?: string;
    pitchDeck?: string;
    tokenomicsSheet?: string;
    financialModel?: string;
    auditReport?: string;
  };
}

export interface PitchAnalysisResult {
  requestId: string;
  projectId: string;
  rating: PitchRating;
  score: number; // 0-100
  confidence: number;
  summary: string;
  risks: Array<{
    category: string;
    severity: RiskLevel;
    description: string;
    impact: string;
  }>;
  strengths: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }>;
  categories: {
    teamStrength: number;
    marketOpportunity: number;
    technicalFeasibility: number;
    tokenomicsDesign: number;
    financialViability: number;
    competitiveAdvantage: number;
    complianceReadiness: number;
    executionRisk: number;
  };
  visibility: {
    shouldHighlight: boolean;
    listingOrder: number;
    badges: string[];
  };
  timestamp: number;
  processingTime: number;
  versionHash: string;
  auditable: AuditEntry;
}

// ==================== COUNTERPARTY SCORING TYPES ====================

export interface CounterpartyScore {
  entityId: string;
  entityType: 'exchange' | 'market_maker' | 'influencer' | 'investor' | 'founder';
  scores: {
    listingReadiness?: number; // For exchanges
    liquidityNeed?: number; // For market makers
    influencerReputation?: number; // For influencers
    investorCredibility?: number; // For VCs
    founderTrustScore?: number; // For founders
    complianceRisk: number; // For all
  };
  indicators: {
    verified: boolean;
    riskLevel: RiskLevel;
    jurisdiction: string;
    redFlags: number;
    greenFlags: number;
    historicalPerformance?: number;
  };
  badges: string[];
  recommendations: string[];
  lastUpdated: number;
}

// ==================== CHAT ASSISTANT TYPES ====================

export interface ChatContext {
  sessionId: string;
  chatRoomId: string;
  userId: string;
  userRole: string;
  participants: string[];
  projectId?: string;
  dealId?: string;
}

export interface ChatCommand {
  command: string;
  parameters?: Record<string, any>;
  context: ChatContext;
}

export interface ChatResponse {
  type: 'response' | 'moderation_warning' | 'compliance_alert' | 'action_items' | 'decision_recap';
  content: string;
  metadata?: {
    suggestions?: string[];
    warnings?: string[];
    complianceIssues?: string[];
    redactedContent?: string;
  };
  timestamp: number;
}

export interface ModerationResult {
  allowed: boolean;
  confidence: number;
  flags: Array<{
    type: 'fraud' | 'pii' | 'misinformation' | 'inappropriate' | 'ai_generated';
    severity: RiskLevel;
    description: string;
  }>;
  suggestedEdits?: string;
  requiresProof?: boolean;
}

// ==================== VIDEO VERIFICATION TYPES ====================

export interface VideoVerificationRequest {
  userId: string;
  sessionId: string;
  videoStream?: string;
  videoFile?: string;
  referenceBiometric?: string;
}

export interface VideoVerificationResult {
  requestId: string;
  userId: string;
  status: 'verified_real' | 'suspicious' | 'fake' | 'error';
  confidence: number;
  checks: {
    facialGeometry: { match: boolean; confidence: number; };
    microExpressions: { natural: boolean; confidence: number; };
    lightingConsistency: { passed: boolean; score: number; };
    deepfakeDetection: { isProbableFake: boolean; confidence: number; };
    livenessCheck: { passed: boolean; score: number; };
  };
  evidenceHash: string;
  timestamp: number;
  auditable: AuditEntry;
}

// ==================== COMPLIANCE TYPES ====================

export interface ComplianceCheck {
  entityId: string;
  entityType: 'user' | 'organization' | 'transaction' | 'project';
  jurisdiction: string;
  checkType: 'kyc' | 'kyb' | 'aml' | 'sanctions' | 'pep' | 'adverse_media' | 'cross_border';
  data: any;
}

export interface ComplianceResult {
  requestId: string;
  passed: boolean;
  riskLevel: RiskLevel;
  flags: string[];
  warnings: string[];
  requiredActions: string[];
  jurisdictionalIssues?: Array<{
    country: string;
    regulation: string;
    violation: string;
    recommendation: string;
  }>;
  timestamp: number;
}

// ==================== AUDIT TYPES ====================

export interface AuditEntry {
  auditId: string;
  timestamp: number;
  requestType: string;
  entityId: string;
  userId?: string;
  action: string;
  inputHash: string;
  outputHash: string;
  decision: string;
  reasoningSnapshot: string;
  evidenceReferences: string[];
  reviewerId?: string;
  cryptographicSignature: string;
  correlationId: string;
}

export interface AuditLog {
  entries: AuditEntry[];
  searchable: boolean;
  immutable: boolean;
  retentionPeriod: number;
}

// ==================== RANKING & VISIBILITY TYPES ====================

export interface EntityRanking {
  entityId: string;
  entityType: 'project' | 'founder' | 'investor';
  globalScore: number;
  categoryScores: Record<string, number>;
  visibility: {
    publicWebsite: boolean;
    investorDashboard: boolean;
    exchangeDashboard: boolean;
    idoDashboard: boolean;
    rank: number;
  };
  badges: Array<{
    type: 'verified' | 'high_potential' | 'compliance_ready' | 'audited';
    color: string;
    icon: string;
  }>;
  trending: boolean;
  lastUpdated: number;
}

// ==================== WEBHOOK TYPES ====================

export interface WebhookPayload {
  eventType: string;
  eventId: string;
  timestamp: number;
  data: any;
  signature: string;
  correlationId: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  error?: string;
}

// ==================== ANALYTICS TYPES ====================

export interface RaftAIAnalytics {
  period: string;
  metrics: {
    totalRequests: number;
    averageProcessingTime: number;
    approvalRate: number;
    rejectionRate: number;
    pendingRate: number;
    averageRiskScore: number;
    topRejectionReasons: Array<{ reason: string; count: number; }>;
    jurisdictionBreakdown: Record<string, number>;
    accuracyMetrics: {
      truePositives: number;
      falsePositives: number;
      trueNegatives: number;
      falseNegatives: number;
      precision: number;
      recall: number;
    };
  };
  trends: {
    riskTrend: 'increasing' | 'stable' | 'decreasing';
    verificationVolume: 'increasing' | 'stable' | 'decreasing';
    complianceHealthScore: number;
  };
}

// ==================== SYSTEM HEALTH TYPES ====================

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  averageLatency: number;
  dependencies: Record<string, {
    status: 'up' | 'down';
    latency: number;
    lastCheck: number;
  }>;
  queueDepth: number;
  errorRate: number;
  lastIncident?: {
    time: number;
    description: string;
    resolved: boolean;
  };
}

// ==================== BEHAVIORAL ANOMALY TYPES ====================

export interface AnomalyDetection {
  entityId: string;
  anomalyType: 'rapid_project_switching' | 'unrealistic_targets' | 'bot_communication' | 'identity_spoofing' | 'document_tampering';
  severity: RiskLevel;
  confidence: number;
  description: string;
  evidence: string[];
  recommendedAction: string;
  timestamp: number;
}

// ==================== EXPLAINABILITY TYPES ====================

export interface ExplainableDecision {
  decisionId: string;
  decision: string;
  confidence: number;
  reasoning: {
    primaryFactors: Array<{
      factor: string;
      weight: number;
      impact: 'positive' | 'negative';
      explanation: string;
    }>;
    dataPoints: Array<{
      name: string;
      value: any;
      significance: number;
    }>;
    alternativeOutcomes: Array<{
      scenario: string;
      probability: number;
    }>;
  };
  humanReadableExplanation: string;
  technicalDetails: Record<string, any>;
  recommendedNextSteps: string[];
}

