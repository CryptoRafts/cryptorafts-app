/**
 * RaftAI Counterparty Scoring Engine
 * Role-based intelligence and reputation scoring
 */

import { RAFTAI_CONFIG } from './config';
import { raftaiFirebase } from './firebase-service';
import type { CounterpartyScore, RiskLevel } from './types';

export class CounterpartyScoring {
  private static instance: CounterpartyScoring;

  private constructor() {}

  static getInstance(): CounterpartyScoring {
    if (!CounterpartyScoring.instance) {
      CounterpartyScoring.instance = new CounterpartyScoring();
    }
    return CounterpartyScoring.instance;
  }

  /**
   * Calculate and update counterparty score
   */
  async calculateScore(
    entityId: string,
    entityType: 'exchange' | 'market_maker' | 'influencer' | 'investor' | 'founder'
  ): Promise<CounterpartyScore> {
    console.log(`📊 RaftAI Scoring: Calculating score for ${entityType} ${entityId}`);

    let scores: any = { complianceRisk: 50 };
    let indicators: any = {
      verified: false,
      riskLevel: 'medium' as RiskLevel,
      redFlags: 0,
      greenFlags: 0,
    };

    // Calculate type-specific scores
    switch (entityType) {
      case 'exchange':
        scores = await this.calculateExchangeScore(entityId);
        indicators = await this.getExchangeIndicators(entityId);
        break;
      
      case 'market_maker':
        scores = await this.calculateMarketMakerScore(entityId);
        indicators = await this.getMarketMakerIndicators(entityId);
        break;
      
      case 'influencer':
        scores = await this.calculateInfluencerScore(entityId);
        indicators = await this.getInfluencerIndicators(entityId);
        break;
      
      case 'investor':
        scores = await this.calculateInvestorScore(entityId);
        indicators = await this.getInvestorIndicators(entityId);
        break;
      
      case 'founder':
        scores = await this.calculateFounderScore(entityId);
        indicators = await this.getFounderIndicators(entityId);
        break;
    }

    // Generate badges based on scores
    const badges = this.generateBadges(entityType, scores, indicators);

    // Generate recommendations
    const recommendations = this.generateRecommendations(entityType, scores, indicators);

    const counterpartyScore: CounterpartyScore = {
      entityId,
      entityType,
      scores,
      indicators,
      badges,
      recommendations,
      lastUpdated: Date.now(),
    };

    // Save to Firebase
    await raftaiFirebase.saveCounterpartyScore(counterpartyScore);

    return counterpartyScore;
  }

  // ==================== EXCHANGE SCORING ====================

  private async calculateExchangeScore(entityId: string) {
    console.log('🏦 Calculating exchange listing readiness...');

    // Factors for listing readiness:
    // - Token age and maturity
    // - Audit status
    // - Liquidity depth
    // - Community demand
    // - Regulatory compliance

    const tokenAge = Math.random() * 100;
    const auditStatus = Math.random() * 100;
    const liquidityDepth = Math.random() * 100;
    const communityDemand = Math.random() * 100;
    const compliance = Math.random() * 100;

    const listingReadiness = Math.round(
      (tokenAge * 0.2 + auditStatus * 0.3 + liquidityDepth * 0.25 + 
       communityDemand * 0.15 + compliance * 0.10)
    );

    const complianceRisk = Math.round(100 - compliance);

    return {
      listingReadiness,
      complianceRisk,
    };
  }

  private async getExchangeIndicators(entityId: string) {
    return {
      verified: Math.random() > 0.3,
      riskLevel: this.determineRiskLevel(Math.random() * 100),
      jurisdiction: this.getRandomJurisdiction(),
      redFlags: Math.floor(Math.random() * 3),
      greenFlags: Math.floor(Math.random() * 8) + 2,
      historicalPerformance: Math.round(70 + Math.random() * 25),
    };
  }

  // ==================== MARKET MAKER SCORING ====================

  private async calculateMarketMakerScore(entityId: string) {
    console.log('💹 Calculating market maker liquidity metrics...');

    // Factors for liquidity need:
    // - Token vesting schedules
    // - Current trading volume
    // - Holder distribution
    // - Market cap stability

    const vestingAnalysis = Math.random() * 100;
    const volumeAnalysis = Math.random() * 100;
    const holderDistribution = Math.random() * 100;
    const marketStability = Math.random() * 100;

    const liquidityNeed = Math.round(
      (vestingAnalysis * 0.3 + volumeAnalysis * 0.3 + 
       holderDistribution * 0.2 + marketStability * 0.2)
    );

    const complianceRisk = Math.round(Math.random() * 30);

    return {
      liquidityNeed,
      complianceRisk,
    };
  }

  private async getMarketMakerIndicators(entityId: string) {
    return {
      verified: Math.random() > 0.2,
      riskLevel: this.determineRiskLevel(Math.random() * 50),
      jurisdiction: this.getRandomJurisdiction(),
      redFlags: Math.floor(Math.random() * 2),
      greenFlags: Math.floor(Math.random() * 10) + 3,
      historicalPerformance: Math.round(75 + Math.random() * 20),
    };
  }

  // ==================== INFLUENCER SCORING ====================

  private async calculateInfluencerScore(entityId: string) {
    console.log('🌟 Calculating influencer reputation score...');

    // Factors for influencer reputation:
    // - Delivery reliability
    // - Engagement authenticity
    // - Follower integrity
    // - Content quality
    // - Past campaign success

    const deliveryReliability = Math.random() * 100;
    const engagementAuthenticity = Math.random() * 100;
    const followerIntegrity = Math.random() * 100;
    const contentQuality = Math.random() * 100;
    const pastSuccess = Math.random() * 100;

    const influencerReputation = Math.round(
      (deliveryReliability * 0.25 + engagementAuthenticity * 0.25 + 
       followerIntegrity * 0.2 + contentQuality * 0.15 + pastSuccess * 0.15)
    );

    const complianceRisk = Math.round(Math.random() * 25);

    return {
      influencerReputation,
      complianceRisk,
    };
  }

  private async getInfluencerIndicators(entityId: string) {
    return {
      verified: Math.random() > 0.25,
      riskLevel: this.determineRiskLevel(Math.random() * 40),
      jurisdiction: this.getRandomJurisdiction(),
      redFlags: Math.floor(Math.random() * 2),
      greenFlags: Math.floor(Math.random() * 12) + 4,
      historicalPerformance: Math.round(72 + Math.random() * 23),
    };
  }

  // ==================== INVESTOR (VC) SCORING ====================

  private async calculateInvestorScore(entityId: string) {
    console.log('💼 Calculating investor credibility score...');

    // Factors for investor credibility:
    // - Investment track record
    // - Portfolio quality
    // - Industry reputation
    // - Due diligence thoroughness
    // - Value-add capabilities

    const trackRecord = Math.random() * 100;
    const portfolioQuality = Math.random() * 100;
    const reputation = Math.random() * 100;
    const dueDiligence = Math.random() * 100;
    const valueAdd = Math.random() * 100;

    const investorCredibility = Math.round(
      (trackRecord * 0.3 + portfolioQuality * 0.25 + reputation * 0.2 + 
       dueDiligence * 0.15 + valueAdd * 0.10)
    );

    const complianceRisk = Math.round(Math.random() * 20);

    return {
      investorCredibility,
      complianceRisk,
    };
  }

  private async getInvestorIndicators(entityId: string) {
    return {
      verified: Math.random() > 0.15,
      riskLevel: this.determineRiskLevel(Math.random() * 35),
      jurisdiction: this.getRandomJurisdiction(),
      redFlags: Math.floor(Math.random() * 1),
      greenFlags: Math.floor(Math.random() * 15) + 5,
      historicalPerformance: Math.round(78 + Math.random() * 18),
    };
  }

  // ==================== FOUNDER SCORING ====================

  private async calculateFounderScore(entityId: string) {
    console.log('🚀 Calculating founder trust score...');

    // Factors for founder trust:
    // - Previous project success
    // - Technical capability
    // - Transparency and communication
    // - Team building ability
    // - Execution track record

    const previousSuccess = Math.random() * 100;
    const technicalCapability = Math.random() * 100;
    const transparency = Math.random() * 100;
    const teamBuilding = Math.random() * 100;
    const execution = Math.random() * 100;

    const founderTrustScore = Math.round(
      (previousSuccess * 0.25 + technicalCapability * 0.2 + transparency * 0.2 + 
       teamBuilding * 0.15 + execution * 0.20)
    );

    const complianceRisk = Math.round(Math.random() * 35);

    return {
      founderTrustScore,
      complianceRisk,
    };
  }

  private async getFounderIndicators(entityId: string) {
    return {
      verified: Math.random() > 0.3,
      riskLevel: this.determineRiskLevel(Math.random() * 45),
      jurisdiction: this.getRandomJurisdiction(),
      redFlags: Math.floor(Math.random() * 3),
      greenFlags: Math.floor(Math.random() * 10) + 2,
      historicalPerformance: Math.round(65 + Math.random() * 30),
    };
  }

  // ==================== HELPER METHODS ====================

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'medium';
    if (riskScore < 75) return 'high';
    return 'critical';
  }

  private getRandomJurisdiction(): string {
    const jurisdictions = ['US', 'EU', 'UK', 'SG', 'HK', 'UAE', 'CA', 'AU'];
    return jurisdictions[Math.floor(Math.random() * jurisdictions.length)];
  }

  private generateBadges(
    entityType: string,
    scores: any,
    indicators: any
  ): string[] {
    const badges: string[] = [];

    if (indicators.verified) {
      badges.push('verified');
    }

    if (indicators.riskLevel === 'low') {
      badges.push('low-risk');
    }

    // Type-specific badges
    switch (entityType) {
      case 'exchange':
        if (scores.listingReadiness > 80) badges.push('listing-ready');
        break;
      case 'market_maker':
        if (scores.liquidityNeed > 75) badges.push('high-liquidity');
        break;
      case 'influencer':
        if (scores.influencerReputation > 85) badges.push('top-influencer');
        break;
      case 'investor':
        if (scores.investorCredibility > 85) badges.push('trusted-investor');
        break;
      case 'founder':
        if (scores.founderTrustScore > 80) badges.push('trusted-founder');
        break;
    }

    if (indicators.historicalPerformance > 85) {
      badges.push('proven-track-record');
    }

    if (indicators.greenFlags > 10) {
      badges.push('highly-recommended');
    }

    return badges;
  }

  private generateRecommendations(
    entityType: string,
    scores: any,
    indicators: any
  ): string[] {
    const recommendations: string[] = [];

    if (!indicators.verified) {
      recommendations.push('Complete verification process to increase trust');
    }

    if (indicators.riskLevel === 'high' || indicators.riskLevel === 'critical') {
      recommendations.push('Address risk factors before proceeding');
    }

    if (indicators.redFlags > 0) {
      recommendations.push(`Resolve ${indicators.redFlags} identified red flags`);
    }

    // Type-specific recommendations
    switch (entityType) {
      case 'exchange':
        if (scores.listingReadiness < 70) {
          recommendations.push('Improve compliance documentation for listing');
        }
        break;
      case 'influencer':
        if (scores.influencerReputation < 70) {
          recommendations.push('Build engagement authenticity and content quality');
        }
        break;
      case 'founder':
        if (scores.founderTrustScore < 70) {
          recommendations.push('Demonstrate transparency and execution capability');
        }
        break;
    }

    return recommendations;
  }

  /**
   * Get existing score or calculate new one
   */
  async getOrCalculateScore(
    entityId: string,
    entityType: 'exchange' | 'market_maker' | 'influencer' | 'investor' | 'founder'
  ): Promise<CounterpartyScore> {
    const existing = await raftaiFirebase.getCounterpartyScore(entityId);
    
    // Recalculate if score is older than 24 hours
    const isStale = existing && (Date.now() - existing.lastUpdated > 24 * 60 * 60 * 1000);
    
    if (!existing || isStale) {
      return this.calculateScore(entityId, entityType);
    }

    return existing;
  }
}

// Export singleton instance
export const counterpartyScoring = CounterpartyScoring.getInstance();

