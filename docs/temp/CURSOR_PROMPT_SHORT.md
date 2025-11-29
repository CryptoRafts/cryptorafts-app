# 🎯 Short Cursor Prompt (One-Paragraph Version)

**Copy this into Cursor's automation/composer:**

---

Generate a high-quality 800-1200 word SEO blog post for Cryptorafts (crypto/Web3 audience) in HTML format. Return ONLY valid JSON with: `title`, `excerpt`, `content` (HTML), `meta_title` (≤60 chars), `meta_description` (≤155 chars), `canonical_url` (https://www.cryptorafts.com/blog/{slug}), `slug`, `tags` (3-6), `category` (Crypto/Web3/AI/Tokenomics/KYC), `keywords` (5-8), `social.linkedin` (120-200 chars), `social.x` (≤280 chars), `social.telegram` (1-2 lines), `reading_time` (minutes), `images` (array), `claims_to_verify` (array), `publish` (false for drafts), `source` ("cursor-ai"), `sourceId` ("cursor-{timestamp}"). POST the JSON to `https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish`. If topic not provided, randomly pick from: crypto, web3, ai, tokenomics, kyc, exchange listings, influencer marketing. Tone: professional founder-level, no emojis. If webhook fails, retry once and notify cryptorafts.admin@gmail.com.

---

## 📋 Full Format Reference

If Cursor needs the full structure, use this:

```json
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
  "images": [{"url": "https://cdn.cryptorafts.com/images/{image}.png", "alt": "alt text"}],
  "claims_to_verify": ["Claim 1", "Claim 2"],
  "publish": false,
  "source": "cursor-ai",
  "sourceId": "cursor-{{timestamp}}"
}
```

---

## ⚙️ Configuration

- **Webhook URL**: Replace `https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish` with your actual n8n webhook URL
- **Publish Mode**: Set `publish: false` for drafts (recommended start), `true` for auto-publish
- **Admin Email**: Replace `cryptorafts.admin@gmail.com` with your admin email

---

## 🚀 Quick Start

1. **Copy the one-paragraph prompt** above into Cursor
2. **Replace** webhook URL with your n8n URL
3. **Set** `publish: false` for initial QA
4. **Run** the automation
5. **Check** drafts in `/admin/blog`

---

For full setup instructions, see `BLOG_AUTOMATION_SETUP.md`.

