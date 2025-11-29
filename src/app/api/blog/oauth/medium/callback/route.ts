/**
 * Medium OAuth Callback Route
 * Handles OAuth 2.0 callback from Medium
 */

import { NextRequest, NextResponse } from 'next/server';
import { mediumService } from '@/lib/medium-service';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Medium OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/admin/blog?error=medium_oauth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/blog?error=medium_oauth_no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenData = await mediumService.exchangeCodeForToken(code);
    
    // Get user info
    const userInfo = await mediumService.getUserInfo(tokenData.accessToken);

    // Store connection in Firestore
    const isReady = await waitForFirebase(5000);
    if (isReady) {
      const dbInstance = ensureDb();
      if (dbInstance) {
        await setDoc(
          doc(dbInstance, 'blog_platforms', 'medium'),
          {
            id: 'medium',
            name: 'Medium',
            icon: '📝',
            connected: true,
            connectedAt: serverTimestamp(),
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            userId: userInfo.id,
            username: userInfo.username,
            name: userInfo.name,
            url: userInfo.url,
            imageUrl: userInfo.imageUrl,
            lastSync: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    console.log('✅ Medium OAuth successful:', userInfo.username);

    return NextResponse.redirect(
      new URL('/admin/blog?success=medium_connected', request.url)
    );
  } catch (error: any) {
    console.error('❌ Medium OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/admin/blog?error=medium_oauth_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

