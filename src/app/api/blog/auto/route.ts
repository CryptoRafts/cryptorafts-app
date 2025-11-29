/**
 * POST /api/blog/auto
 * Generate a blog post automatically using AI
 * 
 * This endpoint uses OpenAI GPT to generate blog post content automatically.
 * Can be triggered manually or via automation (cron, webhook, Zapier, n8n).
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';
import { OpenAIService } from '@/lib/raftai/openai-service';
import { socialShareService } from '@/lib/social-share-service';

interface AutoBlogRequest {
  topic?: string;
  category?: string;
  keywords?: string[];
  publish?: boolean; // If true, automatically publishes the post
  featuredImage?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Auto-blog generation triggered');
    
    const body: AutoBlogRequest = await request.json();
    const { topic, category, keywords = [], publish = false, featuredImage } = body;

    // Get OpenAI service
    const openaiService = OpenAIService.getInstance();
    
    if (!openaiService.isEnabled()) {
      console.error('❌ OpenAI not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.' 
        },
        { status: 500 }
      );
    }

    // Generate topic if not provided
    const finalTopic = topic || await generateRandomTopic(openaiService);

    console.log('📝 Generating blog post for topic:', finalTopic);

    // Generate blog post content using AI
    const blogContent = await generateBlogPost(openaiService, finalTopic, category, keywords);

    // Validate generated content
    const validation = validateBlogContent(blogContent);
    if (!validation.valid) {
      console.error('❌ Generated content failed validation:', validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Generated content failed validation',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Prepare post data
    const postData = {
      title: blogContent.title,
      content: blogContent.content,
      category: category || blogContent.category || 'crypto-news',
      tags: keywords.length > 0 ? keywords : blogContent.tags || [],
      author: 'Cryptorafts Team',
      authorId: 'auto-ai',
      featuredImage,
      status: publish ? 'published' as const : 'draft' as const,
      metaTitle: blogContent.title,
      metaDescription: blogContent.excerpt,
      commentEnabled: true,
      featured: false,
    };

    // Create post in Firestore
    console.log('💾 Saving generated post to Firestore...');
    const postId = await blogServiceServer.createPost(postData);

    console.log('✅ Auto-blog post created successfully:', postId);

    // If publishing, trigger auto-share
    if (publish && postId) {
      console.log('📢 Triggering auto-share for published post...');
      // Auto-share in background (don't await)
      triggerAutoShare(postId, blogContent.title, blogContent.excerpt).catch(err => {
        console.error('❌ Auto-share failed:', err);
      });
    }

    return NextResponse.json({ 
      success: true, 
      postId,
      title: blogContent.title,
      status: postData.status,
      published: publish,
      shareTriggered: publish,
    });

  } catch (error: any) {
    console.error('❌ Error generating auto-blog post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate blog post'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a random relevant topic using AI
 */
async function generateRandomTopic(openaiService: OpenAIService): Promise<string> {
  const prompt = `Generate a relevant, trending topic for a cryptocurrency and Web3 blog.

Requirements:
- Topic should be current and relevant (2024-2025)
- Should be interesting to crypto, Web3, DeFi, AI, or NFT enthusiasts
- Topic should be specific enough to write about in detail
- Return ONLY the topic title, no quotes, no explanation

Examples:
- "How DAOs are revolutionizing decentralized governance"
- "The future of AI-powered DeFi protocols"
- "NFT royalties vs free market debate explained"
- "Layer 2 solutions comparison: Arbitrum vs Optimism vs Polygon"

Generate one topic now:`;

  try {
    const response = await openaiService.chatWithContext(prompt, {
      userRole: 'content-creator',
      conversationHistory: [],
    });

    // Clean up response (remove quotes, extra whitespace, etc.)
    const topic = response
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Topic:\s*/i, '') // Remove "Topic:" prefix if present
      .trim()
      .split('\n')[0]; // Take first line only

    console.log('🎲 Generated random topic:', topic);
    return topic;

  } catch (error: any) {
    console.error('❌ Failed to generate topic, using fallback:', error);
    // Fallback topics if AI fails
    const fallbackTopics = [
      'The Evolution of Cryptocurrency: From Bitcoin to CBDCs',
      'Understanding DeFi Lending Protocols: A Complete Guide',
      'NFT Utility Beyond Art: Real-World Use Cases',
      'Web3 Identity: The Future of Digital Verification',
      'Layer 2 Scaling Solutions Explained',
    ];
    return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
  }
}

/**
 * Generate full blog post content using AI
 */
async function generateBlogPost(
  openaiService: OpenAIService,
  topic: string,
  category?: string,
  keywords?: string[]
): Promise<{
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
}> {
  const prompt = `Write a comprehensive, well-structured blog post about: "${topic}"

${category ? `Category: ${category}` : ''}
${keywords && keywords.length > 0 ? `Keywords to focus on: ${keywords.join(', ')}` : ''}

Requirements:
- Write in HTML format with proper headings (<h2>, <h3>), paragraphs (<p>), lists (<ul>, <ol>), and emphasis (<strong>, <em>)
- Include at least 3-5 H2 sections with relevant H3 subsections
- Content should be 800-1500 words
- Be informative, engaging, and easy to understand
- Include practical examples and real-world applications
- End with a brief conclusion
- Write for crypto and Web3 enthusiasts

Format your response as a JSON object with these exact fields:
{
  "title": "Engaging, SEO-friendly title (60-70 chars)",
  "content": "Full HTML content",
  "excerpt": "Short 150-char description",
  "category": "category-name",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Categories: crypto-news, ai, tokenomics, web3, defi, nft, blockchain, guides
Tags: 3-5 relevant keywords as an array

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

  try {
    const response = await openaiService.chatWithJSON(prompt, {
      userRole: 'content-creator',
      conversationHistory: [],
    });

    // Parse JSON response (already in JSON format)
    let blogData;
    try {
      blogData = JSON.parse(response);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', response);
      throw new Error('AI returned invalid JSON format');
    }

    console.log('✅ Blog content generated successfully');
    return {
      title: blogData.title,
      content: blogData.content,
      excerpt: blogData.excerpt,
      category: blogData.category || 'crypto-news',
      tags: blogData.tags || [],
    };

  } catch (error: any) {
    console.error('❌ Failed to generate blog content:', error);
    throw error;
  }
}

/**
 * Validate generated blog content
 */
function validateBlogContent(content: {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check title
  if (!content.title || content.title.trim().length < 10) {
    errors.push('Title must be at least 10 characters');
  }
  if (content.title && content.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Check content
  if (!content.content || content.content.trim().length < 500) {
    errors.push('Content must be at least 500 characters (approximately 100 words)');
  }
  if (content.content && content.content.length > 50000) {
    errors.push('Content is too long (max 50,000 characters)');
  }

  // Check for spam indicators
  if (content.title && /(buy now|limited time|act fast|click here|guaranteed)/i.test(content.title)) {
    errors.push('Title contains spam-like phrases');
  }

  // Check excerpt
  if (!content.excerpt || content.excerpt.trim().length < 50) {
    errors.push('Excerpt must be at least 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Trigger auto-share to social media platforms
 * This calls the social share service
 */
async function triggerAutoShare(postId: string, title: string, excerpt: string): Promise<void> {
  try {
    if (!socialShareService.isEnabled()) {
      console.log('⚠️ Social share service not configured, skipping auto-share');
      return;
    }

    // Get post slug to build proper URL
    // Note: In production, you'd need to fetch the post to get its slug
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
    const shareUrl = `${baseUrl}/blog/${postId}`;
    
    console.log('📢 Auto-sharing post:', title);
    
    // Share to all configured platforms
    const results = await socialShareService.shareBlogPost(title, excerpt, shareUrl);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Auto-share complete: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.error('❌ Failed platforms:', failed.map(r => r.platform));
    }
    
  } catch (error) {
    console.error('❌ Auto-share error:', error);
  }
}

/**
 * GET /api/blog/auto
 * Get info about auto-blog capabilities
 */
export async function GET() {
  const openaiService = OpenAIService.getInstance();
  
  return NextResponse.json({
    enabled: openaiService.isEnabled(),
    capabilities: {
      generateTopic: true,
      generateContent: true,
      autoPublish: true,
      autoShare: true,
    },
    instructions: {
      endpoint: '/api/blog/auto',
      method: 'POST',
      body: {
        topic: 'Optional: specific topic to write about',
        category: 'Optional: crypto-news, ai, tokenomics, web3, defi, nft, blockchain, guides',
        keywords: 'Optional: array of keywords to focus on',
        publish: 'Optional: true to auto-publish, false to save as draft (default: false)',
        featuredImage: 'Optional: URL for featured image',
      },
      examples: {
        generateRandomPost: '{ "publish": true }',
        generateSpecificPost: '{ "topic": "Understanding DAOs", "category": "web3", "publish": false }',
        generateWithKeywords: '{ "topic": "DeFi Lending", "keywords": ["Aave", "Compound", "MakerDAO"], "publish": false }',
      },
    },
  });
}

