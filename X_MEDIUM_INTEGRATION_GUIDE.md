# 🚀 X (Twitter) & Medium Integration Guide

Complete guide for setting up and using X (Twitter) and Medium integrations in the admin blog system.

---

## ✅ What's Been Implemented

### **1. X (Twitter) Integration** ✅
- ✅ OAuth 2.0 authentication flow
- ✅ PKCE (Proof Key for Code Exchange) security
- ✅ Post tweets with text, hashtags, and links
- ✅ Media upload support (images)
- ✅ Connection status tracking in Firestore
- ✅ Auto-posting when blog is published

### **2. Medium Integration** ✅
- ✅ OAuth 2.0 authentication flow
- ✅ Publish full articles to Medium
- ✅ HTML to Medium format conversion
- ✅ Canonical URL support (SEO-friendly)
- ✅ Tag support (max 5 tags)
- ✅ Draft/Public/Unlisted publishing options
- ✅ Connection status tracking in Firestore
- ✅ Auto-posting when blog is published

---

## 🔧 Setup Instructions

### **Step 1: Get API Credentials**

#### **X (Twitter) API Credentials**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App (or use existing)
3. Enable OAuth 2.0:
   - Go to "User authentication settings"
   - Set App permissions to "Read and write"
   - Set Type of App to "Web App, Automated App or Bot"
   - Add callback URL: `https://cryptorafts.com/api/blog/oauth/x/callback`
   - Add website URL: `https://cryptorafts.com`
4. Generate Client ID and Client Secret
5. Copy the credentials

#### **Medium API Credentials**

1. Go to [Medium Developer Portal](https://medium.com/me/applications)
2. Create a new Integration Token:
   - Click "Get an integration token"
   - Copy the token (this is your access token)
3. For OAuth 2.0 (recommended):
   - Go to [Medium OAuth Apps](https://medium.com/me/applications)
   - Create a new OAuth application
   - Set redirect URI: `https://cryptorafts.com/api/blog/oauth/medium/callback`
   - Copy Client ID and Client Secret

### **Step 2: Add Environment Variables**

Add these to your `.env.local` file:

```env
# X (Twitter) OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback

# OR use X_ prefix (both work)
X_CLIENT_ID=your_twitter_client_id
X_CLIENT_SECRET=your_twitter_client_secret
X_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback

# Medium OAuth 2.0
MEDIUM_CLIENT_ID=your_medium_client_id
MEDIUM_CLIENT_SECRET=your_medium_client_secret
MEDIUM_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/medium/callback

# OR use Medium Integration Token (simpler, but less secure)
MEDIUM_ACCESS_TOKEN=your_medium_integration_token

# App URL (for generating post URLs)
NEXT_PUBLIC_APP_URL=https://cryptorafts.com
```

### **Step 3: Connect Accounts in Admin Panel**

1. Go to `/admin/blog`
2. In the "Platform Connections" section, click "Connect" on:
   - **X (Twitter)** - Will redirect to Twitter OAuth
   - **Medium** - Will redirect to Medium OAuth
3. Authorize the applications
4. You'll be redirected back with connection confirmed

---

## 📝 Usage

### **Automatic Posting**

When you publish a blog post:

1. Go to `/admin/blog`
2. Create or edit a post
3. In the "Platform Selection" section, select:
   - ✅ X (Twitter) - to post a tweet
   - ✅ Medium - to publish full article
4. Click "Publish"
5. The system will automatically:
   - Post to X with title, excerpt, link, and hashtags
   - Publish to Medium as a full article with canonical URL

### **Manual Posting**

#### **Post to X (Twitter)**

```typescript
// API: POST /api/blog/post/x
{
  "postId": "post_id_here",
  "title": "Post Title",
  "excerpt": "Post excerpt...",
  "url": "https://cryptorafts.com/blog/post-slug",
  "hashtags": ["crypto", "blockchain"]
}
```

#### **Post to Medium**

```typescript
// API: POST /api/blog/post/medium
{
  "postId": "post_id_here",
  "title": "Post Title",
  "content": "<p>HTML content...</p>",
  "excerpt": "Post excerpt...",
  "tags": ["crypto", "blockchain", "defi"],
  "canonicalUrl": "https://cryptorafts.com/blog/post-slug",
  "publishStatus": "public" // or "draft" or "unlisted"
}
```

---

## 🔐 Security Features

### **OAuth 2.0 Flow**
- ✅ Secure token exchange
- ✅ PKCE for X (Twitter) - prevents authorization code interception
- ✅ Refresh token support (when available)
- ✅ Tokens stored securely in Firestore
- ✅ No tokens exposed to client-side

### **Token Management**
- Tokens are stored in Firestore `blog_platforms` collection
- Only accessible by admin users
- Automatically refreshed when expired (if refresh tokens available)

---

## 📊 Platform Status Tracking

Connection status is tracked in Firestore:

**Collection:** `blog_platforms`
**Documents:**
- `x` - X (Twitter) connection
- `medium` - Medium connection

**Document Structure:**
```typescript
{
  id: 'x' | 'medium',
  name: string,
  icon: string,
  connected: boolean,
  connectedAt: Timestamp,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number,
  userId: string,
  username: string,
  name: string,
  url?: string,
  lastSync: Timestamp
}
```

---

## 🐛 Troubleshooting

### **X (Twitter) Connection Issues**

**Error: "Twitter OAuth 2.0 not configured"**
- Check that `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are set
- Verify redirect URI matches in Twitter Developer Portal

**Error: "Failed to post tweet"**
- Check that account is connected (go to `/admin/blog`)
- Verify access token is valid
- Check tweet length (280 characters max)

### **Medium Connection Issues**

**Error: "Medium service not configured"**
- Check that `MEDIUM_CLIENT_ID` and `MEDIUM_CLIENT_SECRET` are set
- Or use `MEDIUM_ACCESS_TOKEN` for integration token method

**Error: "Failed to publish to Medium"**
- Check that account is connected
- Verify access token is valid
- Check article content format (HTML required)

### **General Issues**

**OAuth callback not working:**
- Verify redirect URIs match exactly in:
  - Environment variables
  - Platform developer portals
  - Callback route handlers

**Tokens not saving:**
- Check Firebase connection
- Verify admin permissions
- Check Firestore security rules

---

## 📚 API Reference

### **OAuth Authorization Routes**

- `GET /api/blog/oauth/x/authorize` - Get X OAuth URL
- `GET /api/blog/oauth/medium/authorize` - Get Medium OAuth URL

### **OAuth Callback Routes**

- `GET /api/blog/oauth/x/callback` - X OAuth callback
- `GET /api/blog/oauth/medium/callback` - Medium OAuth callback

### **Posting Routes**

- `POST /api/blog/post/x` - Post to X (Twitter)
- `POST /api/blog/post/medium` - Post to Medium

### **Admin Publishing**

- `POST /api/blog/admin/publish` - Publish post to selected platforms

---

## 🎯 Best Practices

1. **Always use OAuth 2.0** - More secure than integration tokens
2. **Set canonical URLs** - Prevents duplicate content issues
3. **Use appropriate tags** - Medium allows max 5 tags
4. **Keep tweets concise** - 280 character limit
5. **Test connections first** - Verify OAuth flow works before publishing
6. **Monitor token expiration** - Refresh tokens when needed
7. **Check platform status** - Verify connections in admin panel

---

## 🔄 Next Steps

1. ✅ Connect X and Medium accounts
2. ✅ Test OAuth flows
3. ✅ Create a test blog post
4. ✅ Publish and verify posts appear on both platforms
5. ✅ Set up auto-posting for future posts

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Verify Firestore connections
5. Review platform API documentation

---

**Status:** ✅ Fully Implemented and Ready to Use

