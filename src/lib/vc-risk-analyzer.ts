/**
 * VC Risk Analyzer - AI-Powered Project Risk Assessment
 * Provides comprehensive risk analysis for investment decisions
 */

export interface RiskAnalysis {
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number; // 0-100 (higher is riskier)
  confidenceLevel: number; // 0-100
  categories: {
    technical: RiskCategory;
    market: RiskCategory;
    team: RiskCategory;
    financial: RiskCategory;
    regulatory: RiskCategory;
    tokenomics: RiskCategory;
  };
  redFlags: RedFlag[];
  mitigationStrategies: string[];
  investmentRecommendation: {
    decision: 'Strong Buy' | 'Buy' | 'Hold' | 'Pass' | 'Strong Pass';
    reasoning: string;
    suggestedTerms?: {
      valuation?: string;
      equity?: string;
      conditions?: string[];
    };
  };
  aiDisclaimer: string; // "RaftAI can do mistakes" warning
  comparableProjects?: {
    name: string;
    outcome: string;
    similarity: number;
  }[];
}

export interface RiskCategory {
  score: number; // 0-100 (higher is riskier)
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: string[];
  positives: string[];
  concerns: string[];
}

export interface RedFlag {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  impact: string;
  mitigation?: string;
}

export interface ProjectData {
  name: string;
  sector: string;
  chain: string;
  stage: string;
  fundingGoal: number;
  teamSize: number | string;
  problem?: string;
  solution?: string;
  marketSize?: string;
  businessModel?: string;
  tokenomics?: any;
  team?: any;
  traction?: any;
  competitors?: string[];
  roadmap?: any;
  raftai?: {
    rating?: string;
    score?: number;
    summary?: string;
    risks?: string[];
    recommendations?: string[];
  };
}

export class VCRiskAnalyzer {
  
  /**
   * Analyze project and calculate comprehensive risk assessment
   */
  static analyzeProject(project: ProjectData): RiskAnalysis {
    const technicalRisk = this.analyzeTechnicalRisk(project);
    const marketRisk = this.analyzeMarketRisk(project);
    const teamRisk = this.analyzeTeamRisk(project);
    const financialRisk = this.analyzeFinancialRisk(project);
    const regulatoryRisk = this.analyzeRegulatoryRisk(project);
    const tokenomicsRisk = this.analyzeTokenomicsRisk(project);

    // Calculate weighted overall risk score
    const overallRiskScore = Math.round(
      technicalRisk.score * 0.20 +
      marketRisk.score * 0.25 +
      teamRisk.score * 0.20 +
      financialRisk.score * 0.15 +
      regulatoryRisk.score * 0.10 +
      tokenomicsRisk.score * 0.10
    );

    const overallRisk = this.getRiskLevel(overallRiskScore);
    const redFlags = this.identifyRedFlags(project, {
      technical: technicalRisk,
      market: marketRisk,
      team: teamRisk,
      financial: financialRisk,
      regulatory: regulatoryRisk,
      tokenomics: tokenomicsRisk
    });

    const mitigationStrategies = this.generateMitigationStrategies(redFlags);
    const investmentRecommendation = this.generateInvestmentRecommendation(
      overallRiskScore,
      project,
      redFlags
    );

    return {
      overallRisk,
      riskScore: overallRiskScore,
      confidenceLevel: this.calculateConfidenceLevel(project),
      categories: {
        technical: technicalRisk,
        market: marketRisk,
        team: teamRisk,
        financial: financialRisk,
        regulatory: regulatoryRisk,
        tokenomics: tokenomicsRisk
      },
      redFlags,
      mitigationStrategies,
      investmentRecommendation,
      aiDisclaimer: "⚠️ RaftAI Analysis Disclaimer: This AI assessment is based on available data and may contain inaccuracies or oversights. RaftAI can do mistakes. Always conduct thorough due diligence and consult with human experts before making investment decisions."
    };
  }

  private static analyzeTechnicalRisk(project: ProjectData): RiskCategory {
    let score = 50; // Start at medium risk
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    // Analyze blockchain choice
    const establishedChains = ['ethereum', 'polygon', 'solana', 'avalanche', 'binance'];
    if (project.chain && establishedChains.includes(project.chain.toLowerCase())) {
      score -= 10;
      positives.push('Building on established blockchain');
      factors.push('Established blockchain platform');
    } else {
      score += 10;
      concerns.push('Building on less established chain');
      factors.push('Newer blockchain platform');
    }

    // Analyze problem/solution clarity
    if (project.problem && project.problem.length > 100) {
      score -= 5;
      positives.push('Clear problem definition');
      factors.push('Well-defined problem statement');
    } else {
      score += 5;
      concerns.push('Unclear problem definition');
      factors.push('Problem statement needs clarity');
    }

    if (project.solution && project.solution.length > 100) {
      score -= 5;
      positives.push('Detailed solution description');
      factors.push('Comprehensive solution approach');
    } else {
      score += 5;
      concerns.push('Limited solution details');
      factors.push('Solution needs more detail');
    }

    // Stage consideration
    if (project.stage === 'mvp' || project.stage === 'launched') {
      score -= 15;
      positives.push('Product already developed');
      factors.push('Working product exists');
    } else {
      score += 10;
      concerns.push('No working product yet');
      factors.push('Pre-product stage');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static analyzeMarketRisk(project: ProjectData): RiskCategory {
    let score = 50;
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    // Analyze sector
    const hotSectors = ['defi', 'nft', 'gaming', 'infrastructure', 'dao'];
    if (project.sector && hotSectors.includes(project.sector.toLowerCase())) {
      score -= 10;
      positives.push('Operating in hot sector');
      factors.push('High-demand sector');
    } else {
      score += 5;
      factors.push('Sector competitiveness to assess');
    }

    // Market size analysis
    if (project.marketSize && project.marketSize.length > 50) {
      score -= 10;
      positives.push('Clear market size identified');
      factors.push('Market opportunity quantified');
    } else {
      score += 10;
      concerns.push('Market size not clearly defined');
      factors.push('Market opportunity unclear');
    }

    // Business model
    if (project.businessModel && project.businessModel.length > 50) {
      score -= 10;
      positives.push('Clear revenue model');
      factors.push('Defined monetization strategy');
    } else {
      score += 15;
      concerns.push('Unclear revenue model');
      factors.push('Monetization strategy undefined');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static analyzeTeamRisk(project: ProjectData): RiskCategory {
    let score = 50;
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    // Team size analysis
    const teamSize = typeof project.teamSize === 'number' ? project.teamSize : 
                    parseInt(String(project.teamSize)) || 0;
    
    if (teamSize >= 5) {
      score -= 15;
      positives.push('Adequate team size');
      factors.push(`Team of ${teamSize} members`);
    } else if (teamSize >= 2) {
      score -= 5;
      factors.push(`Small team of ${teamSize} members`);
    } else {
      score += 15;
      concerns.push('Very small team');
      factors.push('Team size may be insufficient');
    }

    // Stage-based team assessment
    if (project.stage === 'launched' || project.stage === 'mvp') {
      score -= 10;
      positives.push('Team has delivered product');
      factors.push('Proven execution capability');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static analyzeFinancialRisk(project: ProjectData): RiskCategory {
    let score = 50;
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    const fundingGoal = project.fundingGoal || 0;

    // Funding goal reasonableness
    if (fundingGoal > 0 && fundingGoal < 1000000) {
      score -= 10;
      positives.push('Reasonable funding request');
      factors.push(`Seeking $${fundingGoal.toLocaleString()}`);
    } else if (fundingGoal >= 1000000 && fundingGoal < 5000000) {
      score += 5;
      factors.push(`Seeking $${fundingGoal.toLocaleString()}`);
    } else if (fundingGoal >= 5000000) {
      score += 15;
      concerns.push('Very high funding requirement');
      factors.push(`High capital requirement: $${fundingGoal.toLocaleString()}`);
    }

    // Stage vs funding alignment
    if (project.stage === 'idea' && fundingGoal > 500000) {
      score += 10;
      concerns.push('High ask for early stage');
      factors.push('Funding/stage mismatch');
    } else if (project.stage === 'launched' && fundingGoal < 100000) {
      score -= 5;
      positives.push('Conservative funding for traction');
      factors.push('Reasonable growth capital');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static analyzeRegulatoryRisk(project: ProjectData): RiskCategory {
    let score = 30; // Start lower as crypto has inherent regulatory risk
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    // Sector-based regulatory assessment
    const highRegSectors = ['defi', 'exchange', 'lending', 'stablecoin'];
    const mediumRegSectors = ['nft', 'gaming', 'dao'];
    
    if (project.sector && highRegSectors.includes(project.sector.toLowerCase())) {
      score += 25;
      concerns.push('High regulatory scrutiny sector');
      factors.push('Significant compliance requirements');
    } else if (project.sector && mediumRegSectors.includes(project.sector.toLowerCase())) {
      score += 10;
      factors.push('Moderate regulatory considerations');
    } else {
      score += 5;
      positives.push('Lower regulatory risk sector');
      factors.push('Limited regulatory exposure');
    }

    factors.push('Crypto market regulatory uncertainty');
    concerns.push('Evolving regulatory landscape');

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static analyzeTokenomicsRisk(project: ProjectData): RiskCategory {
    let score = 50;
    const factors: string[] = [];
    const positives: string[] = [];
    const concerns: string[] = [];

    if (project.tokenomics) {
      score -= 15;
      positives.push('Tokenomics structure defined');
      factors.push('Token economics planned');
    } else {
      score += 20;
      concerns.push('No tokenomics information');
      factors.push('Token structure undefined');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getRiskLevel(score),
      factors,
      positives,
      concerns
    };
  }

  private static identifyRedFlags(project: ProjectData, categories: any): RedFlag[] {
    const redFlags: RedFlag[] = [];

    // Critical red flags
    if (categories.financial.score > 80) {
      redFlags.push({
        severity: 'Critical',
        category: 'Financial',
        description: 'Unrealistic funding requirements',
        impact: 'May indicate poor financial planning or unrealistic expectations',
        mitigation: 'Request detailed financial breakdown and milestones'
      });
    }

    if (categories.team.score > 75) {
      redFlags.push({
        severity: 'High',
        category: 'Team',
        description: 'Team size inadequate for scope',
        impact: 'Execution risk is significantly elevated',
        mitigation: 'Require team expansion plan or strategic hiring roadmap'
      });
    }

    // High-priority red flags
    if (!project.problem || project.problem.length < 50) {
      redFlags.push({
        severity: 'High',
        category: 'Product',
        description: 'Unclear problem definition',
        impact: 'Product-market fit uncertain',
        mitigation: 'Request detailed market research and user validation'
      });
    }

    if (!project.businessModel || project.businessModel.length < 30) {
      redFlags.push({
        severity: 'High',
        category: 'Business Model',
        description: 'Revenue model not defined',
        impact: 'Long-term sustainability questionable',
        mitigation: 'Require comprehensive monetization strategy'
      });
    }

    // Medium-priority red flags
    if (categories.regulatory.score > 60) {
      redFlags.push({
        severity: 'Medium',
        category: 'Regulatory',
        description: 'High regulatory exposure',
        impact: 'Potential compliance challenges',
        mitigation: 'Ensure legal counsel and compliance framework'
      });
    }

    if (categories.market.score > 65) {
      redFlags.push({
        severity: 'Medium',
        category: 'Market',
        description: 'Market competition or size concerns',
        impact: 'Challenging market penetration',
        mitigation: 'Validate unique value proposition and competitive moat'
      });
    }

    return redFlags;
  }

  private static generateMitigationStrategies(redFlags: RedFlag[]): string[] {
    const strategies: string[] = [];

    redFlags.forEach(flag => {
      if (flag.mitigation) {
        strategies.push(flag.mitigation);
      }
    });

    // Add general strategies
    strategies.push('Implement milestone-based funding with clear KPIs');
    strategies.push('Require regular progress reports and transparency');
    strategies.push('Consider board seat or advisor role for governance');
    strategies.push('Include protective provisions in investment terms');

    return Array.from(new Set(strategies)); // Remove duplicates
  }

  private static generateInvestmentRecommendation(
    riskScore: number,
    project: ProjectData,
    redFlags: RedFlag[]
  ): RiskAnalysis['investmentRecommendation'] {
    const criticalFlags = redFlags.filter(f => f.severity === 'Critical').length;
    const highFlags = redFlags.filter(f => f.severity === 'High').length;

    let decision: RiskAnalysis['investmentRecommendation']['decision'];
    let reasoning: string;
    let suggestedTerms = {};

    if (criticalFlags > 0 || riskScore > 80) {
      decision = 'Strong Pass';
      reasoning = 'Critical risk factors identified. Project requires fundamental restructuring before investment consideration.';
    } else if (riskScore > 65 || highFlags >= 3) {
      decision = 'Pass';
      reasoning = 'Significant risks outweigh potential upside. Consider only if major improvements are made.';
    } else if (riskScore > 50) {
      decision = 'Hold';
      reasoning = 'Moderate risk with potential. Request additional information and risk mitigation plans before deciding.';
      suggestedTerms = {
        valuation: 'Conservative valuation with ratchet provisions',
        equity: '15-25% equity stake with milestone vesting',
        conditions: [
          'Milestone-based tranches',
          'Board observation rights',
          'Protective provisions',
          'Information rights'
        ]
      };
    } else if (riskScore > 35) {
      decision = 'Buy';
      reasoning = 'Acceptable risk profile with good potential. Standard due diligence recommended.';
      suggestedTerms = {
        valuation: 'Fair market valuation with growth upside',
        equity: '10-20% equity stake',
        conditions: [
          'Standard investor protections',
          'Anti-dilution provisions',
          'Information rights'
        ]
      };
    } else {
      decision = 'Strong Buy';
      reasoning = 'Strong opportunity with manageable risks. High potential for success with proper support.';
      suggestedTerms = {
        valuation: 'Market valuation with founder-friendly terms',
        equity: '10-15% equity stake',
        conditions: [
          'Standard protections',
          'Pro-rata rights',
          'Light covenants'
        ]
      };
    }

    return {
      decision,
      reasoning,
      suggestedTerms: Object.keys(suggestedTerms).length > 0 ? suggestedTerms as any : undefined
    };
  }

  private static calculateConfidenceLevel(project: ProjectData): number {
    let confidence = 50;

    // More data = higher confidence
    if (project.problem && project.problem.length > 100) confidence += 10;
    if (project.solution && project.solution.length > 100) confidence += 10;
    if (project.marketSize && project.marketSize.length > 50) confidence += 10;
    if (project.businessModel && project.businessModel.length > 50) confidence += 10;
    if (project.teamSize) confidence += 5;
    if (project.tokenomics) confidence += 5;

    return Math.min(100, confidence);
  }

  private static getRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score < 35) return 'Low';
    if (score < 55) return 'Medium';
    if (score < 75) return 'High';
    return 'Critical';
  }
}

