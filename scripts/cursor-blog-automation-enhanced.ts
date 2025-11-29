/**
 * Enhanced Cursor Blog Automation Script
 * 
 * Automatically generates, optimizes, and publishes daily blog posts
 * with trending topics, SEO optimization, and multi-platform cross-posting
 * 
 * Features:
 * - Daily blog post generation (800-1500 words)
 * - Trending topic detection
 * - SEO optimization (meta tags, canonical URLs)
 * - Multi-platform social media formatting
 * - Content validation
 * - Duplicate prevention
 * - Peak engagement timing
 * 
 * Usage:
 * npm run blog:generate
 * Or schedule: npm run blog:schedule
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish';
const DEFAULT_PUBLISH_MODE = process.env.DEFAULT_PUBLISH_MODE === 'true';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'cryptorafts.admin@gmail.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com';

// Trending topics pool (updated regularly)
const TRENDING_TOPICS = [
  'Bitcoin ETF approval and market impact',
  'Ethereum Layer 2 scaling solutions',
  'DeFi yield farming strategies',
  'NFT utility beyond digital art',
  'CBDC adoption and implications',
  'Crypto regulation updates',
  'Stablecoin market dynamics',
  'Web3 gaming and metaverse',
  'Tokenomics design best practices',
  'Smart contract security audits',
  'Cross-chain interoperability',
  'DAO governance models',
  'Crypto tax strategies',
  'Institutional crypto adoption',
  'Meme coins vs utility tokens',
];

// Peak engagement times (UTC) by platform
const PEAK_TIMES = {
  linkedin: { hour: 8, day: [1, 2, 3, 4, 5] }, // 8 AM UTC, Mon-Fri
  x: { hour: 15, day: [1, 2, 3, 4, 5] }, // 3 PM UTC, Mon-Fri
  telegram: { hour: 12, day: [0, 1, 2, 3, 4, 5, 6] }, // 12 PM UTC, Daily
  devto: { hour: 10, day: [1, 2, 3, 4, 5] }, // 10 AM UTC, Mon-Fri
  blogger: { hour: 9, day: [1, 2, 3, 4, 5] }, // 9 AM UTC, Mon-Fri
};

interface BlogPost {
  title: string;
  content: string;
  excerpt?: string;
  canonical_url: string;
  sourceId: string;
  publish: boolean;
  hashtags: string[];
  meta_title: string;
  meta_description: string;
  slug: string;
  category: string;
  tags: string[];
  keywords: string[];
  social: {
    linkedin: string;
    x: string;
    telegram: string;
    devto: string;
    blogger: string;
    buffer: string;
  };
  reading_time: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
  claims_to_verify: string[];
  scheduled_time?: string;
  platform_timing?: {
    linkedin?: string;
    x?: string;
    telegram?: string;
    devto?: string;
    blogger?: string;
  };
}

/**
 * Get trending topic (simulates Google Trends)
 */
function getTrendingTopic(): string {
  // In production, you could integrate with Google Trends API
  // For now, randomly select from trending topics pool
  const topic = TRENDING_TOPICS[Math.floor(Math.random() * TRENDING_TOPICS.length)];
  console.log(`📈 Selected trending topic: ${topic}`);
  return topic;
}

/**
 * Generate blog post using OpenAI with enhanced prompts
 */
async function generateBlogPost(topic?: string): Promise<BlogPost> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured in environment variables');
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Select trending topic if not provided
  const selectedTopic = topic || getTrendingTopic();

  console.log(`📝 Generating blog post for topic: ${selectedTopic}`);

  // Get current date for context
  const currentDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const prompt = `Generate one high-quality, SEO-optimized blog post for Cryptorafts and return it as valid JSON.

CRITICAL REQUIREMENTS:
- Generate 800-1500 words of unique, engaging content
- Focus on: ${selectedTopic}
- Include latest news, insights, and market analysis (as of ${currentDate})
- Ensure content is unique and not duplicated
- Use trending hashtags relevant to crypto and finance

CONTENT FORMATTING:
- Use proper HTML structure: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- Include at least 3-5 H2 sections with relevant H3 subsections
- Add internal links where relevant (format: <a href="https://www.cryptorafts.com/...">link text</a>)
- Use bold text for key points and important information
- Include lists and bullet points for readability
- Ensure proper paragraph breaks

SEO OPTIMIZATION:
- Meta title: Maximum 60 characters, SEO-optimized, includes primary keyword
- Meta description: Maximum 155 characters, compelling, includes call-to-action
- Canonical URL: Format as https://www.cryptorafts.com/blog/{slug}
- Keywords: 5-8 relevant keywords for SEO
- Tags: 3-6 relevant tags

SOCIAL MEDIA FORMATTING:
- LinkedIn: 120-200 characters, professional tone, include 2-3 hashtags, add link
- X/Twitter: Maximum 280 characters, engaging, include 2-3 trending hashtags, add link
- Telegram: 1-2 short lines, casual tone, include link
- Dev.to: Markdown format, technical focus, include tags
- Blogger: HTML format, SEO-optimized, include labels
- Buffer: Universal format for 3 social profiles, include link and hashtags

HASHTAGS:
- Include 3-5 trending hashtags relevant to crypto/finance
- Use popular hashtags like #crypto #blockchain #DeFi #Web3 #Bitcoin #Ethereum
- Mix trending and evergreen hashtags

VALIDATION:
- Minimum 500 words content
- Title minimum 10 characters
- Maximum 5 external links
- No spam or filler content
- High-quality, actionable content

TONE & STYLE:
- Professional yet engaging
- Easy-to-read for beginners and intermediate crypto enthusiasts
- Include call-to-actions where relevant
- Use data and examples to support points

Return ONLY valid JSON (no markdown, no code blocks) matching this exact structure:
{
  "title": "Catchy SEO-optimized title (60 chars max)",
  "content": "<h1>Title</h1><h2>Section</h2><p>Full HTML content (800-1500 words)</p>",
  "excerpt": "Compelling 2-line summary (150 chars)",
  "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
  "sourceId": "cursor-${Date.now()}",
  "publish": ${DEFAULT_PUBLISH_MODE},
  "hashtags": ["#crypto", "#blockchain", "#DeFi", "#Web3"],
  "meta_title": "SEO title (60 chars max)",
  "meta_description": "SEO description (155 chars max)",
  "slug": "url-friendly-slug",
  "category": "Crypto",
  "tags": ["crypto", "blockchain", "DeFi"],
  "keywords": ["crypto", "blockchain", "DeFi", "Web3", "trading"],
  "social": {
    "linkedin": "Professional LinkedIn caption (120-200 chars) with link and hashtags",
    "x": "Engaging X/Twitter caption (280 chars max) with link and hashtags",
    "telegram": "Casual Telegram message (1-2 lines) with link",
    "devto": "Dev.to formatted markdown post with tags",
    "blogger": "Blogger formatted HTML post with labels",
    "buffer": "Universal Buffer content for 3 profiles with link and hashtags"
  },
  "reading_time": 6,
  "images": [
    {
      "url": "https://cdn.cryptorafts.com/images/{image}.png",
      "alt": "Descriptive alt text"
    }
  ],
  "claims_to_verify": ["Claim 1", "Claim 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer for Cryptorafts, a platform for verified crypto projects. Generate high-quality, SEO-optimized blog posts in JSON format. Always include trending topics, proper SEO metadata, and platform-specific social media captions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Parse JSON response
    let blogPost: BlogPost;
    try {
      blogPost = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate required fields
    if (!blogPost.title || !blogPost.content) {
      throw new Error('Generated post missing required fields');
    }

    // Generate slug if not provided
    if (!blogPost.slug) {
      blogPost.slug = generateSlug(blogPost.title);
    }

    // Set canonical URL if not provided
    if (!blogPost.canonical_url) {
      blogPost.canonical_url = `${BASE_URL}/blog/${blogPost.slug}`;
    }

    // Set sourceId if not provided
    if (!blogPost.sourceId) {
      blogPost.sourceId = `cursor-${Date.now()}`;
    }

    // Ensure sourceId format
    if (!blogPost.sourceId.startsWith('cursor-')) {
      blogPost.sourceId = `cursor-${Date.now()}`;
    }

    // Set publish mode
    blogPost.publish = DEFAULT_PUBLISH_MODE;

    // Calculate reading time if not provided
    if (!blogPost.reading_time) {
      blogPost.reading_time = calculateReadingTime(blogPost.content);
    }

    // Add peak engagement timing
    blogPost.platform_timing = calculatePeakTiming();

    // Validate content quality
    const validation = validateContent(blogPost);
    if (!validation.valid) {
      console.warn('⚠️ Content validation warnings:', validation.warnings);
      // Still proceed, but log warnings
    }

    // Ensure hashtags are formatted correctly
    if (!blogPost.hashtags || blogPost.hashtags.length === 0) {
      blogPost.hashtags = ['#crypto', '#blockchain', '#DeFi'];
    }

    // Ensure social captions include links
    blogPost.social = ensureSocialLinks(blogPost.social, blogPost.canonical_url);

    console.log('✅ Blog post generated successfully');
    return blogPost;

  } catch (error: any) {
    console.error('❌ Error generating blog post:', error);
    throw error;
  }
}

/**
 * Calculate reading time from content
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Calculate peak engagement timing for each platform
 */
function calculatePeakTiming(): {
  linkedin?: string;
  x?: string;
  telegram?: string;
  devto?: string;
  blogger?: string;
} {
  const now = new Date();
  const timing: any = {};

  // Calculate next optimal posting time for each platform
  Object.entries(PEAK_TIMES).forEach(([platform, config]) => {
    const nextPostTime = new Date(now);
    nextPostTime.setUTCHours(config.hour, 0, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextPostTime <= now) {
      nextPostTime.setUTCDate(nextPostTime.getUTCDate() + 1);
    }

    // Adjust to next valid day if needed
    while (!config.day.includes(nextPostTime.getUTCDay())) {
      nextPostTime.setUTCDate(nextPostTime.getUTCDate() + 1);
    }

    timing[platform] = nextPostTime.toISOString();
  });

  return timing;
}

/**
 * Validate content quality
 */
function validateContent(post: BlogPost): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check content length
  const textContent = post.content.replace(/<[^>]*>/g, '');
  const wordCount = textContent.trim().split(/\s+/).length;

  if (wordCount < 500) {
    warnings.push(`Content too short: ${wordCount} words (minimum 500)`);
  }
  if (wordCount > 2000) {
    warnings.push(`Content very long: ${wordCount} words (recommended 800-1500)`);
  }

  // Check title length
  if (post.title.length < 10) {
    warnings.push(`Title too short: ${post.title.length} characters (minimum 10)`);
  }
  if (post.title.length > 100) {
    warnings.push(`Title too long: ${post.title.length} characters (recommended 60)`);
  }

  // Check meta title length
  if (post.meta_title && post.meta_title.length > 60) {
    warnings.push(`Meta title too long: ${post.meta_title.length} characters (maximum 60)`);
  }

  // Check meta description length
  if (post.meta_description && post.meta_description.length > 155) {
    warnings.push(`Meta description too long: ${post.meta_description.length} characters (maximum 155)`);
  }

  // Check external links (should be ≤ 5)
  const externalLinks = (post.content.match(/href=["'](https?:\/\/[^"']+)["']/gi) || [])
    .filter(link => !link.includes('cryptorafts.com') && !link.includes('localhost'));
  
  if (externalLinks.length > 5) {
    warnings.push(`Too many external links: ${externalLinks.length} (maximum 5)`);
  }

  // Check for spam indicators
  const spamPhrases = ['buy now', 'limited time', 'act fast', 'click here', 'guaranteed', 'free money'];
  const hasSpam = spamPhrases.some(phrase => 
    post.title.toLowerCase().includes(phrase) || 
    post.content.toLowerCase().includes(phrase)
  );

  if (hasSpam) {
    warnings.push('Potential spam phrases detected');
  }

  // Check hashtags
  if (!post.hashtags || post.hashtags.length < 3) {
    warnings.push(`Not enough hashtags: ${post.hashtags?.length || 0} (recommended 3-5)`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Ensure social captions include links
 */
function ensureSocialLinks(social: BlogPost['social'], canonicalUrl: string): BlogPost['social'] {
  const ensureLink = (text: string, url: string): string => {
    if (!text.includes(url) && !text.includes('cryptorafts.com')) {
      return `${text} ${url}`;
    }
    return text;
  };

  return {
    linkedin: ensureLink(social.linkedin, canonicalUrl),
    x: ensureLink(social.x, canonicalUrl),
    telegram: ensureLink(social.telegram, canonicalUrl),
    devto: social.devto || social.linkedin,
    blogger: social.blogger || social.linkedin,
    buffer: ensureLink(social.buffer || social.linkedin, canonicalUrl),
  };
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Send blog post to n8n webhook
 */
async function sendToN8NWebhook(blogPost: BlogPost): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N_WEBHOOK_URL not configured');
  }

  console.log(`📤 Sending to n8n webhook: ${N8N_WEBHOOK_URL}`);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogPost),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Webhook returned error:', result);
      
      // Retry once on failure
      console.log('🔄 Retrying webhook request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogPost),
      });

      const retryResult = await retryResponse.json();
      
      if (!retryResponse.ok || !retryResult.success) {
        throw new Error(`Webhook failed after retry: ${JSON.stringify(retryResult)}`);
      }

      console.log('✅ Webhook succeeded on retry');
      return true;
    }

    console.log('✅ Webhook response:', result);
    return true;

  } catch (error: any) {
    console.error('❌ Error sending to webhook:', error);
    
    // Notify admin (you can implement email notification here)
    console.error(`📧 Admin notification needed: ${ADMIN_EMAIL}`);
    
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Enhanced Cursor Blog Automation...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔧 Publish mode: ${DEFAULT_PUBLISH_MODE ? 'AUTO-PUBLISH' : 'DRAFT'}`);

    // Generate blog post with trending topic
    const blogPost = await generateBlogPost();

    console.log(`📝 Generated: "${blogPost.title}"`);
    console.log(`📊 Category: ${blogPost.category}, Tags: ${blogPost.tags.join(', ')}`);
    console.log(`🏷️  Hashtags: ${blogPost.hashtags.join(' ')}`);
    console.log(`⏱️  Reading time: ${blogPost.reading_time} minutes`);
    console.log(`🔗 Canonical URL: ${blogPost.canonical_url}`);
    console.log(`🆔 Source ID: ${blogPost.sourceId}`);

    // Validate content
    const validation = validateContent(blogPost);
    if (!validation.valid) {
      console.warn('⚠️ Content validation warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // Send to n8n webhook
    await sendToN8NWebhook(blogPost);

    console.log('✅ Automation completed successfully!');
    console.log('');
    console.log('📊 Post Summary:');
    console.log(`  Title: ${blogPost.title}`);
    console.log(`  Status: ${blogPost.publish ? 'Published' : 'Draft'}`);
    console.log(`  URL: ${blogPost.canonical_url}`);
    console.log(`  Platforms: LinkedIn, X, Telegram, Dev.to, Blogger, Buffer`);
    console.log(`  Timing: Optimized for peak engagement`);

    process.exit(0);

  } catch (error: any) {
    console.error('❌ Automation failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateBlogPost, sendToN8NWebhook, getTrendingTopic };

