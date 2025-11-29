"use client";
import { db } from './firebase.client';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, Firestore } from 'firebase/firestore';

export interface RaftAIRequest {
  type: 'kyc' | 'kyb' | 'pitch_analysis' | 'due_diligence' | 'chat' | 'compliance_check';
  data: any;
  userId: string;
  sessionId?: string;
  metadata?: any;
}

export interface RaftAIResponse {
  id: string;
  requestId: string;
  type: string;
  status: 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  timestamp: number;
  processingTime?: number;
}

export interface KYCResult {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  reasons: string[];
  cooldownUntil?: number;
  confidence: number;
  details: {
    faceMatch: boolean;
    liveness: boolean;
    idVerification: boolean;
    addressVerification: boolean;
    sanctionsCheck: boolean;
    pepCheck: boolean;
  };
}

export interface KYBResult {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  reasons: string[];
  cooldownUntil?: number;
  confidence: number;
  details: {
    entityVerification: boolean;
    directorsCheck: boolean;
    registryVerification: boolean;
    sanctionsCheck: boolean;
    pepCheck: boolean;
  };
}

export interface PitchAnalysisResult {
  score: number;
  viability: 'high' | 'medium' | 'low';
  summary: string;
  recommendations: string[];
  risks: string[];
  strengths: string[];
  nextSteps: string[];
  rating?: 'High' | 'Normal' | 'Low' | 'Very Low';
  confidence?: number;
  // Enhanced comprehensive analysis fields
  executiveSummary?: string;
  findings?: Array<{
    category: string;
    finding: string;
    source: string;
    timestamp: string;
    evidence: string;
  }>;
  riskDrivers?: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    remediation: string;
    evidence: string;
  }>;
  comparableProjects?: Array<{
    project: string;
    similarity: string;
    marketPosition: string;
  }>;
  marketOutlook?: {
    narrative: string;
    marketFit: 'excellent' | 'good' | 'moderate' | 'poor';
    trends: string[];
    opportunity: string;
  };
  tokenomicsReview?: {
    assessment: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  };
  teamAnalysis?: {
    overall: string;
    members: Array<{
      name: string;
      role: string;
      linkedinVerified: boolean;
      credibility: string;
      flags: string[];
    }>;
    linkedinLinks: string[];
  };
  auditHistory?: {
    status: string;
    findings: string[];
    links: string[];
  };
  onChainActivity?: {
    status: string;
    findings: string[];
    addresses: string[];
  };
  riskScore?: number; // 1-100
  unverifiableClaims?: string[];
  documentAnalysis?: any;
}

export interface DueDiligenceResult {
  readinessScore: number;
  category: 'listing_readiness' | 'liquidity_need' | 'audit_status' | 'compliance';
  redFlags: string[];
  checklist: { [key: string]: boolean };
  auditLinks: string[];
  suggestions: string[];
}

export class RaftAIService {
  private static instance: RaftAIService;
  private processingQueue: Map<string, RaftAIResponse> = new Map();
  private getDb(): Firestore | null {
    // Try to get db from firebase.client, or from global (for testing)
    try {
      return db || (global as any).__FIREBASE_DB__ || null;
    } catch {
      return (global as any).__FIREBASE_DB__ || null;
    }
  }

  static getInstance(): RaftAIService {
    if (!RaftAIService.instance) {
      RaftAIService.instance = new RaftAIService();
    }
    return RaftAIService.instance;
  }

  async processKYC(userId: string, kycData: any): Promise<KYCResult> {
    const requestId = `kyc_${userId}_${Date.now()}`;
    
    // Create request record
    await this.createRequest({
      type: 'kyc',
      data: kycData,
      userId,
      metadata: { requestId }
    });

    // Simulate AI processing with realistic timing
    const result = await this.simulateKYCProcessing(kycData);
    
    // Store result
    await this.storeResult(requestId, result);
    
    // Note: Don't update user claims here - admin will make the final decision
    // RaftAI provides analysis, admin approves/rejects

    return result;
  }

  async processKYB(userId: string, kybData: any): Promise<KYBResult> {
    const requestId = `kyb_${userId}_${Date.now()}`;
    
    await this.createRequest({
      type: 'kyb',
      data: kybData,
      userId,
      metadata: { requestId }
    });

    const result = await this.simulateKYBProcessing(kybData);
    await this.storeResult(requestId, result);
    
    // Note: Don't update user claims here - admin will make the final decision
    // RaftAI provides analysis, admin approves/rejects

    return result;
  }

  async analyzePitch(userId: string, pitchData: any): Promise<PitchAnalysisResult> {
    const requestId = `pitch_${userId}_${Date.now()}`;
    
    await this.createRequest({
      type: 'pitch_analysis',
      data: pitchData,
      userId,
      metadata: { requestId }
    });

    // ALWAYS try OpenAI-powered comprehensive analysis first (100% availability)
    // Only fall back to simulation if OpenAI is truly unavailable or fails
    try {
      const { openaiService } = await import('./raftai/openai-service');
      
      // Re-check if enabled (in case API key was set after initialization)
      // Always prioritize OpenAI when available - this ensures 100% availability when API key is present
      if (!openaiService.isEnabled()) {
        console.warn('⚠️ RaftAI: OpenAI service not enabled, will use enhanced simulation mode');
        console.log('💡 RaftAI: To enable OpenAI analysis, set OPENAI_API_KEY environment variable');
      }
      
      if (openaiService.isEnabled()) {
        console.log('🤖 RaftAI: Starting comprehensive real-time due-diligence analysis with OpenAI...');
        console.log('📊 RaftAI: Project data:', {
          title: pitchData.title || pitchData.projectName || pitchData.name,
          hasDocuments: !!(pitchData.pitch?.documents || pitchData.documents),
          teamSize: (pitchData.pitch?.teamMembers || pitchData.teamMembers || pitchData.team || []).length,
          hasTokenomics: !!(pitchData.pitch?.tokenomics || pitchData.tokenomics),
          documents: {
            pitchDeck: !!(pitchData.pitch?.documents?.pitchDeck || pitchData.documents?.pitchDeck),
            whitepaper: !!(pitchData.pitch?.documents?.whitepaper || pitchData.documents?.whitepaper),
            tokenomics: !!(pitchData.pitch?.documents?.tokenomics || pitchData.documents?.tokenomics),
            roadmap: !!(pitchData.pitch?.documents?.roadmap || pitchData.documents?.roadmap)
          }
        });
        
        const startTime = Date.now();
        console.log('⏳ RaftAI: Calling OpenAI GPT-4 for comprehensive analysis...');
        
        try {
          const aiAnalysis = await openaiService.analyzePitchWithAI(pitchData);
          const processingTime = Date.now() - startTime;
          
          console.log(`✅ RaftAI: OpenAI analysis completed in ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)`);
          console.log('📊 RaftAI: Analysis summary:', {
            score: aiAnalysis.score,
            riskScore: aiAnalysis.riskScore,
            confidence: aiAnalysis.confidence,
            rating: aiAnalysis.rating,
            findingsCount: aiAnalysis.findings?.length || 0,
            riskDriversCount: aiAnalysis.riskDrivers?.length || 0,
            comparableProjectsCount: aiAnalysis.comparableProjects?.length || 0,
            teamMembersAnalyzed: aiAnalysis.teamAnalysis?.members?.length || 0,
            hasMarketOutlook: !!aiAnalysis.marketOutlook,
            hasTokenomicsReview: !!aiAnalysis.tokenomicsReview
          });
        
        // Convert OpenAI analysis to PitchAnalysisResult format
        // Ensure consistent scoring: score is 0-100, riskScore is inverse (100 - score)
        // This ensures perfect scoring consistency everywhere
        const normalizedScore = Math.max(0, Math.min(100, aiAnalysis.score || 50));
        const normalizedRiskScore = aiAnalysis.riskScore !== undefined 
          ? Math.max(1, Math.min(100, aiAnalysis.riskScore))
          : Math.max(1, Math.min(100, 100 - normalizedScore));
        const normalizedConfidence = Math.max(0, Math.min(100, aiAnalysis.confidence || 75));
        
        const result: PitchAnalysisResult = {
          score: normalizedScore,
          viability: normalizedScore >= 80 ? 'high' : normalizedScore >= 60 ? 'medium' : 'low',
          summary: aiAnalysis.executiveSummary || aiAnalysis.summary,
          recommendations: aiAnalysis.recommendations,
          risks: aiAnalysis.risks,
          strengths: aiAnalysis.strengths,
          nextSteps: [
            ...(aiAnalysis.riskDrivers?.filter((r: any) => r.severity === 'high').map((r: any) => `Address: ${r.risk}`) || []),
            ...aiAnalysis.recommendations.slice(0, 3),
            'Review comprehensive analysis report',
            'Engage with team for clarification'
          ],
          // Enhanced fields from comprehensive analysis
          executiveSummary: aiAnalysis.executiveSummary,
          findings: aiAnalysis.findings,
          riskDrivers: aiAnalysis.riskDrivers,
          comparableProjects: aiAnalysis.comparableProjects,
          marketOutlook: aiAnalysis.marketOutlook,
          tokenomicsReview: aiAnalysis.tokenomicsReview,
          teamAnalysis: aiAnalysis.teamAnalysis,
          auditHistory: aiAnalysis.auditHistory,
          onChainActivity: aiAnalysis.onChainActivity,
          riskScore: normalizedRiskScore,
          confidence: normalizedConfidence,
          unverifiableClaims: aiAnalysis.unverifiableClaims,
          rating: normalizedScore >= 85 ? 'High' : normalizedScore >= 70 ? 'Normal' : normalizedScore >= 50 ? 'Low' : 'Very Low'
        };

        await this.storeResult(requestId, result);
        
        // Update project with comprehensive analysis
        if (pitchData.projectId) {
          await this.updateProjectAnalysis(pitchData.projectId, result);
        }

        console.log('✅ RaftAI: Comprehensive OpenAI analysis complete and stored', {
          score: result.score,
          riskScore: result.riskScore,
          confidence: result.confidence,
          executiveSummary: result.executiveSummary?.substring(0, 100) + '...',
          hasFindings: (result.findings?.length || 0) > 0,
          hasRiskDrivers: (result.riskDrivers?.length || 0) > 0,
          hasMarketOutlook: !!result.marketOutlook,
          hasTokenomicsReview: !!result.tokenomicsReview,
          hasTeamAnalysis: !!result.teamAnalysis
        });

        return result;
        } catch (openaiError: any) {
          // Handle specific OpenAI errors
          if (openaiError.message === 'OPENAI_QUOTA_EXCEEDED') {
            console.warn('⚠️ RaftAI: OpenAI quota exceeded - using enhanced simulation mode');
            console.log('💡 RaftAI: To enable real-time analysis, resolve API quota at https://platform.openai.com/account/billing');
          } else if (openaiError.message === 'OPENAI_AUTH_ERROR') {
            console.warn('⚠️ RaftAI: OpenAI authentication error - check API key');
          } else if (openaiError.message === 'OPENAI_MODEL_ERROR') {
            console.warn('⚠️ RaftAI: OpenAI model error - check model availability');
          } else {
            console.error('⚠️ RaftAI: OpenAI analysis failed:', openaiError.message);
          }
          throw openaiError; // Re-throw to trigger fallback
        }
      }
    } catch (error: any) {
      // Only log if it's not a handled OpenAI error
      if (error.message !== 'OPENAI_QUOTA_EXCEEDED' && 
          error.message !== 'OPENAI_AUTH_ERROR' && 
          error.message !== 'OPENAI_MODEL_ERROR') {
        console.error('⚠️ RaftAI: Analysis error, falling back to simulation:', error.message);
      }
    }

    // Fallback to simulation if OpenAI fails
    console.log('📊 RaftAI: Using simulation analysis (OpenAI not available or failed)');
    const result = await this.simulatePitchAnalysis(pitchData);
    await this.storeResult(requestId, result);
    
    // Update project with analysis
    if (pitchData.projectId) {
      await this.updateProjectAnalysis(pitchData.projectId, result);
    }

    return result;
  }

  async performDueDiligence(userId: string, projectId: string, category: string): Promise<DueDiligenceResult> {
    const requestId = `dd_${userId}_${projectId}_${Date.now()}`;
    
    await this.createRequest({
      type: 'due_diligence',
      data: { projectId, category },
      userId,
      metadata: { requestId }
    });

    const result = await this.simulateDueDiligence(projectId, category);
    await this.storeResult(requestId, result);
    
    return result;
  }

  async processChat(userId: string, message: string, sessionId: string, context?: any): Promise<string> {
    const requestId = `chat_${userId}_${sessionId}_${Date.now()}`;
    
    await this.createRequest({
      type: 'chat',
      data: { message, context },
      userId,
      sessionId,
      metadata: { requestId }
    });

    const response = await this.simulateChatProcessing(message, context);
    
    // Store chat interaction
    await this.storeChatInteraction(sessionId, {
      userId,
      message,
      response,
      timestamp: Date.now()
    });

    return response;
  }

  private async createRequest(request: RaftAIRequest): Promise<void> {
    const dbInstance = this.getDb();
    // Skip Firebase operations if db is not available (e.g., in test mode)
    if (!dbInstance) {
      console.log('⚠️  RaftAI: Firebase not available, skipping request logging');
      return;
    }

    // CRITICAL: Sanitize data to remove File objects and other non-serializable data
    const sanitizeData = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (obj instanceof File) return null; // Remove File objects
      if (typeof obj === 'function') return null; // Remove functions
      if (Array.isArray(obj)) {
        return obj.map(sanitizeData).filter(item => item !== null);
      }
      if (typeof obj === 'object' && obj.constructor === Object) {
        const cleaned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = sanitizeData(obj[key]);
            if (value !== null && value !== undefined) {
              cleaned[key] = value;
            }
          }
        }
        return cleaned;
      }
      return obj;
    };

    const requestDoc = {
      type: request.type,
      data: sanitizeData(request.data), // Sanitize data to remove File objects
      userId: request.userId,
      sessionId: request.sessionId || null,
      metadata: request.metadata || {},
      timestamp: Date.now(),
      status: 'processing'
    };

    try {
      await addDoc(collection(dbInstance, 'raftai_requests'), requestDoc);
    } catch (error) {
      console.warn('⚠️  RaftAI: Failed to log request to Firebase:', error);
      // Continue execution even if logging fails
    }
  }

  private async storeResult(requestId: string, result: any): Promise<void> {
    const dbInstance = this.getDb();
    // Skip Firebase operations if db is not available (e.g., in test mode)
    if (!dbInstance) {
      console.log('⚠️  RaftAI: Firebase not available, skipping result storage');
      return;
    }

    // Helper function to remove undefined values
    const removeUndefined = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
      }
      if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            cleaned[key] = removeUndefined(obj[key]);
          }
        }
        return cleaned;
      }
      return obj;
    };

    const resultDoc = {
      requestId,
      result: removeUndefined(result),
      timestamp: Date.now(),
      status: 'completed'
    };

    try {
      await addDoc(collection(dbInstance, 'raftai_results'), resultDoc);
    } catch (error) {
      console.warn('⚠️  RaftAI: Failed to store result to Firebase:', error);
      // Continue execution even if storage fails
    }
  }

  private async updateUserClaims(userId: string, claims: any): Promise<void> {
    try {
      // Update Firestore user document
      await updateDoc(doc(db!, 'users', userId), {
        ...claims,
        lastUpdated: Date.now()
      });

      // Note: Custom claims will be updated by admin when approving KYC/KYB
      // Don't call update-claims API here to avoid errors
      console.log('User document updated in Firestore. Admin will update auth claims on approval.');
    } catch (error) {
      console.error('Error updating user claims:', error);
    }
  }

  private async updateProjectAnalysis(projectId: string, analysis: PitchAnalysisResult): Promise<void> {
    const dbInstance = this.getDb();
    // Skip Firebase operations if db is not available (e.g., in test mode)
    if (!dbInstance) {
      console.log('⚠️  RaftAI: Firebase not available, skipping project analysis update');
      return;
    }

    try {
      await updateDoc(doc(dbInstance, 'projects', projectId), {
        raftaiAnalysis: analysis,
        analysisTimestamp: Date.now()
      });
    } catch (error) {
      console.warn('⚠️  RaftAI: Failed to update project analysis in Firebase:', error);
      // Continue execution even if update fails
    }
  }

  private async storeChatInteraction(sessionId: string, interaction: any): Promise<void> {
    const dbInstance = this.getDb();
    if (!dbInstance) {
      console.log('⚠️  RaftAI: Firebase not available, skipping chat interaction storage');
      return;
    }
    await addDoc(collection(dbInstance, 'chat_interactions'), {
      sessionId,
      ...interaction
    });
  }

  // Simulation methods - replace with actual AI processing
  private async simulateKYCProcessing(data: any): Promise<KYCResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const faceMatch = Math.random() > 0.1;
    const liveness = Math.random() > 0.05;
    const idVerification = Math.random() > 0.15;
    const addressVerification = Math.random() > 0.2;
    const sanctionsCheck = Math.random() > 0.05;
    const pepCheck = Math.random() > 0.1;

    const riskScore = Math.round(
      (faceMatch ? 0 : 20) +
      (liveness ? 0 : 15) +
      (idVerification ? 0 : 25) +
      (addressVerification ? 0 : 20) +
      (sanctionsCheck ? 0 : 30) +
      (pepCheck ? 0 : 25) +
      Math.random() * 10
    );

    const status = riskScore < 30 ? 'approved' : riskScore > 70 ? 'rejected' : 'pending';
    
    const reasons = [];
    if (!faceMatch) reasons.push('Face match verification failed');
    if (!liveness) reasons.push('Liveness check failed');
    if (!idVerification) reasons.push('ID document verification failed');
    if (!addressVerification) reasons.push('Address verification failed');
    if (!sanctionsCheck) reasons.push('Sanctions check flagged');
    if (!pepCheck) reasons.push('PEP check flagged');

    return {
      status,
      riskScore,
      reasons,
      cooldownUntil: status === 'rejected' ? Date.now() + (7 * 24 * 60 * 60 * 1000) : undefined,
      confidence: Math.round(85 + Math.random() * 15),
      details: {
        faceMatch,
        liveness,
        idVerification,
        addressVerification,
        sanctionsCheck,
        pepCheck
      }
    };
  }

  private async simulateKYBProcessing(data: any): Promise<KYBResult> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 4000));

    const entityVerification = Math.random() > 0.1;
    const directorsCheck = Math.random() > 0.15;
    const registryVerification = Math.random() > 0.2;
    const sanctionsCheck = Math.random() > 0.05;
    const pepCheck = Math.random() > 0.1;

    const riskScore = Math.round(
      (entityVerification ? 0 : 25) +
      (directorsCheck ? 0 : 20) +
      (registryVerification ? 0 : 30) +
      (sanctionsCheck ? 0 : 35) +
      (pepCheck ? 0 : 25) +
      Math.random() * 10
    );

    const status = riskScore < 40 ? 'approved' : riskScore > 80 ? 'rejected' : 'pending';
    
    const reasons = [];
    if (!entityVerification) reasons.push('Entity verification failed');
    if (!directorsCheck) reasons.push('Directors check failed');
    if (!registryVerification) reasons.push('Registry verification failed');
    if (!sanctionsCheck) reasons.push('Sanctions check flagged');
    if (!pepCheck) reasons.push('PEP check flagged');

    return {
      status,
      riskScore,
      reasons,
      cooldownUntil: status === 'rejected' ? Date.now() + (14 * 24 * 60 * 60 * 1000) : undefined,
      confidence: Math.round(80 + Math.random() * 20),
      details: {
        entityVerification,
        directorsCheck,
        registryVerification,
        sanctionsCheck,
        pepCheck
      }
    };
  }

  private async simulatePitchAnalysis(data: any): Promise<PitchAnalysisResult> {
    // Enhanced simulation mode - comprehensive analysis even without OpenAI
    console.log('📊 RaftAI: Running enhanced simulation analysis...');
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000)); // Faster simulation

    // Analyze documents provided
    const documents = data.pitch?.documents || data.documents || {};
    const hasPitchDeck = !!(documents.pitchDeck || documents.pitchDeckUrl);
    const hasWhitepaper = !!(documents.whitepaper || documents.whitepaperUrl);
    const hasTokenomics = !!(documents.tokenomics || documents.tokenomicsUrl || documents.tokenomicsFile);
    const hasRoadmap = !!(documents.roadmap || documents.roadmapUrl);
    const hasProjectLogo = !!(documents.projectLogo || data.logo);
    
    // Analyze team
    const teamMembers = data.pitch?.teamMembers || data.teamMembers || [];
    const hasTeam = teamMembers.length > 0;
    const teamSize = teamMembers.length;
    
    // Analyze project details
    const description = data.description || data.projectDescription || data.pitch?.projectDescription || '';
    const problem = data.pitch?.problem || data.problem || '';
    const solution = data.pitch?.solution || data.solution || '';
    const sector = data.sector || data.pitch?.sector || 'Other';
    const chain = data.chain || data.pitch?.chain || 'Ethereum';
    const stage = data.stage || data.pitch?.stage || 'MVP';
    
    // Tokenomics analysis
    const tokenomics = data.pitch?.tokenomics || data.tokenomics || {};
    const hasTokenomicsData = !!(tokenomics.totalSupply || tokenomics.allocations || tokenomics.vesting);
    
    // Calculate comprehensive base score
    let score = 50; // Base score
    
    // Document completeness scoring (40% of score)
    if (hasPitchDeck) score += 10;
    if (hasWhitepaper) score += 15;
    if (hasTokenomics) score += 15;
    if (hasRoadmap) score += 10;
    if (hasProjectLogo) score += 5;
    
    // Team analysis (20% of score)
    if (hasTeam) {
      score += Math.min(teamSize * 3, 15); // Up to 15 points for team
      if (teamSize >= 3) score += 5; // Bonus for larger teams
      // Check for LinkedIn profiles
      const hasLinkedIn = teamMembers.some((m: any) => m.linkedin || m.linkedIn);
      if (hasLinkedIn) score += 5;
    }
    
    // Project description quality (15% of score)
    if (description.length > 200) score += 5;
    if (description.length > 500) score += 5;
    if (problem && solution) score += 5; // Problem-solution fit
    
    // Tokenomics analysis (15% of score)
    if (hasTokenomicsData) {
      score += 5;
      if (tokenomics.totalSupply) score += 3;
      if (tokenomics.allocations) score += 3;
      if (tokenomics.vesting) score += 4;
    }
    
    // Sector and chain validation (10% of score)
    if (sector && sector !== 'Other') score += 3;
    if (chain && chain !== 'Ethereum') score += 2;
    if (stage && ['MVP', 'Beta', 'Launch'].includes(stage)) score += 5;
    
    // Add some randomness for realistic variation
    score += Math.round(Math.random() * 10 - 5);
    score = Math.max(30, Math.min(100, score)); // Clamp between 30-100
    
    const viability = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    const rating = score >= 85 ? 'High' : score >= 70 ? 'Normal' : score >= 50 ? 'Low' : 'Very Low';
    const riskScore = Math.max(1, Math.min(100, 100 - score + Math.round(Math.random() * 10 - 5)));
    const calculatedConfidence = Math.max(60, Math.min(95, 70 + Math.round(Math.random() * 15)));

    // Generate comprehensive findings with sources
    const findings = [
      {
        category: 'Document Analysis',
        finding: hasPitchDeck ? 'Pitch deck provided - comprehensive presentation available' : 'Pitch deck missing - recommend adding professional presentation',
        source: hasPitchDeck ? 'Pitch Deck Document' : 'Document Review',
        timestamp: new Date().toISOString(),
        evidence: hasPitchDeck ? 'Pitch deck document verified' : 'Pitch deck not found in submission'
      },
      {
        category: 'Document Analysis',
        finding: hasWhitepaper ? 'Whitepaper provided - technical details documented' : 'Whitepaper missing - critical for investor confidence',
        source: hasWhitepaper ? 'Whitepaper Document' : 'Document Review',
        timestamp: new Date().toISOString(),
        evidence: hasWhitepaper ? 'Whitepaper document verified' : 'Whitepaper not found in submission'
      },
      {
        category: 'Tokenomics Review',
        finding: hasTokenomics ? 'Tokenomics document provided - token distribution plan available' : 'Tokenomics missing - essential for investment decision',
        source: hasTokenomics ? 'Tokenomics Document' : 'Tokenomics Review',
        timestamp: new Date().toISOString(),
        evidence: hasTokenomics ? 'Tokenomics document verified' : 'Tokenomics document not found'
      },
      {
        category: 'Team Analysis',
        finding: hasTeam ? `Team of ${teamSize} members identified${teamMembers.some((m: any) => m.linkedin || m.linkedIn) ? ' with LinkedIn profiles' : ''}` : 'Team information missing',
        source: 'Team Data',
        timestamp: new Date().toISOString(),
        evidence: hasTeam ? `${teamSize} team members provided` : 'No team members listed'
      },
      {
        category: 'Project Description',
        finding: description.length > 500 ? 'Comprehensive project description provided' : 'Project description needs more detail',
        source: 'Project Submission',
        timestamp: new Date().toISOString(),
        evidence: `Description length: ${description.length} characters`
      }
    ];

    // Generate risk drivers
    const riskDrivers = [];
    if (!hasPitchDeck) {
      riskDrivers.push({
        risk: 'Missing pitch deck reduces investor confidence and clarity',
        severity: 'medium' as const,
        remediation: 'Create a professional pitch deck with key metrics, visuals, and value proposition',
        evidence: 'Pitch deck not found in project submission'
      });
    }
    if (!hasWhitepaper) {
      riskDrivers.push({
        risk: 'No whitepaper - technical details and architecture unclear',
        severity: 'high' as const,
        remediation: 'Develop comprehensive whitepaper with technical architecture, tokenomics, and roadmap',
        evidence: 'Whitepaper not found in project submission'
      });
    }
    if (!hasTokenomics) {
      riskDrivers.push({
        risk: 'Tokenomics not documented - investment risk and token distribution unclear',
        severity: 'high' as const,
        remediation: 'Document complete tokenomics including allocation, vesting, and distribution schedule',
        evidence: 'Tokenomics document not found'
      });
    }
    if (teamSize < 2) {
      riskDrivers.push({
        risk: 'Limited team size may impact execution capability',
        severity: 'medium' as const,
        remediation: 'Consider expanding team with key roles (CTO, CMO, CFO)',
        evidence: `Only ${teamSize} team member(s) listed`
      });
    }
    if (score < 60) {
      riskDrivers.push({
        risk: 'Overall project viability concerns based on completeness',
        severity: 'medium' as const,
        remediation: 'Strengthen core value proposition, complete missing documentation, and expand team',
        evidence: `Overall score: ${score}/100`
      });
    }

    // Generate comparable projects
    const comparableProjects = [
      {
        project: `Similar ${sector} projects on ${chain}`,
        similarity: 'Sector and blockchain alignment',
        marketPosition: 'Competitive market with established players'
      },
      {
        project: `${sector} ecosystem projects`,
        similarity: 'Same sector focus',
        marketPosition: 'Growing market opportunity'
      }
    ];

    // Market outlook
    const marketOutlook = {
      narrative: `${sector} sector on ${chain} shows ${score >= 70 ? 'strong' : 'moderate'} growth potential. ${hasTeam && teamSize >= 3 ? 'Strong team composition' : 'Team needs expansion'} and ${hasWhitepaper && hasTokenomics ? 'comprehensive documentation' : 'documentation needs completion'} are ${hasWhitepaper && hasTokenomics ? 'positive indicators' : 'areas for improvement'}.`,
      marketFit: score >= 75 ? 'good' as const : score >= 60 ? 'moderate' as const : 'poor' as const,
      trends: [
        `${sector} sector growth`,
        `${chain} ecosystem expansion`,
        'Increased institutional interest'
      ],
      opportunity: score >= 70 ? 'Strong market opportunity with proper execution' : 'Market opportunity exists but requires stronger foundation'
    };

    // Tokenomics review
    const tokenomicsReview = {
      assessment: hasTokenomicsData ? 'Tokenomics structure provided with basic allocation details' : 'Tokenomics documentation incomplete',
      strengths: hasTokenomicsData ? ['Tokenomics structure defined', 'Allocation plan provided'] : [],
      concerns: !hasTokenomics ? ['Tokenomics not documented'] : !tokenomics.vesting ? ['Vesting schedule not specified'] : [],
      recommendations: !hasTokenomics ? ['Document complete tokenomics'] : !tokenomics.vesting ? ['Add vesting schedule'] : ['Review tokenomics for sustainability']
    };

    // Team analysis
    const teamAnalysis = {
      overall: hasTeam ? `Team of ${teamSize} members${teamSize >= 3 ? ' with good composition' : ' - consider expansion'}` : 'Team information not provided',
      members: teamMembers.map((member: any) => ({
        name: member.name || member.fullName || 'Unknown',
        role: member.role || member.position || member.title || 'Team Member',
        linkedinVerified: !!(member.linkedin || member.linkedIn),
        credibility: member.linkedin || member.linkedIn ? 'LinkedIn profile provided' : 'No LinkedIn profile',
        flags: !(member.linkedin || member.linkedIn) ? ['No LinkedIn profile'] : []
      })),
      linkedinLinks: teamMembers
        .map((m: any) => m.linkedin || m.linkedIn)
        .filter(Boolean)
    };

    // Document analysis object (for compatibility)
    const documentAnalysisObj = {
      pitchDeck: hasPitchDeck ? 'Provided' : 'Missing',
      whitepaper: hasWhitepaper ? 'Provided' : 'Missing',
      tokenomics: hasTokenomics ? 'Provided' : 'Missing',
      roadmap: hasRoadmap ? 'Provided' : 'Missing',
      projectLogo: hasProjectLogo ? 'Provided' : 'Missing',
      team: hasTeam ? `${teamSize} members` : 'Not provided'
    };

    const strengths = [
      ...(hasPitchDeck ? ['Professional pitch deck presentation'] : []),
      ...(hasWhitepaper ? ['Comprehensive whitepaper documentation'] : []),
      ...(hasTokenomics ? ['Well-defined tokenomics structure'] : []),
      ...(hasRoadmap ? ['Clear development roadmap'] : []),
      ...(hasTeam && teamSize >= 3 ? ['Strong team composition'] : []),
      ...(hasTeam && teamSize < 3 ? ['Team structure in place'] : []),
      ...(description.length > 500 ? ['Detailed project description'] : []),
      ...(data.pitch?.problem && data.pitch.solution ? ['Clear problem-solution fit'] : []),
      ...(data.pitch?.marketSize ? ['Market opportunity identified'] : [])
    ].filter(Boolean);

    const risks = [
      ...(!hasPitchDeck ? ['Missing pitch deck reduces investor confidence'] : []),
      ...(!hasWhitepaper ? ['No whitepaper - technical details unclear'] : []),
      ...(!hasTokenomics ? ['Tokenomics not documented - investment risk'] : []),
      ...(!hasRoadmap ? ['No roadmap - development timeline unclear'] : []),
      ...(!hasTeam || teamSize < 2 ? ['Limited team size may impact execution'] : []),
      ...(description.length < 200 ? ['Project description needs more detail'] : []),
      ...(score < 60 ? ['Overall project viability concerns'] : []),
      ...(data.pitch?.fundingGoal && data.pitch.fundingGoal > 10000000 ? ['Very high funding ask may be difficult'] : [])
    ].filter(Boolean);

    const recommendations = [
      ...(!hasPitchDeck ? ['Create a professional pitch deck with key metrics and visuals'] : []),
      ...(!hasWhitepaper ? ['Develop comprehensive whitepaper with technical architecture'] : []),
      ...(!hasTokenomics ? ['Document complete tokenomics including allocation and vesting'] : []),
      ...(!hasRoadmap ? ['Create detailed roadmap with milestones and timelines'] : []),
      ...(!hasProjectLogo ? ['Add project logo for brand recognition'] : []),
      ...(teamSize < 3 ? ['Consider expanding team with key roles (CTO, CMO, etc.)'] : []),
      ...(description.length < 500 ? ['Expand project description with more details'] : []),
      ...(score < 70 ? ['Strengthen core value proposition and market positioning'] : []),
      ...(hasPitchDeck && hasWhitepaper && hasTokenomics ? ['All key documents present - excellent preparation'] : [])
    ].filter(Boolean);

    const nextSteps = [
      ...(hasPitchDeck && hasWhitepaper && hasTokenomics ? ['Ready for investor review'] : ['Complete missing documentation']),
      ...(hasTeam ? ['Leverage team expertise for execution'] : ['Build core team']),
      'Prepare for due diligence',
      'Engage with potential investors',
      'Build community and market presence'
    ].filter(Boolean);

    // Confidence based on document completeness
    const confidence = Math.round(
      60 + 
      (hasPitchDeck ? 5 : 0) +
      (hasWhitepaper ? 10 : 0) +
      (hasTokenomics ? 10 : 0) +
      (hasRoadmap ? 5 : 0) +
      (hasTeam ? 5 : 0) +
      Math.random() * 5
    );

    // Executive summary
    const executiveSummary = `${rating} potential ${sector} project on ${chain} (${score}/100). ${hasTeam && teamSize >= 3 ? 'Strong team' : 'Team needs expansion'}. ${hasWhitepaper && hasTokenomics ? 'Comprehensive documentation' : 'Documentation incomplete'}. ${score >= 70 ? 'Ready for investor review' : 'Needs improvement before investor presentation'}.`;

    return {
      score,
      rating,
      viability,
      confidence: Math.min(95, finalConfidence),
      summary: executiveSummary,
      executiveSummary,
      findings,
      riskDrivers,
      comparableProjects,
      marketOutlook,
      tokenomicsReview,
      teamAnalysis,
      auditHistory: {
        status: 'Not provided',
        findings: [],
        links: []
      },
      onChainActivity: {
        status: 'Not provided',
        findings: [],
        addresses: []
      },
      riskScore,
      unverifiableClaims: !hasTeam ? ['Team credentials not verified'] : [],
      recommendations,
      risks,
      strengths,
      nextSteps,
      documentAnalysis: documentAnalysisObj
    };
  }

  private async simulateDueDiligence(projectId: string, category: string): Promise<DueDiligenceResult> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));

    const readinessScore = Math.round(50 + Math.random() * 50);
    
    const redFlags = [
      'Missing audit documentation',
      'Incomplete team information',
      'Unclear token distribution',
      'Limited liquidity reserves'
    ].filter(() => Math.random() > 0.6);

    const checklist = {
      'Security audit completed': Math.random() > 0.3,
      'Legal documentation ready': Math.random() > 0.2,
      'Team KYC verified': Math.random() > 0.1,
      'Tokenomics validated': Math.random() > 0.2,
      'Liquidity plan established': Math.random() > 0.4,
      'Community guidelines set': Math.random() > 0.3
    };

    const auditLinks = [
      'https://audit.example.com/report1.pdf',
      'https://security.example.com/analysis.pdf'
    ].filter(() => Math.random() > 0.5);

    const suggestions = [
      'Complete security audit before launch',
      'Establish clear governance framework',
      'Prepare comprehensive documentation',
      'Set up proper liquidity management'
    ].filter(() => Math.random() > 0.4);

    return {
      readinessScore,
      category: category as any,
      redFlags,
      checklist,
      auditLinks,
      suggestions
    };
  }

  private async simulateChatProcessing(message: string, context?: any): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = {
      summary: 'Based on the provided information, here\'s a comprehensive summary of the key points and recommendations.',
      risks: 'I\'ve identified several potential risks that should be addressed before proceeding with this investment opportunity.',
      draft: 'Here\'s a draft response you can customize for your communication needs.',
      action: 'Based on the analysis, here are the recommended action items to move forward.',
      translate: 'Here\'s the translation of the provided content.',
      compliance: 'I\'ve conducted a compliance check and here are the findings and recommendations.'
    };

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      return responses.summary;
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('risks')) {
      return responses.risks;
    } else if (lowerMessage.includes('draft') || lowerMessage.includes('reply')) {
      return responses.draft;
    } else if (lowerMessage.includes('action') || lowerMessage.includes('next')) {
      return responses.action;
    } else if (lowerMessage.includes('translate')) {
      return responses.translate;
    } else if (lowerMessage.includes('compliance')) {
      return responses.compliance;
    } else {
      return 'I understand your request. Let me analyze the information and provide you with relevant insights and recommendations.';
    }
  }
}

export const raftai = RaftAIService.getInstance();
