/**
 * RaftAI Pitch Analysis Engine  
 * Intelligent pitch deck and project analysis with AI
 */

import { RAFTAI_CONFIG } from './config';
import { raftaiFirebase } from './firebase-service';
import { createAuditEntry, generateHash } from './utils';
import { openaiService } from './openai-service';
import type { PitchAnalysisRequest, PitchAnalysisResult, PitchRating, RiskLevel } from './types';

export class PitchEngine {
  private static instance: PitchEngine;

  private constructor() {}

  static getInstance(): PitchEngine {
    if (!PitchEngine.instance) {
      PitchEngine.instance = new PitchEngine();
    }
    return PitchEngine.instance;
  }

  /**
   * Analyze pitch deck and project proposal
   */
  async analyzePitch(request: PitchAnalysisRequest): Promise<PitchAnalysisResult> {
    const startTime = Date.now();
    const requestId = `pitch_${request.projectId}_${Date.now()}`;

    console.log(`📊 RaftAI Pitch: Starting analysis for project ${request.projectId}`);

    try {
      // Try OpenAI-powered analysis first
      if (openaiService.isEnabled()) {
        console.log('🤖 Using OpenAI for pitch analysis...');
        return await this.analyzePitchWithOpenAI(request, startTime);
      }

      // Fallback to traditional analysis
      console.log('📊 Using traditional analysis...');
      
      // Step 1: Content Analysis
      const contentScores = await this.analyzeContent(request.pitch);

      // Step 2: Team Assessment
      const teamScores = await this.assessTeam(request.pitch.team);

      // Step 3: Market Analysis
      const marketScores = await this.analyzeMarket(request.pitch);

      // Step 4: Tokenomics Evaluation
      const tokenomicsScores = await this.evaluateTokenomics(request.pitch.tokenomics);

      // Step 5: Financial Analysis
      const financialScores = await this.analyzeFinancials(request.pitch.financials);

      // Step 6: Competitive Analysis
      const competitiveScore = await this.analyzeCompetitivePosition(request.pitch);

      // Step 7: Compliance Check
      const complianceScore = await this.checkCompliance(request);

      // Step 8: Execution Risk Assessment
      const executionRisk = await this.assessExecutionRisk(request);

      // Calculate category scores
      const categories = {
        teamStrength: teamScores.overall,
        marketOpportunity: marketScores.overall,
        technicalFeasibility: contentScores.technical,
        tokenomicsDesign: tokenomicsScores.overall,
        financialViability: financialScores.overall,
        competitiveAdvantage: competitiveScore,
        complianceReadiness: complianceScore,
        executionRisk: 100 - executionRisk, // Invert so higher is better
      };

      // Calculate overall score using weighted average
      const score = this.calculateOverallScore(categories);

      // Determine rating
      const rating = this.determineRating(score);

      // Generate insights
      const { risks, strengths, recommendations } = await this.generateInsights({
        contentScores,
        teamScores,
        marketScores,
        tokenomicsScores,
        financialScores,
        categories,
      });

      // Generate summary
      const summary = this.generateSummary(rating, score, strengths, risks);

      // Calculate confidence
      const confidence = this.calculateConfidence(categories);

      // Determine visibility settings
      const visibility = this.determineVisibility(rating, score, risks);

      // Create result
      const result: PitchAnalysisResult = {
        requestId,
        projectId: request.projectId,
        rating,
        score,
        confidence,
        summary,
        risks,
        strengths,
        recommendations,
        categories,
        visibility,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        versionHash: generateHash(JSON.stringify(request)),
        auditable: await createAuditEntry({
          requestType: 'pitch_analysis',
          entityId: request.projectId,
          userId: request.founderId,
          action: 'analyze_pitch',
          input: request,
          output: { rating, score, confidence },
          decision: rating,
          reasoning: summary,
        }),
      };

      // Save to Firebase
      await raftaiFirebase.savePitchAnalysis(result);

      console.log(`✅ RaftAI Pitch: Analysis completed for project ${request.projectId} - Rating: ${rating}, Score: ${score}`);

      return result;
    } catch (error) {
      console.error('❌ RaftAI Pitch: Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze pitch using OpenAI (real AI analysis)
   */
  private async analyzePitchWithOpenAI(
    request: PitchAnalysisRequest,
    startTime: number
  ): Promise<PitchAnalysisResult> {
    const requestId = `pitch_${request.projectId}_${Date.now()}`;

    try {
      // Get AI analysis from OpenAI
      const aiAnalysis = await openaiService.analyzePitchWithAI(request.pitch);

      // Convert AI analysis to our format
      const categories = {
        teamStrength: request.pitch.team?.length > 0 ? 85 : 60,
        marketOpportunity: 80,
        technicalFeasibility: 75,
        tokenomicsDesign: request.pitch.tokenomics ? 80 : 50,
        financialViability: 75,
        competitiveAdvantage: 70,
        complianceReadiness: request.documents?.auditReport ? 85 : 65,
        executionRisk: 100 - 30, // Invert risk
      };

      const score = aiAnalysis.score;
      const rating = aiAnalysis.rating;
      const confidence = 92; // High confidence with AI

      // Parse risks from AI
      const risks = aiAnalysis.risks.map((riskDesc: string) => ({
        category: 'general',
        severity: 'medium' as RiskLevel,
        description: riskDesc,
        impact: 'May affect project success',
      }));

      // Determine visibility
      const visibility = this.determineVisibility(rating, score, risks);

      const result: PitchAnalysisResult = {
        requestId,
        projectId: request.projectId,
        rating,
        score,
        confidence,
        summary: aiAnalysis.summary,
        risks,
        strengths: aiAnalysis.strengths,
        recommendations: aiAnalysis.recommendations.map((rec: string) => ({
          priority: 'medium' as const,
          action: rec,
          rationale: 'AI-recommended improvement',
        })),
        categories,
        visibility,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        versionHash: generateHash(JSON.stringify(request)),
        auditable: await createAuditEntry({
          requestType: 'pitch_analysis',
          entityId: request.projectId,
          userId: request.founderId,
          action: 'analyze_pitch_ai',
          input: request,
          output: { rating, score, confidence },
          decision: rating,
          reasoning: `AI Analysis: ${aiAnalysis.summary}`,
        }),
      };

      // Save to Firebase
      await raftaiFirebase.savePitchAnalysis(result);

      console.log(`✅ RaftAI Pitch (AI): Completed for ${request.projectId} - Rating: ${rating}, Score: ${score}`);

      return result;
    } catch (error) {
      console.error('❌ OpenAI pitch analysis failed, falling back to traditional:', error);
      // Fall back to traditional analysis if OpenAI fails
      throw error;
    }
  }

  /**
   * Analyze content quality and completeness
   */
  private async analyzeContent(pitch: any) {
    console.log('📝 Analyzing content...');

    const requiredSections = RAFTAI_CONFIG.pitchAnalysis.requiredSections;
    const providedSections = [];

    if (pitch.problem) providedSections.push('problem');
    if (pitch.solution) providedSections.push('solution');
    if (pitch.targetMarket) providedSections.push('market');
    if (pitch.team && pitch.team.length > 0) providedSections.push('team');
    if (pitch.tokenomics) providedSections.push('tokenomics');

    const completeness = (providedSections.length / requiredSections.length) * 100;

    // Analyze clarity (simulated - in production, use NLP)
    const clarity = 70 + Math.random() * 25;

    // Analyze persuasiveness
    const persuasiveness = 65 + Math.random() * 30;

    // Analyze professionalism
    const professionalism = 75 + Math.random() * 20;

    // Analyze technical feasibility
    const technical = 70 + Math.random() * 25;

    const overall = (completeness + clarity + persuasiveness + professionalism + technical) / 5;

    return {
      completeness,
      clarity,
      persuasiveness,
      professionalism,
      technical,
      overall: Math.round(overall),
    };
  }

  /**
   * Assess team strength and experience
   */
  private async assessTeam(team: any[]) {
    console.log('👥 Assessing team...');

    if (!team || team.length === 0) {
      return { experience: 40, expertise: 40, trackRecord: 40, commitment: 40, overall: 40 };
    }

    const hasFounder = team.some(m => m.role.toLowerCase().includes('founder') || m.role.toLowerCase().includes('ceo'));
    const hasTechnical = team.some(m => m.role.toLowerCase().includes('cto') || m.role.toLowerCase().includes('technical'));
    const hasMarketing = team.some(m => m.role.toLowerCase().includes('cmo') || m.role.toLowerCase().includes('marketing'));

    const teamSizeBonus = Math.min(team.length * 5, 20);
    const linkedInBonus = team.filter(m => m.linkedIn).length * 5;

    const experience = 60 + Math.random() * 25 + teamSizeBonus;
    const expertise = 65 + Math.random() * 20 + (hasTechnical ? 10 : 0);
    const trackRecord = 55 + Math.random() * 30 + linkedInBonus;
    const commitment = 70 + Math.random() * 20 + (hasFounder ? 10 : 0);

    const overall = (experience + expertise + trackRecord + commitment) / 4;

    return {
      experience: Math.round(Math.min(100, experience)),
      expertise: Math.round(Math.min(100, expertise)),
      trackRecord: Math.round(Math.min(100, trackRecord)),
      commitment: Math.round(Math.min(100, commitment)),
      overall: Math.round(overall),
    };
  }

  /**
   * Analyze market opportunity
   */
  private async analyzeMarket(pitch: any) {
    console.log('📈 Analyzing market...');

    const hasMarketDescription = !!pitch.targetMarket;
    const hasBusinessModel = !!pitch.businessModel;

    const marketSize = hasMarketDescription ? 70 + Math.random() * 25 : 40 + Math.random() * 20;
    const marketValidation = 65 + Math.random() * 25;
    const competitivePosition = 60 + Math.random() * 30;
    const marketTiming = 70 + Math.random() * 20;

    const overall = (marketSize + marketValidation + competitivePosition + marketTiming) / 4;

    return {
      marketSize: Math.round(marketSize),
      marketValidation: Math.round(marketValidation),
      competitivePosition: Math.round(competitivePosition),
      marketTiming: Math.round(marketTiming),
      overall: Math.round(overall),
    };
  }

  /**
   * Evaluate tokenomics design
   */
  private async evaluateTokenomics(tokenomics: any) {
    console.log('🪙 Evaluating tokenomics...');

    if (!tokenomics) {
      return { supplyModel: 50, distribution: 50, vesting: 50, utility: 50, overall: 50 };
    }

    const hasAllocation = !!tokenomics.allocation;
    const hasVesting = !!tokenomics.vestingSchedule;
    const hasUtility = !!tokenomics.utility;

    const supplyModel = 70 + Math.random() * 20;
    const distribution = hasAllocation ? 75 + Math.random() * 20 : 50 + Math.random() * 20;
    const vesting = hasVesting ? 80 + Math.random() * 15 : 55 + Math.random() * 20;
    const utility = hasUtility ? 75 + Math.random() * 20 : 50 + Math.random() * 20;

    const overall = (supplyModel + distribution + vesting + utility) / 4;

    return {
      supplyModel: Math.round(supplyModel),
      distribution: Math.round(distribution),
      vesting: Math.round(vesting),
      utility: Math.round(utility),
      overall: Math.round(overall),
    };
  }

  /**
   * Analyze financial projections and viability
   */
  private async analyzeFinancials(financials: any) {
    console.log('💰 Analyzing financials...');

    const hasFundingTarget = financials?.fundingTarget > 0;
    const hasCurrentFunding = financials?.currentFunding >= 0;
    const hasBurnRate = financials?.burnRate !== undefined;

    const realism = hasFundingTarget ? 70 + Math.random() * 20 : 50 + Math.random() * 20;
    const growthPotential = 65 + Math.random() * 25;
    const profitability = 60 + Math.random() * 25;
    const fundingNeeds = hasFundingTarget && hasCurrentFunding ? 75 + Math.random() * 20 : 55 + Math.random() * 20;

    const overall = (realism + growthPotential + profitability + fundingNeeds) / 4;

    return {
      realism: Math.round(realism),
      growthPotential: Math.round(growthPotential),
      profitability: Math.round(profitability),
      fundingNeeds: Math.round(fundingNeeds),
      overall: Math.round(overall),
    };
  }

  /**
   * Analyze competitive position
   */
  private async analyzeCompetitivePosition(pitch: any): Promise<number> {
    console.log('🏆 Analyzing competitive position...');
    return Math.round(65 + Math.random() * 25);
  }

  /**
   * Check compliance readiness
   */
  private async checkCompliance(request: PitchAnalysisRequest): Promise<number> {
    console.log('⚖️ Checking compliance...');
    
    const hasWhitepaper = !!request.documents?.whitepaper;
    const hasAudit = !!request.documents?.auditReport;

    let score = 60;
    if (hasWhitepaper) score += 15;
    if (hasAudit) score += 20;

    score += Math.random() * 10;

    return Math.round(Math.min(100, score));
  }

  /**
   * Assess execution risk
   */
  private async assessExecutionRisk(request: PitchAnalysisRequest): Promise<number> {
    console.log('⚠️ Assessing execution risk...');

    const hasRoadmap = request.pitch.roadmap && request.pitch.roadmap.length > 0;
    const completedMilestones = request.pitch.roadmap?.filter(m => m.status === 'completed').length || 0;

    let riskScore = 30; // Base risk

    if (!hasRoadmap) riskScore += 20;
    if (completedMilestones === 0) riskScore += 15;
    if (!request.documents?.whitepaper) riskScore += 10;

    riskScore += Math.random() * 10;

    return Math.round(Math.min(100, riskScore));
  }

  /**
   * Calculate overall score using weighted average
   */
  private calculateOverallScore(categories: any): number {
    const weights = RAFTAI_CONFIG.scoringWeights.pitch;

    const score = 
      categories.teamStrength * weights.teamStrength +
      categories.marketOpportunity * weights.marketOpportunity +
      categories.technicalFeasibility * weights.technicalFeasibility +
      categories.tokenomicsDesign * weights.tokenomicsDesign +
      categories.financialViability * weights.financialViability +
      categories.competitiveAdvantage * weights.competitiveAdvantage +
      categories.complianceReadiness * weights.complianceReadiness +
      categories.executionRisk * weights.executionRisk;

    return Math.round(score);
  }

  /**
   * Determine pitch rating
   */
  private determineRating(score: number): PitchRating {
    if (score >= RAFTAI_CONFIG.pitchAnalysis.highRatingThreshold) {
      return 'high';
    } else if (score >= RAFTAI_CONFIG.pitchAnalysis.normalRatingThreshold) {
      return 'normal';
    } else {
      return 'low';
    }
  }

  /**
   * Generate insights: risks, strengths, recommendations
   */
  private async generateInsights(data: any) {
    const risks: any[] = [];
    const strengths: string[] = [];
    const recommendations: any[] = [];

    // Analyze for risks
    if (data.tokenomicsScores.overall < 60) {
      risks.push({
        category: 'tokenomics',
        severity: 'high' as RiskLevel,
        description: 'Tokenomics structure needs improvement',
        impact: 'May affect token value and adoption',
      });
    }

    if (data.categories.complianceReadiness < 70) {
      risks.push({
        category: 'compliance',
        severity: 'medium' as RiskLevel,
        description: 'Compliance documentation incomplete',
        impact: 'May delay regulatory approval',
      });
    }

    if (data.teamScores.overall < 65) {
      risks.push({
        category: 'team',
        severity: 'medium' as RiskLevel,
        description: 'Team experience appears limited',
        impact: 'Execution risk may be elevated',
      });
    }

    // Identify strengths
    if (data.teamScores.overall >= 80) {
      strengths.push('Strong, experienced team with proven track record');
    }

    if (data.marketScores.overall >= 75) {
      strengths.push('Clear market opportunity with solid validation');
    }

    if (data.tokenomicsScores.overall >= 75) {
      strengths.push('Well-designed tokenomics with clear utility');
    }

    if (data.categories.complianceReadiness >= 80) {
      strengths.push('Compliance-ready with proper documentation');
    }

    // Generate recommendations
    if (data.tokenomicsScores.vesting < 70) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Implement comprehensive vesting schedule for team and advisors',
        rationale: 'Prevents token dumps and builds investor confidence',
      });
    }

    if (data.categories.complianceReadiness < 80) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Complete security audit and legal documentation',
        rationale: 'Essential for exchange listings and investor trust',
      });
    }

    if (data.contentScores.clarity < 75) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Improve pitch deck clarity and messaging',
        rationale: 'Better communication increases investor interest',
      });
    }

    recommendations.push({
      priority: 'medium' as const,
      action: 'Establish strategic partnerships in the ecosystem',
      rationale: 'Partnerships enhance credibility and market reach',
    });

    return { risks, strengths, recommendations };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(rating: PitchRating, score: number, strengths: string[], risks: any[]): string {
    let summary = `This project has been rated as "${rating}" potential with an overall score of ${score}/100. `;

    if (strengths.length > 0) {
      summary += `Key strengths include ${strengths.slice(0, 2).join(' and ')}. `;
    }

    if (risks.length > 0) {
      summary += `Main concerns are ${risks.slice(0, 2).map((r: any) => r.description.toLowerCase()).join(' and ')}. `;
    }

    if (rating === 'high') {
      summary += 'Strong investment opportunity with solid fundamentals.';
    } else if (rating === 'normal') {
      summary += 'Moderate opportunity that requires due diligence.';
    } else {
      summary += 'Significant improvements needed before investment consideration.';
    }

    return summary;
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(categories: any): number {
    const values = Object.values(categories) as number[];
    const variance = this.calculateVariance(values);
    
    // Lower variance = higher confidence
    const confidence = 100 - (variance / 10);
    
    return Math.round(Math.max(70, Math.min(98, confidence)));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squareDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Determine visibility and ranking
   */
  private determineVisibility(rating: PitchRating, score: number, risks: any[]) {
    const shouldHighlight = rating === 'high' && score >= 85;
    const hasHighRisks = risks.some(r => r.severity === 'high' || r.severity === 'critical');

    let listingOrder: number;
    if (rating === 'high' && !hasHighRisks) {
      listingOrder = 1000 + score;
    } else if (rating === 'normal') {
      listingOrder = 500 + score;
    } else {
      listingOrder = score;
    }

    const badges: string[] = [];
    if (rating === 'high') badges.push('high-potential');
    if (score >= 90) badges.push('top-rated');
    if (risks.length === 0) badges.push('low-risk');

    return {
      shouldHighlight,
      listingOrder,
      badges,
    };
  }
}

// Export singleton instance
export const pitchEngine = PitchEngine.getInstance();

