/**
 * Social Media Auto-Share Service
 * Integrates with Buffer, Twitter, Facebook, LinkedIn APIs for automatic content sharing
 */

interface ShareConfig {
  buffer?: {
    accessToken: string;
    profileIds?: string[];
  };
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  facebook?: {
    appId: string;
    appSecret: string;
    pageAccessToken: string;
  };
  linkedin?: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
  };
  telegram?: {
    botToken: string;
    chatId: string;
  };
}

interface ShareResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

class SocialShareService {
  private config: ShareConfig;
  private enabled: boolean = false;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.config = {
      buffer: process.env.BUFFER_ACCESS_TOKEN ? {
        accessToken: process.env.BUFFER_ACCESS_TOKEN,
        profileIds: process.env.BUFFER_PROFILE_IDS?.split(',') || [],
      } : undefined,
      twitter: (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) ? {
        apiKey: process.env.TWITTER_API_KEY!,
        apiSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
      } : undefined,
      facebook: (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN) ? {
        appId: process.env.FACEBOOK_APP_ID!,
        appSecret: process.env.FACEBOOK_APP_SECRET!,
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN!,
      } : undefined,
      linkedin: (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_ACCESS_TOKEN) ? {
        clientId: process.env.LINKEDIN_CLIENT_ID!,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN!,
      } : undefined,
      telegram: (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ? {
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        chatId: process.env.TELEGRAM_CHAT_ID!,
      } : undefined,
    };

    // Check if at least one platform is configured
    this.enabled = !!(
      this.config.buffer ||
      this.config.twitter ||
      this.config.facebook ||
      this.config.linkedin ||
      this.config.telegram
    );

    if (this.enabled) {
      console.log('✅ Social Share Service initialized with platforms:', this.getEnabledPlatforms());
    } else {
      console.warn('⚠️ Social Share Service: No platforms configured. Set environment variables to enable.');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getEnabledPlatforms(): string[] {
    const platforms: string[] = [];
    if (this.config.buffer) platforms.push('Buffer');
    if (this.config.twitter) platforms.push('Twitter');
    if (this.config.facebook) platforms.push('Facebook');
    if (this.config.linkedin) platforms.push('LinkedIn');
    if (this.config.telegram) platforms.push('Telegram');
    return platforms;
  }

  /**
   * Share a blog post to all configured platforms
   */
  async shareBlogPost(
    title: string,
    excerpt: string,
    url: string,
    platforms: string[] = []
  ): Promise<ShareResult[]> {
    if (!this.enabled) {
      console.warn('⚠️ Social Share Service not configured');
      return [];
    }

    const results: ShareResult[] = [];

    // If specific platforms requested, only share to those
    const targetPlatforms = platforms.length > 0 ? platforms : this.getEnabledPlatforms().map(p => p.toLowerCase());

    // Share to Buffer (which can handle multiple platforms)
    if (targetPlatforms.includes('buffer') && this.config.buffer) {
      try {
        const result = await this.shareToBuffer(title, excerpt, url);
        results.push(result);
      } catch (error: any) {
        results.push({
          platform: 'buffer',
          success: false,
          error: error.message,
        });
      }
    }

    // Share to Twitter
    if (targetPlatforms.includes('twitter') && this.config.twitter) {
      try {
        const result = await this.shareToTwitter(title, url);
        results.push(result);
      } catch (error: any) {
        results.push({
          platform: 'twitter',
          success: false,
          error: error.message,
        });
      }
    }

    // Share to Facebook
    if (targetPlatforms.includes('facebook') && this.config.facebook) {
      try {
        const result = await this.shareToFacebook(title, excerpt, url);
        results.push(result);
      } catch (error: any) {
        results.push({
          platform: 'facebook',
          success: false,
          error: error.message,
        });
      }
    }

    // Share to LinkedIn
    if (targetPlatforms.includes('linkedin') && this.config.linkedin) {
      try {
        const result = await this.shareToLinkedIn(title, excerpt, url);
        results.push(result);
      } catch (error: any) {
        results.push({
          platform: 'linkedin',
          success: false,
          error: error.message,
        });
      }
    }

    // Share to Telegram
    if (targetPlatforms.includes('telegram') && this.config.telegram) {
      try {
        const result = await this.shareToTelegram(title, excerpt, url);
        results.push(result);
      } catch (error: any) {
        results.push({
          platform: 'telegram',
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Share to Buffer (supports multiple platforms through Buffer)
   */
  private async shareToBuffer(title: string, excerpt: string, url: string): Promise<ShareResult> {
    try {
      const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.buffer!.accessToken}`,
        },
        body: JSON.stringify({
          profile_ids: this.config.buffer!.profileIds,
          text: `${title}\n\n${excerpt}\n\n${url}`,
          shorten: true,
          top: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Buffer API error');
      }

      console.log('✅ Shared to Buffer successfully');
      return {
        platform: 'buffer',
        success: true,
        postId: data.updates?.[0]?.id,
      };
    } catch (error: any) {
      console.error('❌ Buffer share error:', error);
      throw error;
    }
  }

  /**
   * Share to Twitter
   */
  private async shareToTwitter(title: string, url: string): Promise<ShareResult> {
    // Note: Twitter API v2 requires OAuth 2.0 or OAuth 1.0a
    // This is a simplified implementation
    
    try {
      const status = `${title}\n\n${url}`;
      
      // Twitter API v2 endpoint
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.twitter!.accessToken}`,
        },
        body: JSON.stringify({
          text: status,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.errors) {
        throw new Error(data.errors?.[0]?.message || 'Twitter API error');
      }

      console.log('✅ Shared to Twitter successfully');
      return {
        platform: 'twitter',
        success: true,
        postId: data.data?.id,
      };
    } catch (error: any) {
      console.error('❌ Twitter share error:', error);
      throw error;
    }
  }

  /**
   * Share to Facebook Page
   */
  private async shareToFacebook(title: string, excerpt: string, url: string): Promise<ShareResult> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${title}\n\n${excerpt}`,
          link: url,
          access_token: this.config.facebook!.pageAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Facebook API error');
      }

      console.log('✅ Shared to Facebook successfully');
      return {
        platform: 'facebook',
        success: true,
        postId: data.id,
      };
    } catch (error: any) {
      console.error('❌ Facebook share error:', error);
      throw error;
    }
  }

  /**
   * Share to LinkedIn
   */
  private async shareToLinkedIn(title: string, excerpt: string, url: string): Promise<ShareResult> {
    // LinkedIn API requires a different approach - simplified here
    try {
      // Note: Actual implementation would require proper LinkedIn API authentication
      // This is a placeholder showing the structure
      
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.linkedin!.accessToken}`,
        },
        body: JSON.stringify({
          author: 'urn:li:organization:YOUR_ORG_ID',
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: `${title}\n\n${excerpt}`,
              },
              shareMediaCategory: 'ARTICLE',
              media: [
                {
                  status: 'READY',
                  originalUrl: url,
                },
              ],
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.errorCode) {
        throw new Error(data.message || 'LinkedIn API error');
      }

      console.log('✅ Shared to LinkedIn successfully');
      return {
        platform: 'linkedin',
        success: true,
        postId: data.id,
      };
    } catch (error: any) {
      console.error('❌ LinkedIn share error:', error);
      throw error;
    }
  }

  /**
   * Share to Telegram
   */
  private async shareToTelegram(title: string, excerpt: string, url: string): Promise<ShareResult> {
    try {
      const message = `<b>${title}</b>\n\n${excerpt}\n\n<a href="${url}">Read more →</a>`;

      const response = await fetch(
        `https://api.telegram.org/bot${this.config.telegram!.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.telegram!.chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok || data.error_code) {
        throw new Error(data.description || 'Telegram API error');
      }

      console.log('✅ Shared to Telegram successfully');
      return {
        platform: 'telegram',
        success: true,
        postId: data.result?.message_id?.toString(),
      };
    } catch (error: any) {
      console.error('❌ Telegram share error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const socialShareService = new SocialShareService();

