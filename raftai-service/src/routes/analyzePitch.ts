import { Router } from 'express';
import { PitchInput, PitchDecision } from '../schemas.js';
import { decidePitch } from '../deciders/pitch.js';
import { updateProjectRaftai } from '../utils/firestore.js';
import { logger } from '../utils/logger.js';
import { IdempotentRequest } from '../mw/idem.js';

const router = Router();

router.post('/', async (req: IdempotentRequest, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const input = PitchInput.parse(req.body);
    
    logger.info('Processing pitch analysis', {
      projectId: input.projectId,
      title: input.title,
      idempotencyKey: req.idempotencyKey
    });

    // Make decision
    const decision = await decidePitch(input);
    
    // Update project with RaftAI analysis
    await updateProjectRaftai({
      projectId: input.projectId,
      raftai: {
        rating: decision.rating,
        score: decision.score,
        summary: decision.summary,
        risks: decision.risks,
        recommendations: decision.recs,
        analyzedAt: Date.now()
      },
      idempotencyKey: req.idempotencyKey,
      requestId: req.headers['x-request-id'] as string
    });

    const processingTime = Date.now() - startTime;
    
    logger.info('Pitch analysis completed', {
      projectId: input.projectId,
      rating: decision.rating,
      score: decision.score,
      processingTimeMs: processingTime
    });

    res.status(200).json(decision);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Invalid pitch input', {
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

    logger.error('Pitch analysis failed', {
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

export { router as analyzePitchRouter };
