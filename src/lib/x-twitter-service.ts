/**
 * X (Twitter) API v2 Service
 * Integrates with Twitter API v2 for posting tweets
 * Requires OAuth 2.0 authentication
 */

interface TwitterConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  redirectUri?: string;
  apiKey?: string;
  apiSecret?: string;
  bearerToken?: string;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface TwitterPost {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
  quoteTweetId?: string;
}

interface TwitterResponse {
  data: {
    id: string;
    text: string;
    edit_history_tweet_ids: string[];
  };
  errors?: Array<{ message: string; code: number }>;
}

class XTwitterService {
  private config: TwitterConfig;
  private enabled: boolean = false;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.config = {
      clientId: process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN,
      refreshToken: process.env.TWITTER_REFRESH_TOKEN || process.env.X_REFRESH_TOKEN,
      redirectUri: process.env.TWITTER_REDIRECT_URI || process.env.X_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/blog/oauth/x/callback`,
      apiKey: process.env.TWITTER_API_KEY || process.env.X_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET || process.env.X_API_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN,
    };

    // Enable if we have OAuth 2.0 credentials OR Bearer token
    this.enabled = !!(
      (this.config.clientId && this.config.clientSecret) ||
      this.config.bearerToken ||
      (this.config.apiKey && this.config.apiSecret && this.config.accessToken)
    );

    if (this.enabled) {
      console.log('✅ X (Twitter) Service initialized');
    } else {
      console.warn('⚠️ X (Twitter) Service: Missing credentials. Set TWITTER_CLIENT_ID/SECRET or TWITTER_BEARER_TOKEN');
    }
  }

  /**
   * Check if Twitter service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get OAuth 2.0 authorization URL
   * Note: For server-side, PKCE will be handled in the authorize route
   */
  getAuthorizationUrl(state?: string, codeChallenge?: string): string {
    if (!this.config.clientId || !this.config.redirectUri) {
      throw new Error('Twitter OAuth 2.0 not configured');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: state || 'twitter_oauth',
    });

    // Add PKCE if provided
    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE code challenge (async for crypto.subtle)
   */
  async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } else {
      // Fallback: use a simple hash (not secure, but works for basic cases)
      // In production, always use crypto.subtle
      const hash = await this.simpleHash(verifier);
      return btoa(hash)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
  }

  /**
   * Simple hash fallback (not cryptographically secure)
   * Note: This is a fallback - in production, always use crypto.subtle
   */
  private async simpleHash(str: string): Promise<string> {
    // Simple hash for fallback - creates a string that can be base64 encoded
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    // Create a simple hash-like string
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += String.fromCharCode(data[i] ^ (i % 256));
    }
    return hash;
  }

  /**
   * Exchange authorization code for access token (OAuth 2.0)
   */
  async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
      throw new Error('Twitter OAuth 2.0 not configured');
    }

    try {
      // Get code verifier from session if not provided
      if (!codeVerifier && typeof window !== 'undefined') {
        codeVerifier = sessionStorage.getItem('twitter_code_verifier') || undefined;
      }

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier || '',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter token exchange failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error: any) {
      console.error('❌ Twitter token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get authenticated user info
   */
  async getUserInfo(accessToken?: string): Promise<TwitterUser> {
    const token = accessToken || this.config.accessToken || this.config.bearerToken;
    if (!token) {
      throw new Error('Twitter access token not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/me?user.fields=profile_image_url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter API error: ${error}`);
      }

      const data = await response.json();
      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        profile_image_url: data.data.profile_image_url,
      };
    } catch (error: any) {
      console.error('❌ Twitter getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(
    post: TwitterPost,
    accessToken?: string
  ): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    const token = accessToken || this.config.accessToken || this.config.bearerToken;
    if (!token) {
      return { success: false, error: 'Twitter access token not available' };
    }

    try {
      // Validate text length (200 characters for X/Twitter as per user requirement)
      if (post.text.length > 200) {
        return { success: false, error: 'Tweet text exceeds 200 characters' };
      }

      const tweetData: any = {
        text: post.text,
      };

      if (post.mediaIds && post.mediaIds.length > 0) {
        tweetData.media = {
          media_ids: post.mediaIds.slice(0, 4), // Twitter allows max 4 media items
        };
      }

      if (post.replyToTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: post.replyToTweetId,
        };
      }

      if (post.quoteTweetId) {
        tweetData.quote_tweet_id = post.quoteTweetId;
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errors?.[0]?.message || `Twitter API error: ${response.status}`;
        console.error('❌ Twitter API error:', errorMessage);
        return { success: false, error: errorMessage };
      }

      const result: TwitterResponse = await response.json();
      console.log('✅ Tweet posted successfully:', result.data.id);

      return {
        success: true,
        tweetId: result.data.id,
      };
    } catch (error: any) {
      console.error('❌ Failed to post tweet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload media (image) to Twitter
   */
  async uploadMedia(file: File | Buffer, accessToken?: string): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    const token = accessToken || this.config.accessToken;
    if (!token) {
      return { success: false, error: 'Twitter access token not available' };
    }

    try {
      // Twitter media upload requires different endpoint
      const formData = new FormData();
      if (file instanceof File) {
        formData.append('media', file);
      } else {
        formData.append('media', new Blob([file]));
      }

      const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter media upload failed: ${error}`);
      }

      const data = await response.json();
      return {
        success: true,
        mediaId: data.media_id_string,
      };
    } catch (error: any) {
      console.error('❌ Failed to upload media to Twitter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format blog post for Twitter (with link)
   * X (Twitter) has a 200 character limit (strict requirement)
   * Format: Title + excerpt + URL + hashtags (all within 200 chars)
   */
  formatPostForTwitter(title: string, excerpt: string, url: string, hashtags?: string[]): string {
    // X (Twitter) character limit: 200 characters (strict requirement)
    const maxLength = 200;
    const urlLength = 23; // Twitter shortens URLs to ~23 chars
    const newlineLength = 1; // Each \n counts as 1 character
    
    // Prepare hashtags (max 2, format as #tag1 #tag2)
    let hashtagText = '';
    if (hashtags && hashtags.length > 0) {
      const formattedHashtags = hashtags
        .slice(0, 2)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .join(' ');
      hashtagText = formattedHashtags;
    }
    
    // Calculate space needed for URL + hashtags + newlines
    // Format: "content\nURL\nhashtags"
    const urlWithNewline = urlLength + newlineLength; // URL + \n before it
    const hashtagWithNewline = hashtagText ? hashtagText.length + newlineLength : 0; // Hashtags + \n before it
    const reservedSpace = urlWithNewline + hashtagWithNewline;
    
    // Available space for title + excerpt
    const availableForContent = maxLength - reservedSpace;
    
    // Build content (title + excerpt)
    let content = '';
    if (title.length <= availableForContent) {
      // Title fits, add it
      content = title;
      const remainingSpace = availableForContent - title.length;
      
      // Add excerpt if there's space (at least 10 chars for excerpt)
      if (excerpt && remainingSpace > 10) {
        const excerptToAdd = excerpt.length <= remainingSpace 
          ? excerpt 
          : excerpt.substring(0, remainingSpace - 3) + '...';
        content = `${content} ${excerptToAdd}`;
      }
    } else {
      // Title is too long, truncate it
      content = title.substring(0, availableForContent - 3) + '...';
    }
    
    // Build final text: content + URL + hashtags
    let text = content;
    if (url) {
      text = `${text}\n${url}`;
    }
    if (hashtagText) {
      text = `${text}\n${hashtagText}`;
    }
    
    // Final safety check - ensure we're exactly within 200 characters
    if (text.length > maxLength) {
      // Emergency truncation: keep URL and hashtags, truncate content
      const lines = text.split('\n');
      const urlLine = lines.find(line => line.startsWith('http')) || '';
      const hashtagLine = lines.find(line => line.startsWith('#')) || '';
      
      const reservedForUrl = urlLine ? urlLine.length + 1 : 0; // +1 for \n
      const reservedForHashtags = hashtagLine ? hashtagLine.length + 1 : 0; // +1 for \n
      const contentMax = maxLength - reservedForUrl - reservedForHashtags;
      
      // Truncate content line
      const contentLine = lines[0];
      const truncatedContent = contentLine.substring(0, Math.max(0, contentMax - 3)) + '...';
      
      // Rebuild
      text = truncatedContent;
      if (urlLine) text = `${text}\n${urlLine}`;
      if (hashtagLine) text = `${text}\n${hashtagLine}`;
    }
    
    // Final validation - must be <= 200
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
    }
    
    return text;
  }
}

// Export singleton instance
export const xTwitterService = new XTwitterService();

