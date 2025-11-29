/**
 * Dev.to Service for Blog Automation
 * 
 * Publishes blog posts to Dev.to automatically
 * API Docs: https://developers.forem.com/api/v1#tag/articles
 */

interface DevToArticle {
  title: string;
  body_markdown: string;
  published: boolean;
  main_image?: string;
  canonical_url?: string;
  description?: string;
  tags?: string[];
  series?: string;
}

interface DevToResponse {
  id: number;
  title: string;
  url: string;
  published: boolean;
}

class DevToService {
  private apiKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl = 'https://dev.to/api';

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.apiKey = process.env.DEVTO_API_KEY || null;
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      console.log('⚠️ Dev.to service not configured (missing DEVTO_API_KEY)');
    } else {
      console.log('✅ Dev.to service initialized');
    }
  }

  /**
   * Check if Dev.to service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Convert HTML content to Markdown (basic conversion)
   */
  private htmlToMarkdown(html: string): string {
    // Basic HTML to Markdown conversion
    let markdown = html
      .replace(/<h2>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<p>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<ul>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
      .trim();

    return markdown;
  }

  /**
   * Publish article to Dev.to
   */
  async publishArticle(post: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    canonical_url?: string;
    featuredImage?: string;
    publish?: boolean;
  }): Promise<{ success: boolean; articleId?: number; url?: string; error?: string }> {
    if (!this.enabled || !this.apiKey) {
      return { success: false, error: 'Dev.to service not configured' };
    }

    try {
      // Convert HTML to Markdown
      const bodyMarkdown = this.htmlToMarkdown(post.content);

      // Add canonical URL at the top if provided
      const canonicalNote = post.canonical_url 
        ? `\n\n---\n\n*This article was originally published on [Cryptorafts](${post.canonical_url})*\n\n---\n\n`
        : '';

      const article: DevToArticle = {
        title: post.title,
        body_markdown: canonicalNote + bodyMarkdown,
        published: post.publish !== false, // Default to published
        main_image: post.featuredImage,
        canonical_url: post.canonical_url,
        description: post.excerpt,
        tags: post.tags?.slice(0, 4) || [], // Dev.to allows max 4 tags
      };

      const response = await fetch(`${this.baseUrl}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({ article }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Dev.to API error:', error);
        return { success: false, error: `Dev.to API error: ${response.status}` };
      }

      const result: DevToResponse = await response.json();
      console.log('✅ Article published to Dev.to:', result.url);

      return {
        success: true,
        articleId: result.id,
        url: result.url,
      };
    } catch (error: any) {
      console.error('❌ Failed to publish to Dev.to:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const devToService = new DevToService();

