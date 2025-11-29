import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';

/**
 * GET /api/blog/slug/[slug]
 * Get a single blog post by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await blogServiceServer.getPostBySlug(slug);
    
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

