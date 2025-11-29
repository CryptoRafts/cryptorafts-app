/**
 * Blogger Service for Blog Automation
 * 
 * Publishes blog posts to Google Blogger automatically
 * API Docs: https://developers.google.com/blogger/docs/3.0/reference
 */

interface BloggerPost {
  title: string;
  content: string;
  labels?: string[];
  published?: boolean;
  customMetaData?: {
    canonicalUrl?: string;
  };
}

interface BloggerResponse {
  id: string;
  url: string;
  published: string;
}

class BloggerService {
  private apiKey: string | null = null;
  private blogId: string | null = null;
  private enabled: boolean = false;
  private baseUrl = 'https://www.googleapis.com/blogger/v3';

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.apiKey = process.env.BLOGGER_API_KEY || null;
    this.blogId = process.env.BLOGGER_BLOG_ID || null;
    this.enabled = !!(this.apiKey && this.blogId);

    if (!this.enabled) {
      console.log('⚠️ Blogger service not configured (missing BLOGGER_API_KEY or BLOGGER_BLOG_ID)');
    } else {
      console.log('✅ Blogger service initialized');
    }
  }

  /**
   * Check if Blogger service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Publish post to Blogger
   */
  async publishPost(post: {
    title: string;
    content: string;
    tags?: string[];
    canonical_url?: string;
    publish?: boolean;
  }): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
    if (!this.enabled || !this.apiKey || !this.blogId) {
      return { success: false, error: 'Blogger service not configured' };
    }

    try {
      // Add canonical URL note if provided
      const canonicalNote = post.canonical_url 
        ? `<p><em>This article was originally published on <a href="${post.canonical_url}">Cryptorafts</a></em></p>`
        : '';

      const bloggerPost: BloggerPost = {
        title: post.title,
        content: canonicalNote + post.content,
        labels: post.tags || [],
        published: post.publish !== false, // Default to published
        customMetaData: post.canonical_url ? {
          canonicalUrl: post.canonical_url,
        } : undefined,
      };

      const url = `${this.baseUrl}/blogs/${this.blogId}/posts?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bloggerPost),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Blogger API error:', error);
        return { success: false, error: `Blogger API error: ${response.status}` };
      }

      const result: BloggerResponse = await response.json();
      console.log('✅ Post published to Blogger:', result.url);

      return {
        success: true,
        postId: result.id,
        url: result.url,
      };
    } catch (error: any) {
      console.error('❌ Failed to publish to Blogger:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const bloggerService = new BloggerService();

