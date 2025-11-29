/**
 * IFTTT Service for Blog Automation
 * 
 * Triggers IFTTT webhooks for blog post events
 * Docs: https://ifttt.com/maker_webhooks
 */

interface IFTTTWebhookPayload {
  value1?: string;
  value2?: string;
  value3?: string;
}

class IFTTTService {
  private webhookKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl = 'https://maker.ifttt.com/trigger';

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.webhookKey = process.env.IFTTT_WEBHOOK_KEY || null;
    this.enabled = !!this.webhookKey;

    if (!this.enabled) {
      console.log('⚠️ IFTTT service not configured (missing IFTTT_WEBHOOK_KEY)');
    } else {
      console.log('✅ IFTTT service initialized');
    }
  }

  /**
   * Check if IFTTT service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Trigger IFTTT webhook event
   */
  async triggerEvent(
    eventName: string,
    payload: IFTTTWebhookPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.enabled || !this.webhookKey) {
      return { success: false, error: 'IFTTT service not configured' };
    }

    try {
      const url = `${this.baseUrl}/${eventName}/with/key/${this.webhookKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ IFTTT webhook error:', error);
        return { success: false, error: `IFTTT error: ${response.status}` };
      }

      const result = await response.json();
      console.log('✅ IFTTT event triggered:', eventName);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to trigger IFTTT event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify about new blog post
   */
  async notifyNewPost(post: {
    title: string;
    url: string;
    status: string;
  }): Promise<boolean> {
    const result = await this.triggerEvent('blog_post_created', {
      value1: post.title,
      value2: post.url,
      value3: post.status,
    });

    return result.success;
  }
}

// Export singleton instance
export const iftttService = new IFTTTService();

