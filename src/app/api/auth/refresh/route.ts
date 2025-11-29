export const runtime = 'nodejs';
// src/app/api/auth/refresh/route.ts
// Refresh Token Endpoint - Rotate Tokens Securely

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SESSION = 24 * 60 * 60; // 1 day (session)
const REFRESH_TOKEN_EXPIRY_REMEMBER = 30 * 24 * 60 * 60; // 30 days (remember me)

// Store used refresh tokens to detect reuse
const usedRefreshTokens = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is available
    if (!auth) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    const rememberMe = cookieStore.get('rememberMe')?.value === 'true';

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    // Check for token reuse (security)
    if (usedRefreshTokens.has(refreshToken)) {
      console.error('⚠️ Refresh token reuse detected!');
      
      // Clear all tokens
      const response = NextResponse.json(
        { error: 'Token reuse detected', code: 'REFRESH_TOKEN_REUSED' },
        { status: 401 }
      );
      
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      response.cookies.delete('rememberMe');
      
      return response;
    }

    // Verify refresh token (custom token)
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(refreshToken);
    } catch (error) {
      console.error('Invalid refresh token:', error);
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Generate new access token (short-lived)
    const newAccessToken = await auth.createCustomToken(userId);

    // Generate new refresh token (rotate)
    const newRefreshToken = await auth.createCustomToken(userId);

    // Mark old token as used
    usedRefreshTokens.add(refreshToken);
    
    // Clean up old tokens after 1 hour
    setTimeout(() => {
      usedRefreshTokens.delete(refreshToken);
    }, 60 * 60 * 1000);

    // Create response with new access token
    const response = NextResponse.json({
      accessToken: newAccessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    // Set new refresh token in httpOnly cookie
    const maxAge = rememberMe ? REFRESH_TOKEN_EXPIRY_REMEMBER : REFRESH_TOKEN_EXPIRY_SESSION;
    
    response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
      path: '/',
    });

    console.log(`✅ Token refreshed for user ${userId} (${rememberMe ? '30d' : 'session'})`);

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clean up used tokens periodically
setInterval(() => {
  if (usedRefreshTokens.size > 10000) {
    usedRefreshTokens.clear();
    console.log('🗑️ Cleared used refresh tokens cache');
  }
}, 60 * 60 * 1000); // Every hour


