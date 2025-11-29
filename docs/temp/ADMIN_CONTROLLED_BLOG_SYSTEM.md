# 🎛️ Admin-Controlled AI Blog & Social Posting System

**Complete admin-controlled blogging system with AI generation, platform selection, and scheduling**

---

## ✅ What's Been Created

### 1. **Google Trends Integration** ✅
- ✅ `src/lib/google-trends-service.ts` - Trending topics service
- ✅ Fetches trending crypto/blockchain topics
- ✅ Provides trending hashtags
- ✅ Optimal posting times per platform

### 2. **Admin API Endpoints** ✅
- ✅ `POST /api/blog/admin/manage` - Create/edit posts, approve AI posts
- ✅ `POST /api/blog/admin/publish` - Publish to selected platforms
- ✅ `GET /api/blog/admin/manage` - Get posts (with AI filter)

### 3. **Updated Blog Generation** ✅
- ✅ `POST /api/blog/generate-auto` - AI generation (admin-controlled)
- ✅ Uses Google Trends for topics
- ✅ Saves with platform selection metadata
- ✅ Requires admin approval (if draft mode)

### 4. **Firebase Schema Updates** ✅
- ✅ Platform selection fields
- ✅ Scheduling metadata
- ✅ Platform posting status
- ✅ AI generation tracking

---

## 🎯 Features

### **Daily AI Blog Generation**
- ✅ Generates 800-1500 words daily
- ✅ Uses Google Trends for trending topics
- ✅ Includes trending hashtags
- ✅ SEO optimized (meta title ≤60, description ≤155)
- ✅ Validates content (min 500 words, no spam)
- ✅ Saves as draft (requires admin approval)

### **Admin Control**
- ✅ **Manual Creation**: Admin can create/edit posts
- ✅ **Scheduling**: Schedule posts for any date/time
- ✅ **Platform Selection**: Choose which platforms to post to
  - LinkedIn
  - X/Twitter
  - Telegram
  - Dev.to
  - Blogger
  - Buffer
  - Website
- ✅ **Approval System**: Approve/override AI-generated posts
- ✅ **Override AI**: Edit AI-generated content

### **Social Media & Cross-Posting**
- ✅ Platform-specific captions
- ✅ Trending hashtags
- ✅ Optimal posting times per platform
- ✅ Admin selects platforms before publishing
- ✅ Tracks posting status per platform

### **Website Publishing**
- ✅ Full HTML content
- ✅ Metadata (title, slug, canonical URL)
- ✅ Draft mode and auto-publish mode
- ✅ SEO optimization

### **Automation & Validation**
- ✅ Unique sourceId prevents duplicates
- ✅ Error handling and retries
- ✅ SEO optimization
- ✅ Content validation

---

## 📊 API Endpoints

### **1. Generate AI Blog Post**

**POST** `/api/blog/generate-auto`

**No parameters** - Fully automatic

**Response**:
```json
{
  "success": true,
  "postId": "...",
  "title": "...",
  "status": "draft",
  "canonical_url": "...",
  "sourceId": "cursor-...",
  "metadata": {
    "platformSelection": {
      "linkedin": false,
      "x": false,
      "telegram": false,
      "devto": false,
      "blogger": false,
      "buffer": false,
      "website": true
    },
    "optimalPostingTimes": {
      "linkedin": "09:00",
      "x": "12:00",
      "telegram": "18:00",
      "devto": "10:00",
      "blogger": "14:00",
      "buffer": "11:00",
      "website": "09:00"
    },
    "requiresApproval": true,
    "aiGenerated": true
  }
}
```

---

### **2. Admin Manage Posts**

**POST** `/api/blog/admin/manage`

**Create/Edit Post**:
```json
{
  "id": "post-id", // Optional - for updates
  "title": "Blog Title",
  "content": "<p>HTML content</p>",
  "excerpt": "Summary",
  "category": "Crypto",
  "tags": ["crypto", "blockchain"],
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "featuredImage": "https://...",
  "status": "draft" | "published" | "scheduled",
  "scheduledDate": "2024-01-01T09:00:00Z", // ISO string
  "platformSelection": {
    "linkedin": true,
    "x": true,
    "telegram": false,
    "devto": false,
    "blogger": false,
    "buffer": false,
    "website": true
  },
  "approve": true, // Approve AI-generated post
  "override": false // Override AI content
}
```

**Response**:
```json
{
  "success": true,
  "postId": "...",
  "message": "Post created/updated successfully",
  "post": {
    "id": "...",
    "title": "...",
    "status": "draft",
    "platformSelection": {...},
    "scheduledFor": "2024-01-01T09:00:00Z"
  }
}
```

---

**GET** `/api/blog/admin/manage?status=draft&aiGenerated=true&requiresApproval=true`

**Query Parameters**:
- `status`: Filter by status (draft/published/scheduled)
- `aiGenerated`: Filter AI-generated posts (true/false)
- `requiresApproval`: Filter posts requiring approval (true/false)

**Response**:
```json
{
  "success": true,
  "posts": [...],
  "count": 10
}
```

---

### **3. Admin Publish to Platforms**

**POST** `/api/blog/admin/publish`

**Publish Post**:
```json
{
  "postId": "post-id",
  "platforms": ["linkedin", "x", "telegram", "devto", "blogger", "buffer", "website"],
  "scheduleFor": "2024-01-01T09:00:00Z" // Optional - ISO string
}
```

**Response**:
```json
{
  "success": true,
  "message": "Post published/scheduled successfully",
  "postId": "...",
  "platformSelection": {...},
  "scheduledFor": "2024-01-01T09:00:00Z",
  "platforms": ["linkedin", "x", "website"]
}
```

---

## 🔄 Workflow

### **1. AI Generates Post Daily**

```bash
# Automatic daily generation
POST /api/blog/generate-auto
```

**Result**: Post saved as draft with:
- ✅ AI-generated content
- ✅ Platform selection (all false, website true)
- ✅ Requires admin approval
- ✅ Optimal posting times included

---

### **2. Admin Reviews & Approves**

```bash
# Get AI-generated posts requiring approval
GET /api/blog/admin/manage?aiGenerated=true&requiresApproval=true

# Approve and select platforms
POST /api/blog/admin/manage
{
  "id": "post-id",
  "approve": true,
  "platformSelection": {
    "linkedin": true,
    "x": true,
    "website": true
  }
}
```

---

### **3. Admin Schedules Publishing**

```bash
# Schedule post for optimal time
POST /api/blog/admin/publish
{
  "postId": "post-id",
  "platforms": ["linkedin", "x", "website"],
  "scheduleFor": "2024-01-01T09:00:00Z"
}
```

---

### **4. Manual Post Creation**

```bash
# Admin creates post manually
POST /api/blog/admin/manage
{
  "title": "Manual Post",
  "content": "<p>Content</p>",
  "category": "Crypto",
  "tags": ["crypto"],
  "status": "published",
  "platformSelection": {
    "linkedin": true,
    "x": true,
    "website": true
  }
}
```

---

## 📋 Firebase Schema

### **Blog Post Document**

```typescript
{
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  author: string;
  authorId: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduledDate?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  shares: number;
  readingTime: number;
  metadata: {
    canonicalUrl: string;
    keywords: string[];
    socialCaptions: {
      linkedin?: string;
      x?: string;
      telegram?: string;
      devto?: string;
      blogger?: string;
      buffer?: string;
    };
    hashtags: string[];
    source: string;
    sourceId: string;
    images: Array<{ url: string; alt: string }>;
    platformSelection: {
      linkedin: boolean;
      x: boolean;
      telegram: boolean;
      devto: boolean;
      blogger: boolean;
      buffer: boolean;
      website: boolean;
    };
    optimalPostingTimes: Record<string, string>;
    scheduledFor: string | null;
    aiGenerated: boolean;
    requiresApproval: boolean;
    platformStatus: Record<string, {
      posted: boolean;
      postedAt?: string;
      error?: string;
    }>;
  };
}
```

---

## 🚀 Usage Examples

### **Example 1: Daily AI Generation**

```bash
# Schedule daily (cron/GitHub Actions)
curl -X POST https://www.cryptorafts.com/api/blog/generate-auto
```

**Result**: Post saved as draft, requires admin approval

---

### **Example 2: Admin Approves & Selects Platforms**

```bash
curl -X POST https://www.cryptorafts.com/api/blog/admin/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "post-id",
    "approve": true,
    "platformSelection": {
      "linkedin": true,
      "x": true,
      "telegram": true,
      "website": true
    }
  }'
```

---

### **Example 3: Schedule Post**

```bash
curl -X POST https://www.cryptorafts.com/api/blog/admin/publish \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-id",
    "platforms": ["linkedin", "x", "website"],
    "scheduleFor": "2024-01-01T09:00:00Z"
  }'
```

---

### **Example 4: Manual Post Creation**

```bash
curl -X POST https://www.cryptorafts.com/api/blog/admin/manage \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manual Blog Post",
    "content": "<h1>Title</h1><p>Content</p>",
    "category": "Crypto",
    "tags": ["crypto", "blockchain"],
    "status": "published",
    "platformSelection": {
      "linkedin": true,
      "x": true,
      "website": true
    }
  }'
```

---

## ✅ Status

- ✅ Google Trends integration
- ✅ Admin API endpoints
- ✅ Platform selection
- ✅ Scheduling system
- ✅ Approval workflow
- ✅ Firebase schema updated
- ✅ AI generation (admin-controlled)
- ✅ Manual post creation
- ✅ Platform posting tracking

---

## 🎉 Ready!

**Everything is admin-controlled!**

1. **AI generates** posts daily (saved as drafts)
2. **Admin reviews** and selects platforms
3. **Admin schedules** or publishes immediately
4. **System tracks** posting status per platform

**All stored in Firebase with full admin control!**

