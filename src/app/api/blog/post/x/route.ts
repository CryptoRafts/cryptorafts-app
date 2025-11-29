/**
 * Post to X (Twitter) API Route
 * Posts blog content to X/Twitter
 */

import { NextRequest, NextResponse } from 'next/server';
import { xTwitterService } from '@/lib/x-twitter-service';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, title, excerpt, url, hashtags, accessToken } = body;

    if (!postId && (!title || !url)) {
      return NextResponse.json(
        { success: false, error: 'Post ID or title and URL required' },
        { status: 400 }
      );
    }

    // Get access token from Firestore if not provided
    let token = accessToken;
    if (!token) {
      const isReady = await waitForFirebase(5000);
      if (isReady) {
        const dbInstance = ensureDb();
        if (dbInstance) {
          const platformDoc = await getDoc(doc(dbInstance, 'blog_platforms', 'x'));
          if (platformDoc.exists()) {
            const data = platformDoc.data();
            token = data.accessToken;
          }
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'X (Twitter) not connected. Please connect your account first.' },
        { status: 401 }
      );
    }

    // Format post for Twitter
    const tweetText = xTwitterService.formatPostForTwitter(
      title || 'New Blog Post',
      excerpt || '',
      url || '',
      hashtags || []
    );

    // Post to Twitter
    const result = await xTwitterService.postTweet(
      { text: tweetText },
      token
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      message: 'Posted to X (Twitter) successfully',
    });
  } catch (error: any) {
    console.error('❌ Error posting to X:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post to X' },
      { status: 500 }
    );
  }
}

