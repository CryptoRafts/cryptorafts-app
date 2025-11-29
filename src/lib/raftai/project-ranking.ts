/**
 * RaftAI Project Ranking & Tiering Engine
 * Intelligent project scoring and ranking for all roles except Founder
 */

import { db } from '../firebase.client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { RAFTAI_CONFIG } from './config';
import { DataIsolation, validateUID } from '../security/data-isolation';

export type ProjectTier = 'high' | 'medium' | 'low';

export interface PotentialScoreFactors {
  traction: number; // 0-100
  revenue: number; // 0-100
  userEngagement: number; // 0-100
  verificationStatus: number; // 0-100
  riskScore: number; // 0-100 (inverted - lower is better)
}

export interface RankedProject {
  id: string;
  name: string;
  description: string;
  founderId: string;
  potentialScore: number;
  tier: ProjectTier;
  scoreFactors: PotentialScoreFactors;
  isSpotlight: boolean;
  isPremium: boolean;
  status: 'active' | 'archived' | 'blocked';
  createdAt: number;
  updatedAt: number;
  metadata?: any;
}

export interface ProjectsByTier {
  high: RankedProject[];
  medium: RankedProject[];
  low: RankedProject[];
}

/**
 * Scoring weights for PotentialScore calculation
 */
const SCORING_WEIGHTS = {
  traction: 0.25,        // 25% - Market traction
  revenue: 0.20,         // 20% - Revenue/funding
  userEngagement: 0.20,  // 20% - User activity
  verificationStatus: 0.20, // 20% - KYC/KYB status
  risk: 0.15,            // 15% - Risk assessment (inverted)
};

/**
 * Tier thresholds
 */
const TIER_THRESHOLDS = {
  high: 80,   // >= 80 = High tier
  medium: 50, // 50-79 = Medium tier
  // < 50 = Low tier
};

export class ProjectRankingEngine {
  private static instance: ProjectRankingEngine;
  private unsubscribers: Map<string, () => void> = new Map();

  private constructor() {
    console.log('📊 RaftAI Project Ranking: Engine initialized');
  }

  static getInstance(): ProjectRankingEngine {
    if (!ProjectRankingEngine.instance) {
      ProjectRankingEngine.instance = new ProjectRankingEngine();
    }
    return ProjectRankingEngine.instance;
  }

  /**
   * Calculate PotentialScore from various factors
   */
  calculatePotentialScore(factors: PotentialScoreFactors): number {
    // Invert risk score (lower risk = higher score contribution)
    const riskContribution = 100 - factors.riskScore;

    const score = 
      (factors.traction * SCORING_WEIGHTS.traction) +
      (factors.revenue * SCORING_WEIGHTS.revenue) +
      (factors.userEngagement * SCORING_WEIGHTS.userEngagement) +
      (factors.verificationStatus * SCORING_WEIGHTS.verificationStatus) +
      (riskContribution * SCORING_WEIGHTS.risk);

    return Math.round(score);
  }

  /**
   * Determine tier based on score
   */
  determineTier(score: number): ProjectTier {
    if (score >= TIER_THRESHOLDS.high) return 'high';
    if (score >= TIER_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate score factors from project data
   */
  calculateScoreFactors(project: any): PotentialScoreFactors {
    // Traction score (based on metrics, partnerships, community)
    const traction = this.calculateTractionScore(project);

    // Revenue score (based on funding, revenue, market cap)
    const revenue = this.calculateRevenueScore(project);

    // User engagement score (based on activity, retention, growth)
    const userEngagement = this.calculateEngagementScore(project);

    // Verification status (based on KYC/KYB completion)
    const verificationStatus = this.calculateVerificationScore(project);

    // Risk score (from RaftAI analysis)
    const riskScore = project.raftai?.riskScore || 50;

    return {
      traction,
      revenue,
      userEngagement,
      verificationStatus,
      riskScore,
    };
  }

  /**
   * Calculate traction score
   */
  private calculateTractionScore(project: any): number {
    let score = 0;

    // Partnerships (0-30 points)
    const partnershipCount = project.partnerships?.length || 0;
    score += Math.min(partnershipCount * 5, 30);

    // Community size (0-30 points)
    const communitySize = project.metrics?.communitySize || 0;
    if (communitySize > 100000) score += 30;
    else if (communitySize > 50000) score += 25;
    else if (communitySize > 10000) score += 20;
    else if (communitySize > 1000) score += 10;

    // Social media presence (0-20 points)
    const socialFollowers = project.metrics?.socialFollowers || 0;
    if (socialFollowers > 50000) score += 20;
    else if (socialFollowers > 10000) score += 15;
    else if (socialFollowers > 1000) score += 10;

    // Milestones completed (0-20 points)
    const completedMilestones = project.roadmap?.filter((m: any) => m.status === 'completed').length || 0;
    score += Math.min(completedMilestones * 5, 20);

    return Math.min(score, 100);
  }

  /**
   * Calculate revenue score
   */
  private calculateRevenueScore(project: any): number {
    let score = 0;

    // Current funding (0-40 points)
    const currentFunding = project.financials?.currentFunding || 0;
    if (currentFunding >= 10000000) score += 40; // $10M+
    else if (currentFunding >= 5000000) score += 35; // $5M+
    else if (currentFunding >= 1000000) score += 30; // $1M+
    else if (currentFunding >= 500000) score += 20; // $500K+
    else if (currentFunding >= 100000) score += 10; // $100K+

    // Monthly revenue (0-30 points)
    const monthlyRevenue = project.financials?.monthlyRevenue || 0;
    if (monthlyRevenue >= 1000000) score += 30; // $1M/month
    else if (monthlyRevenue >= 500000) score += 25;
    else if (monthlyRevenue >= 100000) score += 20;
    else if (monthlyRevenue >= 50000) score += 15;
    else if (monthlyRevenue >= 10000) score += 10;

    // Revenue growth (0-30 points)
    const revenueGrowth = project.metrics?.revenueGrowth || 0;
    if (revenueGrowth > 100) score += 30; // 100%+ growth
    else if (revenueGrowth > 50) score += 25;
    else if (revenueGrowth > 20) score += 20;
    else if (revenueGrowth > 10) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(project: any): number {
    let score = 0;

    // Daily active users (0-30 points)
    const dau = project.metrics?.dailyActiveUsers || 0;
    if (dau > 100000) score += 30;
    else if (dau > 50000) score += 25;
    else if (dau > 10000) score += 20;
    else if (dau > 1000) score += 15;
    else if (dau > 100) score += 10;

    // User retention (0-30 points)
    const retention = project.metrics?.retentionRate || 0;
    if (retention > 80) score += 30;
    else if (retention > 60) score += 25;
    else if (retention > 40) score += 20;
    else if (retention > 20) score += 10;

    // Activity score (0-20 points)
    const lastActivity = project.lastActivityAt || 0;
    const daysSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 1) score += 20; // Active today
    else if (daysSinceActivity < 7) score += 15; // Active this week
    else if (daysSinceActivity < 30) score += 10; // Active this month

    // Engagement rate (0-20 points)
    const engagementRate = project.metrics?.engagementRate || 0;
    if (engagementRate > 50) score += 20;
    else if (engagementRate > 30) score += 15;
    else if (engagementRate > 10) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate verification score
   */
  private calculateVerificationScore(project: any): number {
    let score = 0;

    // Founder KYC (0-40 points)
    if (project.founder?.kyc?.status === 'approved') {
      score += 40;
    } else if (project.founder?.kyc?.status === 'pending') {
      score += 20;
    }

    // Company KYB (0-30 points)
    if (project.kyb?.status === 'approved') {
      score += 30;
    } else if (project.kyb?.status === 'pending') {
      score += 15;
    }

    // Security audit (0-30 points)
    if (project.audit?.completed) {
      score += 30;
    } else if (project.audit?.inProgress) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Sort projects within a tier
   */
  private sortProjectsInTier(projects: RankedProject[]): RankedProject[] {
    return projects.sort((a, b) => {
      // Pin spotlight/premium to top
      if (a.isSpotlight && !b.isSpotlight) return -1;
      if (!a.isSpotlight && b.isSpotlight) return 1;
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;

      // Then sort by score (desc)
      if (b.potentialScore !== a.potentialScore) {
        return b.potentialScore - a.potentialScore;
      }

      // Then by recency (desc)
      return b.updatedAt - a.updatedAt;
    });
  }

  /**
   * Organize projects into tiers
   */
  organizeByTiers(projects: RankedProject[]): ProjectsByTier {
    const organized: ProjectsByTier = {
      high: [],
      medium: [],
      low: [],
    };

    // Filter out archived/blocked and organize by tier
    projects
      .filter(p => p.status === 'active')
      .forEach(project => {
        organized[project.tier].push(project);
      });

    // Sort each tier
    organized.high = this.sortProjectsInTier(organized.high);
    organized.medium = this.sortProjectsInTier(organized.medium);
    organized.low = this.sortProjectsInTier(organized.low);

    return organized;
  }

  /**
   * Update project score in Firebase
   */
  async updateProjectScore(projectId: string, project: any): Promise<void> {
    if (!db) return;

    try {
      const scoreFactors = this.calculateScoreFactors(project);
      const potentialScore = this.calculatePotentialScore(scoreFactors);
      const tier = this.determineTier(potentialScore);

      await updateDoc(doc(db!, 'projects', projectId), {
        'raftai.potentialScore': potentialScore,
        'raftai.tier': tier,
        'raftai.scoreFactors': scoreFactors,
        'raftai.lastScoredAt': Timestamp.now(),
      });

      console.log(`✅ Updated project ${projectId} - Score: ${potentialScore}, Tier: ${tier}`);
    } catch (error) {
      console.error(`❌ Error updating project score:`, error);
    }
  }

  /**
   * Subscribe to real-time project updates for a specific role
   * ENFORCES STRICT UID ISOLATION AND ROLE-BASED ACCESS
   */
  subscribeToRankedProjects(
    userRole: string,
    userId: string,
    callback: (projects: ProjectsByTier) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized');
      return () => {};
    }

    // Validate UID
    try {
      validateUID(userId);
    } catch (error) {
      console.error('❌ Invalid UID for project ranking:', error);
      return () => {};
    }

    // Don't rank for founders (they see all their projects differently)
    if (userRole === 'founder') {
      console.log('⚠️ Project ranking not applicable for Founder role');
      // Founders see only their own projects
      this.subscribeToFounderProjects(userId, callback);
      return () => {};
    }

    console.log(`📊 Subscribing to ranked projects for role: ${userRole}, user: ${userId}`);

    // Build isolated query based on role
    let q;
    
    // Check if user is admin
    DataIsolation.isAdmin(userId).then((isUserAdmin) => {
      if (isUserAdmin) {
        // Admin can see all active projects
        console.log(`👑 Admin ${userId} accessing all projects`);
        q = query(
          collection(db!, 'projects'),
          where('status', '==', 'active'),
          orderBy('raftai.potentialScore', 'desc')
        );
      } else {
        // Regular users see filtered projects based on role
        q = this.buildRoleBasedQuery(userRole, userId);
      }

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const projects: RankedProject[] = [];

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          
          // CRITICAL: Validate user has permission to view this project
          if (!this.hasPermission(userRole, userId, data, isUserAdmin)) {
            return;
          }

          const scoreFactors = data.raftai?.scoreFactors || this.calculateScoreFactors(data);
          const potentialScore = data.raftai?.potentialScore || this.calculatePotentialScore(scoreFactors);
          const tier = data.raftai?.tier || this.determineTier(potentialScore);

          // Only include active projects (hide archived/blocked)
          if (data.status !== 'active') {
            return;
          }

          projects.push({
            id: docSnap.id,
            name: data.name || 'Unnamed Project',
            description: data.description || '',
            founderId: data.founderId || data.userId,
            potentialScore,
            tier,
            scoreFactors,
            isSpotlight: data.spotlight === true || data.isSpotlight === true,
            isPremium: data.premium === true || data.isPremium === true,
            status: data.status || 'active',
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || Date.now(),
            metadata: DataIsolation.sanitizeDataForUser(data, userId), // Sanitize sensitive data
          });
        });

        // Organize into tiers and sort
        const organized = this.organizeByTiers(projects);

        console.log(`📊 Ranked projects for ${userRole} ${userId} - High: ${organized.high.length}, Medium: ${organized.medium.length}, Low: ${organized.low.length}`);

        callback(organized);
      }, (error) => {
        console.error('❌ Error in project ranking subscription:', error);
      });

      // Store unsubscriber with UID isolation
      const key = `${userRole}_${userId}`;
      this.unsubscribers.set(key, unsubscribe);
    });

    // Return cleanup function
    return () => {
      const key = `${userRole}_${userId}`;
      const unsubscribe = this.unsubscribers.get(key);
      if (unsubscribe) {
        unsubscribe();
        this.unsubscribers.delete(key);
      }
    };
  }

  /**
   * Subscribe to founder's own projects (isolated)
   */
  private subscribeToFounderProjects(
    founderId: string,
    callback: (projects: ProjectsByTier) => void
  ): void {
    if (!db) return;

    validateUID(founderId);

    console.log(`📂 Subscribing to projects for founder ${founderId}`);

    // Founder sees ONLY their own projects
    const q = query(
      collection(db!, 'projects'),
      where('founderId', '==', founderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects: RankedProject[] = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();

        // CRITICAL: Double-check ownership
        if (data.founderId !== founderId) {
          console.error(`🔒 Isolation violation: Project ${docSnap.id} does not belong to ${founderId}`);
          DataIsolation.logIsolationBreach(founderId, `projects/${docSnap.id}`, 'Attempted access to other founder\'s project');
          return;
        }

        const scoreFactors = data.raftai?.scoreFactors || this.calculateScoreFactors(data);
        const potentialScore = data.raftai?.potentialScore || this.calculatePotentialScore(scoreFactors);
        const tier = data.raftai?.tier || this.determineTier(potentialScore);

        projects.push({
          id: docSnap.id,
          name: data.name || 'Unnamed Project',
          description: data.description || '',
          founderId: data.founderId,
          potentialScore,
          tier,
          scoreFactors,
          isSpotlight: data.spotlight === true,
          isPremium: data.premium === true,
          status: data.status || 'active',
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
          metadata: data,
        });
      });

      // Organize founder's projects
      const organized = this.organizeByTiers(projects);
      callback(organized);
    });

    this.unsubscribers.set(`founder_${founderId}`, unsubscribe);
  }

  /**
   * Build role-based isolated query
   */
  private buildRoleBasedQuery(userRole: string, userId: string): Query {
    validateUID(userId);

    // All non-founder roles see active projects, filtered by role-specific criteria
    const baseQuery = query(
      collection(db!, 'projects'),
      where('status', '==', 'active')
    );

    // Role-specific filtering happens in hasPermission method
    return baseQuery;
  }

  /**
   * Check if user has permission to view project (with UID isolation)
   */
  private hasPermission(userRole: string, userId: string, projectData: any, isAdmin: boolean = false): boolean {
    // Validate UID first
    try {
      validateUID(userId);
    } catch {
      return false;
    }

    // CRITICAL: Never show blocked/archived projects
    if (projectData.status === 'blocked' || projectData.status === 'archived') {
      return false;
    }

    // Admins can see everything
    if (isAdmin || userRole === 'admin') {
      return true;
    }

    // IMPORTANT: Founders ONLY see their own projects (enforced elsewhere)
    // This method is only called for non-founder roles

    // VCs can see all active projects
    if (userRole === 'vc') {
      return projectData.status === 'active';
    }

    // Exchanges can see projects marked for listing OR with exchange in targetRoles
    if (userRole === 'exchange') {
      const hasTargetRole = projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('exchange');
      return projectData.status === 'active' && 
             (projectData.seekingListing === true || projectData.listingReady === true || hasTargetRole);
    }

    // IDOs can see projects seeking IDO OR with ido in targetRoles
    if (userRole === 'ido') {
      const hasTargetRole = projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('ido');
      return projectData.status === 'active' && 
             (projectData.seekingIDO === true || hasTargetRole);
    }

    // Influencers can see public projects or those seeking marketing OR with influencer in targetRoles
    if (userRole === 'influencer') {
      const hasTargetRole = projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('influencer');
      return projectData.status === 'active' && 
             (projectData.visibility === 'public' || projectData.seekingMarketing === true || hasTargetRole);
    }

    // Agencies can see projects seeking services OR with agency in targetRoles
    if (userRole === 'agency') {
      const hasTargetRole = projectData.targetRoles && Array.isArray(projectData.targetRoles) && projectData.targetRoles.includes('agency');
      return projectData.status === 'active' && 
             (projectData.seekingServices === true || hasTargetRole);
    }

    // Traders see public projects only
    if (userRole === 'trader') {
      return projectData.status === 'active' && 
             projectData.visibility === 'public';
    }

    // Default deny
    console.warn(`⚠️ Unknown role ${userRole} attempted to access projects`);
    return false;
  }

  /**
   * Recalculate scores for all projects
   */
  async recalculateAllScores(): Promise<void> {
    if (!db) return;

    console.log('🔄 Recalculating scores for all projects...');

    try {
      const snapshot = await getDocs(
        query(collection(db!, 'projects'), where('status', '==', 'active'))
      );

      let updated = 0;
      for (const docSnap of snapshot.docs) {
        await this.updateProjectScore(docSnap.id, docSnap.data());
        updated++;
      }

      console.log(`✅ Recalculated scores for ${updated} projects`);
    } catch (error) {
      console.error('❌ Error recalculating scores:', error);
    }
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
    console.log('🔌 All project ranking subscriptions cleaned up');
  }
}

// Export singleton instance
export const projectRanking = ProjectRankingEngine.getInstance();

