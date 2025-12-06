/**
 * API Security Utilities
 * Centralized security functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/server/firebaseAdmin';
import { checkRateLimit, RATE_LIMITS } from './rate-limiter';
import { validateRequiredFields, sanitizeString } from './input-validator';

/**
 * Verify Firebase authentication token
 */
export async function verifyAuthToken(
  req: NextRequest
): Promise<{ valid: boolean; uid?: string; email?: string; error?: string }> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const adminAuth = getAdminAuth();
    
    if (!adminAuth) {
      return { valid: false, error: 'Admin auth not available' };
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email || undefined
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Token verification failed'
    };
  }
}

/**
 * Verify user role
 */
export function verifyRole(
  decodedToken: any,
  requiredRole: string
): boolean {
  const userRole = decodedToken.role || decodedToken.customClaims?.role;
  return userRole === requiredRole;
}

/**
 * Verify admin access
 */
export function verifyAdminAccess(
  decodedToken: any,
  allowedEmails: string[] = ['anasshamsiggc@gmail.com']
): boolean {
  const email = (decodedToken.email || '').toLowerCase();
  const isAdminEmail = allowedEmails.includes(email);
  const hasAdminClaim = decodedToken.admin?.super === true || 
                        decodedToken.customClaims?.admin?.super === true;
  
  return isAdminEmail || hasAdminClaim;
}

/**
 * Secure API route wrapper
 */
export async function secureAPIRoute(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    requireRole?: string;
    requireAdmin?: boolean;
    rateLimit?: typeof RATE_LIMITS.API_GENERAL;
    validateBody?: (body: any) => { valid: boolean; error?: string };
  } = {}
): Promise<{
  authorized: boolean;
  response?: NextResponse;
  user?: { uid: string; email?: string; role?: string };
}> {
  const {
    requireAuth = true,
    requireRole,
    requireAdmin = false,
    rateLimit = RATE_LIMITS.API_GENERAL,
    validateBody
  } = options;
  
  // Rate limiting
  const rateLimitResult = checkRateLimit(req, rateLimit);
  if (!rateLimitResult.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    };
  }
  
  // Authentication
  if (requireAuth) {
    const authResult = await verifyAuthToken(req);
    
    if (!authResult.valid) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: authResult.error || 'Unauthorized' },
          { status: 401 }
        )
      };
    }
    
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Service unavailable' },
          { status: 503 }
        )
      };
    }
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Missing token' },
          { status: 401 }
        )
      };
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Role check
    if (requireRole && !verifyRole(decodedToken, requireRole)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      };
    }
    
    // Admin check
    if (requireAdmin && !verifyAdminAccess(decodedToken)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      };
    }
    
    // Body validation
    if (validateBody) {
      try {
        const body = await req.json();
        const validation = validateBody(body);
        
        if (!validation.valid) {
          return {
            authorized: false,
            response: NextResponse.json(
              { error: validation.error || 'Invalid request body' },
              { status: 400 }
            )
          };
        }
      } catch (error) {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
          )
        };
      }
    }
    
    return {
      authorized: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || decodedToken.customClaims?.role
      }
    };
  }
  
  return { authorized: true };
}

/**
 * Validate request body structure
 */
export function validateRequestBody<T>(
  body: any,
  schema: {
    required?: string[];
    optional?: string[];
    validators?: Record<string, (value: any) => boolean>;
  }
): { valid: boolean; data?: T; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  // Check required fields
  if (schema.required) {
    const requiredCheck = validateRequiredFields(body, schema.required);
    if (!requiredCheck.valid) {
      return {
        valid: false,
        error: `Missing required fields: ${requiredCheck.missing.join(', ')}`
      };
    }
  }
  
  // Validate field values
  if (schema.validators) {
    for (const [field, validator] of Object.entries(schema.validators)) {
      if (body[field] !== undefined && !validator(body[field])) {
        return {
          valid: false,
          error: `Invalid value for field: ${field}`
        };
      }
    }
  }
  
  return { valid: true, data: body as T };
}



