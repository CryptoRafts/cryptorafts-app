/**
 * X (Twitter) OAuth Authorization Route
 * Initiates OAuth 2.0 flow for X/Twitter
 */

import { NextRequest, NextResponse } from 'next/server';
import { xTwitterService } from '@/lib/x-twitter-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || 'x_oauth';

    if (!xTwitterService.isEnabled()) {
      return NextResponse.json(
        { success: false, error: 'X (Twitter) service not configured. Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET' },
        { status: 400 }
      );
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = xTwitterService.generateCodeVerifier();
    const codeChallenge = await xTwitterService.generateCodeChallenge(codeVerifier);

    // Store code verifier in state (in production, use secure session storage)
    const stateWithVerifier = `${state}:verifier:${codeVerifier}`;

    const authUrl = xTwitterService.getAuthorizationUrl(stateWithVerifier, codeChallenge);

    return NextResponse.json({
      success: true,
      authUrl,
      codeVerifier, // Return for client-side storage if needed
    });
  } catch (error: any) {
    console.error('❌ X OAuth authorization error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

