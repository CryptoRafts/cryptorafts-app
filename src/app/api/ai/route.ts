import { NextRequest, NextResponse } from 'next/server';
import { adminAuth as getAdminAuth } from '@/lib/firebase.admin';
import { logger } from '@/lib/logger';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

// AI service configuration
const AI_SERVICE_URL = process.env.RAFTAI_SERVICE_URL || 'http://localhost:3001';
const AI_SERVICE_TIMEOUT = 30000; // 30 seconds

interface AIRequest {
  type: 'kyc' | 'pitch' | 'chat' | 'analysis';
  data: any;
  userId: string;
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId: string;
}

// Rate limiting function
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Validate AI request
function validateAIRequest(body: any): { valid: boolean; error?: string; data?: AIRequest } {
  if (!body.type || !body.data || !body.userId) {
    return { valid: false, error: 'Missing required fields: type, data, userId' };
  }

  const validTypes = ['kyc', 'pitch', 'chat', 'analysis'];
  if (!validTypes.includes(body.type)) {
    return { valid: false, error: 'Invalid AI request type' };
  }

  // Type-specific validation
  switch (body.type) {
    case 'kyc':
      if (!body.data.documents || !Array.isArray(body.data.documents)) {
        return { valid: false, error: 'KYC request requires documents array' };
      }
      break;
    case 'pitch':
      if (!body.data.content && !body.data.deck) {
        return { valid: false, error: 'Pitch request requires content or deck' };
      }
      break;
    case 'chat':
      if (!body.data.message || typeof body.data.message !== 'string') {
        return { valid: false, error: 'Chat request requires message string' };
      }
      break;
    case 'analysis':
      if (!body.data.projectId) {
        return { valid: false, error: 'Analysis request requires projectId' };
      }
      break;
  }

  return { valid: true, data: body as AIRequest };
}

// Make request to AI service with timeout
async function callAIService(request: AIRequest): Promise<AIResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_KEY}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.result,
      requestId: data.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const adminAuth = getAdminAuth();
    
    if (!adminAuth) {
      logger.warn('Firebase Admin not available, skipping authentication');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      logger.warn('Rate limit exceeded for AI request', { userId });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateAIRequest(body);
    
    if (!validation.valid) {
      logger.warn('Invalid AI request', { userId, error: validation.error });
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const aiRequest = validation.data!;

    // Log the request
    logger.info('AI request initiated', {
      type: aiRequest.type,
      userId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Call AI service
    const result = await callAIService(aiRequest);

    // Log successful response
    logger.info('AI request completed', {
      type: aiRequest.type,
      userId,
      requestId: result.requestId,
      success: result.success
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('AI service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`AI service health check failed: ${response.status}`);
    }

    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('AI service health check failed', { error: errorMessage });
    return NextResponse.json(
      { status: 'unhealthy', error: errorMessage },
      { status: 503 }
    );
  }
}
