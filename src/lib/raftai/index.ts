/**
 * RaftAI - Complete Intelligence & Compliance Engine
 * Main orchestration layer that ties all modules together
 */

import { RAFTAI_CONFIG, validateConfig } from './config';
import { kycEngine } from './kyc-engine';
import { kybEngine } from './kyb-engine';
import { pitchEngine } from './pitch-engine';
import { chatAssistant } from './chat-assistant';
import { videoVerification } from './video-verification';
import { counterpartyScoring } from './counterparty-scoring';
import { raftaiFirebase } from './firebase-service';
import { projectRanking } from './project-ranking';
import type {
  KYCRequest,
  KYCResult,
  KYBRequest,
  KYBResult,
  PitchAnalysisRequest,
  PitchAnalysisResult,
  ChatContext,
  ChatResponse,
  VideoVerificationRequest,
  VideoVerificationResult,
  CounterpartyScore,
  SystemHealth,
} from './types';

export class RaftAI {
  private static instance: RaftAI;
  private initialized: boolean = false;
  private startTime: number = Date.now();

  private constructor() {
    console.log('🧠 RaftAI: Initializing Intelligence & Compliance Engine...');
  }

  static getInstance(): RaftAI {
    if (!RaftAI.instance) {
      RaftAI.instance = new RaftAI();
    }
    return RaftAI.instance;
  }

  /**
   * Initialize RaftAI system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ RaftAI: Already initialized');
      return;
    }

    console.log('🚀 RaftAI: Starting initialization...');

    try {
      // Validate configuration
      const configValid = validateConfig();
      if (!configValid) {
        console.warn('⚠️ RaftAI: Configuration validation warnings');
      }

      // Update system health
      await this.updateSystemHealth();

      this.initialized = true;
      console.log('✅ RaftAI: Initialization complete');
      console.log(`📊 RaftAI: Version ${RAFTAI_CONFIG.version}`);
      console.log(`🌍 RaftAI: Environment ${RAFTAI_CONFIG.environment}`);
    } catch (error) {
      console.error('❌ RaftAI: Initialization failed:', error);
      throw error;
    }
  }

  // ==================== KYC OPERATIONS ====================

  /**
   * Process KYC verification
   */
  async processKYC(request: KYCRequest): Promise<KYCResult> {
    this.ensureInitialized();
    return kycEngine.processKYC(request);
  }

  /**
   * Get KYC history for user
   */
  async getKYCHistory(userId: string): Promise<KYCResult[]> {
    this.ensureInitialized();
    return kycEngine.getKYCHistory(userId);
  }

  /**
   * Check if user can retry KYC
   */
  async canRetryKYC(userId: string) {
    this.ensureInitialized();
    return kycEngine.canRetryKYC(userId);
  }

  // ==================== KYB OPERATIONS ====================

  /**
   * Process KYB verification
   */
  async processKYB(request: KYBRequest): Promise<KYBResult> {
    this.ensureInitialized();
    return kybEngine.processKYB(request);
  }

  /**
   * Get KYB history for organization
   */
  async getKYBHistory(organizationId: string): Promise<KYBResult[]> {
    this.ensureInitialized();
    return kybEngine.getKYBHistory(organizationId);
  }

  // ==================== PITCH ANALYSIS OPERATIONS ====================

  /**
   * Analyze pitch deck and project
   */
  async analyzePitch(request: PitchAnalysisRequest): Promise<PitchAnalysisResult> {
    this.ensureInitialized();
    return pitchEngine.analyzePitch(request);
  }

  /**
   * Get pitch analysis history
   */
  async getPitchHistory(projectId: string): Promise<PitchAnalysisResult[]> {
    this.ensureInitialized();
    return raftaiFirebase.getProjectPitchHistory(projectId);
  }

  // ==================== CHAT OPERATIONS ====================

  /**
   * Process chat message with RaftAI
   */
  async chat(context: ChatContext, message: string): Promise<ChatResponse> {
    this.ensureInitialized();
    return chatAssistant.processMessage(context, message);
  }

  /**
   * Moderate message before sending
   */
  async moderateMessage(message: string, context: ChatContext) {
    this.ensureInitialized();
    return chatAssistant.moderateMessage(message, context);
  }

  // ==================== VIDEO VERIFICATION OPERATIONS ====================

  /**
   * Verify video for liveness and authenticity
   */
  async verifyVideo(request: VideoVerificationRequest): Promise<VideoVerificationResult> {
    this.ensureInitialized();
    return videoVerification.verifyVideo(request);
  }

  /**
   * Verify live video stream
   */
  async verifyLiveStream(userId: string, sessionId: string, streamUrl: string) {
    this.ensureInitialized();
    return videoVerification.verifyLiveStream(userId, sessionId, streamUrl);
  }

  // ==================== COUNTERPARTY SCORING OPERATIONS ====================

  /**
   * Calculate counterparty score
   */
  async calculateCounterpartyScore(
    entityId: string,
    entityType: 'exchange' | 'market_maker' | 'influencer' | 'investor' | 'founder'
  ): Promise<CounterpartyScore> {
    this.ensureInitialized();
    return counterpartyScoring.calculateScore(entityId, entityType);
  }

  /**
   * Get or calculate counterparty score
   */
  async getCounterpartyScore(
    entityId: string,
    entityType: 'exchange' | 'market_maker' | 'influencer' | 'investor' | 'founder'
  ): Promise<CounterpartyScore> {
    this.ensureInitialized();
    return counterpartyScoring.getOrCalculateScore(entityId, entityType);
  }

  // ==================== AUDIT & ANALYTICS OPERATIONS ====================

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(entityId: string, limit = 50) {
    this.ensureInitialized();
    return raftaiFirebase.getAuditTrail(entityId, limit);
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    return raftaiFirebase.getSystemHealth();
  }

  /**
   * Update system health
   */
  private async updateSystemHealth(): Promise<void> {
    const health: SystemHealth = {
      status: 'operational',
      uptime: Date.now() - this.startTime,
      averageLatency: 150, // ms
      dependencies: {
        firebase: {
          status: 'up',
          latency: 50,
          lastCheck: Date.now(),
        },
        openai: {
          status: RAFTAI_CONFIG.apiKeys.openai ? 'up' : 'down',
          latency: 200,
          lastCheck: Date.now(),
        },
      },
      queueDepth: 0,
      errorRate: 0.001,
    };

    await raftaiFirebase.updateSystemHealth(health);
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to KYC updates
   */
  subscribeToKYCUpdates(userId: string, callback: (results: KYCResult[]) => void) {
    this.ensureInitialized();
    return raftaiFirebase.subscribeToKYCUpdates(userId, callback);
  }

  /**
   * Subscribe to system health
   */
  subscribeToSystemHealth(callback: (health: SystemHealth) => void) {
    return raftaiFirebase.subscribeToSystemHealth(callback);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get RaftAI configuration
   */
  getConfig() {
    return RAFTAI_CONFIG;
  }

  /**
   * Get RaftAI status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      version: RAFTAI_CONFIG.version,
      environment: RAFTAI_CONFIG.environment,
      uptime: Date.now() - this.startTime,
      features: RAFTAI_CONFIG.features,
    };
  }

  /**
   * Ensure RaftAI is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('RaftAI not initialized. Call initialize() first.');
    }
  }

  // ==================== PROJECT RANKING OPERATIONS ====================

  /**
   * Subscribe to ranked projects for a role
   */
  subscribeToRankedProjects(
    userRole: string,
    userId: string,
    callback: (projects: any) => void
  ) {
    this.ensureInitialized();
    return projectRanking.subscribeToRankedProjects(userRole, userId, callback);
  }

  /**
   * Recalculate all project scores
   */
  async recalculateProjectScores() {
    this.ensureInitialized();
    return projectRanking.recalculateAllScores();
  }

  /**
   * Update score for a specific project
   */
  async updateProjectScore(projectId: string, projectData: any) {
    this.ensureInitialized();
    return projectRanking.updateProjectScore(projectId, projectData);
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Process multiple KYC requests in batch
   */
  async batchProcessKYC(requests: KYCRequest[]): Promise<KYCResult[]> {
    this.ensureInitialized();
    console.log(`🔄 RaftAI: Processing batch of ${requests.length} KYC requests`);
    
    const results = await Promise.allSettled(
      requests.map(req => this.processKYC(req))
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map((r: any) => r.value);
  }

  /**
   * Process multiple pitch analyses in batch
   */
  async batchAnalyzePitches(requests: PitchAnalysisRequest[]): Promise<PitchAnalysisResult[]> {
    this.ensureInitialized();
    console.log(`🔄 RaftAI: Processing batch of ${requests.length} pitch analyses`);
    
    const results = await Promise.allSettled(
      requests.map(req => this.analyzePitch(req))
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map((r: any) => r.value);
  }
}

// Export singleton instance as default
export const raftAI = RaftAI.getInstance();

// Also export individual engines for direct access if needed
export {
  kycEngine,
  kybEngine,
  pitchEngine,
  chatAssistant,
  videoVerification,
  counterpartyScoring,
  raftaiFirebase,
};

// Export project ranking engine
export { projectRanking } from './project-ranking';
export type {
  ProjectTier,
  PotentialScoreFactors,
  RankedProject,
  ProjectsByTier,
} from './project-ranking';

// Export types
export * from './types';
export * from './config';

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  console.log('🌐 RaftAI: Browser environment detected, auto-initializing...');
  raftAI.initialize().catch(console.error);

  // Expose RaftAI to window for debugging
  (window as any).raftAI = {
    core: raftAI,
    status: () => raftAI.getStatus(),
    config: () => raftAI.getConfig(),
    
    // Test functions
    testKYC: (userId: string) => raftAI.processKYC({
      userId,
      personalInfo: {
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        address: '123 Test St',
        phone: '+1234567890',
        email: 'test@example.com',
      },
      documents: {
        idDocument: {
          type: 'passport',
          number: 'TEST123',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
          issuingCountry: 'US',
        },
      },
    }),
  };

  console.log('🔧 RaftAI: Debug tools available via window.raftAI');
}

