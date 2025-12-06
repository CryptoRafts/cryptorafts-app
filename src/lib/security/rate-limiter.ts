/**
 * Rate Limiting Security Module
 * Prevents abuse and DDoS attacks
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for serverless, consider Redis in production)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Generate rate limit key from request
 */
function generateKey(req: NextRequest, userId?: string): string {
  // Use user ID if available, otherwise use IP
  if (userId) {
    return `user:${userId}`;
  }
  
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = config.keyGenerator 
    ? config.keyGenerator(req)
    : generateKey(req, userId);
  
  const now = Date.now();
  const entry = rateLimitStore[key];
  
  // Initialize or reset if window expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs
    };
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count
  entry.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Standard rate limit configurations
 */
export const RATE_LIMITS = {
  // API routes
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  },
  
  API_AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  
  API_AI: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 AI requests per minute
  },
  
  API_KYC_KYB: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // 3 submissions per hour
  },
  
  API_WALLET: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 wallet operations per minute
  },
  
  // File uploads
  FILE_UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 uploads per minute
  },
  
  // Admin routes
  ADMIN_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }
};

/**
 * Rate limit middleware for API routes
 */
export function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.API_GENERAL,
  userId?: string
): Response | null {
  const result = checkRateLimit(req, config, userId);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  return null; // Request allowed
}



