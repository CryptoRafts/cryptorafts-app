/**me 
 * Medium API Service
 * Integrates with Medium API for publishing articles
 * Requires OAuth 2.0 authentication
 */

interface MediumConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  redirectUri?: string;
}

interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
  imageUrl: string;
}

interface MediumPost {
  title: string;
  contentFormat: 'html' | 'markdown';
  content: string;
  tags?: string[];
  publishStatus: 'draft' | 'public' | 'unlisted';
  canonicalUrl?: string;
  notifyFollowers?: boolean;
}

interface MediumResponse {
  data: {
    id: string;
    title: string;
    authorId: string;
    tags: string[];
    url: string;
    canonicalUrl: string;
    publishStatus: string;
    publishedAt?: number;
    license: string;
    licenseUrl: string;
  };
}

class MediumService {
  private config: MediumConfig;
  private enabled: boolean = false;
  private baseUrl = 'https://api.medium.com/v1';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.config = {
      clientId: process.env.MEDIUM_CLIENT_ID,
      clientSecret: process.env.MEDIUM_CLIENT_SECRET,
      accessToken: process.env.MEDIUM_ACCESS_TOKEN,
      refreshToken: process.env.MEDIUM_REFRESH_TOKEN,
      redirectUri: process.env.MEDIUM_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/blog/oauth/medium/callback`,
    };

    this.enabled = !!(this.config.clientId && this.config.clientSecret);
    
    if (this.enabled) {
      console.log('✅ Medium Service initialized');
    } else {
      console.warn('⚠️ Medium Service: Missing credentials. Set MEDIUM_CLIENT_ID and MEDIUM_CLIENT_SECRET');
    }
  }

  /**
   * Check if Medium service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.config.clientId || !this.config.redirectUri) {
      throw new Error('Medium OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'basicProfile,publishPost',
      response_type: 'code',
      state: state || 'medium_oauth',
    });

    return `https://medium.com/m/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
      throw new Error('Medium OAuth not configured');
    }

    try {
      const response = await fetch('https://api.medium.com/v1/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Medium token exchange failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error: any) {
      console.error('❌ Medium token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get authenticated user info
   */
  async getUserInfo(accessToken: string): Promise<MediumUser> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Medium API error: ${error}`);
      }

      const data = await response.json();
      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        url: data.data.url,
        imageUrl: data.data.imageUrl,
      };
    } catch (error: any) {
      console.error('❌ Medium getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * Get user's publications (if any)
   */
  async getUserPublications(accessToken: string): Promise<any[]> {
    try {
      const user = await this.getUserInfo(accessToken);
      const response = await fetch(`${this.baseUrl}/users/${user.id}/publications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // User might not have publications, return empty array
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error('❌ Medium getUserPublications error:', error);
      return [];
    }
  }

  /**
   * Publish article to Medium
   */
  async publishArticle(
    accessToken: string,
    post: MediumPost,
    publicationId?: string
  ): Promise<{ success: boolean; articleId?: string; url?: string; error?: string }> {
    try {
      const user = await this.getUserInfo(accessToken);
      
      // Determine the author ID (user or publication)
      const authorId = publicationId ? `publications/${publicationId}` : `users/${user.id}`;
      
      // Prepare content
      const articleData: any = {
        title: post.title,
        contentFormat: post.contentFormat || 'html',
        content: post.content,
        publishStatus: post.publishStatus || 'public',
        tags: post.tags?.slice(0, 5) || [], // Medium allows max 5 tags
      };

      if (post.canonicalUrl) {
        articleData.canonicalUrl = post.canonicalUrl;
      }

      if (post.notifyFollowers !== undefined) {
        articleData.notifyFollowers = post.notifyFollowers;
      }

      const url = `${this.baseUrl}/${authorId}/posts`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Medium API error:', error);
        return { success: false, error: `Medium API error: ${response.status}` };
      }

      const result: MediumResponse = await response.json();
      console.log('✅ Article published to Medium:', result.data.url);

      return {
        success: true,
        articleId: result.data.id,
        url: result.data.url,
      };
    } catch (error: any) {
      console.error('❌ Failed to publish to Medium:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert HTML to Medium-compatible format
   */
  htmlToMediumFormat(html: string): string {
    // Medium supports HTML, but we can clean it up
    // Remove script tags and style tags for security
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .trim();

    // Add canonical URL note if needed (will be added by publishArticle)
    return cleaned;
  }
}

// Export singleton instance
export const mediumService = new MediumService();

