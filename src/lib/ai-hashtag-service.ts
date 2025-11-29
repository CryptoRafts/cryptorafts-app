/**
 * AI Hashtag Suggestion Service
 * Suggests trending hashtags for viral posts using AI
 */

import { OpenAIService } from './raftai/openai-service';
import { googleTrendsService } from './google-trends-service';

interface HashtagSuggestion {
  hashtag: string;
  score: number; // 0-100 viral potential score
  reason: string;
  category: string;
}

class AIHashtagService {
  private static instance: AIHashtagService;

  static getInstance(): AIHashtagService {
    if (!AIHashtagService.instance) {
      AIHashtagService.instance = new AIHashtagService();
    }
    return AIHashtagService.instance;
  }

  /**
   * Get AI-suggested hashtags for viral posts
   */
  async suggestHashtags(
    content: string,
    category: string = 'crypto',
    count: number = 10
  ): Promise<HashtagSuggestion[]> {
    try {
      // Get trending hashtags from Google Trends
      const trendingHashtags = await googleTrendsService.getTrendingHashtags(15);
      
      // Use OpenAI to analyze content and suggest best hashtags
      const openaiService = OpenAIService.getInstance();
      
      if (!openaiService.isEnabled()) {
        // Fallback to trending hashtags
        return this.formatTrendingHashtags(trendingHashtags, count);
      }

      const prompt = `Analyze this ${category} content and suggest ${count} viral hashtags that will maximize engagement and reach.

Content: ${content.substring(0, 500)}

Trending hashtags: ${trendingHashtags.join(', ')}

Return JSON array with:
{
  "hashtags": [
    {
      "hashtag": "#crypto",
      "score": 95,
      "reason": "High engagement, trending topic",
      "category": "crypto"
    }
  ]
}

Prioritize:
1. Trending hashtags with high engagement
2. Category-specific hashtags
3. Broad appeal hashtags
4. Niche but viral potential hashtags

Score (0-100) based on:
- Trending status (40 points)
- Engagement potential (30 points)
- Relevance to content (20 points)
- Viral potential (10 points)`;

      const response = await openaiService.chatWithJSON(prompt, {
        userRole: 'social-media-manager',
      });

      const result = JSON.parse(response);
      
      if (result.hashtags && Array.isArray(result.hashtags)) {
        return result.hashtags.slice(0, count);
      }

      // Fallback
      return this.formatTrendingHashtags(trendingHashtags, count);

    } catch (error) {
      console.error('Error getting AI hashtag suggestions:', error);
      // Fallback to trending hashtags
      const trendingHashtags = await googleTrendsService.getTrendingHashtags(count);
      return this.formatTrendingHashtags(trendingHashtags, count);
    }
  }

  /**
   * Get platform-specific hashtag suggestions
   */
  async suggestPlatformHashtags(
    content: string,
    platform: 'linkedin' | 'x' | 'telegram' | 'instagram' | 'tiktok',
    count: number = 5
  ): Promise<HashtagSuggestion[]> {
    const platformGuidelines: Record<string, string> = {
      linkedin: 'Professional, business-focused, 3-5 hashtags max',
      x: 'Trending, concise, 2-3 hashtags max, high engagement',
      telegram: 'Community-focused, crypto-specific, 3-5 hashtags',
      instagram: 'Visual, lifestyle, 5-10 hashtags, mix trending and niche',
      tiktok: 'Viral, trending, 3-5 hashtags, high engagement potential',
    };

    const allSuggestions = await this.suggestHashtags(content, 'crypto', count * 2);
    
    // Filter and prioritize for platform
    return allSuggestions
      .filter((h, index) => index < count)
      .map(h => ({
        ...h,
        reason: `${h.reason} (Optimized for ${platform})`,
      }));
  }

  /**
   * Format trending hashtags into suggestion format
   */
  private formatTrendingHashtags(
    hashtags: string[],
    count: number
  ): HashtagSuggestion[] {
    return hashtags.slice(0, count).map((hashtag, index) => ({
      hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
      score: 100 - (index * 5), // Decreasing score
      reason: 'Trending topic with high engagement potential',
      category: 'crypto',
    }));
  }

  /**
   * Get viral hashtag mix (trending + niche + evergreen)
   */
  async getViralHashtagMix(content: string): Promise<{
    trending: HashtagSuggestion[];
    niche: HashtagSuggestion[];
    evergreen: HashtagSuggestion[];
  }> {
    const allSuggestions = await this.suggestHashtags(content, 'crypto', 15);
    
    return {
      trending: allSuggestions.filter((h, i) => i < 5 && h.score > 80),
      niche: allSuggestions.filter((h, i) => i >= 5 && i < 10),
      evergreen: allSuggestions.filter((h, i) => i >= 10),
    };
  }
}

export const aiHashtagService = AIHashtagService.getInstance();
export { AIHashtagService };

