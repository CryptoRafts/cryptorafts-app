/**
 * POST /api/blog/n8n-webhook
 * n8n webhook endpoint for automated blog post creation
 * 
 * This endpoint receives blog posts from n8n automation workflows
 * and handles validation, duplicate checking, and saving to Firestore.
 * 
 * Expected format from n8n/Cursor:
 * {
 *   "title": "...",
 *   "excerpt": "...",
 *   "content": "<h2>...</h2><p>...</p>",
 *   "meta_title": "...",
 *   "meta_description": "...",
 *   "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
 *   "slug": "...",
 *   "tags": [...],
 *   "category": "...",
 *   "keywords": [...],
 *   "social": {
 *     "linkedin": "...",
 *     "x": "...",
 *     "telegram": "..."
 *   },
 *   "reading_time": 6,
 *   "images": [...],
 *   "claims_to_verify": [...],
 *   "publish": false,
 *   "source": "cursor-ai",
 *   "sourceId": "cursor-{{timestamp}}"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';
import { telegramService } from '@/lib/telegram-service';
import { devToService } from '@/lib/devto-service';
import { bloggerService } from '@/lib/blogger-service';
import { iftttService } from '@/lib/ifttt-service';

interface N8NWebhookPayload {
  title: string;
  excerpt?: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  slug?: string;
  tags?: string[];
  category?: string;
  keywords?: string[];
  social?: {
    linkedin?: string;
    x?: string;
    telegram?: string;
  };
  reading_time?: number;
  images?: Array<{
    url: string;
    alt: string;
  }>;
  claims_to_verify?: string[];
  publish?: boolean;
  source?: string;
  sourceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: N8NWebhookPayload = await request.json();
    
    console.log('📥 n8n webhook received:', {
      title: body.title,
      source: body.source,
      sourceId: body.sourceId,
      publish: body.publish,
    });

    // Validation
    if (!body.title || !body.content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title and content are required' 
        },
        { status: 400 }
      );
    }

    // Check for duplicate by sourceId
    if (body.sourceId) {
      const isDuplicate = await checkDuplicateBySourceId(body.sourceId);
      if (isDuplicate) {
        console.log('⚠️ Duplicate detected by sourceId:', body.sourceId);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Duplicate post detected',
            duplicate: true,
            sourceId: body.sourceId
          },
          { status: 409 }
        );
      }
    }

    // Validate content quality
    const validation = validateN8NContent(body);
    if (!validation.valid) {
      console.error('❌ Content validation failed:', validation.errors);
      // Still save as draft if validation fails
      body.publish = false;
    }

    // Count external links (spam check)
    const linkCount = countExternalLinks(body.content);
    if (linkCount > 20) {
      console.warn('⚠️ Too many external links detected:', linkCount);
      body.publish = false; // Force draft if too many links
    }

    // Prepare post data for blog service
    const postData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || generateExcerpt(body.content),
      slug: body.slug || undefined, // Will be auto-generated if not provided
      category: body.category || 'Crypto',
      tags: body.tags || [],
      author: 'Cryptorafts Team',
      authorId: body.source === 'cursor-ai' ? 'cursor-ai' : 'n8n-automation',
      featuredImage: body.images && body.images.length > 0 ? body.images[0].url : '',
      status: (body.publish === true && validation.valid) ? 'published' : 'draft',
      metaTitle: body.meta_title || body.title,
      metaDescription: body.meta_description || body.excerpt || generateExcerpt(body.content, 155),
      readingTime: body.reading_time,
      // Store additional metadata
      metadata: {
        canonicalUrl: body.canonical_url,
        keywords: body.keywords || [],
        socialCaptions: body.social || {},
        claimsToVerify: body.claims_to_verify || [],
        source: body.source || 'n8n',
        sourceId: body.sourceId,
        images: body.images || [],
        linkCount,
        validationErrors: validation.errors || [],
      },
    };

    // Create post in Firestore
    const postId = await blogServiceServer.createPost(postData);

    console.log('✅ Blog post created via n8n webhook:', {
      postId,
      title: body.title,
      status: postData.status,
      sourceId: body.sourceId,
    });

    const canonicalUrl = body.canonical_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com'}/blog/${postData.slug || postId}`;

    // Send notifications and cross-post (async, don't await)
    Promise.all([
      // Telegram notification
      telegramService.isEnabled() && telegramService.notifyBlogPostCreated({
        title: body.title,
        status: postData.status,
        canonical_url: canonicalUrl,
        category: body.category || 'Crypto',
        tags: body.tags || [],
        reading_time: body.reading_time,
      }).catch(err => console.error('Telegram notification failed:', err)),

      // Dev.to cross-post (if published)
      postData.status === 'published' && devToService.isEnabled() && devToService.publishArticle({
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        tags: body.tags,
        canonical_url: canonicalUrl,
        featuredImage: body.images?.[0]?.url,
        publish: true,
      }).catch(err => console.error('Dev.to cross-post failed:', err)),

      // Blogger cross-post (if published)
      postData.status === 'published' && bloggerService.isEnabled() && bloggerService.publishPost({
        title: body.title,
        content: body.content,
        tags: body.tags,
        canonical_url: canonicalUrl,
        publish: true,
      }).catch(err => console.error('Blogger cross-post failed:', err)),

      // IFTTT webhook
      iftttService.isEnabled() && iftttService.notifyNewPost({
        title: body.title,
        url: canonicalUrl,
        status: postData.status,
      }).catch(err => console.error('IFTTT webhook failed:', err)),
    ]).catch(err => {
      console.error('Some cross-posting failed:', err);
    });

    // Return success response
    return NextResponse.json({
      success: true,
      postId,
      status: postData.status,
      message: postData.status === 'draft' 
        ? 'Post saved as draft (requires review)' 
        : 'Post published successfully',
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
      metadata: {
        linkCount,
        duplicateChecked: !!body.sourceId,
      },
    });

  } catch (error: any) {
    console.error('❌ Error processing n8n webhook:', error);
    
    // Handle duplicate slug error gracefully
    if (error.message && error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Duplicate post detected (slug already exists)',
          duplicate: true
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process webhook request'
      },
      { status: 500 }
    );
  }
}

/**
 * Check for duplicate posts by sourceId
 */
async function checkDuplicateBySourceId(sourceId: string): Promise<boolean> {
  try {
    const db = blogServiceServer['getDb']();
    if (!db) return false;

    // Query Firestore for posts with matching sourceId
    const snapshot = await db.collection('blog_posts')
      .where('metadata.sourceId', '==', sourceId)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false; // Don't block on error
  }
}

/**
 * Validate n8n webhook content
 */
function validateN8NContent(body: N8NWebhookPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Title validation
  if (!body.title || body.title.trim().length < 10) {
    errors.push('Title must be at least 10 characters');
  }
  if (body.title && body.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Content validation
  if (!body.content || body.content.trim().length < 500) {
    errors.push('Content must be at least 500 characters');
  }
  if (body.content && body.content.length > 50000) {
    errors.push('Content is too long (max 50,000 characters)');
  }

  // Meta title validation
  if (body.meta_title && body.meta_title.length > 60) {
    errors.push('Meta title should be <= 60 characters for SEO');
  }

  // Meta description validation
  if (body.meta_description && body.meta_description.length > 155) {
    errors.push('Meta description should be <= 155 characters for SEO');
  }

  // Spam detection
  if (body.title && /(buy now|limited time|act fast|click here|guaranteed|free money)/i.test(body.title)) {
    errors.push('Title contains spam-like phrases');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count external links in content
 */
function countExternalLinks(content: string): number {
  if (!content) return 0;
  
  // Match all href attributes
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  const matches = content.match(linkRegex);
  
  if (!matches) return 0;

  // Filter out internal links (cryptorafts.com)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com';
  const externalLinks = matches.filter(link => {
    const url = link.replace(/href=["']|["']/g, '');
    return !url.includes('cryptorafts.com') && !url.startsWith('/');
  });

  return externalLinks.length;
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength: number = 150): string {
  if (!content) return '';
  
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length <= maxLength) return text;
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * GET /api/blog/n8n-webhook
 * Get webhook info and status
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/blog/n8n-webhook',
    method: 'POST',
    description: 'n8n webhook endpoint for automated blog post creation',
    requiredFields: ['title', 'content'],
    optionalFields: [
      'excerpt',
      'meta_title',
      'meta_description',
      'canonical_url',
      'slug',
      'tags',
      'category',
      'keywords',
      'social',
      'reading_time',
      'images',
      'claims_to_verify',
      'publish',
      'source',
      'sourceId',
    ],
    response: {
      success: 'boolean',
      postId: 'string (if successful)',
      status: "'draft' | 'published'",
      message: 'string',
      validation: {
        valid: 'boolean',
        errors: 'string[]',
      },
    },
    notes: [
      'Posts with publish=true will be published immediately if validation passes',
      'Posts with validation errors or >20 external links will be saved as drafts',
      'Duplicate detection by sourceId prevents reposting',
      'Canonical URL should point to cryptorafts.com/blog/{slug}',
    ],
  });
}

