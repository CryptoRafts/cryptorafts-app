import { Router } from 'express';
import { IdoInput, IdoOutput } from '../schemas.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const input = IdoInput.parse(req.body);
    
    logger.info('Processing IDO intake check', {
      projectId: input.projectId,
      tokenSymbol: input.token.symbol,
      jurisdiction: input.jurisdiction
    });

    const issues: string[] = [];
    let riskScore = 0;

    // Check jurisdiction
    const restrictedJurisdictions = ['IR', 'KP', 'SY', 'CU'];
    if (restrictedJurisdictions.includes(input.jurisdiction)) {
      issues.push('Restricted jurisdiction');
      riskScore += 50;
    }

    // Check token economics
    if (input.token.supply <= 0) {
      issues.push('Invalid token supply');
      riskScore += 20;
    }

    if (input.token.salePrice <= 0) {
      issues.push('Invalid sale price');
      riskScore += 20;
    }

    if (input.token.hardCap <= 0) {
      issues.push('Invalid hard cap');
      riskScore += 20;
    }

    // Check for reasonable tokenomics
    const marketCap = input.token.supply * input.token.salePrice;
    if (marketCap > input.token.hardCap * 10) {
      issues.push('Token supply too high relative to hard cap');
      riskScore += 15;
    }

    // Check whitelist requirement
    if (!input.token.whitelist) {
      issues.push('Whitelist not implemented');
      riskScore += 10;
    }

    // Check jurisdiction-specific requirements
    if (input.jurisdiction === 'US') {
      issues.push('US jurisdiction requires additional compliance');
      riskScore += 25;
    }

    if (input.jurisdiction === 'EU') {
      issues.push('EU jurisdiction requires GDPR compliance');
      riskScore += 15;
    }

    // Check for common red flags
    if (input.token.symbol.length < 2 || input.token.symbol.length > 10) {
      issues.push('Invalid token symbol format');
      riskScore += 5;
    }

    const result: IdoOutput = {
      ok: true,
      issues,
      riskScore: Math.min(100, riskScore)
    };

    const processingTime = Date.now() - startTime;
    
    logger.info('IDO intake check completed', {
      projectId: input.projectId,
      issuesCount: issues.length,
      riskScore,
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

    logger.error('IDO intake check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

export { router as idoRouter };
