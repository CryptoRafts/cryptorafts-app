import { PitchInputType, PitchDecisionType } from '../schemas.js';
import { logger } from '../utils/logger.js';
import { openaiClient } from '../utils/openai-client.js';

export async function decidePitch(input: PitchInputType): Promise<PitchDecisionType> {
  logger.info('Processing pitch analysis with OpenAI', {
    projectId: input.projectId,
    title: input.title,
    sector: input.sector
  });

  // Get AI analysis from OpenAI
  const aiAnalysis = await openaiClient.analyzePitch({
    projectId: input.projectId,
    title: input.title,
    summary: input.summary,
    sector: input.sector,
    stage: input.stage,
    chain: input.chain,
    tokenomics: input.tokenomics
  });

  // Calculate score based on weighted factors (enhanced with AI)
  const teamScore = evaluateTeam(input);
  const marketScore = evaluateMarket(input);
  const tokenomicsScore = evaluateTokenomics(input);
  const tractionScore = evaluateTraction(input);
  const docsScore = evaluateDocs(input);

  // Weighted scoring
  const baseScore = Math.round(
    teamScore * 0.20 +
    marketScore * 0.25 +
    tokenomicsScore * 0.25 +
    tractionScore * 0.20 +
    docsScore * 0.10
  );

  // Adjust score based on AI confidence
  const confidenceMultiplier = aiAnalysis.confidence / 100;
  const totalScore = Math.round(baseScore * (0.7 + confidenceMultiplier * 0.3));

  // Use AI rating if available, otherwise calculate
  let rating: 'High' | 'Normal' | 'Low' = aiAnalysis.rating;
  if (!rating) {
    if (totalScore >= 75) {
      rating = 'High';
    } else if (totalScore >= 50) {
      rating = 'Normal';
    } else {
      rating = 'Low';
    }
  }

  // Use AI-generated summary and recommendations
  const summary = aiAnalysis.summary || generateSummary(input, totalScore, rating);
  const risks = aiAnalysis.risks.length > 0 ? aiAnalysis.risks : generateRisks(input, totalScore);
  const recs = aiAnalysis.recommendations.length > 0 ? aiAnalysis.recommendations : generateRecommendations(input, totalScore);

  logger.info('Pitch analysis complete with AI enhancement', {
    projectId: input.projectId,
    rating,
    score: totalScore,
    aiConfidence: aiAnalysis.confidence
  });

  return {
    rating,
    score: totalScore,
    summary,
    risks,
    recs
  };
}

function evaluateTeam(input: PitchInputType): number {
  // Basic team evaluation based on available data
  let score = 50; // Base score
  
  // Check if project has detailed information
  if (input.summary && input.summary.length > 100) {
    score += 20;
  }
  
  // Check sector relevance
  const highValueSectors = ['DeFi', 'Infrastructure', 'AI'];
  if (highValueSectors.includes(input.sector)) {
    score += 15;
  }
  
  // Check stage maturity
  const matureStages = ['Beta', 'Live', 'Scaling'];
  if (matureStages.includes(input.stage)) {
    score += 15;
  }
  
  return Math.min(100, score);
}

function evaluateMarket(input: PitchInputType): number {
  let score = 50; // Base score
  
  // Sector analysis
  const marketScores: Record<string, number> = {
    'DeFi': 80,
    'Infrastructure': 75,
    'AI': 85,
    'Gaming': 70,
    'Social': 60,
    'NFT': 50,
    'Privacy': 65,
    'Other': 40
  };
  
  score = marketScores[input.sector] || 40;
  
  // Chain analysis
  const chainScores: Record<string, number> = {
    'Ethereum': 80,
    'Solana': 75,
    'Polygon': 70,
    'Arbitrum': 75,
    'Optimism': 70,
    'Base': 65,
    'BSC': 60,
    'Avalanche': 65,
    'Other': 50
  };
  
  const chainBonus = chainScores[input.chain] || 50;
  score = Math.round((score + chainBonus) / 2);
  
  return Math.min(100, score);
}

function evaluateTokenomics(input: PitchInputType): number {
  let score = 50; // Base score
  
  // Check if tokenomics are provided
  if (input.tokenomics.totalSupply > 0) {
    score += 20;
    
    // Evaluate supply size (reasonable range)
    const supply = input.tokenomics.totalSupply;
    if (supply >= 1000000 && supply <= 10000000000) {
      score += 15;
    } else if (supply > 10000000000) {
      score += 5; // Too large supply
    }
  }
  
  // Check TGE percentage
  if (input.tokenomics.tge) {
    const tgePercent = parseFloat(input.tokenomics.tge.replace('%', ''));
    if (tgePercent >= 5 && tgePercent <= 20) {
      score += 15; // Reasonable TGE
    } else if (tgePercent > 20) {
      score -= 10; // Too high TGE
    }
  }
  
  // Check vesting schedule
  if (input.tokenomics.vesting && input.tokenomics.vesting.length > 0) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

function evaluateTraction(input: PitchInputType): number {
  let score = 30; // Base score for early stage
  
  // Stage-based scoring
  const stageScores: Record<string, number> = {
    'Idea': 20,
    'MVP': 40,
    'Beta': 60,
    'Live': 80,
    'Scaling': 90
  };
  
  score = stageScores[input.stage] || 30;
  
  // Summary quality indicates traction
  if (input.summary && input.summary.length > 200) {
    score += 10;
  }
  
  return Math.min(100, score);
}

function evaluateDocs(input: PitchInputType): number {
  let score = 0;
  
  // Check if docs are provided
  if (input.docs && input.docs.length > 0) {
    score += 50;
    
    // Check for important document types
    const docTypes = input.docs.map(doc => doc.name.toLowerCase());
    if (docTypes.some(name => name.includes('whitepaper'))) score += 20;
    if (docTypes.some(name => name.includes('audit'))) score += 20;
    if (docTypes.some(name => name.includes('tokenomics'))) score += 10;
  }
  
  return Math.min(100, score);
}

function generateSummary(input: PitchInputType, score: number, rating: string): string {
  return `${input.title} is a ${input.sector} project on ${input.chain} at ${input.stage} stage. ` +
    `The project shows ${rating.toLowerCase()} potential with a score of ${score}/100. ` +
    `Key strengths include ${input.sector} sector positioning and ${input.stage} development stage.`;
}

function generateRisks(input: PitchInputType, score: number): string[] {
  const risks: string[] = [];
  
  if (score < 50) {
    risks.push('Limited project information provided');
  }
  
  if (input.stage === 'Idea') {
    risks.push('Very early stage with unproven concept');
  }
  
  if (!input.tokenomics.totalSupply || input.tokenomics.totalSupply === 0) {
    risks.push('Tokenomics not clearly defined');
  }
  
  if (!input.docs || input.docs.length === 0) {
    risks.push('No supporting documentation provided');
  }
  
  if (input.sector === 'Other') {
    risks.push('Unclear market positioning');
  }
  
  return risks.length > 0 ? risks : ['Standard market and execution risks'];
}

function generateRecommendations(input: PitchInputType, score: number): string[] {
  const recs: string[] = [];
  
  if (score < 60) {
    recs.push('Provide more detailed project information and documentation');
  }
  
  if (!input.tokenomics.totalSupply || input.tokenomics.totalSupply === 0) {
    recs.push('Define clear tokenomics and token distribution');
  }
  
  if (!input.docs || input.docs.length === 0) {
    recs.push('Create whitepaper and technical documentation');
  }
  
  if (input.stage === 'Idea' || input.stage === 'MVP') {
    recs.push('Develop MVP and gather user feedback');
  }
  
  recs.push('Consider professional audit before launch');
  recs.push('Build strong community and marketing strategy');
  
  return recs;
}
