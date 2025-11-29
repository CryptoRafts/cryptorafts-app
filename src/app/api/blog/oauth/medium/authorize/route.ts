/**
 * Medium OAuth Authorization Route
 * Initiates OAuth 2.0 flow for Medium
 */

import { NextRequest, NextResponse } from 'next/server';
import { mediumService } from '@/lib/medium-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || 'medium_oauth';

    if (!mediumService.isEnabled()) {
      return NextResponse.json(
        { success: false, error: 'Medium service not configured. Please set MEDIUM_CLIENT_ID and MEDIUM_CLIENT_SECRET' },
        { status: 400 }
      );
    }

    const authUrl = mediumService.getAuthorizationUrl(state);

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    console.error('❌ Medium OAuth authorization error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

