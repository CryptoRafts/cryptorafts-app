/**
 * POST /api/blog/generate-auto
 * 
 * Fully automated blog post generation endpoint
 * Uses existing OpenAI service from the app
 * Generates, validates, and posts blog content automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/raftai/openai-service';
import { blogServiceServer } from '@/lib/blog-service.server';
import { googleTrendsService } from '@/lib/google-trends-service';
import { BlogGeneratorFallback } from '@/lib/blog-generator-fallback';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Admin-controlled system - no hardcoded topics, uses Google Trends

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Auto blog generation triggered');

    const openaiService = OpenAIService.getInstance();
    const openaiEnabled = openaiService.isEnabled();
    
    if (!openaiEnabled) {
      console.log('⚠️ OpenAI not enabled, using fallback generator...');
    }

    // Get trending topic from Google Trends
    let selectedTopic: { keyword: string; trendScore?: number };
    try {
      const trendingTopics = await googleTrendsService.getTrendingTopics(15);
      selectedTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
      console.log(`📈 Selected trending topic: ${selectedTopic.keyword}`);
    } catch (error) {
      // Fallback topics if Google Trends fails
      const fallbackTopics = ['Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Web3', 'Blockchain'];
      selectedTopic = { keyword: fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)] };
      console.log(`📈 Using fallback topic: ${selectedTopic.keyword}`);
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const sourceId = `cursor-${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com';
    const publishMode = true; // Always publish auto-generated posts
    
    // Get trending hashtags (with fallback)
    let trendingHashtags: string[] = [];
    try {
      trendingHashtags = await googleTrendsService.getTrendingHashtags(5);
    } catch (error) {
      trendingHashtags = ['#crypto', '#blockchain', '#DeFi', '#Web3', '#NFTs'];
    }
    const hashtagsString = trendingHashtags.join(' ');

    const prompt = `Generate one high-quality, SEO-optimized blog post for Cryptorafts and return it as valid JSON.

CRITICAL REQUIREMENTS:
- Generate 800-1500 words of unique, engaging content
- Focus on: ${selectedTopic.keyword} (Category: ${selectedTopic.category}, Trend Score: ${selectedTopic.trendScore})
- Include latest news, insights, and market analysis (as of ${currentDate})
- Use trending hashtags: ${hashtagsString}
- Ensure content is unique and not duplicated
- Use trending hashtags relevant to crypto and finance

CONTENT FORMATTING:
- Use proper HTML structure: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- Include at least 3-5 H2 sections with relevant H3 subsections
- Add internal links where relevant (format: <a href="https://www.cryptorafts.com/...">link text</a>)
- Use bold text for key points
- Include lists and bullet points
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
- Include 3-5 trending hashtags (#crypto #blockchain #DeFi #Web3 #Bitcoin #Ethereum)

VALIDATION:
- Minimum 500 words content
- Title minimum 10 characters
- Maximum 5 external links
- No spam or filler content

TONE & STYLE:
- Professional yet engaging
- Easy-to-read for beginners and intermediate crypto enthusiasts
- Include call-to-actions where relevant

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Catchy SEO-optimized title (60 chars max)",
  "content": "<h1>Title</h1><h2>Section</h2><p>Full HTML content (800-1500 words)</p>",
  "excerpt": "Compelling 2-line summary (150 chars)",
  "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
  "sourceId": "${sourceId}",
  "publish": ${publishMode},
  "hashtags": ${JSON.stringify(trendingHashtags)},
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
  "images": [{"url": "https://cdn.cryptorafts.com/images/{image}.png", "alt": "alt text"}],
  "claims_to_verify": []
}`;

    // Generate blog post using OpenAI (with fallback)
    let blogPost: any;
    
    // If OpenAI is not enabled, use fallback directly
    if (!openaiEnabled) {
      console.log('📝 OpenAI not enabled, using fallback generator...');
      try {
        const fallbackPost = await BlogGeneratorFallback.generateBlogPost(selectedTopic.keyword);
        
        blogPost = {
          title: fallbackPost.title,
          content: fallbackPost.content,
          excerpt: fallbackPost.excerpt,
          category: fallbackPost.category,
          tags: fallbackPost.tags,
          meta_title: fallbackPost.metaTitle,
          meta_description: fallbackPost.metaDescription,
          slug: fallbackPost.slug,
          hashtags: fallbackPost.tags.map(t => `#${t.replace(/\s+/g, '')}`),
          social: {
            linkedin: `${fallbackPost.excerpt} Read more: ${baseUrl}/blog/${fallbackPost.slug} #crypto #blockchain`,
            x: `${fallbackPost.excerpt.substring(0, 200)} ${baseUrl}/blog/${fallbackPost.slug} #crypto #blockchain`,
            telegram: `📰 ${fallbackPost.title}\n\n${fallbackPost.excerpt}\n\nRead more: ${baseUrl}/blog/${fallbackPost.slug}`,
            devto: `# ${fallbackPost.title}\n\n${fallbackPost.content.replace(/<[^>]*>/g, '').substring(0, 500)}...`,
            blogger: fallbackPost.content,
            buffer: `${fallbackPost.title} - ${fallbackPost.excerpt} ${baseUrl}/blog/${fallbackPost.slug}`
          }
        };
        
        console.log('✅ Blog post generated using fallback method (template-based)');
      } catch (fallbackError: any) {
        console.error('❌ Fallback generator error:', fallbackError);
        throw new Error(`Fallback generator failed: ${fallbackError?.message || 'Unknown error'}`);
      }
    } else {
      // Try OpenAI first
      try {
        console.log('📝 Generating blog post with OpenAI...');
        const jsonResponse = await openaiService.chatWithJSON(prompt, {
          userRole: 'content-creator',
          conversationHistory: [],
        });

        // Parse JSON response
        try {
          blogPost = JSON.parse(jsonResponse);
          console.log('✅ Blog post generated with OpenAI');
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', jsonResponse);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } catch (openaiError: any) {
        // Check if it's a quota error or any OpenAI error
        const errorMessage = openaiError?.message || openaiError?.toString() || '';
        const isQuotaError = errorMessage.includes('429') || 
                            errorMessage.includes('quota') || 
                            errorMessage.includes('exceeded') ||
                            errorMessage.includes('billing');
        
        if (isQuotaError) {
          console.log('⚠️ OpenAI quota exceeded, using fallback generator...');
        } else {
          console.log('⚠️ OpenAI error, using fallback generator...', errorMessage);
        }
        
        // Use fallback generator
        try {
          const fallbackPost = await BlogGeneratorFallback.generateBlogPost(selectedTopic.keyword);
          
          // Convert to expected format
          blogPost = {
            title: fallbackPost.title,
            content: fallbackPost.content,
            excerpt: fallbackPost.excerpt,
            category: fallbackPost.category,
            tags: fallbackPost.tags,
            meta_title: fallbackPost.metaTitle,
            meta_description: fallbackPost.metaDescription,
            slug: fallbackPost.slug,
            hashtags: fallbackPost.tags.map(t => `#${t.replace(/\s+/g, '')}`),
            social: {
              linkedin: `${fallbackPost.excerpt} Read more: ${baseUrl}/blog/${fallbackPost.slug} #crypto #blockchain`,
              x: `${fallbackPost.excerpt.substring(0, 200)} ${baseUrl}/blog/${fallbackPost.slug} #crypto #blockchain`,
              telegram: `📰 ${fallbackPost.title}\n\n${fallbackPost.excerpt}\n\nRead more: ${baseUrl}/blog/${fallbackPost.slug}`,
              devto: `# ${fallbackPost.title}\n\n${fallbackPost.content.replace(/<[^>]*>/g, '').substring(0, 500)}...`,
              blogger: fallbackPost.content,
              buffer: `${fallbackPost.title} - ${fallbackPost.excerpt} ${baseUrl}/blog/${fallbackPost.slug}`
            }
          };
          
          console.log('✅ Blog post generated using fallback method (template-based)');
        } catch (fallbackError: any) {
          console.error('❌ Fallback generator error:', fallbackError);
          throw new Error(`Both OpenAI and fallback generator failed: ${fallbackError?.message || 'Unknown error'}`);
        }
      }
    }

    // Validate required fields
    if (!blogPost.title || !blogPost.content) {
      return NextResponse.json(
        { success: false, error: 'Generated post missing required fields' },
        { status: 500 }
      );
    }

    // Generate slug if not provided
    if (!blogPost.slug) {
      blogPost.slug = generateSlug(blogPost.title);
    }

    // Set canonical URL if not provided
    if (!blogPost.canonical_url) {
      blogPost.canonical_url = `${baseUrl}/blog/${blogPost.slug}`;
    }

    // Ensure sourceId
    blogPost.sourceId = sourceId;

    // Set publish mode - always publish for auto-generated posts
    blogPost.publish = true; // Always publish auto-generated posts

    // Calculate reading time
    if (!blogPost.reading_time) {
      blogPost.reading_time = calculateReadingTime(blogPost.content);
    }

    // Ensure hashtags
    if (!blogPost.hashtags || blogPost.hashtags.length === 0) {
      blogPost.hashtags = ['#crypto', '#blockchain', '#DeFi'];
    }

    // Ensure social captions include links
    blogPost.social = ensureSocialLinks(blogPost.social, blogPost.canonical_url);

    console.log('✅ Blog post generated:', blogPost.title);

    // Save to Firestore
    const postData: any = {
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt || generateExcerpt(blogPost.content),
      slug: blogPost.slug,
      category: blogPost.category || 'Crypto',
      tags: blogPost.tags || [],
      author: 'Cryptorafts Team',
      authorId: 'auto-ai',
      featuredImage: blogPost.images?.[0]?.url || blogPost.featuredImage || '', // Ensure it's always a string
      status: blogPost.publish ? 'published' : 'draft',
      metaTitle: blogPost.meta_title || blogPost.title,
      metaDescription: blogPost.meta_description || blogPost.excerpt,
      readingTime: blogPost.reading_time,
      metadata: {
        canonicalUrl: blogPost.canonical_url,
        keywords: blogPost.keywords || [],
        socialCaptions: blogPost.social || {},
        hashtags: blogPost.hashtags || [],
        source: 'cursor-ai',
        sourceId: blogPost.sourceId,
        images: blogPost.images || [],
        claimsToVerify: blogPost.claims_to_verify || [],
      },
    };

    // Remove any undefined values (Firestore doesn't accept undefined)
    Object.keys(postData).forEach(key => {
      if (postData[key] === undefined) {
        delete postData[key];
      }
    });
    
    // Ensure featuredImage is always a string
    if (!postData.featuredImage) {
      postData.featuredImage = '';
    }

    // Get optimal posting times (with error handling)
    let optimalTimes: any = {};
    try {
      optimalTimes = googleTrendsService.getOptimalPostingTimes();
    } catch (error) {
      console.warn('⚠️ Could not get optimal posting times, using defaults');
      optimalTimes = {
        linkedin: '09:00',
        x: '12:00',
        telegram: '18:00',
      };
    }
    
    // Add platform selection and scheduling to metadata
    postData.metadata = {
      ...postData.metadata,
        platformSelection: {
          linkedin: true, // Auto-post to all socials
          x: true,
          telegram: true,
          devto: true,
          blogger: true,
          buffer: true,
          website: true, // Always post to website
        },
      optimalPostingTimes: optimalTimes,
        scheduledFor: null, // Admin will set this
        aiGenerated: true,
        requiresApproval: false, // Auto-post to all socials
        autoPostToSocials: true, // Flag for auto-posting
    };

    // Create post in Firestore (with error handling and fallback)
    let postId: string | null = null;
    let useClientSideFallback = false;
    
    try {
      postId = await blogServiceServer.createPost(postData);
      console.log('✅ Post saved to Firestore:', postId);
    } catch (createError: any) {
      console.error('❌ Error creating post in Firestore:', createError);
      
      // If Admin SDK is not configured, return post data for client-side creation
      if (createError?.message?.includes('Firebase Admin SDK not configured') || 
          createError?.message?.includes('FIREBASE_SERVICE_ACCOUNT_B64')) {
        console.log('🔄 Admin SDK not available, returning post data for client-side creation');
        useClientSideFallback = true;
        // Don't throw - return the post data instead
      } else {
        // Other errors should still throw
        throw new Error(`Failed to create blog post: ${createError?.message || 'Unknown error'}`);
      }
    }

    const canonicalUrl = blogPost.canonical_url || `${baseUrl}/blog/${blogPost.slug}`;

    // If using client-side fallback, return post data for client to create
    if (useClientSideFallback) {
      return NextResponse.json({
        success: true,
        postId: null,
        postData: postData, // Return the full post data
        requiresClientSideCreation: true,
        title: blogPost.title,
        status: postData.status,
        canonical_url: canonicalUrl,
        sourceId: blogPost.sourceId,
        message: 'Blog post generated. Creating via client-side Firestore...',
        metadata: {
          platformSelection: postData.metadata?.platformSelection,
          optimalPostingTimes: postData.metadata?.optimalPostingTimes,
          requiresApproval: postData.metadata?.requiresApproval,
          aiGenerated: true,
        },
      });
    }

    // Auto-post to all connected platforms if published (for server-side creation)
    let autoPosted = false;
    if (postData.status === 'published' && postId) {
      try {
        // Get connected platforms from Firestore (only if Admin SDK is available)
        let connectedPlatforms: string[] = [];
        try {
          const adminDb = getAdminDb();
          if (adminDb) {
            const platformsRef = adminDb.collection('blog_platforms');
            const platformsSnapshot = await platformsRef.get();
            connectedPlatforms = platformsSnapshot.docs
              .filter(doc => doc.data().connected === true)
              .map(doc => doc.id);
            console.log('📱 Connected platforms found:', connectedPlatforms);
          }
        } catch (platformError) {
          console.warn('⚠️ Could not fetch connected platforms, will use metadata selection:', platformError);
          // Fallback to metadata platform selection
          connectedPlatforms = Object.entries(postData.metadata?.platformSelection || {})
            .filter(([_, selected]) => selected)
            .map(([platform]) => platform);
        }

        // Post to connected platforms if any
        if (connectedPlatforms.length > 0) {
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
            autoPosted = true;
            console.log('✅ Auto-posted to platforms:', publishData.platforms || connectedPlatforms);
          } else {
            const errorData = await publishResponse.json();
            console.error('❌ Failed to auto-post to platforms:', errorData);
          }
        } else {
          console.log('ℹ️ No connected platforms found, skipping auto-post');
        }
      } catch (error) {
        console.error('❌ Error auto-posting to platforms:', error);
      }
    }

    return NextResponse.json({
      success: true,
      postId,
      title: blogPost.title,
      status: postData.status,
      canonical_url: canonicalUrl,
      sourceId: blogPost.sourceId,
      message: 'Blog post generated and saved successfully',
      autoPosted,
      metadata: {
        platformSelection: postData.metadata?.platformSelection,
        optimalPostingTimes: postData.metadata?.optimalPostingTimes,
        requiresApproval: postData.metadata?.requiresApproval,
        aiGenerated: true,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in auto blog generation:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to generate blog post',
        errorType: error?.name || 'UnknownError',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error?.stack,
          message: error?.message,
          code: error?.code,
        } : undefined
      },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function generateExcerpt(content: string, maxLength: number = 150): string {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

function ensureSocialLinks(social: any, canonicalUrl: string): any {
  const ensureLink = (text: string, url: string): string => {
    if (!text.includes(url) && !text.includes('cryptorafts.com')) {
      return `${text} ${url}`;
    }
    return text;
  };

  return {
    linkedin: ensureLink(social.linkedin || '', canonicalUrl),
    x: ensureLink(social.x || '', canonicalUrl),
    telegram: ensureLink(social.telegram || '', canonicalUrl),
    devto: social.devto || social.linkedin || '',
    blogger: social.blogger || social.linkedin || '',
    buffer: ensureLink(social.buffer || social.linkedin || '', canonicalUrl),
  };
}

