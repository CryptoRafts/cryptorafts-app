/**
 * X (Twitter) OAuth Callback Route
 * Handles OAuth 2.0 callback from Twitter
 */

import { NextRequest, NextResponse } from 'next/server';
import { xTwitterService } from '@/lib/x-twitter-service';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ X OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/admin/blog?error=x_oauth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/blog?error=x_oauth_no_code', request.url)
      );
    }

    // Get code verifier from state or session (in production, use secure session)
    // For now, we'll try without it (some Twitter apps don't require PKCE)
    let codeVerifier: string | undefined;
    
    // Try to get from state parameter if encoded
    if (state && state.includes('verifier:')) {
      codeVerifier = state.split('verifier:')[1];
    }

    // Exchange code for access token
    const tokenData = await xTwitterService.exchangeCodeForToken(code, codeVerifier);
    
    // Get user info
    const userInfo = await xTwitterService.getUserInfo(tokenData.accessToken);

    // Store connection in Firestore
    const isReady = await waitForFirebase(5000);
    if (isReady) {
      const dbInstance = ensureDb();
      if (dbInstance) {
        await setDoc(
          doc(dbInstance, 'blog_platforms', 'x'),
          {
            id: 'x',
            name: 'X (Twitter)',
            icon: '🐦',
            connected: true,
            connectedAt: serverTimestamp(),
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            userId: userInfo.id,
            username: userInfo.username,
            name: userInfo.name,
            profileImageUrl: userInfo.profile_image_url,
            lastSync: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    console.log('✅ X OAuth successful:', userInfo.username);

    return NextResponse.redirect(
      new URL('/admin/blog?success=x_connected', request.url)
    );
  } catch (error: any) {
    console.error('❌ X OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/admin/blog?error=x_oauth_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

