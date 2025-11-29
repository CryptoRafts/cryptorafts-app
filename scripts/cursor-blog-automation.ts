/**
 * Cursor Blog Automation Script
 * 
 * This script generates AI blog posts using OpenAI and sends them to n8n webhook
 * 
 * Usage:
 * 1. Configure environment variables (see .env.example)
 * 2. Run: npx tsx scripts/cursor-blog-automation.ts
 * 3. Or schedule via cron: 0 9 * * * cd /path/to/project && npx tsx scripts/cursor-blog-automation.ts
 * 
 * Configuration:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - N8N_WEBHOOK_URL: Your n8n webhook URL
 * - DEFAULT_PUBLISH_MODE: 'false' for drafts (recommended), 'true' for auto-publish
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables (try .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish';
const DEFAULT_PUBLISH_MODE = process.env.DEFAULT_PUBLISH_MODE === 'true';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'cryptorafts.admin@gmail.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com';

// Topic pool for random selection
const TOPIC_POOL = [
  'crypto',
  'web3',
  'ai',
  'tokenomics',
  'kyc',
  'exchange listings',
  'influencer marketing',
  'DeFi protocols',
  'NFT utility',
  'blockchain security',
  'DAO governance',
  'Layer 2 scaling',
];

interface BlogPost {
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  slug: string;
  tags: string[];
  category: string;
  keywords: string[];
  social: {
    linkedin: string;
    x: string;
    telegram: string;
  };
  reading_time: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
  claims_to_verify: string[];
  publish: boolean;
  source: string;
  sourceId: string;
}

/**
 * Generate blog post using OpenAI
 */
async function generateBlogPost(topic?: string): Promise<BlogPost> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured in environment variables');
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Select topic if not provided
  const selectedTopic = topic || TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];

  console.log(`📝 Generating blog post for topic: ${selectedTopic}`);

  const prompt = `Generate one high-quality, SEO-optimized blog post for Cryptorafts and return it as valid JSON.

Rules:
- Produce an 800–1200 word article in HTML format (use <h2>, <h3>, <p>, <ul>/<li> where appropriate)
- Tone: professional founder-level, trustworthy, concise. No slang, no emojis.
- Audience: crypto founders, VCs, exchanges, token projects.
- Include trustworthy, actionable advice that ties to "trust, transparency, verified projects" when relevant.
- Topic: ${selectedTopic}

Provide SEO metadata:
- meta_title (<=60 chars)
- meta_description (<=155 chars)
- canonical_url (point to site)
- 5–8 keywords

Provide 3 social captions:
- LinkedIn (120–200 chars)
- X/Twitter (<=280 chars)
- Telegram summary (1–2 short lines)

Provide tags (array of 3–6 tags), a category (one of: Crypto, Web3, AI, Tokenomics, KYC), and estimated reading_time (minutes).

Detect and remove or escape unsafe characters for XML/HTML.

If the article references factual claims (dates, company names, numbers), list them in "claims_to_verify" array.

Return ONLY valid JSON (no markdown, no code blocks) matching this exact structure:
{
  "title": "Catchy SEO title here",
  "excerpt": "Two-line summary/excerpt",
  "content": "<h2>Intro</h2><p>...</p>",
  "meta_title": "SEO title <= 60 chars",
  "meta_description": "SEO description <=155 chars",
  "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
  "slug": "url-friendly-slug",
  "tags": ["crypto","tokenomics","KYC"],
  "category": "Crypto",
  "keywords": ["crypto","web3","tokenomics","KYC","audits"],
  "social": {
    "linkedin": "LinkedIn caption here",
    "x": "Short tweet here",
    "telegram": "Telegram message here"
  },
  "reading_time": 6,
  "images": [
    {
      "url": "https://cdn.cryptorafts.com/images/{generated-image}.png",
      "alt": "alt text"
    }
  ],
  "claims_to_verify": ["Claim 1", "Claim 2"],
  "publish": ${DEFAULT_PUBLISH_MODE},
  "source": "cursor-ai",
  "sourceId": "cursor-${Date.now()}"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer for Cryptorafts, a platform for verified crypto projects. Generate high-quality, SEO-optimized blog posts in JSON format.',
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

    // Set publish mode
    blogPost.publish = DEFAULT_PUBLISH_MODE;

    console.log('✅ Blog post generated successfully');
    return blogPost;

  } catch (error: any) {
    console.error('❌ Error generating blog post:', error);
    throw error;
  }
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
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Cursor blog automation...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔧 Publish mode: ${DEFAULT_PUBLISH_MODE ? 'AUTO-PUBLISH' : 'DRAFT'}`);

    // Generate blog post
    const blogPost = await generateBlogPost();

    console.log(`📝 Generated: "${blogPost.title}"`);
    console.log(`📊 Category: ${blogPost.category}, Tags: ${blogPost.tags.join(', ')}`);
    console.log(`⏱️  Reading time: ${blogPost.reading_time} minutes`);

    // Send to n8n webhook
    await sendToN8NWebhook(blogPost);

    console.log('✅ Automation completed successfully!');
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

export { generateBlogPost, sendToN8NWebhook };

