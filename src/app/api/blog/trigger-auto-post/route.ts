/**
 * Manual Trigger: Auto-Post Blog
 * 
 * This endpoint allows manual triggering of auto-post
 * Can be called from admin dashboard or manually
 * 
 * GET /api/blog/trigger-auto-post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebaseAdmin';
import { OpenAIService } from '@/lib/raftai/openai-service';
import { blogServiceServer } from '@/lib/blog-service.server';
import { googleTrendsService } from '@/lib/google-trends-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🤖 Manual auto-post trigger');
    
    // Try to get admin DB first
    let db;
    try {
      db = getAdminDb();
    } catch (error) {
      // Fallback: use client-side approach
      console.log('⚠️ Admin DB not available, will use client-side method');
      return NextResponse.json({
        success: false,
        error: 'Please use the cron endpoint or trigger from admin dashboard',
        useEndpoint: '/api/blog/cron/auto-post'
      }, { status: 503 });
    }

    if (!db) {
      throw new Error('Database not available');
    }

    // Check if auto-posting is enabled
    const settingsRef = db.collection('blog_settings').doc('auto_posting');
    const settingsDoc = await settingsRef.get();
    const settings = settingsDoc.data();
    
    if (!settings?.enabled) {
      console.log('⏸️ Auto-posting is disabled');
      return NextResponse.json({
        success: false,
        message: 'Auto-posting is disabled. Enable it in admin dashboard first.',
        skipped: true
      });
    }

    console.log('✅ Auto-posting is enabled, generating blog post...');

    // Check OpenAI service
    const openaiService = OpenAIService.getInstance();
    if (!openaiService.isEnabled()) {
      throw new Error('OpenAI service not enabled. Check OPENAI_API_KEY in environment variables.');
    }

    // Check if we already posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    
    const postsRef = db.collection('blog_posts');
    const todayPostsQuery = await postsRef
      .where('createdAt', '>=', todayStart)
      .where('status', '==', 'published')
      .limit(1)
      .get();
    
    if (!todayPostsQuery.empty) {
      console.log('ℹ️ Blog post already created today');
      return NextResponse.json({
        success: true,
        message: 'Blog post already created today',
        skipped: true
      });
    }

    // Generate blog post
    const trendingTopics = await googleTrendsService.getTrendingTopics(15);
    const selectedTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    console.log(`📈 Selected trending topic: ${selectedTopic.keyword}`);

    const currentDate = new Date().toISOString().split('T')[0];
    const sourceId = `auto-manual-${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
    
    const trendingHashtags = await googleTrendsService.getTrendingHashtags(5);
    const hashtagsString = trendingHashtags.join(' ');

    const prompt = `Generate one high-quality, SEO-optimized blog post for Cryptorafts about: ${selectedTopic.keyword}

CRITICAL REQUIREMENTS:
- Generate 800-1500 words of unique, engaging content
- Focus on: ${selectedTopic.keyword} in the context of cryptocurrency, blockchain, Web3, DeFi, or NFTs
- Include trending hashtags: ${hashtagsString}
- Write in a professional but accessible tone
- Include practical insights, examples, and actionable information
- Optimize for SEO with relevant keywords
- Current date: ${currentDate}

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling blog post title (60-70 characters)",
  "content": "<p>Full HTML content with proper formatting, headings, paragraphs, lists, etc.</p>",
  "excerpt": "Brief 150-character summary",
  "category": "crypto-news|ai|tokenomics|web3|defi|guides|startups|investing",
  "tags": ["tag1", "tag2", "tag3"],
  "metaTitle": "SEO meta title",
  "metaDescription": "SEO meta description (150-160 characters)",
  "canonical_url": "${baseUrl}/blog/[slug]"
}`;

    console.log('🤖 Generating blog post with OpenAI...');
    const completion = await openaiService.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cryptocurrency and Web3 content writer. Generate high-quality, SEO-optimized blog posts in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let blogPost;
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      blogPost = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      throw new Error('Failed to parse generated blog post');
    }

    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    if (!blogPost.slug) {
      blogPost.slug = generateSlug(blogPost.title);
    }

    const postData = {
      title: blogPost.title,
      slug: blogPost.slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt || blogPost.content.substring(0, 160).replace(/<[^>]*>/g, ''),
      category: blogPost.category || 'crypto-news',
      tags: blogPost.tags || [],
      author: 'Cryptorafts AI',
      authorId: 'auto-ai',
      status: 'published' as const,
      metaTitle: blogPost.metaTitle || blogPost.title,
      metaDescription: blogPost.metaDescription || blogPost.excerpt,
      featuredImage: blogPost.featuredImage || '',
      commentEnabled: true,
      featured: false,
      views: 0,
      likes: 0,
      shares: 0,
    };

    const postId = await blogServiceServer.createPost(postData);
    console.log('✅ Blog post created:', postId);

    // Get connected platforms
    const platformsRef = db.collection('blog_platforms');
    const platformsSnapshot = await platformsRef.get();
    const connectedPlatforms = platformsSnapshot.docs
      .filter(doc => doc.data().connected === true)
      .map(doc => doc.id);

    console.log('📱 Connected platforms:', connectedPlatforms);

    // Post to connected platforms
    if (connectedPlatforms.length > 0) {
      try {
        const publishResponse = await fetch(`${baseUrl}/api/blog/admin/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            platforms: connectedPlatforms,
          }),
        });

        if (publishResponse.ok) {
          console.log('✅ Posted to connected platforms:', connectedPlatforms);
        }
      } catch (error) {
        console.error('❌ Error posting to platforms:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post generated and published successfully',
      postId,
      title: blogPost.title,
      platforms: connectedPlatforms,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Auto-posting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

