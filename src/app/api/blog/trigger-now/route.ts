/**
 * Trigger Auto-Post Now
 * Manually trigger blog post generation and publishing immediately
 * 
 * GET /api/blog/trigger-now
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/raftai/openai-service';
import { blogServiceServer } from '@/lib/blog-service.server';
import { googleTrendsService } from '@/lib/google-trends-service';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Manual auto-post trigger');
    
    // Check OpenAI service
    const openaiService = OpenAIService.getInstance();
    if (!openaiService.isEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI service not enabled. Check OPENAI_API_KEY in environment variables.'
        },
        { status: 500 }
      );
    }

    // Get trending topic
    const trendingTopics = await googleTrendsService.getTrendingTopics(15);
    const selectedTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    console.log(`📈 Selected trending topic: ${selectedTopic.keyword}`);

    const currentDate = new Date().toISOString().split('T')[0];
    const sourceId = `manual-${Date.now()}`;
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

    // Generate slug
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    if (!blogPost.slug) {
      blogPost.slug = generateSlug(blogPost.title);
    }

    // Create post data
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

    // Save to Firestore
    const postId = await blogServiceServer.createPost(postData);
    console.log('✅ Blog post created:', postId);

    // Get connected platforms using Admin SDK
    let connectedPlatforms: string[] = [];
    try {
      const db = getAdminDb();
      if (db) {
        const platformsRef = db.collection('blog_platforms');
        const platformsSnapshot = await platformsRef.get();
        connectedPlatforms = platformsSnapshot.docs
          .filter(doc => doc.data().connected === true)
          .map(doc => doc.id);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch platforms, will try to post anyway');
    }

    console.log('📱 Connected platforms:', connectedPlatforms);

    // Post to connected platforms
    let postedPlatforms: string[] = [];
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
          const publishData = await publishResponse.json();
          postedPlatforms = publishData.postedTo || connectedPlatforms;
          console.log('✅ Posted to platforms:', postedPlatforms);
        } else {
          console.error('❌ Failed to post to platforms');
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
      slug: blogPost.slug,
      url: `${baseUrl}/blog/${blogPost.slug}`,
      platforms: postedPlatforms,
      timestamp: new Date().toISOString(),
      nextPost: 'Tomorrow at 9 AM UTC (5 AM EST) - Automatic'
    });

  } catch (error: any) {
    console.error('❌ Error generating blog post:', error);
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

