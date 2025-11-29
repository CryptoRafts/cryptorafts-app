import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface HMACRequest extends Request {
  verified?: boolean;
}

export function verifyHMAC(req: HMACRequest, res: Response, next: NextFunction) {
  const signature = req.headers['x-signature-sha256'] as string;
  const signingSecret = process.env.RAFTAI_SIGNING_SECRET;

  if (!signingSecret) {
    logger.error('RAFTAI_SIGNING_SECRET not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }

  if (!signature) {
    logger.warn('Missing HMAC signature', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      error: 'Missing HMAC signature',
      code: 'MISSING_SIGNATURE'
    });
  }

  // Get raw body
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(body)
    .digest('hex');

  // Use timing-safe comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    logger.warn('Invalid HMAC signature', {
      ip: req.ip,
      path: req.path,
      providedSignature: signature.substring(0, 8) + '...',
      expectedSignature: expectedSignature.substring(0, 8) + '...'
    });
    return res.status(401).json({
      error: 'Invalid HMAC signature',
      code: 'INVALID_SIGNATURE'
    });
  }

  req.verified = true;
  next();
}
