import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const expectedKey = process.env.RAFTAI_API_KEY;

  if (!expectedKey) {
    logger.error('RAFTAI_API_KEY not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }

  if (token !== expectedKey) {
    logger.warn('Invalid API key', {
      ip: req.ip,
      path: req.path,
      keyLength: token.length
    });
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  req.apiKey = token;
  next();
}
