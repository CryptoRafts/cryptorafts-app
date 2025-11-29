/**
 * Post to Medium API Route
 * Publishes blog content to Medium
 */

import { NextRequest, NextResponse } from 'next/server';
import { mediumService } from '@/lib/medium-service';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      postId, 
      title, 
      content, 
      excerpt, 
      tags, 
      canonicalUrl, 
      publishStatus = 'public',
      publicationId,
      accessToken 
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content required' },
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
          const platformDoc = await getDoc(doc(dbInstance, 'blog_platforms', 'medium'));
          if (platformDoc.exists()) {
            const data = platformDoc.data();
            token = data.accessToken;
          }
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Medium not connected. Please connect your account first.' },
        { status: 401 }
      );
    }

    // Convert HTML to Medium format
    const mediumContent = mediumService.htmlToMediumFormat(content);

    // Prepare Medium post
    const mediumPost = {
      title,
      contentFormat: 'html' as const,
      content: mediumContent,
      tags: tags || [],
      publishStatus: publishStatus as 'draft' | 'public' | 'unlisted',
      canonicalUrl: canonicalUrl || undefined,
      notifyFollowers: publishStatus === 'public',
    };

    // Publish to Medium
    const result = await mediumService.publishArticle(
      token,
      mediumPost,
      publicationId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      articleId: result.articleId,
      url: result.url,
      message: 'Published to Medium successfully',
    });
  } catch (error: any) {
    console.error('❌ Error posting to Medium:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post to Medium' },
      { status: 500 }
    );
  }
}

