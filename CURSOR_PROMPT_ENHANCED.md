# 🚀 Enhanced Cursor Prompt - Automated Daily Blog Posting

**Complete prompt for Cursor to generate, optimize, and publish daily blog posts**

---

## 📋 Copy This Prompt to Cursor

```
Task: Automatically generate, optimize, and publish one high-quality blog post daily for Cryptorafts.

CONTENT GENERATION:
- Generate 800-1500 words of unique, engaging content
- Focus on cryptocurrency, blockchain, and finance topics
- Use trending topics from Google Trends or current crypto/finance trends
- Include latest news, insights, and market analysis
- Ensure unique content; check for duplicates using sourceId
- Format with proper HTML: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- Include at least 3-5 H2 sections with relevant H3 subsections
- Add internal links to cryptorafts.com content where relevant
- Use bold text for key points
- Include proper paragraph breaks

SEO OPTIMIZATION:
- Meta title: Maximum 60 characters, SEO-optimized, includes primary keyword
- Meta description: Maximum 155 characters, compelling, includes call-to-action
- Canonical URL: Format as https://www.cryptorafts.com/blog/{slug}
- Keywords: 5-8 relevant keywords for SEO
- Tags: 3-6 relevant tags
- Include 3-5 trending hashtags (#crypto #blockchain #DeFi #Web3 #Bitcoin #Ethereum)

CONTENT VALIDATION:
- Minimum 500 words content
- Title minimum 10 characters
- Maximum 5 external links (internal links unlimited)
- Detect and remove spam, filler, or low-quality content
- Ensure high-quality, actionable content

SOCIAL MEDIA CROSS-POSTING:
Prepare optimized content for each platform:
- LinkedIn: 120-200 characters, professional tone, 2-3 hashtags, include link
- X/Twitter: Maximum 280 characters, engaging, 2-3 trending hashtags, include link
- Telegram: 1-2 short lines, casual tone, include link
- Dev.to: Markdown format, technical focus, include tags
- Blogger: HTML format, SEO-optimized, include labels
- Buffer: Universal format for 3 social profiles, include link and hashtags

Schedule posts for peak engagement times:
- LinkedIn: 8 AM UTC, Mon-Fri
- X/Twitter: 3 PM UTC, Mon-Fri
- Telegram: 12 PM UTC, Daily
- Dev.to: 10 AM UTC, Mon-Fri
- Blogger: 9 AM UTC, Mon-Fri

WEBSITE PUBLISHING:
- Send full HTML content to webhook API: https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
- Include publish status (draft or auto-publish based on DEFAULT_PUBLISH_MODE)
- Use OpenAI API key from environment: OPENAI_API_KEY

AUTOMATION & TRACKING:
- Include unique sourceId: "cursor-{timestamp}" to prevent duplicates
- Include social posting log for each platform (success/failure)
- Implement retry logic if posting fails (retry once, then notify admin)

TONE & STYLE:
- Professional yet engaging
- Easy-to-read for beginners and intermediate crypto enthusiasts
- Use call-to-actions where relevant
- Include data and examples to support points

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "Catchy SEO-optimized title (60 chars max)",
  "content": "<h1>Title</h1><h2>Section</h2><p>Full HTML content (800-1500 words)</p>",
  "excerpt": "Compelling 2-line summary (150 chars)",
  "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
  "sourceId": "cursor-{timestamp}",
  "publish": true/false,
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
  "images": [{"url": "https://cdn.cryptorafts.com/images/{image}.png", "alt": "alt text"}],
  "claims_to_verify": ["Claim 1", "Claim 2"],
  "platform_timing": {
    "linkedin": "2025-01-XXT08:00:00Z",
    "x": "2025-01-XXT15:00:00Z",
    "telegram": "2025-01-XXT12:00:00Z",
    "devto": "2025-01-XXT10:00:00Z",
    "blogger": "2025-01-XXT09:00:00Z"
  }
}

DELIVERY:
- POST the generated JSON to: https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
- If response is success (200 + {success:true}), mark complete
- If webhook fails, retry once and notify: cryptorafts.admin@gmail.com

VALIDATION BEFORE SENDING:
- Check content length (500+ words)
- Check title length (10+ characters)
- Count external links (≤5)
- Verify no spam phrases
- Ensure hashtags included (3-5)
- Validate meta title/description lengths

DEFAULT BEHAVIOR:
- If no topic provided, select from trending topics pool
- Default publish mode: false (draft) for QA, true for auto-publish
- Generate one article per run
- Schedule: once per day (or as configured)
```

---

## 🎯 Quick Usage

### Option 1: Use Enhanced Script

```bash
npm run blog:generate:enhanced
```

### Option 2: Use Standard Script

```bash
npm run blog:generate
```

### Option 3: Copy Prompt to Cursor

Copy the prompt above and paste into Cursor's composer/automation.

---

## ✨ Enhanced Features

### Trending Topics
- Automatically selects from trending topics pool
- Can be updated with Google Trends API integration
- Focuses on current crypto/finance trends

### SEO Optimization
- Meta title ≤ 60 characters
- Meta description ≤ 155 characters
- Canonical URLs
- 5-8 keywords
- 3-6 tags

### Multi-Platform Formatting
- LinkedIn: Professional, 120-200 chars
- X/Twitter: Engaging, ≤280 chars
- Telegram: Casual, 1-2 lines
- Dev.to: Markdown format
- Blogger: HTML format
- Buffer: Universal format

### Peak Engagement Timing
- Calculates optimal posting times
- Platform-specific scheduling
- Timezone-aware (UTC)

### Content Validation
- Word count check (500+ words)
- Title length validation
- External link limit (≤5)
- Spam detection
- Quality checks

### Duplicate Prevention
- Unique sourceId per post
- Timestamp-based IDs
- Prevents reposting

---

## 📊 Output Format

The enhanced script generates JSON matching your exact specification:

```json
{
  "title": "...",
  "content": "<h1>...</h1><p>...</p>",
  "canonical_url": "https://www.cryptorafts.com/blog/{slug}",
  "sourceId": "cursor-{timestamp}",
  "publish": true,
  "hashtags": ["#crypto", "#blockchain"],
  "social": {
    "linkedin": "...",
    "x": "...",
    "telegram": "...",
    "devto": "...",
    "blogger": "...",
    "buffer": "..."
  },
  "platform_timing": {
    "linkedin": "2025-01-XXT08:00:00Z",
    "x": "2025-01-XXT15:00:00Z"
  }
}
```

---

## 🚀 Scheduling

### Daily Automation

**GitHub Actions** (`.github/workflows/blog-automation.yml`):
- Runs daily at 9 AM UTC
- Uses enhanced script

**Cron** (Linux/Mac):
```bash
0 9 * * * cd /path/to/project && npm run blog:generate:enhanced
```

**Windows Task Scheduler**:
- Use `scripts/schedule-blog-automation.ps1`
- Set to run daily

---

## ✅ Features Checklist

- ✅ Trending topic detection
- ✅ SEO optimization (meta tags, canonical URLs)
- ✅ Multi-platform social formatting
- ✅ Content validation
- ✅ Duplicate prevention
- ✅ Peak engagement timing
- ✅ Retry logic
- ✅ Error notifications
- ✅ HTML formatting
- ✅ Hashtag optimization

---

## 📚 Related Files

- **Enhanced Script**: `scripts/cursor-blog-automation-enhanced.ts`
- **Standard Script**: `scripts/cursor-blog-automation.ts`
- **n8n Workflow**: `N8N_COMPLETE_SETUP_GUIDE.md`
- **Integration Guide**: `INTEGRATIONS_SETUP_GUIDE.md`

---

## 🎉 Ready!

Use the enhanced script or copy the prompt to Cursor. Everything is configured and ready!

**Run**: `npm run blog:generate:enhanced`

