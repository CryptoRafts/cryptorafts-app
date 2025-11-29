// src/app/api/auth/logout/route.ts
// Logout Endpoint - Revoke Refresh Token

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Delete refresh token cookie
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete('rememberMe');

    console.log('✅ User logged out');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

