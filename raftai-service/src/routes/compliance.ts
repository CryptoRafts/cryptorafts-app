import { Router } from 'express';
import { ComplianceInput, ComplianceOutput } from '../schemas.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const input = ComplianceInput.parse(req.body);
    
    logger.info('Processing compliance check', {
      textLength: input.text.length
    });

    // Simple compliance checking logic
    const flags: string[] = [];
    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

    const text = input.text.toLowerCase();

    // Check for restricted terms
    const restrictedTerms = [
      'guaranteed returns',
      'risk-free',
      'guaranteed profit',
      'no risk',
      'sure thing',
      'can\'t lose'
    ];

    const highRiskTerms = [
      'ponzi',
      'pyramid',
      'scam',
      'fraud',
      'illegal'
    ];

    const mediumRiskTerms = [
      'unregulated',
      'offshore',
      'tax evasion',
      'money laundering'
    ];

    // Check for high-risk terms
    for (const term of highRiskTerms) {
      if (text.includes(term)) {
        flags.push(`High-risk term detected: "${term}"`);
        severity = 'high';
      }
    }

    // Check for medium-risk terms
    for (const term of mediumRiskTerms) {
      if (text.includes(term)) {
        flags.push(`Medium-risk term detected: "${term}"`);
        if (severity === 'none') severity = 'medium';
      }
    }

    // Check for restricted financial terms
    for (const term of restrictedTerms) {
      if (text.includes(term)) {
        flags.push(`Restricted financial term: "${term}"`);
        if (severity === 'none') severity = 'low';
      }
    }

    // Check for jurisdiction mentions
    const restrictedJurisdictions = ['iran', 'north korea', 'syria', 'cuba'];
    for (const jurisdiction of restrictedJurisdictions) {
      if (text.includes(jurisdiction)) {
        flags.push(`Restricted jurisdiction mentioned: "${jurisdiction}"`);
        severity = 'high';
      }
    }

    // Check for unlicensed financial services
    const unlicensedTerms = [
      'unlicensed broker',
      'unregistered investment',
      'unregulated trading'
    ];
    for (const term of unlicensedTerms) {
      if (text.includes(term)) {
        flags.push(`Unlicensed activity: "${term}"`);
        if (severity === 'none' || severity === 'low') severity = 'medium';
      }
    }

    const result: ComplianceOutput = {
      flags,
      severity
    };

    const processingTime = Date.now() - startTime;
    
    logger.info('Compliance check completed', {
      flagsCount: flags.length,
      severity,
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

    logger.error('Compliance check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});

export { router as complianceRouter };
