import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';
import { socialShareService } from '@/lib/social-share-service';

/**
 * GET /api/blog/[id]
 * Get a single blog post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await blogServiceServer.getPostById(id);
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/[id]
 * Update a blog post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('🔍 PATCH /api/blog/[id]:', { id, body });
    
    // Handle increment/decrement operations
    if (body.views === null) {
      console.log('📊 Incrementing views...');
      await blogServiceServer.incrementViews(id);
    } else if (body.likes === null) {
      console.log('❤️ Incrementing likes...');
      await blogServiceServer.incrementLikes(id);
    } else if (body.likes === -1) {
      console.log('💔 Decrementing likes...');
      await blogServiceServer.decrementLikes(id);
    } else if (body.shares === null) {
      console.log('🔗 Incrementing shares...');
      await blogServiceServer.incrementShares(id);
    } else {
      console.log('✏️ Updating post...');
      const postBefore = await blogServiceServer.getPostById(id);
      await blogServiceServer.updatePost(id, body);
      
      // If post is being published (status changed to published), trigger auto-share
      if (body.status === 'published' && postBefore && (postBefore as any).status !== 'published') {
        console.log('📢 Post published, triggering auto-share...');
        const postAfter = await blogServiceServer.getPostById(id);
        if (postAfter) {
          triggerAutoShareOnPublish(id, (postAfter as any).title, (postAfter as any).excerpt || '').catch(err => {
            console.error('❌ Auto-share failed:', err);
          });
        }
      }
    }
    
    console.log('✅ PATCH successful');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/[id]
 * Delete a blog post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await blogServiceServer.deletePost(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Trigger auto-share when a post is published
 */
async function triggerAutoShareOnPublish(postId: string, title: string, excerpt: string): Promise<void> {
  try {
    if (!socialShareService.isEnabled()) {
      console.log('⚠️ Social share service not configured, skipping auto-share');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
    const shareUrl = `${baseUrl}/blog/${postId}`;
    
    console.log('📢 Auto-sharing published post:', title);
    
    // Share to all configured platforms
    const results = await socialShareService.shareBlogPost(title, excerpt, shareUrl);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Auto-share complete: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.error('❌ Failed platforms:', failed.map(r => r.platform));
    }
    
  } catch (error) {
    console.error('❌ Auto-share error:', error);
  }
}

