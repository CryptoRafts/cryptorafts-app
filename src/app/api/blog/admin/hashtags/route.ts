/**
 * AI Hashtag Suggestion API
 * 
 * POST /api/blog/admin/hashtags
 * 
 * Get AI-suggested hashtags for viral posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiHashtagService } from '@/lib/ai-hashtag-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, category, platform, count } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    let suggestions;

    if (platform) {
      // Platform-specific suggestions
      suggestions = await aiHashtagService.suggestPlatformHashtags(
        content,
        platform,
        count || 5
      );
    } else {
      // General suggestions
      suggestions = await aiHashtagService.suggestHashtags(
        content,
        category || 'crypto',
        count || 10
      );
    }

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });

  } catch (error: any) {
    console.error('❌ Error getting hashtag suggestions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get hashtag suggestions' },
      { status: 500 }
    );
  }
}

