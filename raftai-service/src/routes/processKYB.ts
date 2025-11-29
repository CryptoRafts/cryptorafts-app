import { Router } from 'express';
import { KybInput, Decision } from '../schemas.js';
import { logger } from '../utils/logger.js';
import { IdempotentRequest } from '../mw/idem.js';
import { openaiClient } from '../utils/openai-client.js';

const router = Router();

// KYB decision logic with OpenAI integration
async function decideKYB(input: KybInput): Promise<Decision> {
  logger.info('Processing KYB decision with OpenAI', {
    orgId: input.orgId,
    name: input.name,
    jurisdiction: input.jurisdiction
  });

  // Get AI analysis from OpenAI
  const aiAnalysis = await openaiClient.analyzeKYB({
    orgId: input.orgId,
    businessName: input.name,
    registrationNumber: input.registrationNumber,
    jurisdiction: input.jurisdiction
  });

  // Basic validation
  const hasRequiredDocs = input.docs && input.docs.length >= 2;
  const hasRegistration = input.docs?.some(doc => doc.kind === 'registration');
  
  if (!hasRequiredDocs) {
    return {
      status: 'rejected',
      riskScore: 80,
      reasons: ['Insufficient documentation provided', ...aiAnalysis.findings.slice(0, 2)]
    };
  }

  if (!hasRegistration) {
    return {
      status: 'rejected',
      riskScore: 70,
      reasons: ['Registration document required', ...aiAnalysis.findings.slice(0, 2)]
    };
  }

  // Check jurisdiction (basic)
  const restrictedJurisdictions = ['IR', 'KP', 'SY', 'CU'];
  if (restrictedJurisdictions.includes(input.jurisdiction)) {
    return {
      status: 'rejected',
      riskScore: 100,
      reasons: ['Restricted jurisdiction']
    };
  }

  // Use AI analysis for additional insights
  const sanctions = aiAnalysis.riskFactors.some(r => r.toLowerCase().includes('sanction'));
  const adverseMedia = aiAnalysis.riskFactors.some(r => r.toLowerCase().includes('adverse'));

  let riskScore = 20; // Base score for KYB
  if (sanctions) riskScore += 40;
  if (adverseMedia) riskScore += 20;
  if (aiAnalysis.riskFactors.length > 2) riskScore += 15;

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

router.post('/', async (req: IdempotentRequest, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const input = KybInput.parse(req.body);
    
    logger.info('Processing KYB request', {
      orgId: input.orgId,
      idempotencyKey: req.idempotencyKey
    });

    // Make decision
    const decision = await decideKYB(input);
    
    // Apply decision to Firestore and set claims
    const { applyKybDecision } = await import('../utils/firestore.js');
    await applyKybDecision({
      orgId: input.orgId,
      decision,
      vendorRef: input.registrationNumber,
      idempotencyKey: req.idempotencyKey,
      requestId: req.headers['x-request-id'] as string
    });

    const processingTime = Date.now() - startTime;
    
    logger.info('KYB decision completed', {
      orgId: input.orgId,
      status: decision.status,
      riskScore: decision.riskScore,
      processingTimeMs: processingTime
    });

    res.status(200).json(decision);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Invalid KYB input', {
        error: error.message,
        body: req.body,
        processingTimeMs: processingTime
      });
      
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    logger.error('KYB processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

export { router as processKybRouter };
