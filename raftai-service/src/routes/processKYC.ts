import { Router } from 'express';
import { KycInput, Decision } from '../schemas.js';
import { decideKYC } from '../deciders/kyc.js';
import { applyKycDecision } from '../utils/firestore.js';
import { logger } from '../utils/logger.js';
import { IdempotentRequest } from '../mw/idem.js';

const router = Router();

router.post('/', async (req: IdempotentRequest, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const input = KycInput.parse(req.body);
    
    logger.info('Processing KYC request', {
      userId: input.userId,
      idempotencyKey: req.idempotencyKey
    });

    // Make decision
    const decision = await decideKYC(input);
    
    // Apply decision to Firestore and set claims
    await applyKycDecision({
      userId: input.userId,
      decision,
      vendorRef: input.vendorRef,
      idempotencyKey: req.idempotencyKey,
      requestId: req.headers['x-request-id'] as string
    });

    const processingTime = Date.now() - startTime;
    
    logger.info('KYC decision completed', {
      userId: input.userId,
      status: decision.status,
      riskScore: decision.riskScore,
      processingTimeMs: processingTime
    });

    res.status(200).json(decision);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Invalid KYC input', {
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

    logger.error('KYC processing failed', {
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

export { router as processKycRouter };
