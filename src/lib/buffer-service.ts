/**
 * Buffer API Service
 * Integrates with Buffer to post to multiple platforms (X, Medium, etc.)
 */

interface BufferConfig {
  accessToken?: string;
  profileIds?: string[];
}

interface BufferProfile {
  id: string;
  service: string; // 'twitter', 'medium', etc.
  service_username: string;
  service_id: string;
  avatar_media_url?: string;
}

interface BufferPost {
  profile_ids: string[];
  text: string;
  media?: {
    link?: string;
    photo?: string;
    thumbnail?: string;
  };
  shorten?: boolean;
  top?: boolean;
  now?: boolean;
  scheduled_at?: number;
}

interface BufferResponse {
  success: boolean;
  updates?: Array<{
    id: string;
    profile_id: string;
    status: string;
  }>;
  message?: string;
}

class BufferService {
  private config: BufferConfig;
  private enabled: boolean = false;
  private baseUrl = 'https://api.bufferapp.com/1';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.config = {
      accessToken: process.env.BUFFER_ACCESS_TOKEN,
      profileIds: process.env.BUFFER_PROFILE_IDS?.split(',').map(id => id.trim()) || [],
    };

    this.enabled = !!(this.config.accessToken);

    if (this.enabled) {
      console.log('✅ Buffer Service initialized');
      if (this.config.profileIds && this.config.profileIds.length > 0) {
        console.log(`   Configured ${this.config.profileIds.length} profile(s)`);
      }
    } else {
      console.warn('⚠️ Buffer Service: Missing BUFFER_ACCESS_TOKEN. Set it in .env.local');
    }
  }

  /**
   * Check if Buffer service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all connected profiles
   */
  async getProfiles(): Promise<BufferProfile[]> {
    if (!this.enabled || !this.config.accessToken) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/profiles.json`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Buffer API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching Buffer profiles:', error);
      return [];
    }
  }

  /**
   * Get profiles by service (e.g., 'twitter', 'medium')
   */
  async getProfilesByService(service: string): Promise<BufferProfile[]> {
    const allProfiles = await this.getProfiles();
    return allProfiles.filter(profile => 
      profile.service?.toLowerCase() === service.toLowerCase()
    );
  }

  /**
   * Post to Buffer (which will post to connected profiles)
   */
  async postToBuffer(
    title: string,
    excerpt: string,
    url: string,
    profileIds?: string[],
    options?: {
      now?: boolean;
      scheduledAt?: Date;
      media?: string;
    }
  ): Promise<{ success: boolean; updateIds?: string[]; error?: string }> {
    if (!this.enabled || !this.config.accessToken) {
      return { success: false, error: 'Buffer service not configured' };
    }

    try {
      // Use provided profile IDs or default ones
      const targetProfileIds = profileIds || this.config.profileIds || [];

      if (targetProfileIds.length === 0) {
        return { success: false, error: 'No Buffer profiles configured' };
      }

      // Format the post text
      const postText = `${title}\n\n${excerpt}\n\n${url}`;

      const postData: BufferPost = {
        profile_ids: targetProfileIds,
        text: postText,
        shorten: true,
        top: true,
      };

      // Add media if provided
      if (options?.media) {
        postData.media = {
          photo: options.media,
          link: url,
        };
      }

      // Schedule or post now
      if (options?.scheduledAt) {
        postData.scheduled_at = Math.floor(options.scheduledAt.getTime() / 1000);
      } else {
        postData.now = options?.now !== false; // Default to posting now
      }

      const response = await fetch(`${this.baseUrl}/updates/create.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(postData),
      });

      const data: BufferResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Buffer API error');
      }

      console.log('✅ Posted to Buffer successfully');
      return {
        success: true,
        updateIds: data.updates?.map(u => u.id),
      };
    } catch (error: any) {
      console.error('❌ Buffer post error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post to specific platforms via Buffer
   */
  async postToPlatforms(
    title: string,
    excerpt: string,
    url: string,
    platforms: string[] = ['twitter', 'medium'],
    options?: {
      now?: boolean;
      scheduledAt?: Date;
      media?: string;
    }
  ): Promise<{ success: boolean; results: any[] }> {
    if (!this.enabled) {
      return { success: false, results: [] };
    }

    try {
      // Get profiles for requested platforms
      const allProfiles = await this.getProfiles();
      const targetProfiles = allProfiles.filter(profile =>
        platforms.some(platform => 
          profile.service?.toLowerCase() === platform.toLowerCase()
        )
      );

      if (targetProfiles.length === 0) {
        return {
          success: false,
          results: [{ error: 'No profiles found for requested platforms' }],
        };
      }

      const profileIds = targetProfiles.map(p => p.id);

      // Post to Buffer
      const result = await this.postToBuffer(
        title,
        excerpt,
        url,
        profileIds,
        options
      );

      return {
        success: result.success,
        results: targetProfiles.map(profile => ({
          platform: profile.service,
          username: profile.service_username,
          success: result.success,
          updateId: result.updateIds?.[0],
        })),
      };
    } catch (error: any) {
      console.error('❌ Error posting to platforms via Buffer:', error);
      return { success: false, results: [{ error: error.message }] };
    }
  }
}

// Export singleton instance
export const bufferService = new BufferService();

