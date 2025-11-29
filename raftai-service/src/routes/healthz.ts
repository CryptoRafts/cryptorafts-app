import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        firebase: await checkFirebase(),
        providers: await checkProviders()
      }
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function checkFirebase(): Promise<{ status: string; details?: string }> {
  try {
    // Simple Firebase connectivity check
    const { db } = await import('../utils/firestore.js');
    await db.collection('_health').limit(1).get();
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkProviders(): Promise<{ status: string; details?: string }> {
  const providers = {
    kyc: process.env.KYC_VENDOR || 'none',
    llm: process.env.LLM_PROVIDER || 'none',
    embeddings: process.env.EMBEDDINGS_PROVIDER || 'none',
    vector: process.env.VECTOR_DB || 'none',
    sanctions: process.env.SANCTIONS_PROVIDER || 'none',
    moderation: process.env.MODERATION_PROVIDER || 'none'
  };

  const configured = Object.values(providers).filter(p => p !== 'none').length;
  const total = Object.keys(providers).length;

  return {
    status: configured > 0 ? 'partial' : 'none',
    details: `${configured}/${total} providers configured`
  };
}

export { router as healthzRouter };
