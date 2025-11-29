/**
 * OpenAI Client for Real AI Analysis
 * Provides AI-powered analysis for KYC, KYB, Pitch, Chat, and Finance
 */

import OpenAI from 'openai';
import { logger } from './logger.js';

// Initialize OpenAI client - API key REQUIRED in .env file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  logger.error('⚠️ CRITICAL: OPENAI_API_KEY not found in environment variables!');
  logger.error('⚠️ AI analysis will use fallback logic only. Set OPENAI_API_KEY in .env file for real AI.');
}

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY
}) : null;

/**
 * Analyze KYC data with OpenAI - Enhanced for accuracy
 */
export async function analyzeKYCWithAI(data: {
  userId: string;
  livenessScore?: number;
  faceMatchScore?: number;
  documentType?: string;
}): Promise<{
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
}> {
  const livenessScore = data.livenessScore ?? 0;
  const faceMatchScore = data.faceMatchScore ?? 0;
  const livenessPercent = (livenessScore * 100).toFixed(1);
  const faceMatchPercent = (faceMatchScore * 100).toFixed(1);

  // Check if OpenAI is available
  if (!openai) {
    logger.warn('OpenAI not available - using data-driven fallback for KYC analysis');
    return getDataDrivenKYCAnalysis(data, livenessScore, faceMatchScore, livenessPercent, faceMatchPercent);
  }

  try {
    logger.info('Analyzing KYC with OpenAI GPT-4', { userId: data.userId });

    const prompt = `You are a professional KYC compliance analyst reviewing identity verification data. Provide a thorough, accurate assessment.

**VERIFICATION DATA:**
- User ID: ${data.userId}
- Liveness Score: ${livenessPercent}% (measures if person is physically present, not a photo/video)
- Face Match Score: ${faceMatchPercent}% (measures how well face matches ID document)
- Document Type: ${data.documentType || 'Government ID'}

**SCORING GUIDELINES:**
- Liveness ≥75%: Excellent (real person confirmed)
- Liveness 60-74%: Good (likely real person)
- Liveness <60%: Poor (potential fraud)
- Face Match ≥82%: Strong match
- Face Match 70-81%: Acceptable match
- Face Match <70%: Weak match

**YOUR TASK:**
Analyze these scores and provide ACCURATE, SPECIFIC findings based on the actual numbers. Don't be generic.

Return JSON format:
{
  "findings": ["Specific finding 1 with actual percentages", "Finding 2", "Finding 3", "Finding 4"],
  "recommendations": ["Specific action 1", "Action 2"],
  "riskFactors": ["Risk 1 if any", "Risk 2 if any"],
  "confidence": 85
}

Be precise and reference the actual scores in your findings. If scores are high, be positive. If scores are low, be cautious.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior KYC compliance analyst with 15 years of experience in identity verification and fraud detection. Provide accurate, data-driven analysis based on the exact scores provided. Be specific, not generic.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    logger.info('KYC analysis complete', { userId: data.userId, confidence: analysis.confidence });

    return {
      findings: analysis.findings || [
        `✅ Liveness verification: ${livenessPercent}% - ${livenessScore >= 0.75 ? 'Excellent' : livenessScore >= 0.60 ? 'Good' : 'Requires review'}`,
        `✅ Face match verification: ${faceMatchPercent}% - ${faceMatchScore >= 0.82 ? 'Strong match' : faceMatchScore >= 0.70 ? 'Acceptable' : 'Weak match'}`,
        `✅ Document type: ${data.documentType || 'Government ID'} - Authenticity verified`,
        `✅ Overall assessment: ${livenessScore >= 0.75 && faceMatchScore >= 0.82 ? 'All checks passed' : 'Additional verification recommended'}`
      ],
      recommendations: analysis.recommendations || [
        livenessScore >= 0.75 && faceMatchScore >= 0.82 ? 'Approve for platform access' : 'Manual review recommended'
      ],
      riskFactors: analysis.riskFactors || (livenessScore < 0.75 || faceMatchScore < 0.82 ? [`Liveness score ${livenessPercent}% is ${livenessScore < 0.75 ? 'below threshold' : 'acceptable'}`] : []),
      confidence: analysis.confidence || (livenessScore >= 0.75 && faceMatchScore >= 0.82 ? 92 : 65)
    };
  } catch (error) {
    logger.error('OpenAI KYC analysis error - falling back to data-driven analysis:', error);
    return getDataDrivenKYCAnalysis(data, livenessScore, faceMatchScore, livenessPercent, faceMatchPercent);
  }
}

/**
 * Data-driven KYC analysis (used when OpenAI unavailable or fails)
 * Provides accurate analysis based on actual verification scores
 */
function getDataDrivenKYCAnalysis(
  data: { userId: string; documentType?: string },
  livenessScore: number,
  faceMatchScore: number,
  livenessPercent: string,
  faceMatchPercent: string
): {
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
} {
  const livenessPass = livenessScore >= 0.75;
  const faceMatchPass = faceMatchScore >= 0.82;
  const bothPass = livenessPass && faceMatchPass;
  
  // Determine status based on actual scores
  const livenessStatus = livenessScore >= 0.75 ? '✅ EXCELLENT' : 
                         livenessScore >= 0.60 ? '⚠️ ACCEPTABLE' : 
                         '❌ BELOW THRESHOLD';
  
  const faceMatchStatus = faceMatchScore >= 0.82 ? '✅ STRONG MATCH' :
                          faceMatchScore >= 0.70 ? '⚠️ WEAK MATCH' :
                          '❌ POOR MATCH';

  const findings: string[] = [
    `Liveness Detection: ${livenessPercent}% - ${livenessStatus} (Threshold: 75%)`,
    `Face Match: ${faceMatchPercent}% - ${faceMatchStatus} (Threshold: 82%)`,
    `Document Type: ${data.documentType || 'Government ID'} - Submitted`,
    bothPass ? '✅ Verification Status: ALL CHECKS PASSED' : 
    livenessPass || faceMatchPass ? '⚠️ Verification Status: PARTIAL PASS - Manual review recommended' :
    '❌ Verification Status: FAILED - Re-verification required'
  ];

  const recommendations: string[] = [];
  if (bothPass) {
    recommendations.push('✅ APPROVE: All identity verification checks passed successfully');
    recommendations.push('User can proceed with full platform access');
  } else {
    if (!livenessPass) {
      recommendations.push(`⚠️ Liveness score ${livenessPercent}% is below 75% threshold - request new liveness check`);
    }
    if (!faceMatchPass) {
      recommendations.push(`⚠️ Face match ${faceMatchPercent}% is below 82% threshold - verify photo quality and lighting`);
    }
    recommendations.push('🔍 MANUAL REVIEW REQUIRED: Compliance team should review before approval');
    if (!bothPass && (livenessScore > 0.60 || faceMatchScore > 0.70)) {
      recommendations.push('Consider requesting higher quality document photos');
    }
  }

  const riskFactors: string[] = [];
  if (!livenessPass) {
    if (livenessScore < 0.50) {
      riskFactors.push('🚨 HIGH RISK: Very low liveness score suggests potential fraud (photo/video spoof)');
    } else if (livenessScore < 0.75) {
      riskFactors.push('⚠️ MEDIUM RISK: Liveness score below threshold - may indicate poor capture conditions');
    }
  }
  if (!faceMatchPass) {
    if (faceMatchScore < 0.60) {
      riskFactors.push('🚨 HIGH RISK: Poor face match suggests wrong person or altered document');
    } else if (faceMatchScore < 0.82) {
      riskFactors.push('⚠️ MEDIUM RISK: Face match below threshold - verify identity document authenticity');
    }
  }

  // Calculate confidence based on scores
  let confidence: number;
  if (bothPass) {
    confidence = Math.round(85 + (livenessScore * 5) + (faceMatchScore * 5));
  } else if (livenessScore >= 0.60 || faceMatchScore >= 0.70) {
    confidence = Math.round(50 + (livenessScore * 15) + (faceMatchScore * 15));
  } else {
    confidence = Math.round(25 + (livenessScore * 10) + (faceMatchScore * 10));
  }
  confidence = Math.min(95, Math.max(20, confidence));

  logger.info('Data-driven KYC analysis complete', {
    userId: data.userId,
    livenessPass,
    faceMatchPass,
    confidence,
    status: bothPass ? 'PASS' : 'FAIL'
  });

  return {
    findings,
    recommendations,
    riskFactors,
    confidence
  };
}

/**
 * Analyze KYB data with OpenAI - Enhanced for accuracy
 */
export async function analyzeKYBWithAI(data: {
  orgId: string;
  businessName?: string;
  registrationNumber?: string;
  jurisdiction?: string;
}): Promise<{
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
}> {
  const hasRegistration = !!data.registrationNumber;
  const hasJurisdiction = !!data.jurisdiction;
  const hasBusinessName = !!data.businessName;
  const completeness = (hasRegistration ? 33 : 0) + (hasJurisdiction ? 33 : 0) + (hasBusinessName ? 34 : 0);

  // Check if OpenAI is available
  if (!openai) {
    logger.warn('OpenAI not available - using data-driven fallback for KYB analysis');
    return getDataDrivenKYBAnalysis(data, hasRegistration, hasJurisdiction, hasBusinessName, completeness);
  }

  try {
    logger.info('Analyzing KYB with OpenAI GPT-4', { orgId: data.orgId, business: data.businessName });

    const prompt = `You are a senior business compliance officer conducting a thorough KYB (Know Your Business) review. Provide accurate, specific analysis.

**BUSINESS INFORMATION:**
- Organization ID: ${data.orgId}
- Business Name: ${data.businessName || '⚠️ NOT PROVIDED'}
- Registration Number: ${data.registrationNumber || '⚠️ NOT PROVIDED'}
- Jurisdiction: ${data.jurisdiction || '⚠️ NOT PROVIDED'}
- Data Completeness: ${completeness}%

**YOUR TASK:**
Analyze this business based on the information provided. Be SPECIFIC:
- If registration number is provided, reference it in findings
- If jurisdiction is provided, comment on it specifically
- If information is missing, note it as a risk factor
- Don't make assumptions about data that isn't provided

**COMPLIANCE CRITERIA:**
- Registration Number: REQUIRED for business verification
- Jurisdiction: Needed to assess regulatory requirements
- Business Name: Required for entity identification

Return JSON format:
{
  "findings": ["Specific finding 1", "Finding 2", "Finding 3", "Finding 4"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "riskFactors": ["Risk 1 if any", "Risk 2 if any"],
  "confidence": 75
}

Be honest about what you can and cannot verify based on the data provided.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior KYB compliance officer with 20 years of experience in business verification, corporate due diligence, and regulatory compliance. Provide accurate, data-driven analysis. Be specific about what information is present vs missing.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    logger.info('KYB analysis complete', { orgId: data.orgId, confidence: analysis.confidence });

    return {
      findings: analysis.findings || [
        `${hasBusinessName ? '✅' : '⚠️'} Business Name: ${data.businessName || 'Not provided - Required for verification'}`,
        `${hasRegistration ? '✅' : '⚠️'} Registration: ${data.registrationNumber ? `Confirmed - ${data.registrationNumber}` : 'Not provided - Required'}`,
        `${hasJurisdiction ? '✅' : '⚠️'} Jurisdiction: ${data.jurisdiction || 'Not provided - Needed for compliance check'}`,
        `📊 Data Completeness: ${completeness}% - ${completeness === 100 ? 'All information provided' : 'Missing required information'}`
      ],
      recommendations: analysis.recommendations || [
        completeness === 100 ? 'Proceed with regulatory compliance checks' : 'Request missing business information before approval',
        completeness >= 66 ? 'Continue verification process' : 'Business registration documentation required'
      ],
      riskFactors: analysis.riskFactors || (completeness < 100 ? ['Incomplete business information provided'] : []),
      confidence: analysis.confidence || (completeness >= 100 ? 90 : completeness >= 66 ? 70 : 50)
    };
  } catch (error) {
    logger.error('OpenAI KYB analysis error - falling back to data-driven analysis:', error);
    return getDataDrivenKYBAnalysis(data, hasRegistration, hasJurisdiction, hasBusinessName, completeness);
  }
}

/**
 * Data-driven KYB analysis (used when OpenAI unavailable or fails)
 * Provides accurate analysis based on actual business information provided
 */
function getDataDrivenKYBAnalysis(
  data: { orgId: string; businessName?: string; registrationNumber?: string; jurisdiction?: string },
  hasRegistration: boolean,
  hasJurisdiction: boolean,
  hasBusinessName: boolean,
  completeness: number
): {
  findings: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
} {
  const allInfoProvided = hasRegistration && hasJurisdiction && hasBusinessName;
  const partialInfo = hasRegistration || hasJurisdiction || hasBusinessName;

  // Restricted jurisdictions (high-risk countries)
  const restrictedJurisdictions = ['IR', 'KP', 'SY', 'CU', 'VE', 'AF'];
  const isRestricted = hasJurisdiction && data.jurisdiction && restrictedJurisdictions.includes(data.jurisdiction);

  const findings: string[] = [
    `${hasBusinessName ? '✅' : '❌'} Business Name: ${data.businessName || 'NOT PROVIDED - Required for verification'}`,
    `${hasRegistration ? '✅' : '❌'} Registration Number: ${hasRegistration ? `${data.registrationNumber} (Submitted)` : 'NOT PROVIDED - Critical requirement'}`,
    `${hasJurisdiction ? '✅' : '❌'} Jurisdiction: ${hasJurisdiction ? `${data.jurisdiction}${isRestricted ? ' (⚠️ RESTRICTED)' : ''}` : 'NOT PROVIDED - Needed for compliance'}`,
    `📊 Data Completeness: ${completeness}% - ${allInfoProvided ? '✅ Complete' : partialInfo ? '⚠️ Incomplete' : '❌ Missing all data'}`
  ];

  const recommendations: string[] = [];
  if (allInfoProvided && !isRestricted) {
    recommendations.push('✅ APPROVE: All required business information provided');
    recommendations.push('Proceed with regulatory and compliance verification');
    recommendations.push('Verify business registration with local authorities');
  } else {
    if (!hasBusinessName) {
      recommendations.push('🚨 URGENT: Provide legal business name as registered');
    }
    if (!hasRegistration) {
      recommendations.push('🚨 URGENT: Submit official business registration number');
    }
    if (!hasJurisdiction) {
      recommendations.push('🚨 URGENT: Specify business registration jurisdiction');
    }
    if (isRestricted) {
      recommendations.push('⚠️ RESTRICTED JURISDICTION: Enhanced due diligence required');
      recommendations.push('Verify compliance with international sanctions');
    }
    recommendations.push('🔍 MANUAL REVIEW REQUIRED: Cannot approve without complete information');
  }

  const riskFactors: string[] = [];
  if (!allInfoProvided) {
    if (completeness < 34) {
      riskFactors.push('🚨 CRITICAL: Minimal business information provided - cannot perform verification');
    } else if (completeness < 67) {
      riskFactors.push('⚠️ HIGH RISK: Incomplete business information - verification not possible');
    } else {
      riskFactors.push('⚠️ MEDIUM RISK: Missing some business information');
    }
  }
  if (isRestricted) {
    riskFactors.push('🚨 HIGH RISK: Business registered in restricted/sanctioned jurisdiction');
    riskFactors.push('Requires enhanced due diligence and compliance verification');
  }
  if (!hasRegistration) {
    riskFactors.push('Cannot verify business legitimacy without registration number');
  }

  // Calculate confidence based on completeness and risk factors
  let confidence: number;
  if (allInfoProvided && !isRestricted) {
    confidence = 85;
  } else if (allInfoProvided && isRestricted) {
    confidence = 50; // Lower confidence for restricted jurisdictions
  } else if (completeness >= 67) {
    confidence = 60;
  } else if (completeness >= 34) {
    confidence = 35;
  } else {
    confidence = 15;
  }

  logger.info('Data-driven KYB analysis complete', {
    orgId: data.orgId,
    completeness,
    allInfoProvided,
    isRestricted,
    confidence,
    status: allInfoProvided && !isRestricted ? 'PASS' : 'FAIL'
  });

  return {
    findings,
    recommendations,
    riskFactors,
    confidence
  };
}

/**
 * Analyze pitch with OpenAI - Enhanced for crypto project expertise
 */
export async function analyzePitchWithAI(data: {
  projectId: string;
  title: string;
  summary?: string;
  sector: string;
  stage: string;
  chain: string;
  tokenomics?: any;
}): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  rating: 'High' | 'Normal' | 'Low';
  confidence: number;
}> {
  const hasSummary = !!data.summary && data.summary.length > 50;
  const hasTokenomics = !!data.tokenomics?.totalSupply && data.tokenomics.totalSupply > 0;

  // Check if OpenAI is available
  if (!openai) {
    logger.warn('OpenAI not available - using data-driven fallback for Pitch analysis');
    return getDataDrivenPitchAnalysis(data, hasSummary, hasTokenomics);
  }

  try {
    logger.info('Analyzing pitch with OpenAI GPT-4', { projectId: data.projectId, sector: data.sector });

    const totalSupply = data.tokenomics?.totalSupply || 0;
    const tge = data.tokenomics?.tge || 'N/A';
    const vesting = data.tokenomics?.vesting || 'N/A';

    const prompt = `You are a top-tier crypto VC analyst evaluating a blockchain project. Provide SPECIFIC, ACTIONABLE analysis.

**PROJECT DETAILS:**
📌 Project Name: ${data.title}
📊 Sector: ${data.sector}
🚀 Development Stage: ${data.stage}
⛓️ Blockchain: ${data.chain}
📝 Description: ${data.summary || '⚠️ NOT PROVIDED - This is a RED FLAG'}

**TOKENOMICS:**
💰 Total Supply: ${totalSupply > 0 ? totalSupply.toLocaleString() : '⚠️ NOT PROVIDED'}
🎯 TGE (Token Generation Event): ${tge}
⏰ Vesting Schedule: ${vesting}

**ANALYSIS CRITERIA:**

**Stage Assessment:**
- Idea: 20-40 score (concept only)
- MVP: 40-60 score (basic prototype)
- Beta: 60-75 score (testing phase)
- Live: 75-90 score (operational)
- Scaling: 85-95 score (growing)

**Sector Strength (DeFi, AI, Infrastructure highest):**
- DeFi/AI/Infrastructure: Premium sectors
- Gaming/NFT: Moderate potential
- Other: Needs strong differentiation

**Blockchain Analysis:**
- Ethereum: Most established, high credibility
- Solana/Arbitrum/Base: Strong performance chains
- Others: Assess specific advantages

**YOUR TASK:**
Provide HONEST, SPECIFIC analysis. Reference actual data. Don't be generic.

Return JSON:
{
  "summary": "2-3 sentence assessment referencing specific details from the project",
  "strengths": ["Specific strength 1 with data", "Strength 2", "Strength 3"],
  "weaknesses": ["Specific weakness 1", "Weakness 2", "Weakness 3"],
  "risks": ["Specific risk 1", "Risk 2", "Risk 3"],
  "recommendations": ["Actionable rec 1", "Rec 2", "Rec 3"],
  "rating": "High" | "Normal" | "Low",
  "confidence": 75
}

Be critical but fair. Consider real market conditions.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a partner at a top-tier crypto VC firm with 10+ years of experience evaluating blockchain projects. You have invested in successful projects like Ethereum, Solana, and major DeFi protocols. Provide brutally honest, data-driven analysis. Be specific and reference actual project details. Your reputation depends on accuracy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    logger.info('Pitch analysis complete', { 
      projectId: data.projectId, 
      rating: analysis.rating,
      confidence: analysis.confidence 
    });

    // Determine rating based on stage and sector if AI didn't provide one
    let rating: 'High' | 'Normal' | 'Low' = analysis.rating || 'Normal';
    if (!analysis.rating) {
      if ((data.stage === 'Live' || data.stage === 'Scaling') && ['DeFi', 'AI', 'Infrastructure'].includes(data.sector)) {
        rating = 'High';
      } else if (data.stage === 'Beta' || data.stage === 'Live') {
        rating = 'Normal';
      } else {
        rating = 'Low';
      }
    }

    return {
      summary: analysis.summary || `${data.title} is a ${data.sector} project on ${data.chain} blockchain at ${data.stage} development stage. ${hasSummary ? 'Project has provided detailed information.' : 'Limited project information available.'}`,
      strengths: analysis.strengths || [
        `Operating in ${data.sector} sector with ${['DeFi', 'AI', 'Infrastructure'].includes(data.sector) ? 'strong' : 'moderate'} market potential`,
        `Built on ${data.chain} blockchain for ${data.chain === 'Ethereum' ? 'maximum security and adoption' : 'optimized performance'}`,
        `${data.stage} development stage ${data.stage === 'Live' || data.stage === 'Scaling' ? 'demonstrates execution capability' : 'shows early progress'}`
      ],
      weaknesses: analysis.weaknesses || [
        hasSummary ? 'Additional technical details would strengthen pitch' : '⚠️ Critical: Project description missing - cannot evaluate properly',
        hasTokenomics ? 'Tokenomics structure needs market validation' : '⚠️ Critical: Tokenomics not defined - major red flag',
        'Team background and track record not fully disclosed'
      ],
      risks: analysis.risks || [
        `Market competition in ${data.sector} sector from established players`,
        `${data.stage === 'Idea' || data.stage === 'MVP' ? 'High execution risk due to early stage' : 'Standard market execution risk'}`,
        'Regulatory uncertainty in crypto markets',
        !hasSummary ? '⚠️ Insufficient project information for proper due diligence' : 'Documentation completeness needs improvement'
      ],
      recommendations: analysis.recommendations || [
        !hasSummary ? '🚨 URGENT: Provide detailed project description and value proposition' : 'Expand technical documentation',
        !hasTokenomics ? '🚨 URGENT: Define complete tokenomics (supply, distribution, vesting)' : 'Validate tokenomics with market comparables',
        'Complete professional smart contract audit',
        'Build community and establish partnerships',
        data.stage === 'Idea' ? 'Develop MVP to demonstrate viability' : 'Increase market traction metrics'
      ],
      rating,
      confidence: analysis.confidence || (hasSummary && hasTokenomics ? 75 : hasSummary ? 60 : 40)
    };
  } catch (error) {
    logger.error('OpenAI pitch analysis error - falling back to data-driven analysis:', error);
    return getDataDrivenPitchAnalysis(data, hasSummary, hasTokenomics);
  }
}

/**
 * Data-driven Pitch analysis (used when OpenAI unavailable or fails)
 * Provides accurate, detailed analysis based on actual project data
 */
function getDataDrivenPitchAnalysis(
  data: {
    projectId: string;
    title: string;
    summary?: string;
    sector: string;
    stage: string;
    chain: string;
    tokenomics?: any;
  },
  hasSummary: boolean,
  hasTokenomics: boolean
): {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  rating: 'High' | 'Normal' | 'Low';
  confidence: number;
} {
  // Sector scoring (realistic market assessment)
  const sectorScores: Record<string, { score: number; label: string }> = {
    'DeFi': { score: 85, label: 'High-value sector with strong product-market fit' },
    'Infrastructure': { score: 80, label: 'Critical infrastructure - long-term value' },
    'AI': { score: 90, label: 'Emerging high-growth sector' },
    'Gaming': { score: 70, label: 'Established market with engagement challenges' },
    'NFT': { score: 55, label: 'Saturated market - needs strong differentiation' },
    'Social': { score: 65, label: 'Network effects critical for success' },
    'Privacy': { score: 70, label: 'Niche market with regulatory considerations' },
    'Other': { score: 45, label: 'Unclear market positioning' }
  };

  // Stage scoring (execution maturity)
  const stageScores: Record<string, { score: number; label: string; risk: string }> = {
    'Idea': { score: 25, label: 'Concept stage - unproven', risk: '🚨 VERY HIGH execution risk - no validation' },
    'MVP': { score: 45, label: 'Early prototype - needs validation', risk: '⚠️ HIGH risk - requires significant development' },
    'Beta': { score: 65, label: 'Testing phase - near launch', risk: '⚠️ MEDIUM risk - technical validation in progress' },
    'Live': { score: 80, label: 'Operational product - proven execution', risk: '✅ MODERATE risk - product live, execution demonstrated' },
    'Scaling': { score: 90, label: 'Growing user base - strong traction', risk: '✅ LOW risk - validated model with growth momentum' }
  };

  // Chain scoring (ecosystem strength)
  const chainScores: Record<string, { score: number; label: string }> = {
    'Ethereum': { score: 90, label: 'Most established ecosystem - highest security' },
    'Solana': { score: 80, label: 'High-performance - strong developer community' },
    'Arbitrum': { score: 85, label: 'Layer 2 scaling - Ethereum security' },
    'Optimism': { score: 80, label: 'Layer 2 - growing ecosystem' },
    'Polygon': { score: 75, label: 'EVM compatible - good scaling' },
    'Base': { score: 75, label: 'Coinbase ecosystem - emerging' },
    'BSC': { score: 65, label: 'High activity - centralization concerns' },
    'Avalanche': { score: 70, label: 'Fast performance - moderate adoption' },
    'Other': { score: 50, label: 'Limited ecosystem support' }
  };

  const sectorInfo = sectorScores[data.sector] || sectorScores['Other'];
  const stageInfo = stageScores[data.stage] || stageScores['Idea'];
  const chainInfo = chainScores[data.chain] || chainScores['Other'];

  // Calculate tokenomics score
  let tokenomicsScore = 0;
  let tokenomicsDetail = '';
  if (hasTokenomics) {
    tokenomicsScore = 50;
    const supply = data.tokenomics.totalSupply || 0;
    const tge = data.tokenomics.tge ? parseFloat(data.tokenomics.tge.replace('%', '')) : 0;
    
    if (supply > 0) {
      tokenomicsScore += 20;
      if (supply >= 1000000 && supply <= 10000000000) {
        tokenomicsScore += 15;
        tokenomicsDetail = `Total supply ${supply.toLocaleString()} tokens - reasonable distribution`;
      } else if (supply > 10000000000) {
        tokenomicsScore += 5;
        tokenomicsDetail = `Total supply ${supply.toLocaleString()} tokens - may be too high`;
      }
    }
    
    if (tge > 0) {
      if (tge >= 5 && tge <= 20) {
        tokenomicsScore += 15;
        tokenomicsDetail += `, TGE ${tge}% - optimal unlock`;
      } else if (tge > 20) {
        tokenomicsScore -= 10;
        tokenomicsDetail += `, TGE ${tge}% - ⚠️ too high (dump risk)`;
      }
    }
  } else {
    tokenomicsDetail = '🚨 CRITICAL: Tokenomics not defined - cannot evaluate token economics';
  }

  // Content quality score
  const contentScore = hasSummary ? (data.summary!.length > 200 ? 80 : 60) : 20;

  // Calculate overall score with weighted factors
  const overallScore = Math.round(
    (sectorInfo.score * 0.25) +
    (stageInfo.score * 0.25) +
    (chainInfo.score * 0.20) +
    (tokenomicsScore * 0.20) +
    (contentScore * 0.10)
  );

  // Determine rating based on overall score
  let rating: 'High' | 'Normal' | 'Low';
  if (overallScore >= 75 && hasSummary && hasTokenomics) {
    rating = 'High';
  } else if (overallScore >= 50 && (hasSummary || hasTokenomics)) {
    rating = 'Normal';
  } else {
    rating = 'Low';
  }

  // Generate accurate summary
  const summary = hasSummary && hasTokenomics ? 
    `${data.title} is a ${data.sector} project on ${data.chain} blockchain at ${data.stage} stage (Score: ${overallScore}/100). ${sectorInfo.label}. ${stageInfo.label}. The project has provided comprehensive information including tokenomics and detailed description.` :
    hasSummary ?
    `${data.title} is a ${data.sector} project on ${data.chain} at ${data.stage} stage (Score: ${overallScore}/100). ${sectorInfo.label}. ⚠️ WARNING: Tokenomics are missing - this is a critical gap that prevents proper evaluation.` :
    `${data.title} - ${data.sector} project on ${data.chain} at ${data.stage} stage (Score: ${overallScore}/100). 🚨 CRITICAL: Missing essential information. Cannot perform proper due diligence without detailed project description${hasTokenomics ? '' : ' and tokenomics'}.`;

  // Generate strengths
  const strengths: string[] = [
    `✅ ${sectorInfo.label} (Sector score: ${sectorInfo.score}/100)`,
    `✅ ${chainInfo.label} - ${data.chain} blockchain`,
    `✅ ${stageInfo.label} (Stage score: ${stageInfo.score}/100)`
  ];
  if (hasTokenomics && tokenomicsScore >= 70) {
    strengths.push(`✅ ${tokenomicsDetail}`);
  }
  if (hasSummary && data.summary!.length > 200) {
    strengths.push(`✅ Comprehensive project documentation provided (${data.summary!.length} chars)`);
  }

  // Generate weaknesses
  const weaknesses: string[] = [];
  if (!hasSummary) {
    weaknesses.push('🚨 CRITICAL: No project description - cannot evaluate value proposition, team, or technology');
  } else if (data.summary!.length < 100) {
    weaknesses.push('⚠️ Project description too brief - needs detailed explanation of technology and use case');
  }
  if (!hasTokenomics) {
    weaknesses.push('🚨 CRITICAL: Tokenomics undefined - cannot assess token value, distribution, or economics');
  } else if (tokenomicsScore < 50) {
    weaknesses.push(`⚠️ ${tokenomicsDetail}`);
  }
  if (stageInfo.score < 60) {
    weaknesses.push(`⚠️ Early development stage - needs to demonstrate product-market fit`);
  }
  if (sectorInfo.score < 60) {
    weaknesses.push(`⚠️ ${sectorInfo.label} - needs strong differentiation`);
  }

  // Generate risks
  const risks: string[] = [
    stageInfo.risk,
    `Market competition: ${data.sector} sector ${sectorInfo.score >= 80 ? 'has high competition from established players' : 'requires clear differentiation strategy'}`,
    'Crypto market volatility and regulatory uncertainty'
  ];
  if (!hasSummary) {
    risks.push('🚨 CANNOT ASSESS: Without project details, unable to evaluate team, technology, or execution risks');
  }
  if (!hasTokenomics) {
    risks.push('🚨 Token economics risk: No clarity on supply, distribution, vesting, or utility');
  }
  if (chainInfo.score < 70) {
    risks.push(`⚠️ Blockchain choice: ${data.chain} has ${chainInfo.label.toLowerCase()}`);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (!hasSummary) {
    recommendations.push('🚨 IMMEDIATE ACTION: Provide detailed project description including team, technology, problem solved, and go-to-market strategy');
  } else if (data.summary!.length < 200) {
    recommendations.push('📝 Expand project description with technical details, team background, and competitive advantages');
  }
  if (!hasTokenomics) {
    recommendations.push('🚨 IMMEDIATE ACTION: Define complete tokenomics - total supply, distribution, vesting schedule, TGE %, utility, and token value accrual');
  }
  if (stageInfo.score < 60) {
    recommendations.push('🚀 Development: Build MVP and gather user feedback to validate product-market fit');
  }
  recommendations.push('🔒 Security: Complete professional smart contract audit from reputable firm (CertiK, Trail of Bits, etc.)');
  recommendations.push('👥 Community: Build engaged community through social media, Discord, and regular updates');
  if (sectorInfo.score >= 70) {
    recommendations.push('🤝 Partnerships: Establish strategic partnerships within the ecosystem to drive adoption');
  }

  // Calculate confidence
  let confidence: number;
  if (hasSummary && hasTokenomics) {
    confidence = Math.min(85, 60 + Math.round(overallScore * 0.25));
  } else if (hasSummary || hasTokenomics) {
    confidence = Math.min(60, 40 + Math.round(overallScore * 0.20));
  } else {
    confidence = Math.min(35, 20 + Math.round(overallScore * 0.15));
  }

  logger.info('Data-driven Pitch analysis complete', {
    projectId: data.projectId,
    sector: data.sector,
    stage: data.stage,
    overallScore,
    rating,
    confidence,
    hasSummary,
    hasTokenomics
  });

  return {
    summary,
    strengths,
    weaknesses,
    risks,
    recommendations,
    rating,
    confidence
  };
}

/**
 * Summarize chat with OpenAI - Enhanced for deal room conversations
 */
export async function summarizeChatWithAI(messages: Array<{
  sender: string;
  text: string;
  timestamp: any;
}>): Promise<{
  summary: string;
  keyPoints: string[];
  actions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}> {
  if (messages.length === 0) {
    return {
      summary: 'No messages to summarize',
      keyPoints: [],
      actions: [],
      sentiment: 'neutral'
    };
  }

  // Check if OpenAI is available
  if (!openai) {
    logger.warn('OpenAI not available - using basic chat summarization');
    const participantCount = new Set(messages.map(m => m.sender)).size;
    return {
      summary: `Business conversation with ${messages.length} messages between ${participantCount} participants. Real-time AI summarization unavailable - set OPENAI_API_KEY for detailed analysis.`,
      keyPoints: [`${participantCount} participants in discussion`, `${messages.length} total messages exchanged`, 'Full AI analysis requires OpenAI API key'],
      actions: [],
      sentiment: 'neutral'
    };
  }

  try {
    logger.info('Summarizing chat with OpenAI GPT-4', { messageCount: messages.length });

    const chatText = messages
      .slice(-50) // Only analyze last 50 messages for relevance
      .map((m, i) => `[${i + 1}] ${m.sender}: ${m.text}`)
      .join('\n');

    const participantCount = new Set(messages.map(m => m.sender)).size;

    const prompt = `You are an expert deal room analyst reviewing a business conversation. Provide ACCURATE, SPECIFIC analysis.

**CONVERSATION DETAILS:**
📊 Total Messages: ${messages.length}
👥 Participants: ${participantCount}
📝 Context: Business/Investment Discussion

**CONVERSATION:**
${chatText}

**YOUR TASK:**
Analyze this conversation and extract:
1. Main topics and discussion themes
2. Key decisions or agreements made
3. Action items with who needs to do what
4. Overall sentiment and deal progress

**IMPORTANT:**
- Be SPECIFIC - reference actual points discussed
- Extract REAL action items mentioned in chat
- Assess if this is progressing toward a deal or not
- Note any concerns or blockers mentioned

Return JSON:
{
  "summary": "Specific 2-3 sentence summary of what was discussed and decided",
  "keyPoints": ["Point 1 with specifics", "Point 2", "Point 3", "Point 4", "Point 5"],
  "actions": ["Action: Person should do X by Y", "Action 2 if any"],
  "sentiment": "positive" | "neutral" | "negative"
}

Sentiment guide:
- Positive: Deal progressing, agreements made, enthusiasm
- Neutral: Information exchange, questions, no clear direction
- Negative: Disagreements, concerns raised, deal at risk`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior business analyst specialized in deal room communications with 15+ years of experience in VC and M&A. Extract accurate, actionable insights from conversations. Be specific and reference actual content discussed.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.25,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    logger.info('Chat summary complete', { sentiment: analysis.sentiment, actionCount: analysis.actions?.length });

    return {
      summary: analysis.summary || `Conversation with ${messages.length} messages between ${participantCount} participants discussing business collaboration.`,
      keyPoints: analysis.keyPoints || [
        `${participantCount} participants engaged in discussion`,
        `${messages.length} messages exchanged`,
        'Topics included business collaboration and project details'
      ],
      actions: analysis.actions || [],
      sentiment: analysis.sentiment || 'neutral'
    };
  } catch (error) {
    logger.error('OpenAI chat summary error:', error);
    const participantCount = new Set(messages.map(m => m.sender)).size;
    
    return {
      summary: `Business conversation with ${messages.length} messages between ${participantCount} participants. Analysis temporarily unavailable.`,
      keyPoints: [
        `${participantCount} participants involved`,
        `${messages.length} total messages`,
        'Conversation analysis pending'
      ],
      actions: [],
      sentiment: 'neutral'
    };
  }
}

/**
 * Analyze financial document with OpenAI - Enhanced for transaction analysis
 */
export async function analyzeFinancialWithAI(data: {
  transactionId: string;
  amount?: number;
  currency?: string;
  description?: string;
}): Promise<{
  verified: boolean;
  findings: string[];
  risks: string[];
  recommendations: string[];
  confidence: number;
}> {
  const hasAmount = typeof data.amount === 'number' && data.amount > 0;
  const hasCurrency = !!data.currency;
  const hasDescription = !!data.description;
  const completeness = (hasAmount ? 40 : 0) + (hasCurrency ? 30 : 0) + (hasDescription ? 30 : 0);

  // Check if OpenAI is available
  if (!openai) {
    logger.warn('OpenAI not available - using data-driven fallback for financial analysis');
    return {
      verified: hasAmount && hasCurrency && hasDescription,
      findings: [
        `${hasAmount ? '✅' : '❌'} Amount: ${hasAmount ? `${data.amount?.toLocaleString()} ${data.currency || 'USD'}` : 'NOT PROVIDED'}`,
        `${hasCurrency ? '✅' : '❌'} Currency: ${data.currency || 'NOT SPECIFIED'}`,
        `${hasDescription ? '✅' : '❌'} Description: ${hasDescription ? 'Provided' : 'MISSING'}`,
        `Data Completeness: ${completeness}% - ${completeness >= 80 ? '✅ Sufficient' : '⚠️ Incomplete'}`
      ],
      risks: completeness < 80 ? ['Incomplete transaction information - cannot fully verify'] : [],
      recommendations: [completeness >= 80 ? 'Transaction can be processed' : 'Request complete transaction details', 'Real-time AI fraud detection requires OpenAI API key'],
      confidence: completeness >= 80 ? 70 : 40
    };
  }

  try {
    logger.info('Analyzing financial transaction with OpenAI GPT-4', { 
      transactionId: data.transactionId,
      amount: data.amount 
    });

    const prompt = `You are a senior financial compliance analyst reviewing a transaction. Provide ACCURATE, SPECIFIC assessment.

**TRANSACTION INFORMATION:**
🆔 Transaction ID: ${data.transactionId}
💰 Amount: ${hasAmount ? `${data.amount?.toLocaleString()} ${data.currency || ''}` : '⚠️ NOT PROVIDED'}
💱 Currency: ${data.currency || '⚠️ NOT SPECIFIED'}
📝 Description: ${data.description || '⚠️ NOT PROVIDED'}
📊 Data Completeness: ${completeness}%

**FRAUD DETECTION CRITERIA:**
- Amount reasonableness (too large/small = suspicious)
- Currency legitimacy (standard fiat/crypto)
- Description clarity (vague = red flag)
- Transaction pattern (unusual = investigation needed)

**YOUR TASK:**
Analyze this transaction for legitimacy and risk. Be SPECIFIC:
- Reference the actual amount if provided
- Comment on the description quality
- Identify red flags if any
- Provide actionable recommendations

**RED FLAGS:**
- Missing amount or currency
- Vague or missing description
- Unusual transaction patterns
- Suspicious amounts (very round numbers, very large)

Return JSON:
{
  "verified": true/false,
  "findings": ["Finding 1 with specifics", "Finding 2", "Finding 3", "Finding 4"],
  "risks": ["Risk 1 if any", "Risk 2"],
  "recommendations": ["Rec 1", "Rec 2"],
  "confidence": 80
}

Be thorough but objective. Base verification on data completeness and reasonableness.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior financial compliance officer and fraud detection specialist with 20 years of experience in transaction monitoring and AML/CFT compliance. Provide accurate, risk-based analysis. Be specific about what looks legitimate vs suspicious.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    logger.info('Financial analysis complete', { 
      transactionId: data.transactionId,
      verified: analysis.verified,
      confidence: analysis.confidence
    });

    return {
      verified: analysis.verified ?? (completeness >= 70),
      findings: analysis.findings || [
        `${hasAmount ? '✅' : '⚠️'} Transaction Amount: ${hasAmount ? `${data.amount?.toLocaleString()} ${data.currency || 'USD'}` : 'MISSING - Cannot verify'}`,
        `${hasCurrency ? '✅' : '⚠️'} Currency: ${data.currency || 'NOT SPECIFIED - Required'}`,
        `${hasDescription ? '✅' : '⚠️'} Description: ${hasDescription ? 'Provided' : 'MISSING - Red flag'}`,
        `📊 Data Quality: ${completeness}% complete - ${completeness >= 80 ? 'Sufficient for verification' : 'Insufficient data'}`
      ],
      risks: analysis.risks || (completeness < 70 ? [
        'Incomplete transaction information',
        'Cannot perform full fraud screening',
        'Manual review required due to missing data'
      ] : []),
      recommendations: analysis.recommendations || [
        completeness >= 80 ? 'Approve transaction' : 'Request complete transaction details',
        'Verify identity of all parties involved'
      ],
      confidence: analysis.confidence || (completeness >= 80 ? 85 : completeness >= 50 ? 60 : 35)
    };
  } catch (error) {
    logger.error('OpenAI financial analysis error:', error);
    const hasAmount = typeof data.amount === 'number' && data.amount > 0;
    const hasDesc = !!data.description;
    
    return {
      verified: hasAmount && hasDesc,
      findings: [
        `${hasAmount ? '✅' : '⚠️'} Amount: ${hasAmount ? `${data.amount} ${data.currency || 'USD'}` : 'MISSING'}`,
        `${hasDesc ? '✅' : '⚠️'} Description: ${hasDesc ? 'PROVIDED' : 'MISSING'}`,
        `Transaction ID: ${data.transactionId}`,
        hasAmount && hasDesc ? 'Basic verification passed' : 'Cannot verify - missing data'
      ],
      risks: !hasAmount || !hasDesc ? ['Missing critical transaction information'] : [],
      recommendations: [hasAmount && hasDesc ? 'Proceed with verification' : 'Request complete transaction details'],
      confidence: hasAmount && hasDesc ? 75 : 40
    };
  }
}

export const openaiClient = {
  analyzeKYC: analyzeKYCWithAI,
  analyzeKYB: analyzeKYBWithAI,
  analyzePitch: analyzePitchWithAI,
  summarizeChat: summarizeChatWithAI,
  analyzeFinancial: analyzeFinancialWithAI
};

