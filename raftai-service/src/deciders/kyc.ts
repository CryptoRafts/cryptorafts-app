import { KycInputType, DecisionType } from '../schemas.js';
import { logger } from '../utils/logger.js';
import { openaiClient } from '../utils/openai-client.js';

const FACE_MIN_LIVENESS = parseFloat(process.env.FACE_MIN_LIVENESS || '0.75');
const FACE_MIN_MATCH = parseFloat(process.env.FACE_MIN_MATCH || '0.82');

export async function decideKYC(input: KycInputType): Promise<DecisionType> {
  const { livenessScore, faceMatchScore } = input;
  
  logger.info('Processing KYC decision with OpenAI', {
    userId: input.userId,
    livenessScore,
    faceMatchScore
  });

  // Check face verification scores
  const faceOk = (livenessScore ?? 1) >= FACE_MIN_LIVENESS && (faceMatchScore ?? 1) >= FACE_MIN_MATCH;
  
  // Get AI analysis from OpenAI
  const aiAnalysis = await openaiClient.analyzeKYC({
    userId: input.userId,
    livenessScore,
    faceMatchScore,
    documentType: 'identity_verification'
  });
  
  if (!faceOk) {
    const reasons = [];
    if ((livenessScore ?? 1) < FACE_MIN_LIVENESS) {
      reasons.push(`Liveness score too low: ${livenessScore} < ${FACE_MIN_LIVENESS}`);
    }
    if ((faceMatchScore ?? 1) < FACE_MIN_MATCH) {
      reasons.push(`Face match score too low: ${faceMatchScore} < ${FACE_MIN_MATCH}`);
    }
    
    // Add AI findings
    reasons.push(...aiAnalysis.riskFactors);
    
    return {
      status: 'rejected',
      riskScore: calculateRiskScore({ faceOk: false, sanctions: false, adverseMedia: false }),
      reasons: [...reasons, ...aiAnalysis.findings.slice(0, 2)]
    };
  }

  // Use AI analysis for additional insights
  const sanctions = aiAnalysis.riskFactors.some(r => r.toLowerCase().includes('sanction'));
  const adverseMedia = aiAnalysis.riskFactors.some(r => r.toLowerCase().includes('adverse'));

  const riskScore = calculateRiskScore({ faceOk, sanctions, adverseMedia });
  
  if (riskScore >= 70) {
    return {
      status: 'rejected',
      riskScore,
      reasons: [...aiAnalysis.findings, ...aiAnalysis.riskFactors]
    };
  } else if (riskScore >= 40) {
    return {
      status: 'pending',
      riskScore,
      reasons: [...aiAnalysis.findings, 'Manual review recommended']
    };
  } else {
    return {
      status: 'approved',
      riskScore,
      reasons: aiAnalysis.findings
    };
  }
}

function calculateRiskScore(factors: {
  faceOk: boolean;
  sanctions: boolean;
  adverseMedia: boolean;
}): number {
  let score = 10; // Base score
  
  if (!factors.faceOk) {
    score += 50; // Liveness or face match failed
  }
  
  if (factors.sanctions) {
    score += 30; // Sanctions hit
  }
  
  if (factors.adverseMedia) {
    score += 20; // Adverse media hit
  }
  
  return Math.min(100, Math.max(0, score));
}
