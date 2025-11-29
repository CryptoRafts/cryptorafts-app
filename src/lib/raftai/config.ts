/**
 * RaftAI Configuration
 * Central configuration for all RaftAI modules
 */

export const RAFTAI_CONFIG = {
  // System Identity
  name: 'RaftAI',
  version: '3.0.0',
  environment: process.env.NODE_ENV || 'development',

  // Performance Thresholds
  performance: {
    maxProcessingTime: 5000, // 5 seconds happy path
    timeoutThreshold: 30000, // 30 seconds before timeout
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Risk Scoring Thresholds
  riskThresholds: {
    low: 30,
    medium: 60,
    high: 80,
    critical: 90,
  },

  // KYC Configuration
  kyc: {
    requiredDocuments: ['id_document', 'selfie'],
    optionalDocuments: ['proof_of_address'],
    faceMatchThreshold: 0.85,
    livenessThreshold: 0.90,
    documentAuthenticityThreshold: 0.80,
    cooldownPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxRetries: 3,
  },

  // KYB Configuration
  kyb: {
    requiredDocuments: ['registration_certificate', 'articles_of_association'],
    optionalDocuments: ['tax_registration', 'proof_of_address'],
    minimumOwnershipDisclosure: 0.25, // 25%
    cooldownPeriod: 14 * 24 * 60 * 60 * 1000, // 14 days
    maxRetries: 3,
  },

  // Pitch Analysis Configuration
  pitchAnalysis: {
    minimumScore: 60,
    highRatingThreshold: 80,
    normalRatingThreshold: 60,
    requiredSections: ['problem', 'solution', 'market', 'team', 'tokenomics'],
    cooldownPeriod: 24 * 60 * 60 * 1000, // 24 hours
    maxReanalysisPerMonth: 3,
  },

  // Chat Moderation
  chatModeration: {
    enablePreModeration: true,
    fraudDetectionThreshold: 0.75,
    piiRedactionEnabled: true,
    autoTranslationEnabled: true,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'],
  },

  // Video Verification
  videoVerification: {
    deepfakeDetectionThreshold: 0.80,
    livenessThreshold: 0.85,
    facialGeometryThreshold: 0.90,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['mp4', 'webm', 'mov'],
  },

  // Compliance
  compliance: {
    enableJurisdictionalChecks: true,
    enableCrossBorderValidation: true,
    enableNDAEnforcement: true,
    supportedJurisdictions: ['US', 'EU', 'UK', 'SG', 'HK', 'UAE'],
    sanctionsLists: ['OFAC', 'UN', 'EU', 'UK_HMT'],
    pepSources: ['OpenSanctions', 'WorldCheck'],
  },

  // Audit & Privacy
  audit: {
    retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    enableCryptographicSigning: true,
    enableImmutableStorage: true,
    hashAlgorithm: 'SHA-256',
    piiRedaction: true,
    tenantIsolation: true,
  },

  // Webhooks
  webhooks: {
    enableHMACValidation: true,
    hmacAlgorithm: 'sha256',
    enableIdempotency: true,
    maxRetries: 5,
    retryBackoff: 'exponential',
  },

  // Firebase Collections
  collections: {
    kycRequests: 'raftai_kyc_requests',
    kycResults: 'raftai_kyc_results',
    kybRequests: 'raftai_kyb_requests',
    kybResults: 'raftai_kyb_results',
    pitchAnalyses: 'raftai_pitch_analyses',
    chatInteractions: 'raftai_chat_interactions',
    chatModerations: 'raftai_chat_moderations',
    videoVerifications: 'raftai_video_verifications',
    complianceChecks: 'raftai_compliance_checks',
    auditLogs: 'raftai_audit_logs',
    counterpartyScores: 'raftai_counterparty_scores',
    anomalyDetections: 'raftai_anomaly_detections',
    systemHealth: 'raftai_system_health',
    analytics: 'raftai_analytics',
  },

  // API Keys (from environment)
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    onfido: process.env.ONFIDO_API_KEY, // For KYC/KYB verification
    sumsub: process.env.SUMSUB_API_KEY, // Alternative KYC provider
    chainalysis: process.env.CHAINALYSIS_API_KEY, // For blockchain analysis
  },

  // Feature Flags
  features: {
    enableOpenAIIntegration: true,
    enableRealTimeScoring: true,
    enablePredictiveAnalytics: true,
    enableBehavioralAnalysis: true,
    enableDeepfakeDetection: true,
    enableAnomalyDetection: true,
  },

  // Scoring Weights
  scoringWeights: {
    pitch: {
      teamStrength: 0.20,
      marketOpportunity: 0.18,
      technicalFeasibility: 0.15,
      tokenomicsDesign: 0.15,
      financialViability: 0.12,
      competitiveAdvantage: 0.10,
      complianceReadiness: 0.07,
      executionRisk: 0.03,
    },
    kyc: {
      faceMatch: 0.25,
      liveness: 0.20,
      documentVerification: 0.20,
      sanctionsCheck: 0.20,
      pepCheck: 0.10,
      amlCheck: 0.05,
    },
    kyb: {
      entityVerification: 0.25,
      ownershipTransparency: 0.20,
      directorsCheck: 0.15,
      sanctionsCheck: 0.20,
      financialStability: 0.15,
      regulatoryCompliance: 0.05,
    },
  },

  // UI Colors
  uiColors: {
    approved: '#10b981',
    pending: '#f59e0b',
    rejected: '#ef4444',
    high: '#10b981',
    normal: '#3b82f6',
    low: '#6b7280',
  },
};

// Validation helper
export function validateConfig(): boolean {
  const required = [
    RAFTAI_CONFIG.apiKeys.openai,
    // Add other required keys
  ];

  const missing = required.filter(key => !key);
  
  if (missing.length > 0) {
    console.warn('⚠️ RaftAI: Missing required configuration');
    return false;
  }

  return true;
}

// Export typed config
export type RaftAIConfigType = typeof RAFTAI_CONFIG;

