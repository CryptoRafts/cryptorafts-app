import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { openaiClient } from '../utils/openai-client.js';

const router = Router();

// Finance analysis endpoint
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, transactionId, amount, currency, description, documentData } = req.body;
    
    logger.info('Processing financial analysis with OpenAI', {
      userId,
      transactionId,
      amount
    });

    if (!transactionId) {
      return res.status(400).json({
        error: 'Transaction ID is required',
        code: 'INVALID_INPUT'
      });
    }

    // Get AI analysis from OpenAI
    const aiAnalysis = await openaiClient.analyzeFinancial({
      transactionId,
      amount,
      currency,
      description
    });

    const processingTime = Date.now() - startTime;

    const result = {
      success: true,
      analysis: {
        verified: aiAnalysis.verified,
        score: aiAnalysis.verified ? 90 : 40,
        confidence: aiAnalysis.confidence,
        status: aiAnalysis.verified ? 'approved' : 'needs_review',
        findings: aiAnalysis.findings,
        recommendations: aiAnalysis.recommendations,
        risks: aiAnalysis.risks
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        analyzedBy: 'RaftAI Finance Analyzer with OpenAI GPT-4',
        processingTime,
        transactionId
      }
    };

    logger.info('Financial analysis completed', {
      transactionId,
      verified: aiAnalysis.verified,
      processingTimeMs: processingTime
    });

    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Financial analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    res.status(500).json({
      error: 'Financial analysis failed',
      code: 'PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment extraction endpoint
router.post('/extract', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { transactionId, documentData } = req.body;
    
    logger.info('Extracting payment information', { transactionId });

    if (!transactionId || !documentData) {
      return res.status(400).json({
        error: 'Transaction ID and document data are required',
        code: 'INVALID_INPUT'
      });
    }

    // For now, return basic extraction
    // Can be enhanced with OpenAI for document parsing
    const result = {
      success: true,
      extracted: {
        transactionId,
        amount: documentData.amount || null,
        currency: documentData.currency || null,
        date: documentData.date || new Date().toISOString(),
        payee: documentData.payee || null,
        payer: documentData.payer || null
      },
      metadata: {
        extractedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    };

    logger.info('Payment extraction completed', { transactionId });

    res.status(200).json(result);
    
  } catch (error) {
    logger.error('Payment extraction failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Payment extraction failed',
      code: 'PROCESSING_ERROR'
    });
  }
});

export { router as financeRouter };

