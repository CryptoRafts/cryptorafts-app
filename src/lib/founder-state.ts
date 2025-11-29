"use client";

import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.client';

export interface FounderProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'founder';
  onboardingStep: 'profile' | 'kyc' | 'kyb_decision' | 'kyb' | 'pitch' | 'home';
  profileCompleted: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  kybStatus: 'pending' | 'approved' | 'rejected' | 'skipped';
  kybSkipped: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt: any;
  isActive: boolean;
  
  // Profile data
  profilePhotoUrl?: string;
  profile_image_url?: string;
  bio?: string;
  website?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
    github?: string;
  };
  
  // KYC data
  kyc?: {
    status: 'pending' | 'approved' | 'rejected';
    riskScore?: number;
    reasons?: string[];
    vendorRef?: string;
    updatedAt?: number;
    cooldownUntil?: number;
    documents?: {
      idFront?: string;
      idBack?: string;
      proofOfAddress?: string;
      selfie?: string;
    };
  };
  
  // KYB data
  kyb?: {
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    entityName?: string;
    registrationNumber?: string;
    country?: string;
    documents?: {
      registration?: string;
      logo?: string;
    };
    updatedAt?: number;
  };
  
  // Pitch data
  pitch?: {
    oneTime: boolean;
    submittedAt?: number;
    rating?: 'High' | 'Normal' | 'Low';
    summary?: string;
    risks?: string[];
    recommendations?: string[];
    projectId?: string;
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
  product: string;
  traction: string;
  tokenomics: any;
  team: any;
  roadmap: any;
  documents: {
    pitch?: string;
    whitepaper?: string;
    model?: string;
    audits?: string[];
  };
  raftai: {
    rating: 'High' | 'Normal' | 'Low';
    summary: string;
    risks: string[];
    recommendations: string[];
    lastAnalyzed: number;
    cooldownUntil?: number;
  };
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
  createdAt: any;
  updatedAt: any;
}

export interface DealRoom {
  id: string;
  type: 'deal' | 'listing' | 'ido' | 'campaign' | 'proposal' | 'team';
  founderId: string;
  counterpartyId: string;
  counterpartyType: 'vc' | 'exchange' | 'ido' | 'influencer' | 'agency';
  projectId?: string;
  status: 'active' | 'closed' | 'archived';
  stage: 'initial' | 'dd' | 'term_sheet' | 'closed' | 'listed' | 'launched';
  createdAt: any;
  updatedAt: any;
  lastMessageAt: any;
  members: string[];
}

export class FounderStateManager {
  private static instance: FounderStateManager;
  
  public static getInstance(): FounderStateManager {
    if (!FounderStateManager.instance) {
      FounderStateManager.instance = new FounderStateManager();
    }
    return FounderStateManager.instance;
  }
  
  // Profile Management
  async updateProfile(uid: string, profileData: Partial<FounderProfile>): Promise<void> {
    try {
      // Filter out any File objects or other non-serializable data
      const cleanData = { ...profileData };
      
      // Remove any File objects
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] instanceof File) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });
      
      await updateDoc(doc(db!, 'users', uid), {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
  
  async getProfile(uid: string): Promise<FounderProfile | null> {
    try {
      const docRef = doc(db!, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as FounderProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }
  
  // Onboarding Flow
  async completeProfile(uid: string, profileData: any): Promise<void> {
    // Clean the profile data to remove any File objects
    const cleanProfileData = { ...profileData };
    
    // Remove any File objects
    Object.keys(cleanProfileData).forEach(key => {
      if (cleanProfileData[key] instanceof File) {
        delete cleanProfileData[key];
      }
    });
    
    await this.updateProfile(uid, {
      ...cleanProfileData,
      profileCompleted: true,
      onboardingStep: 'kyc'
    });
  }
  
  async completeKYC(uid: string, kycData: any): Promise<void> {
    await this.updateProfile(uid, {
      kyc: kycData,
      kycStatus: kycData.status,
      onboardingStep: kycData.status === 'approved' ? 'kyb_decision' : 'kyc'
    });
  }
  
  async completeKYB(uid: string, kybData: any): Promise<void> {
    await this.updateProfile(uid, {
      kyb: kybData,
      kybStatus: kybData.status,
      kybSkipped: kybData.status === 'skipped',
      onboardingStep: kybData.status === 'skipped' ? 'pitch' : 'pitch'
    });
  }
  
  async skipKYB(uid: string): Promise<void> {
    await this.updateProfile(uid, {
      kybStatus: 'skipped',
      kybSkipped: true,
      onboardingStep: 'pitch'
    });
  }
  
  async completePitch(uid: string, pitchData: any): Promise<void> {
    // Create project from pitch data
    const projectId = await this.createProject(uid, {
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
      documents: {
        pitchDeck: pitchData.pitchDeck?.name,
        whitepaper: pitchData.whitepaper?.name,
        tokenModel: pitchData.tokenModel?.name,
        audits: pitchData.audits?.name
      },
      raftai: {
        rating: pitchData.rating,
        summary: pitchData.summary,
        risks: pitchData.risks,
        recommendations: pitchData.recommendations,
        status: pitchData.status
      },
      pitch: {
        submitted: true,
        oneTime: true,
        submittedAt: new Date()
      }
    });

    await this.updateProfile(uid, {
      pitch: {
        ...pitchData,
        oneTime: true,
        projectId,
        submittedAt: new Date()
      },
      onboardingStep: 'home'
    });
  }
  
  // Project Management
  async createProject(uid: string, projectData: any): Promise<string> {
    try {
      const projectRef = doc(db!, 'projects');
      const project: Project = {
        id: projectRef.id,
        founderId: uid,
        ...projectData,
        interest: {
          vcs: 0,
          exchanges: 0,
          idos: 0,
          influencers: 0,
          agencies: 0
        },
        badges: {
          kyc: false,
          kyb: false,
          audit: false,
          doxxed: false
        },
        raftai: {
          rating: 'Normal',
          summary: '',
          risks: [],
          recommendations: [],
          lastAnalyzed: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(projectRef, project);
      return projectRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }
  
  async getProjects(uid: string): Promise<Project[]> {
    try {
      // For now, return empty array since we don't have projects collection set up yet
      // In a real implementation, you would query the projects collection
      return [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }
  
  // Deal Room Management
  async createDealRoom(roomData: Omit<DealRoom, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt'>): Promise<string> {
    try {
      const roomRef = doc(db!, 'dealRooms');
      const room: DealRoom = {
        id: roomRef.id,
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      };
      
      await setDoc(roomRef, room);
      return roomRef.id;
    } catch (error) {
      console.error('Error creating deal room:', error);
      throw error;
    }
  }
  
  async getDealRooms(uid: string): Promise<DealRoom[]> {
    try {
      // For now, return empty array since we don't have deal rooms collection set up yet
      // In a real implementation, you would query the dealRooms collection
      return [];
    } catch (error) {
      console.error('Error getting deal rooms:', error);
      return [];
    }
  }
  
  // RaftAI Integration
  async analyzeKYC(kycData: any): Promise<{ status: string; riskScore: number; reasons: string[] }> {
    // Simulate RaftAI analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        const riskScore = Math.random() * 100;
        const status = riskScore < 30 ? 'approved' : riskScore < 70 ? 'pending' : 'rejected';
        const reasons = riskScore > 30 ? ['Document quality issues', 'Identity verification needed'] : [];
        
        resolve({ status, riskScore, reasons });
      }, 2000);
    });
  }
  
  async analyzePitch(pitchData: any): Promise<{ rating: string; summary: string; risks: string[]; recommendations: string[] }> {
    // Simulate RaftAI pitch analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        const rating = Math.random() > 0.5 ? 'High' : Math.random() > 0.3 ? 'Normal' : 'Low';
        const summary = `Strong ${pitchData.sector} project with ${rating.toLowerCase()} potential.`;
        const risks = ['Market volatility', 'Regulatory uncertainty'];
        const recommendations = ['Strengthen tokenomics', 'Expand team', 'Secure partnerships'];
        
        resolve({ rating, summary, risks, recommendations });
      }, 3000);
    });
  }
}

export const founderStateManager = FounderStateManager.getInstance();
