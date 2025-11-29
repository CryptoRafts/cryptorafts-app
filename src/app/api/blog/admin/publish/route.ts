/**
 * Admin Platform Publishing API
 * 
 * POST /api/blog/admin/publish
 * 
 * Publishes post to selected platforms based on admin selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';
import { xTwitterService } from '@/lib/x-twitter-service';
import { mediumService } from '@/lib/medium-service';
import { bufferService } from '@/lib/buffer-service';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';

interface PublishRequest {
  postId: string;
  platforms?: string[]; // ['linkedin', 'x', 'medium', 'telegram', 'devto', 'blogger', 'buffer', 'website']
  scheduleFor?: string; // ISO string for scheduling
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body: PublishRequest = await request.json();
    const { postId, platforms, scheduleFor } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID required' },
        { status: 400 }
      );
    }

    // Get post
    const post = await blogServiceServer.getPostById(postId);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get platform selection from post metadata or use provided platforms
    const platformSelection = post.metadata?.platformSelection || {
      linkedin: platforms?.includes('linkedin') || false,
      x: platforms?.includes('x') || false,
      medium: platforms?.includes('medium') || false,
      telegram: platforms?.includes('telegram') || false,
      devto: platforms?.includes('devto') || false,
      blogger: platforms?.includes('blogger') || false,
      buffer: platforms?.includes('buffer') || false,
      website: platforms?.includes('website') !== false, // Default to true
    };

    // Post to Buffer (for X and LinkedIn) if selected
    if (platformSelection.buffer && !scheduleFor) {
      try {
        const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/blog/${post.slug}`;
        
        // Buffer supports X (Twitter) and LinkedIn, but NOT Medium
        // So we'll use Buffer for X/LinkedIn and direct API for Medium
        const bufferPlatforms: string[] = [];
        if (platformSelection.x) bufferPlatforms.push('twitter');
        // Note: Medium is NOT supported by Buffer, use direct API instead
        
        // Post to Buffer for X and LinkedIn
        if (bufferPlatforms.length > 0) {
          const bufferResult = await bufferService.postToPlatforms(
            post.title,
            post.excerpt || '',
            postUrl,
            bufferPlatforms,
            {
              now: true,
              media: post.featuredImage,
            }
          );

          if (bufferResult.success) {
            platformStatus.buffer = {
              success: true,
              platforms: bufferResult.results,
              postedAt: new Date().toISOString(),
            };
          } else {
            platformStatus.buffer = {
              success: false,
              error: bufferResult.results[0]?.error || 'Buffer post failed',
            };
          }
        }
      } catch (error: any) {
        console.error('Error posting to Buffer:', error);
        platformStatus.buffer = {
          success: false,
          error: error.message,
        };
      }
    }

    // Initialize platform status if not exists
    const platformStatus: Record<string, any> = post.metadata?.platformStatus || {};

    // Post to X (Twitter) if selected
    if (platformSelection.x && !scheduleFor) {
      try {
        const dbInstance = ensureDb();
        if (dbInstance) {
          const platformDoc = await getDoc(doc(dbInstance, 'blog_platforms', 'x'));
          if (platformDoc.exists() && platformDoc.data().accessToken) {
            const tweetText = xTwitterService.formatPostForTwitter(
              post.title,
              post.excerpt || '',
              `${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/blog/${post.slug}`,
              post.tags || []
            );

            const tweetResult = await xTwitterService.postTweet(
              { text: tweetText },
              platformDoc.data().accessToken
            );

            if (tweetResult.success) {
              platformStatus.x = {
                success: true,
                tweetId: tweetResult.tweetId,
                postedAt: new Date().toISOString(),
              };
            } else {
              platformStatus.x = {
                success: false,
                error: tweetResult.error,
              };
            }
          }
        }
      } catch (error: any) {
        console.error('Error posting to X:', error);
        platformStatus.x = {
          success: false,
          error: error.message,
        };
      }
    }

    // Post to Medium if selected
    if (platformSelection.medium && !scheduleFor) {
      try {
        const dbInstance = ensureDb();
        if (dbInstance) {
          const platformDoc = await getDoc(doc(dbInstance, 'blog_platforms', 'medium'));
          if (platformDoc.exists() && platformDoc.data().accessToken) {
            const mediumContent = mediumService.htmlToMediumFormat(post.content);
            const mediumPost = {
              title: post.title,
              contentFormat: 'html' as const,
              content: mediumContent,
              tags: post.tags || [],
              publishStatus: 'public' as const,
              canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/blog/${post.slug}`,
              notifyFollowers: true,
            };

            const mediumResult = await mediumService.publishArticle(
              platformDoc.data().accessToken,
              mediumPost
            );

            if (mediumResult.success) {
              platformStatus.medium = {
                success: true,
                articleId: mediumResult.articleId,
                url: mediumResult.url,
                postedAt: new Date().toISOString(),
              };
            } else {
              platformStatus.medium = {
                success: false,
                error: mediumResult.error,
              };
            }
          }
        }
      } catch (error: any) {
        console.error('Error posting to Medium:', error);
        platformStatus.medium = {
          success: false,
          error: error.message,
        };
      }
    }

    // Update post with platform selection and status
    const updateData: any = {
      metadata: {
        ...post.metadata,
        platformSelection,
        platformStatus,
        scheduledFor: scheduleFor || null,
      },
    };

    // If scheduling, set status to scheduled
    if (scheduleFor) {
      updateData.status = 'scheduled';
      updateData.scheduledDate = new Date(scheduleFor);
    } else if (platformSelection.website) {
      // If publishing to website now, set to published
      updateData.status = 'published';
      updateData.publishedAt = new Date();
    }

    await blogServiceServer.updatePost(postId, updateData);

    return NextResponse.json({
      success: true,
      message: scheduleFor ? 'Post scheduled successfully' : 'Post published successfully',
      postId,
      platformSelection,
      scheduledFor: scheduleFor || null,
      platforms: Object.entries(platformSelection)
        .filter(([_, selected]) => selected)
        .map(([platform]) => platform),
    });

  } catch (error: any) {
    console.error('❌ Error publishing post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish post' },
      { status: 500 }
    );
  }
}

