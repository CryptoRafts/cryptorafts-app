import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';

/**
 * GET /api/blog
 * Get all blog posts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') as 'draft' | 'published' | 'scheduled' | undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      author: searchParams.get('author') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    };

    const posts = await blogServiceServer.getPosts(filters);
    
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog
 * Create a new blog post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { title, content, category, tags, author, authorId, featuredImage, status, scheduledDate, metaTitle, metaDescription } = body;
    
    // Validation
    if (!title || !content || !category || !author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare post data, ensuring no undefined values
    const postData: any = {
      title,
      content,
      slug: '',
      category,
      tags: tags || [],
      author,
      authorId,
      featuredImage: featuredImage || '', // Ensure it's always a string
      status: status || 'draft',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || '',
    };

    // Only add scheduledDate if provided
    if (scheduledDate) {
      postData.scheduledDate = new Date(scheduledDate);
    }

    // Remove any undefined values
    Object.keys(postData).forEach(key => {
      if (postData[key] === undefined) {
        delete postData[key];
      }
    });

    const postId = await blogServiceServer.createPost(postData);
    
    return NextResponse.json({ success: true, postId });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

