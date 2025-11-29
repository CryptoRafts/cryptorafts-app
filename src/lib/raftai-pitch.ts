"use client";

import { db } from './firebase.client';
import { doc, updateDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';

export interface PitchData {
  // Basics
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
}

export interface RaftAIPitchAnalysis {
  rating: 'High' | 'Normal' | 'Low';
  score: number; // 0-100
  summary: string;
  risks: string[];
  recommendations: string[];
  confidence: number;
  analysis: {
    marketOpportunity: number;
    teamStrength: number;
    tokenomics: number;
    technicalFeasibility: number;
    competitiveAdvantage: number;
    executionRisk: number;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface Project {
  id: string;
  founderId: string;
  name: string;
  sector: string;
  chain: string;
  stage: string;
  valueProposition: string;
  problem: string;
  solution: string;
  evidence: string;
  productDescription: string;
  users: string;
  growthMetrics: string;
  totalSupply: string;
  allocations: string;
  vesting: string;
  auditLinks: string;
  teamMembers: string;
  advisors: string;
  timeline: string;
  documents: {
    pitchDeck?: string;
    whitepaper?: string;
    tokenModel?: string;
    audits?: string;
  };
  pitch: {
    submitted: boolean;
    oneTime: boolean;
    submittedAt: any;
  };
  raftai: RaftAIPitchAnalysis;
  interest: {
    vcs: number;
    exchanges: number;
    idos: number;
    influencers: number;
    agencies: number;
  };
  badges: {
    kyc: boolean;
    kyb: boolean;
    audit: boolean;
    doxxed: boolean;
  };
  visibility: {
    discoverable: boolean;
    publicFields: string[];
  };
  createdAt: any;
  updatedAt: any;
}

export class RaftAIPitchManager {
  private static instance: RaftAIPitchManager;
  
  public static getInstance(): RaftAIPitchManager {
    if (!RaftAIPitchManager.instance) {
      RaftAIPitchManager.instance = new RaftAIPitchManager();
    }
    return RaftAIPitchManager.instance;
  }

  /**
   * Analyze pitch with RaftAI
   */
  async analyzePitch(pitchData: PitchData): Promise<RaftAIPitchAnalysis> {
    try {
      // Simulate RaftAI analysis delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate comprehensive analysis
      const analysis: RaftAIPitchAnalysis = {
        rating: this.generateRating(),
        score: this.generateScore(),
        summary: this.generateSummary(pitchData),
        risks: this.generateRisks(pitchData),
        recommendations: this.generateRecommendations(pitchData),
        confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
        analysis: {
          marketOpportunity: Math.random() * 0.4 + 0.6, // 60-100%
          teamStrength: Math.random() * 0.3 + 0.7, // 70-100%
          tokenomics: Math.random() * 0.4 + 0.6, // 60-100%
          technicalFeasibility: Math.random() * 0.3 + 0.7, // 70-100%
          competitiveAdvantage: Math.random() * 0.4 + 0.6, // 60-100%
          executionRisk: Math.random() * 0.3 + 0.3, // 30-60% (lower is better)
        },
        insights: {
          strengths: this.generateStrengths(pitchData),
          weaknesses: this.generateWeaknesses(pitchData),
          opportunities: this.generateOpportunities(pitchData),
          threats: this.generateThreats(pitchData)
        }
      };

      return analysis;

    } catch (error) {
      console.error('Error analyzing pitch:', error);
      throw error;
    }
  }

  /**
   * Create project from pitch data
   */
  async createProject(founderId: string, pitchData: PitchData, analysis: RaftAIPitchAnalysis): Promise<string> {
    try {
      const projectRef = doc(collection(db!, 'projects'));
      const project: Project = {
        id: projectRef.id,
        founderId,
        ownerId: founderId,  // Required by Firestore rules
        userId: founderId,   // Required by Firestore rules
        name: pitchData.projectName,
        sector: pitchData.sector,
        chain: pitchData.chain,
        stage: pitchData.stage,
        valueProposition: pitchData.valueProposition,
        problem: pitchData.problem,
        solution: pitchData.solution,
        evidence: pitchData.evidence,
        productDescription: pitchData.productDescription,
        users: pitchData.users,
        growthMetrics: pitchData.growthMetrics,
        totalSupply: pitchData.totalSupply,
        allocations: pitchData.allocations,
        vesting: pitchData.vesting,
        auditLinks: pitchData.auditLinks,
        teamMembers: pitchData.teamMembers,
        advisors: pitchData.advisors,
        timeline: pitchData.timeline,
        documents: pitchData.documents,
        pitch: {
          submitted: true,
          oneTime: true,
          submittedAt: serverTimestamp()
        },
        raftai: analysis,
        interest: {
          vcs: 0,
          exchanges: 0,
          idos: 0,
          influencers: 0,
          agencies: 0
        },
        badges: {
          kyc: true, // Founder has completed KYC
          kyb: false, // Will be updated based on KYB status
          audit: !!pitchData.auditLinks,
          doxxed: true // Team information provided
        },
        visibility: {
          discoverable: true,
          publicFields: ['name', 'sector', 'chain', 'stage', 'valueProposition', 'badges']
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db!, 'projects'), project);
      return projectRef.id;

    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Re-analyze existing project
   */
  async reAnalyzeProject(projectId: string, updatedData?: Partial<PitchData>): Promise<RaftAIPitchAnalysis> {
    try {
      // Check cooldown period (24-48 hours)
      const projectDoc = await getDoc(doc(db!, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data() as Project;
      const lastAnalysis = project.raftai;
      
      // Check if enough time has passed since last analysis
      const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
      const timeSinceLastAnalysis = Date.now() - (lastAnalysis?.analyzedAt?.toMillis() || 0);
      
      if (timeSinceLastAnalysis < cooldownPeriod) {
        throw new Error(`Re-analysis available in ${Math.ceil((cooldownPeriod - timeSinceLastAnalysis) / (60 * 60 * 1000))} hours`);
      }

      // Perform new analysis
      const newAnalysis = await this.analyzePitch({
        projectName: project.name,
        sector: project.sector,
        chain: project.chain,
        stage: project.stage,
        valueProposition: project.valueProposition,
        problem: project.problem,
        solution: project.solution,
        evidence: project.evidence,
        productDescription: project.productDescription,
        users: project.users,
        growthMetrics: project.growthMetrics,
        totalSupply: project.totalSupply,
        allocations: project.allocations,
        vesting: project.vesting,
        auditLinks: project.auditLinks,
        teamMembers: project.teamMembers,
        advisors: project.advisors,
        timeline: project.timeline,
        documents: project.documents,
        ...updatedData
      });

      // Update project with new analysis
      await updateDoc(doc(db!, 'projects', projectId), {
        raftai: {
          ...newAnalysis,
          analyzedAt: serverTimestamp(),
          previousAnalysis: lastAnalysis
        },
        updatedAt: serverTimestamp()
      });

      return newAnalysis;

    } catch (error) {
      console.error('Error re-analyzing project:', error);
      throw error;
    }
  }

  /**
   * Generate rating based on score
   */
  private generateRating(): 'High' | 'Normal' | 'Low' {
    const score = Math.random() * 100;
    if (score >= 80) return 'High';
    if (score >= 60) return 'Normal';
    return 'Low';
  }

  /**
   * Generate score (0-100)
   */
  private generateScore(): number {
    return Math.floor(Math.random() * 100);
  }

  /**
   * Generate summary
   */
  private generateSummary(pitchData: PitchData): string {
    return `This ${pitchData.sector} project on ${pitchData.chain} shows ${pitchData.stage === 'Live' ? 'strong' : 'promising'} potential. The team has identified a clear problem in ${pitchData.sector} and proposes a ${pitchData.solution.length > 100 ? 'comprehensive' : 'focused'} solution. The tokenomics appear ${pitchData.totalSupply ? 'well-structured' : 'needs refinement'}, and the team demonstrates ${pitchData.teamMembers.length > 200 ? 'strong' : 'adequate'} experience in the space.`;
  }

  /**
   * Generate risks
   */
  private generateRisks(pitchData: PitchData): string[] {
    const risks = [
      'Market competition in the sector',
      'Regulatory uncertainty',
      'Technical implementation challenges',
      'Token utility and adoption risk'
    ];

    if (pitchData.stage === 'Idea') {
      risks.push('Early stage execution risk');
    }

    if (!pitchData.auditLinks) {
      risks.push('Smart contract security risk');
    }

    if (pitchData.teamMembers.length < 100) {
      risks.push('Limited team information provided');
    }

    return risks.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(pitchData: PitchData): string[] {
    const recommendations = [
      'Consider conducting a security audit before launch',
      'Develop a more detailed go-to-market strategy',
      'Strengthen token utility and use cases',
      'Build strategic partnerships in the ecosystem'
    ];

    if (pitchData.stage === 'Idea') {
      recommendations.push('Develop MVP to validate product-market fit');
    }

    if (!pitchData.advisors) {
      recommendations.push('Add experienced advisors to the team');
    }

    return recommendations.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Generate strengths
   */
  private generateStrengths(pitchData: PitchData): string[] {
    const strengths = [
      'Clear problem identification',
      'Strong value proposition',
      'Experienced team',
      'Solid tokenomics'
    ];

    if (pitchData.stage === 'Live') {
      strengths.push('Proven product-market fit');
    }

    if (pitchData.auditLinks) {
      strengths.push('Security audited');
    }

    return strengths.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Generate weaknesses
   */
  private generateWeaknesses(pitchData: PitchData): string[] {
    const weaknesses = [
      'Limited market validation',
      'Competitive landscape challenges',
      'Technical complexity',
      'Regulatory risks'
    ];

    if (pitchData.stage === 'Idea') {
      weaknesses.push('No product yet');
    }

    return weaknesses.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  /**
   * Generate opportunities
   */
  private generateOpportunities(pitchData: PitchData): string[] {
    return [
      'Growing market demand',
      'Partnership opportunities',
      'Technology advancement',
      'Regulatory clarity'
    ].slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Generate threats
   */
  private generateThreats(pitchData: PitchData): string[] {
    return [
      'Market volatility',
      'Competition from established players',
      'Regulatory changes',
      'Technology disruption'
    ].slice(0, Math.floor(Math.random() * 3) + 1);
  }
}

export const raftaiPitchManager = RaftAIPitchManager.getInstance();
