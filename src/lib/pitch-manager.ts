"use client";

import { auth, db } from './firebase.client';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { globalRules } from './global-rules';

export interface PitchData {
  // Company basics
  projectName: string;
  sector: string;
  chain: string;
  stage: string;
  valueProposition: string;
  
  // Problem & Solution
  problem: string;
  solution: string;
  evidence: string;
  
  // Product & Traction
  productDescription: string;
  users: string;
  growthMetrics: string;
  
  // Tokenomics
  totalSupply: string;
  allocations: string;
  vesting: string;
  auditLinks: string;
  
  // Team & Roadmap
  teamMembers: string;
  advisors: string;
  timeline: string;
  
  // Documents
  documents: {
    pitchDeck?: string;
    whitepaper?: string;
    tokenModel?: string;
    audits?: string;
  };
  
  // Additional fields
  targetRaise?: string;
  repoLinks?: string;
  videoUrl?: string;
  geography?: string;
  tags?: string[];
}

export interface RaftAIDecision {
  decision: 'PASS' | 'CONDITIONAL' | 'FAIL';
  score: number; // 0-100
  riskBreakdown: string[];
  reasons: string[];
  recommendedRoutes: Array<{
    type: 'VC' | 'Exchange' | 'IDO' | 'Influencer' | 'Agency';
    id: string;
    match: number; // 0-1
    rationale: string;
  }>;
  sla: number; // processing time in seconds
  confidence: number; // 0-1
}

export interface Pitch {
  id: string;
  founderId: string;
  orgId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  data: PitchData;
  aiDecision?: RaftAIDecision;
  routes: Array<{
    id: string;
    counterpartOrgId: string;
    roleType: 'VC' | 'Exchange' | 'IDO' | 'Influencer' | 'Agency';
    matchScore: number;
    status: 'SENT' | 'VIEWED' | 'RESPONDED' | 'DECLINED';
    rationale: string;
    sentAt: any;
    viewedAt?: any;
    respondedAt?: any;
    declinedAt?: any;
    declineReason?: string;
  }>;
  submittedAt: any;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export class PitchManager {
  private static instance: PitchManager;
  
  public static getInstance(): PitchManager {
    if (!PitchManager.instance) {
      PitchManager.instance = new PitchManager();
    }
    return PitchManager.instance;
  }

  /**
   * Submit pitch (allows re-pitch if previous pitch was rejected)
   */
  async submitPitch(pitchData: PitchData): Promise<string> {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    // Check if pitch already exists
    const existingPitch = await this.getExistingPitch();
    if (existingPitch && existingPitch.status !== 'REJECTED') {
      throw new Error('Pitch already submitted. Only one active pitch per founder is allowed.');
    }
    
    // Validate pitch data
    this.validatePitchData(pitchData);
    
    try {
      let pitchRef;
      let pitch: Pitch;
      
      if (existingPitch && existingPitch.status === 'REJECTED') {
        // Update existing rejected pitch
        pitchRef = doc(db!, 'pitches', existingPitch.id);
        pitch = {
          ...existingPitch,
          status: 'SUBMITTED',
          data: pitchData,
          routes: [], // Reset routes for new submission
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await updateDoc(pitchRef, pitch);
      } else {
        // Create new pitch document
        pitchRef = doc(collection(db!, 'pitches'));
        pitch = {
          id: pitchRef.id,
          founderId: auth.currentUser.uid,
          orgId: auth.currentUser.uid, // Simplified for now
          status: 'SUBMITTED',
          data: pitchData,
          routes: [],
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(pitchRef, pitch);
      }
      
      // Update user profile
      await updateDoc(doc(db!, 'users', auth.currentUser.uid), {
        'pitch.submitted': true,
        'pitch.pitchId': pitchRef.id,
        'pitch.submittedAt': serverTimestamp(),
        'onboardingStep': 'home',
        updatedAt: serverTimestamp()
      });
      
      // Update custom claims
      const { authClaimsManager } = await import('./auth-claims');
      await authClaimsManager.markPitchSubmitted(auth.currentUser.uid);
      
      // Log audit event
      await globalRules.logAuditEvent('pitch_submitted', pitchRef.id, {
        founderId: auth.currentUser.uid,
        projectName: pitchData.projectName
      });
      
      // Trigger AI review
      await this.triggerAIReview(pitchRef.id);
      
      return pitchRef.id;
      
    } catch (error) {
      console.error('Error submitting pitch:', error);
      throw error;
    }
  }

  /**
   * Get existing pitch for user
   */
  async getExistingPitch(): Promise<Pitch | null> {
    if (!auth.currentUser) return null;
    
    try {
      const pitchesQuery = query(
        collection(db!, 'pitches'),
        where('founderId', '==', auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(pitchesQuery);
      if (snapshot.empty) return null;
      
      const pitchDoc = snapshot.docs[0];
      return { id: pitchDoc.id, ...pitchDoc.data() } as Pitch;
      
    } catch (error) {
      // Handle permission errors gracefully
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        return null;
      }
      console.error('Error getting existing pitch:', error);
      return null;
    }
  }

  /**
   * Check if user has existing pitch
   */
  async hasExistingPitch(uid: string): Promise<boolean> {
    try {
      const pitchesQuery = query(
        collection(db!, 'pitches'),
        where('founderId', '==', uid)
      );
      
      const snapshot = await getDocs(pitchesQuery);
      return !snapshot.empty;
      
    } catch (error) {
      // Handle permission errors gracefully
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.log('Pitch access not yet available - user may need to complete onboarding first');
        return false;
      }
      console.error('Error checking existing pitch:', error);
      return false;
    }
  }

  /**
   * Check if user can re-pitch (has rejected pitch)
   */
  async canRepitch(uid: string): Promise<boolean> {
    try {
      const existingPitch = await this.getExistingPitch();
      return existingPitch?.status === 'REJECTED';
    } catch (error) {
      console.error('Error checking re-pitch eligibility:', error);
      return false;
    }
  }

  /**
   * Trigger AI review
   */
  async triggerAIReview(pitchId: string): Promise<void> {
    try {
      // Update pitch status
      await updateDoc(doc(db!, 'pitches', pitchId), {
        status: 'UNDER_REVIEW',
        updatedAt: serverTimestamp()
      });
      
      // Simulate AI processing
      const aiDecision = await this.simulateAIReview(pitchId);
      
      // Update pitch with AI decision
      await updateDoc(doc(db!, 'pitches', pitchId), {
        aiDecision,
        status: aiDecision.decision === 'FAIL' ? 'REJECTED' : 'APPROVED',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // If approved, create routes
      if (aiDecision.decision !== 'FAIL') {
        await this.createRoutes(pitchId, aiDecision.recommendedRoutes);
      }
      
      // Log audit event
      await globalRules.logAuditEvent('ai_review_completed', pitchId, {
        decision: aiDecision.decision,
        score: aiDecision.score,
        sla: aiDecision.sla
      });
      
    } catch (error) {
      console.error('Error triggering AI review:', error);
      throw error;
    }
  }

  /**
   * Simulate AI review
   */
  private async simulateAIReview(pitchId: string): Promise<RaftAIDecision> {
    // Simulate processing delay (≤5s SLA)
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate AI decision
    const score = Math.floor(Math.random() * 100);
    const decision = score >= 70 ? 'PASS' : score >= 50 ? 'CONDITIONAL' : 'FAIL';
    
    const aiDecision: RaftAIDecision = {
      decision,
      score,
      riskBreakdown: this.generateRiskBreakdown(score),
      reasons: this.generateReasons(decision, score),
      recommendedRoutes: this.generateRecommendedRoutes(decision, score),
      sla: processingTime / 1000,
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    };
    
    return aiDecision;
  }

  /**
   * Create routes based on AI recommendations
   */
  private async createRoutes(pitchId: string, recommendedRoutes: RaftAIDecision['recommendedRoutes']): Promise<void> {
    try {
      for (const route of recommendedRoutes) {
        const routeRef = doc(collection(db!, 'routes'));
        await setDoc(routeRef, {
          id: routeRef.id,
          pitchId,
          counterpartOrgId: route.id,
          roleType: route.type,
          matchScore: route.match,
          status: 'SENT',
          rationale: route.rationale,
          sentAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Update pitch routes
        await updateDoc(doc(db!, 'pitches', pitchId), {
          routes: [...(await this.getPitch(pitchId))?.routes || [], {
            id: routeRef.id,
            counterpartOrgId: route.id,
            roleType: route.type,
            matchScore: route.match,
            status: 'SENT',
            rationale: route.rationale,
            sentAt: serverTimestamp()
          }],
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating routes:', error);
      throw error;
    }
  }

  /**
   * Get pitch by ID
   */
  async getPitch(pitchId: string): Promise<Pitch | null> {
    try {
      const pitchDoc = await getDoc(doc(db!, 'pitches', pitchId));
      if (!pitchDoc.exists()) return null;
      
      return { id: pitchDoc.id, ...pitchDoc.data() } as Pitch;
      
    } catch (error) {
      console.error('Error getting pitch:', error);
      return null;
    }
  }

  /**
   * Validate pitch data
   */
  private validatePitchData(data: PitchData): void {
    const requiredFields = [
      'projectName', 'sector', 'chain', 'stage', 'valueProposition',
      'problem', 'solution', 'evidence', 'productDescription', 'users',
      'growthMetrics', 'totalSupply', 'allocations', 'vesting',
      'teamMembers', 'timeline'
    ];
    
    for (const field of requiredFields) {
      if (!data[field as keyof PitchData] || data[field as keyof PitchData] === '') {
        throw new Error(`${field} is required`);
      }
    }
    
    // Validate document requirements
    if (!data.documents.pitchDeck || !data.documents.whitepaper) {
      throw new Error('Pitch deck and whitepaper are required');
    }
  }

  /**
   * Generate risk breakdown
   */
  private generateRiskBreakdown(score: number): string[] {
    const risks = [
      'Market competition risk',
      'Regulatory uncertainty',
      'Technical implementation challenges',
      'Token utility and adoption risk',
      'Team execution risk',
      'Funding and runway risk'
    ];
    
    // Return more risks for lower scores
    const riskCount = score < 50 ? 4 : score < 70 ? 3 : 2;
    return risks.slice(0, riskCount);
  }

  /**
   * Generate reasons
   */
  private generateReasons(decision: string, score: number): string[] {
    switch (decision) {
      case 'PASS':
        return [
          'Strong market opportunity',
          'Experienced team',
          'Solid tokenomics',
          'Clear value proposition'
        ];
      case 'CONDITIONAL':
        return [
          'Good potential with some concerns',
          'Team needs strengthening',
          'Tokenomics could be improved',
          'Market validation needed'
        ];
      case 'FAIL':
        return [
          'High execution risk',
          'Weak tokenomics',
          'Limited market opportunity',
          'Team concerns'
        ];
      default:
        return [];
    }
  }

  /**
   * Generate recommended routes
   */
  private generateRecommendedRoutes(decision: string, score: number): RaftAIDecision['recommendedRoutes'] {
    if (decision === 'FAIL') return [];
    
    const routes: RaftAIDecision['recommendedRoutes'] = [];
    
    // Always recommend VCs for good pitches
    if (score >= 60) {
      routes.push({
        type: 'VC',
        id: 'vc_org_1',
        match: Math.random() * 0.3 + 0.7, // 70-100%
        rationale: 'Strong fit for early-stage investment'
      });
    }
    
    // Recommend exchanges for established projects
    if (score >= 70 && Math.random() > 0.5) {
      routes.push({
        type: 'Exchange',
        id: 'exchange_org_1',
        match: Math.random() * 0.2 + 0.8, // 80-100%
        rationale: 'Good candidate for token listing'
      });
    }
    
    // Recommend IDOs for public sale projects
    if (score >= 65 && Math.random() > 0.6) {
      routes.push({
        type: 'IDO',
        id: 'ido_org_1',
        match: Math.random() * 0.25 + 0.75, // 75-100%
        rationale: 'Suitable for IDO launch'
      });
    }
    
    return routes;
  }
}

export const pitchManager = PitchManager.getInstance();
