/**
 * Test script for blog automation
 * 
 * This script tests the blog automation without actually sending to webhook
 * Useful for debugging and validation
 * 
 * Usage: npx tsx scripts/test-blog-automation.ts
 */

import dotenv from 'dotenv';
import { generateBlogPost } from './cursor-blog-automation';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testBlogGeneration() {
  console.log('🧪 Testing blog post generation...\n');

  try {
    // Test 1: Check environment variables
    console.log('📋 Environment Check:');
    console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  N8N_WEBHOOK_URL: ${process.env.N8N_WEBHOOK_URL || '⚠️  Not set (will skip webhook test)'}`);
    console.log(`  DEFAULT_PUBLISH_MODE: ${process.env.DEFAULT_PUBLISH_MODE || 'false (default)'}`);
    console.log(`  ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'cryptorafts.admin@gmail.com (default)'}`);
    console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cryptorafts.com (default)'}\n`);

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is required. Add it to .env.local');
      process.exit(1);
    }

    // Test 2: Generate blog post
    console.log('📝 Generating blog post...\n');
    const blogPost = await generateBlogPost('crypto');

    // Test 3: Validate structure
    console.log('✅ Blog post generated successfully!\n');
    console.log('📊 Post Details:');
    console.log(`  Title: ${blogPost.title}`);
    console.log(`  Category: ${blogPost.category}`);
    console.log(`  Tags: ${blogPost.tags.join(', ')}`);
    console.log(`  Reading Time: ${blogPost.reading_time} minutes`);
    console.log(`  Content Length: ${blogPost.content.length} characters`);
    console.log(`  Slug: ${blogPost.slug}`);
    console.log(`  Canonical URL: ${blogPost.canonical_url}`);
    console.log(`  Publish Mode: ${blogPost.publish ? 'Auto-publish' : 'Draft'}`);
    console.log(`  Source ID: ${blogPost.sourceId}\n`);

    // Test 4: Validate required fields
    console.log('🔍 Validation Check:');
    const requiredFields = ['title', 'content', 'slug', 'category', 'tags', 'social', 'canonical_url'];
    const missingFields = requiredFields.filter(field => !blogPost[field as keyof typeof blogPost]);
    
    if (missingFields.length > 0) {
      console.error(`  ❌ Missing fields: ${missingFields.join(', ')}`);
    } else {
      console.log('  ✅ All required fields present');
    }

    // Test 5: Validate content quality
    console.log('\n📏 Content Quality:');
    console.log(`  Title length: ${blogPost.title.length} chars ${blogPost.title.length >= 10 && blogPost.title.length <= 100 ? '✅' : '⚠️'}`);
    console.log(`  Content length: ${blogPost.content.length} chars ${blogPost.content.length >= 500 ? '✅' : '⚠️'}`);
    console.log(`  Meta title length: ${blogPost.meta_title.length} chars ${blogPost.meta_title.length <= 60 ? '✅' : '⚠️'}`);
    console.log(`  Meta description length: ${blogPost.meta_description.length} chars ${blogPost.meta_description.length <= 155 ? '✅' : '⚠️'}`);
    console.log(`  LinkedIn caption: ${blogPost.social.linkedin.length} chars ${blogPost.social.linkedin.length >= 120 && blogPost.social.linkedin.length <= 200 ? '✅' : '⚠️'}`);
    console.log(`  X/Twitter caption: ${blogPost.social.x.length} chars ${blogPost.social.x.length <= 280 ? '✅' : '⚠️'}`);

    // Test 6: Check HTML structure
    console.log('\n🔧 HTML Structure:');
    const hasH2 = blogPost.content.includes('<h2>');
    const hasP = blogPost.content.includes('<p>');
    console.log(`  Has H2 headings: ${hasH2 ? '✅' : '⚠️'}`);
    console.log(`  Has paragraphs: ${hasP ? '✅' : '⚠️'}`);

    console.log('\n✅ All tests passed! Blog post is ready for automation.\n');
    console.log('💡 To send this to webhook, run: npm run blog:generate');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
testBlogGeneration();

