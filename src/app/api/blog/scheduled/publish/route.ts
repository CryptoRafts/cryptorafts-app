/**
 * Scheduled Posts Publisher
 * 
 * POST /api/blog/scheduled/publish
 * 
 * Checks scheduled posts and publishes them when time arrives
 * Moves from scheduled_posts to blog_posts collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const now = new Date();
    console.log('🔍 Checking scheduled posts for publishing...', now.toISOString());

    // Get all scheduled posts where scheduledDate <= now
    const scheduledQuery = await db.collection('scheduled_posts')
      .where('scheduledDate', '<=', now)
      .get();

    if (scheduledQuery.empty) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled posts ready to publish',
        published: 0,
      });
    }

    const publishedPosts: string[] = [];

    // Process each scheduled post
    for (const doc of scheduledQuery.docs) {
      const scheduledPost = doc.data();
      
      try {
        // Move to blog_posts collection
        const blogPost = {
          ...scheduledPost,
          status: 'published',
          publishedAt: new Date(),
          views: 0,
          likes: 0,
          shares: 0,
          commentEnabled: true,
          featured: false,
        };

        // Remove scheduledDate and scheduledFor from metadata
        if (blogPost.metadata) {
          delete blogPost.metadata.scheduledFor;
          delete blogPost.scheduledDate;
        }

        // Add to blog_posts
        const newPostRef = await db.collection('blog_posts').add(blogPost);
        const newPostId = newPostRef.id;

        // Delete from scheduled_posts
        await doc.ref.delete();

        publishedPosts.push(doc.id);
        console.log(`✅ Published scheduled post: ${scheduledPost.title}`);

        // Send blog notification email
        try {
          const { emailService } = await import('@/lib/email.service');
          await emailService.sendBlogUpdateNotification({
            title: blogPost.title,
            slug: blogPost.slug,
            author: blogPost.author || 'Admin',
            category: blogPost.category,
            excerpt: blogPost.excerpt,
            status: 'published',
          });
        } catch (emailError) {
          console.error('Failed to send blog notification email:', emailError);
          // Don't fail the publish if email fails
        }

        // Trigger platform publishing if configured
        if (blogPost.metadata?.platformSelection) {
          try {
            const selectedPlatforms = Object.entries(blogPost.metadata.platformSelection)
              .filter(([_, selected]) => selected)
              .map(([platform]) => platform);

            if (selectedPlatforms.length > 0) {
              // Call publish endpoint (async, don't await)
              fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com'}/api/blog/admin/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId: doc.id,
                  platforms: selectedPlatforms,
                }),
              }).catch(err => console.error('Error publishing to platforms:', err));
            }
          } catch (error) {
            console.error('Error triggering platform publish:', error);
          }
        }

      } catch (error) {
        console.error(`❌ Error publishing scheduled post ${doc.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Published ${publishedPosts.length} scheduled post(s)`,
      published: publishedPosts.length,
      postIds: publishedPosts,
    });

  } catch (error: any) {
    console.error('❌ Error processing scheduled posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
}

// GET endpoint to check scheduled posts (for manual trigger)
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const scheduledQuery = await db.collection('scheduled_posts').get();
    const scheduledPosts = scheduledQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      scheduledPosts,
      count: scheduledPosts.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching scheduled posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

