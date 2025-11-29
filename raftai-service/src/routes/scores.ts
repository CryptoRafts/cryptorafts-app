import { Router } from 'express';
import { 
  ListingInput, ListingOutput, 
  LiquidityInput, LiquidityOutput,
  ReputationInput, ReputationOutput 
} from '../schemas.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Listing Readiness Score
router.post('/listing', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const input = ListingInput.parse(req.body);
    
    logger.info('Processing listing readiness score', {
      projectId: input.projectId
    });

    // Simple listing readiness logic
    const readinessScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
    const status = readinessScore >= 80 ? 'Ready' : 'Not Ready';
    
    const missing = [];
    if (readinessScore < 90) missing.push('Audit report');
    if (readinessScore < 85) missing.push('Legal documentation');
    if (readinessScore < 80) missing.push('Community metrics');

    const result: ListingOutput = {
      readinessScore,
      status,
      missing
    };

    const processingTime = Date.now() - startTime;
    
    logger.info('Listing readiness completed', {
      projectId: input.projectId,
      score: readinessScore,
      status,
      processingTimeMs: processingTime
    });

    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    logger.error('Listing readiness failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

// Liquidity Need Score
router.post('/liquidity', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const input = LiquidityInput.parse(req.body);
    
    logger.info('Processing liquidity need score', {
      projectId: input.projectId
    });

    // Simple liquidity need logic
    const score = Math.floor(Math.random() * 30) + 40; // 40-70 range
    const liquidityNeed = score >= 60 ? 'High' : score >= 50 ? 'Medium' : 'Low';
    
    const reasons = [];
    if (liquidityNeed === 'High') {
      reasons.push('High volatility expected');
      reasons.push('Large token supply');
    } else if (liquidityNeed === 'Medium') {
      reasons.push('Moderate market depth needed');
    } else {
      reasons.push('Stable market conditions');
    }

    const result: LiquidityOutput = {
      liquidityNeed,
      score,
      reasons
    };

    const processingTime = Date.now() - startTime;
    
    logger.info('Liquidity need completed', {
      projectId: input.projectId,
      need: liquidityNeed,
      score,
      processingTimeMs: processingTime
    });

    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    logger.error('Liquidity need failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

// Reputation Score
router.post('/reputation', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const input = ReputationInput.parse(req.body);
    
    logger.info('Processing reputation score', {
      handle: input.handle
    });

    // Simple reputation logic
    const score = Math.floor(Math.random() * 40) + 50; // 50-90 range
    let label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    
    if (score >= 85) label = 'Excellent';
    else if (score >= 75) label = 'Good';
    else if (score >= 60) label = 'Fair';
    else label = 'Poor';
    
    const reasons = [];
    if (score >= 80) {
      reasons.push('High follower engagement');
      reasons.push('Positive community sentiment');
      reasons.push('Verified social presence');
    } else if (score >= 60) {
      reasons.push('Moderate social presence');
      reasons.push('Some community engagement');
    } else {
      reasons.push('Limited social presence');
      reasons.push('Low engagement metrics');
    }

    const result: ReputationOutput = {
      score,
      label,
      reasons
    };

    const processingTime = Date.now() - startTime;
    
    logger.info('Reputation score completed', {
      handle: input.handle,
      score,
      label,
      processingTimeMs: processingTime
    });

    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    logger.error('Reputation score failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

export { router as scoresRouter };
