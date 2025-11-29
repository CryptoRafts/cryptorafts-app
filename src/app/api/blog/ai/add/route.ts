import { NextRequest, NextResponse } from 'next/server';
import { blogService } from '@/lib/blog-service';

/**
 * POST /api/blog/ai/add
 * AI automation endpoint for external services to post blog articles
 * Requires API key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.BLOG_AI_API_KEY || 'cryptorafts-blog-ai-2025-secret';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.slice(7);
    if (token !== apiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    const { 
      title, 
      content, 
      tags = [], 
      category = 'general',
      meta_title,
      meta_description,
      author = 'AI Automation',
      status = 'draft'
    } = body;
    
    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create post as draft (requires admin approval)
    const postId = await blogService.createPost({
      title,
      content,
      slug: '',
      category,
      tags: Array.isArray(tags) ? tags : [tags],
      author,
      metaTitle: meta_title,
      metaDescription: meta_description,
      status: status || 'draft',
    });
    
    // Log AI submission
    console.log('🤖 AI post submitted:', { postId, title, author });
    
    return NextResponse.json({ 
      success: true, 
      postId,
      message: 'Blog post submitted for review',
      note: 'An admin will review and publish this post'
    });
  } catch (error: any) {
    console.error('Error in AI blog submission:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

