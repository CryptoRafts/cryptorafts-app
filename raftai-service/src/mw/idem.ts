import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

interface IdempotencyEntry {
  result: any;
  timestamp: number;
  ttl: number;
}

// In-memory cache for idempotency (in production, use Redis)
const idempotencyCache = new Map<string, IdempotencyEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now > entry.timestamp + entry.ttl) {
      idempotencyCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface IdempotentRequest extends Request {
  idempotencyKey?: string;
}

export function idempotencyMiddleware(req: IdempotentRequest, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'Idempotency-Key header is required for this endpoint',
      code: 'MISSING_IDEMPOTENCY_KEY'
    });
  }

  // Validate idempotency key format (should be a valid UUID or similar)
  if (!/^[a-zA-Z0-9-_]{8,64}$/.test(idempotencyKey)) {
    return res.status(400).json({
      error: 'Invalid Idempotency-Key format',
      code: 'INVALID_IDEMPOTENCY_KEY'
    });
  }

  // Create a hash of the request for additional uniqueness
  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      method: req.method,
      path: req.path,
      body: req.body,
      idempotencyKey
    }))
    .digest('hex');

  const cacheKey = `${idempotencyKey}:${requestHash}`;
  const cached = idempotencyCache.get(cacheKey);

  if (cached) {
    logger.info('Returning cached idempotent response', {
      idempotencyKey,
      age: Date.now() - cached.timestamp
    });
    
    return res.status(200).json(cached.result);
  }

  // Store the original res.json method
  const originalJson = res.json.bind(res);
  
  // Override res.json to cache the response
  res.json = function(body: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(cacheKey, {
        result: body,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000 // 24 hours TTL
      });
      
      logger.info('Cached idempotent response', {
        idempotencyKey,
        statusCode: res.statusCode
      });
    }
    
    return originalJson(body);
  };

  req.idempotencyKey = idempotencyKey;
  next();
}
