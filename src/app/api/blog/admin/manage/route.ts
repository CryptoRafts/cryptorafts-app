/**
 * Admin Blog Management API
 * 
 * POST /api/blog/admin/manage
 * 
 * Admin-controlled blog post management:
 * - Create/edit posts manually
 * - Select platforms to post to
 * - Schedule posts
 * - Approve/override AI-generated posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer, BlogPost, PlatformSelection } from '@/lib/blog-service.server';
import { googleTrendsService } from '@/lib/google-trends-service';

interface AdminPostRequest {
  id?: string; // For updates
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduledDate?: string; // ISO string
  platformSelection?: PlatformSelection;
  approve?: boolean; // For AI-generated posts
  override?: boolean; // Override AI-generated content
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const body: AdminPostRequest = await request.json();
    const {
      id,
      title,
      content,
      excerpt,
      category,
      tags,
      metaTitle,
      metaDescription,
      featuredImage,
      status,
      scheduledDate,
      platformSelection,
      approve,
      override,
    } = body;

    // Validate required fields
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, category' },
        { status: 400 }
      );
    }

    // Get optimal posting times if not provided
    const optimalTimes = googleTrendsService.getOptimalPostingTimes();

    // IMPORTANT: If status is 'scheduled', it will be saved to scheduled_posts collection
    // Only 'published' or 'draft' posts are saved to blog_posts collection
    
    // Prepare post data
    const postData: any = {
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      featuredImage,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      author: 'Admin',
      authorId: 'admin',
      metadata: {
        platformSelection: platformSelection || {
          linkedin: false,
          x: false,
          telegram: false,
          devto: false,
          blogger: false,
          buffer: false,
          website: true,
        },
        optimalPostingTimes: optimalTimes,
        scheduledFor: scheduledDate || null,
        aiGenerated: false,
        requiresApproval: false,
        platformStatus: {},
      },
    };

    let result;

    if (id) {
      // Update existing post
      const existingPost = await blogServiceServer.getPostById(id);
      if (!existingPost) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      // If approving AI-generated post
      if (approve && existingPost.metadata?.aiGenerated) {
        postData.status = 'published';
        postData.metadata.aiGenerated = true;
        postData.metadata.requiresApproval = false;
      }

      // If overriding AI-generated content
      if (override && existingPost.metadata?.aiGenerated) {
        postData.metadata.aiGenerated = false;
        postData.metadata.requiresApproval = false;
      }

      // Merge with existing metadata
      if (existingPost.metadata) {
        postData.metadata = {
          ...existingPost.metadata,
          ...postData.metadata,
          platformSelection: platformSelection || existingPost.metadata.platformSelection || postData.metadata.platformSelection,
        };
      }

      result = await blogServiceServer.updatePost(id, postData);
    } else {
      // Create new post
      result = await blogServiceServer.createPost(postData);
    }

    // Send blog notification email if published
    if (status === 'published') {
      try {
        const { emailService } = await import('@/lib/email.service');
        const post = await blogServiceServer.getPostById(id || result);
        if (post) {
          await emailService.sendBlogUpdateNotification({
            title: post.title,
            slug: post.slug,
            author: post.author || 'Admin',
            category: post.category,
            excerpt: post.excerpt,
            status: 'published',
          });
        }
      } catch (emailError) {
        console.error('Failed to send blog notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      postId: id || result,
      message: id ? 'Post updated successfully' : 'Post created successfully',
      post: {
        id: id || result,
        title,
        status,
        platformSelection: postData.metadata.platformSelection,
        scheduledFor: scheduledDate,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in admin blog management:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to manage blog post' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const aiGenerated = searchParams.get('aiGenerated') === 'true';
    const requiresApproval = searchParams.get('requiresApproval') === 'true';

    const filters: any = {};
    if (status) filters.status = status;

    const posts = await blogServiceServer.getPosts(filters);

    // Filter by AI-generated or requires approval if requested
    let filteredPosts = posts;
    if (aiGenerated) {
      filteredPosts = filteredPosts.filter((post: any) => post.metadata?.aiGenerated === true);
    }
    if (requiresApproval) {
      filteredPosts = filteredPosts.filter((post: any) => post.metadata?.requiresApproval === true);
    }

    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      count: filteredPosts.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching admin posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

