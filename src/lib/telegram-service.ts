/**
 * Telegram Service for Blog Automation Notifications
 * 
 * Sends notifications to Telegram when blog posts are generated
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

class TelegramService {
  private botToken: string | null = null;
  private chatId: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.chatId = process.env.TELEGRAM_CHAT_ID || null;
    this.enabled = !!(this.botToken && this.chatId);

    if (!this.enabled) {
      console.log('⚠️ Telegram service not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
    } else {
      console.log('✅ Telegram service initialized');
    }
  }

  /**
   * Check if Telegram service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    if (!this.enabled || !this.botToken || !this.chatId) {
      console.warn('⚠️ Telegram not configured, skipping notification');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const payload: TelegramMessage = {
        chat_id: this.chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        console.log('✅ Telegram notification sent');
        return true;
      } else {
        console.error('❌ Telegram API error:', result.description);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to send Telegram notification:', error.message);
      return false;
    }
  }

  /**
   * Send blog post notification
   */
  async notifyBlogPostCreated(post: {
    title: string;
    status: 'draft' | 'published';
    canonical_url: string;
    category: string;
    tags: string[];
    reading_time?: number;
  }): Promise<boolean> {
    const statusEmoji = post.status === 'published' ? '✅' : '📝';
    const statusText = post.status === 'published' ? 'Published' : 'Draft';
    
    const message = `
${statusEmoji} <b>New Blog Post Generated</b>

<b>Title:</b> ${post.title}
<b>Status:</b> ${statusText}
<b>Category:</b> ${post.category}
<b>Tags:</b> ${post.tags.join(', ')}
${post.reading_time ? `<b>Reading Time:</b> ${post.reading_time} min` : ''}

<b>Link:</b> <a href="${post.canonical_url}">${post.canonical_url}</a>
    `.trim();

    return this.sendMessage(message, 'HTML');
  }

  /**
   * Send error notification
   */
  async notifyError(error: string, context?: string): Promise<boolean> {
    const message = `
❌ <b>Blog Automation Error</b>

${context ? `<b>Context:</b> ${context}\n` : ''}
<b>Error:</b> ${error}

<i>Check logs for details</i>
    `.trim();

    return this.sendMessage(message, 'HTML');
  }

  /**
   * Send success notification
   */
  async notifySuccess(message: string): Promise<boolean> {
    const formattedMessage = `✅ <b>Success</b>\n\n${message}`;
    return this.sendMessage(formattedMessage, 'HTML');
  }
}

// Export singleton instance
export const telegramService = new TelegramService();

