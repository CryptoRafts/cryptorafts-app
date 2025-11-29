/**
 * Blog Service - Server-side implementation using Firebase Admin
 * For use in API routes and server components
 * REQUIRES: Firebase Admin SDK to be configured with FIREBASE_SERVICE_ACCOUNT_B64
 */

import { getAdminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

// Utility functions (inlined to avoid importing client-side code)
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function generateExcerpt(content: string, maxLength: number = 160): string {
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Initialize Firestore for server-side use (Admin SDK only)
function getFirestoreDb(): { db: any; isAdmin: boolean } {
  // In server-side context, we can ONLY use Admin SDK
  // Client-side Firestore is not available in API routes
  if (typeof window !== 'undefined') {
    throw new Error('blog-service.server.ts should only be used in server-side contexts');
  }

  // Try Admin SDK (required for server-side)
  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      console.log('✅ Using Firebase Admin SDK for blog service');
      return { db: adminDb, isAdmin: true };
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin SDK not available:', error?.message);
  }

  // If Admin SDK is not available, we cannot proceed
  throw new Error(
    'Firebase Admin SDK not configured. ' +
    'Please set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel environment variables. ' +
    'See: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk'
  );
}

// Type definitions (inlined to avoid importing client-side code)
export interface PlatformSelection {
  linkedin: boolean;
  x: boolean;
  telegram: boolean;
  devto: boolean;
  blogger: boolean;
  buffer: boolean;
  website: boolean;
}

export interface BlogPostMetadata {
  canonicalUrl?: string;
  keywords?: string[];
  socialCaptions?: {
    linkedin?: string;
    x?: string;
    telegram?: string;
    devto?: string;
    blogger?: string;
    buffer?: string;
  };
  hashtags?: string[];
  source?: string;
  sourceId?: string;
  images?: Array<{ url: string; alt: string }>;
  claimsToVerify?: string[];
  platformSelection?: PlatformSelection;
  optimalPostingTimes?: Record<string, string>;
  scheduledFor?: string | null;
  aiGenerated?: boolean;
  requiresApproval?: boolean;
  platformStatus?: Record<string, {
    posted: boolean;
    postedAt?: string;
    error?: string;
  }>;
}

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  author: string;
  authorId?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduledDate?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  shares: number;
  readingTime?: number;
  commentEnabled?: boolean;
  featured?: boolean;
  seoKeyword?: string;
  metadata?: BlogPostMetadata;
}

const COLLECTION_NAME = 'blog_posts';

class BlogServiceServer {
  private getDb() {
    return getFirestoreDb();
  }

  async getPosts(filters: any = {}) {
    try {
      console.log('🔍 Blog Service: Getting posts with filters:', filters);
      const { db } = this.getDb();
      
      if (!db) {
        console.error('❌ Firestore not initialized - returning empty array');
        return [];
      }

      // Build query using Admin SDK
      console.log('🔍 Blog Service: Building query for collection:', COLLECTION_NAME);
      let queryRef: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);

      // Apply filters
      if (filters.status) {
        queryRef = queryRef.where('status', '==', filters.status);
      }
      if (filters.category) {
        queryRef = queryRef.where('category', '==', filters.category);
      }
      if (filters.featured) {
        queryRef = queryRef.where('featured', '==', true);
      }

      // Get all matching documents (orderBy removed to avoid index requirement)
      console.log('🔍 Blog Service: Executing query...');
      const snapshot = await queryRef.get();
      console.log('🔍 Blog Service: Got snapshot with', snapshot.size, 'documents');

      let posts = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                         (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString());
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                         (data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString());
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
        };
      });

      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        posts = posts.filter((post: any) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          (post.tags || []).some((tag: string) => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply tag filter if provided
      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter((post: any) =>
          filters.tags.some((tag: string) => (post.tags || []).includes(tag))
        );
      }

      // Sort by createdAt descending
      posts.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      // Apply limit
      if (filters.limit) {
        posts = posts.slice(0, filters.limit);
      }

      return posts;
    } catch (error) {
      console.error('❌ Error getting blog posts:', error);
      return [];
    }
  }

  async getPostById(id: string) {
    try {
      const { db } = this.getDb();
      if (!db) return null;

      const docSnapshot = await db.collection(COLLECTION_NAME).doc(id).get();

      if (!docSnapshot.exists) return null;

      const data = docSnapshot.data();
      const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                       (data?.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString());
      const updatedAt = data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                       (data?.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString());
      
      return {
        id: docSnapshot.id,
        ...data,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('❌ Error getting blog post:', error);
      return null;
    }
  }

  async getPostBySlug(slug: string) {
    try {
      const { db } = this.getDb();
      if (!db) return null;

      const snapshot = await db.collection(COLLECTION_NAME)
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const docSnapshot = snapshot.docs[0];
      const data = docSnapshot.data();
      const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                       (data?.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString());
      const updatedAt = data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                       (data?.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString());
      
      return {
        id: docSnapshot.id,
        ...data,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('❌ Error getting blog post by slug:', error);
      return null;
    }
  }

  async createPost(postData: any) {
    try {
      const { db } = this.getDb();
      if (!db) throw new Error('Firestore not initialized');

      // Validate content before saving
      const validation = this.validatePostContent(postData);
      if (!validation.valid) {
        console.error('❌ Post validation failed:', validation.errors);
        throw new Error(`Post validation failed: ${validation.errors.join(', ')}`);
      }

      const slug = postData.slug || generateSlug(postData.title);

      // Check if slug already exists
      const existingPost = await this.getPostBySlug(slug);
      if (existingPost) {
        throw new Error(`Slug "${slug}" already exists`);
      }

      // Check for duplicate content (skip for AI-generated posts or be more lenient)
      // AI-generated posts can have similar topics, so we only check for exact title matches
      const isAIGenerated = postData.metadata?.aiGenerated === true;
      if (!isAIGenerated) {
        const isDuplicate = await this.checkDuplicateContent(postData);
        if (isDuplicate) {
          throw new Error('Duplicate content detected: This post is too similar to an existing post');
        }
      } else {
        // For AI-generated posts, only check for exact title match (not content similarity)
        const isExactTitleDuplicate = await this.checkExactTitleDuplicate(postData.title);
        if (isExactTitleDuplicate) {
          throw new Error('Duplicate title detected: A post with this exact title already exists');
        }
      }

      // IMPORTANT: Scheduled posts are NOT saved to blog_posts collection
      // They are saved to scheduled_posts collection and moved to blog_posts when published
      if (postData.status === 'scheduled' && postData.scheduledDate) {
        const scheduledPostData: any = {
          ...postData,
          slug,
          excerpt: postData.excerpt || generateExcerpt(postData.content),
          readingTime: calculateReadingTime(postData.content),
          createdAt: new Date(),
          updatedAt: new Date(),
          scheduledDate: postData.scheduledDate,
          featuredImage: postData.featuredImage || '', // Ensure it's always a string
        };

        // Remove undefined values
        Object.keys(scheduledPostData).forEach(key => {
          if (scheduledPostData[key] === undefined) {
            delete scheduledPostData[key];
          }
        });

        // Save to scheduled_posts collection (not blog_posts)
        const docRef = await db.collection('scheduled_posts').add(scheduledPostData);
        console.log('✅ Scheduled post saved to scheduled_posts:', docRef.id);
        return docRef.id;
      }

      // Only save published or draft posts to blog_posts
      // Remove undefined values (Firestore doesn't accept undefined)
      const cleanPostData: any = {};
      Object.keys(postData).forEach(key => {
        const value = postData[key];
        // Only include defined values, convert undefined to appropriate defaults
        if (value !== undefined) {
          cleanPostData[key] = value;
        }
      });

      const newPost: any = {
        ...cleanPostData,
        slug,
        excerpt: cleanPostData.excerpt || generateExcerpt(cleanPostData.content),
        readingTime: calculateReadingTime(cleanPostData.content),
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0,
        shares: 0,
        commentEnabled: cleanPostData.commentEnabled !== undefined ? cleanPostData.commentEnabled : true,
        featured: cleanPostData.featured !== undefined ? cleanPostData.featured : false,
      };

      // Ensure featuredImage is always a string, never undefined
      if (cleanPostData.featuredImage !== undefined) {
        newPost.featuredImage = cleanPostData.featuredImage || '';
      } else {
        newPost.featuredImage = '';
      }

      // Remove any remaining undefined values
      Object.keys(newPost).forEach(key => {
        if (newPost[key] === undefined) {
          delete newPost[key];
        }
      });

      // Save to Firestore using Admin SDK
      const docRef = await db.collection(COLLECTION_NAME).add(newPost);
      console.log('✅ Blog post created:', docRef.id);
      
      // Send notification email if published
      if (newPost.status === 'published') {
        try {
          const { emailService } = await import('@/lib/email.service');
          await emailService.sendBlogUpdateNotification({
            title: newPost.title,
            slug: newPost.slug,
            author: newPost.author || 'Admin',
            category: newPost.category,
            excerpt: newPost.excerpt,
            status: 'published',
          });
        } catch (emailError) {
          console.error('Failed to send blog notification email:', emailError);
          // Don't fail the post creation if email fails
        }
      }
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating blog post:', error);
      throw error;
    }
  }

  async updatePost(id: string, updates: any) {
    try {
      const { db } = this.getDb();
      if (!db) throw new Error('Firestore not initialized');

      // Recalculate reading time if content changed
      if (updates.content) {
        updates.readingTime = calculateReadingTime(updates.content);
      }

      if (updates.title && !updates.slug) {
        updates.slug = generateSlug(updates.title);
      }

      updates.updatedAt = new Date();

      await db.collection(COLLECTION_NAME).doc(id).update(updates);
      console.log('✅ Blog post updated:', id);
      
      // Send notification email if status changed to published
      if (updates.status === 'published') {
        try {
          const post = await this.getPostById(id);
          if (post) {
            const { emailService } = await import('@/lib/email.service');
            await emailService.sendBlogUpdateNotification({
              title: post.title,
              slug: post.slug,
              author: post.author || 'Admin',
              category: post.category,
              excerpt: post.excerpt,
              status: 'published',
            });
          }
        } catch (emailError) {
          console.error('Failed to send blog notification email:', emailError);
          // Don't fail the update if email fails
        }
      }
    } catch (error) {
      console.error('❌ Error updating blog post:', error);
      throw error;
    }
  }

  async deletePost(id: string) {
    try {
      const { db } = this.getDb();
      if (!db) throw new Error('Firestore not initialized');

      await db.collection(COLLECTION_NAME).doc(id).delete();
      console.log('✅ Blog post deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting blog post:', error);
      throw error;
    }
  }

  async incrementViews(id: string) {
    try {
      const { db } = this.getDb();
      if (!db) return;

      const post = await this.getPostById(id);
      const currentViews = (post as any)?.views || 0;

      await db.collection(COLLECTION_NAME).doc(id).update({
        views: currentViews + 1,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
    }
  }

  async incrementLikes(id: string) {
    try {
      console.log('🔍 Incrementing likes for post:', id);
      const { db } = this.getDb();
      if (!db) {
        console.error('❌ Database not initialized');
        return;
      }

      const post = await this.getPostById(id);
      const currentLikes = (post as any)?.likes || 0;
      console.log('🔍 Current likes:', currentLikes);

      await db.collection(COLLECTION_NAME).doc(id).update({
        likes: currentLikes + 1,
        updatedAt: new Date(),
      });
      console.log('✅ Likes incremented to:', currentLikes + 1);
    } catch (error) {
      console.error('❌ Error incrementing likes:', error);
    }
  }

  async decrementLikes(id: string) {
    try {
      console.log('🔍 Decrementing likes for post:', id);
      const { db } = this.getDb();
      if (!db) {
        console.error('❌ Database not initialized');
        return;
      }

      const post = await this.getPostById(id);
      const currentLikes = (post as any)?.likes || 0;
      console.log('🔍 Current likes:', currentLikes);

      await db.collection(COLLECTION_NAME).doc(id).update({
        likes: Math.max(0, currentLikes - 1),
        updatedAt: new Date(),
      });
      console.log('✅ Likes decremented to:', Math.max(0, currentLikes - 1));
    } catch (error) {
      console.error('❌ Error decrementing likes:', error);
    }
  }

  async incrementShares(id: string) {
    try {
      console.log('🔍 Incrementing shares for post:', id);
      const { db } = this.getDb();
      if (!db) {
        console.error('❌ Database not initialized');
        return;
      }

      const post = await this.getPostById(id);
      const currentShares = (post as any)?.shares || 0;
      console.log('🔍 Current shares:', currentShares);

      await db.collection(COLLECTION_NAME).doc(id).update({
        shares: currentShares + 1,
        updatedAt: new Date(),
      });
      console.log('✅ Shares incremented to:', currentShares + 1);
    } catch (error) {
      console.error('❌ Error incrementing shares:', error);
    }
  }

  /**
   * Validate blog post content to prevent spam and invalid content
   */
  validatePostContent(postData: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!postData.title || postData.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (!postData.content || postData.content.trim().length === 0) {
      errors.push('Content is required');
    }
    if (!postData.category || postData.category.trim().length === 0) {
      errors.push('Category is required');
    }

    // Title length validation
    if (postData.title && postData.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }
    if (postData.title && postData.title.length > 150) {
      errors.push('Title must be less than 150 characters');
    }

    // Content length validation
    const textContent = postData.content ? postData.content.replace(/<[^>]*>/g, '').trim() : '';
    if (textContent.length < 100) {
      errors.push('Content must be at least 100 characters');
    }
    if (textContent.length > 100000) {
      errors.push('Content is too long (max 100,000 characters)');
    }

    // Spam detection - check for common spam indicators
    const spamPatterns = [
      /buy\s+now/i,
      /limited\s+time\s+offer/i,
      /act\s+fast/i,
      /click\s+here/i,
      /guaranteed\s+profit/i,
      /make\s+money\s+fast/i,
      /risk\s+free/i,
      /no\s+credit\s+check/i,
      /urgent\s+act\s+now/i,
      /get\s+rich\s+quick/i,
    ];

    if (postData.title) {
      for (const pattern of spamPatterns) {
        if (pattern.test(postData.title)) {
          errors.push('Title contains spam-like content');
          break;
        }
      }
    }

    if (textContent) {
      let spamCount = 0;
      for (const pattern of spamPatterns) {
        const matches = textContent.match(pattern);
        if (matches) spamCount += matches.length;
      }
      if (spamCount >= 3) {
        errors.push('Content contains multiple spam indicators');
      }
    }

    // Check for excessive links
    const linkCount = (postData.content?.match(/<a\s+href/g) || []).length;
    if (linkCount > 20) {
      errors.push('Too many links in content (max 20)');
    }

    // Check for blank or whitespace-only content
    if (postData.content && postData.content.replace(/<[^>]*>/g, '').trim().length === 0) {
      errors.push('Content appears to be empty or only HTML tags');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for exact title duplicate (for AI-generated posts)
   */
  async checkExactTitleDuplicate(title: string): Promise<boolean> {
    try {
      const { db } = this.getDb();
      if (!db) return false;

      const currentTitle = title?.toLowerCase().trim() || '';
      if (!currentTitle) return false;

      // Get all existing posts
      const snapshot = await db.collection(COLLECTION_NAME).get();
      if (snapshot.empty) return false;

      // Check for exact title match
      const titleMatch = snapshot.docs.some((doc: any) => {
        const existingTitle = doc.data()?.title?.toLowerCase().trim() || '';
        return existingTitle === currentTitle;
      });

      if (titleMatch) {
        console.log('⚠️ Exact duplicate title detected');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking exact title duplicate:', error);
      return false; // Allow post if check fails (fail-safe)
    }
  }

  /**
   * Check for duplicate content by comparing title and content similarity
   * For AI-generated posts, this is skipped in favor of checkExactTitleDuplicate
   */
  async checkDuplicateContent(postData: any): Promise<boolean> {
    try {
      const { db } = this.getDb();
      if (!db) return false;

      // Get recent posts only (last 30 days) to avoid false positives
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);
      
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('createdAt', '>=', thirtyDaysAgoTimestamp)
        .get();
      
      if (snapshot.empty) return false;

      const currentTitle = postData.title?.toLowerCase().trim() || '';
      const currentContent = postData.content?.replace(/<[^>]*>/g, '').toLowerCase().trim() || '';

      // Check for exact title match
      const titleMatch = snapshot.docs.some((doc: any) => {
        const existingTitle = doc.data()?.title?.toLowerCase().trim() || '';
        return existingTitle === currentTitle;
      });

      if (titleMatch) {
        console.log('⚠️ Duplicate title detected');
        return true;
      }

      // Check for similar content (simple word overlap check)
      // Increased threshold to 95% for stricter matching (was 80%)
      const currentWords = currentContent.split(/\s+/).filter((w: string) => w.length > 3); // Words > 3 chars
      const similarityThreshold = 0.95; // 95% similarity (very strict)

      for (const doc of snapshot.docs) {
        const existingContent = doc.data()?.content?.replace(/<[^>]*>/g, '').toLowerCase().trim() || '';
        const existingWords = existingContent.split(/\s+/).filter((w: string) => w.length > 3);
        
        // Calculate overlap
        const overlap = currentWords.filter((w: string) => existingWords.includes(w)).length;
        const similarity = overlap / Math.max(currentWords.length, existingWords.length);

        if (similarity > similarityThreshold) {
          console.log(`⚠️ Duplicate content detected (${(similarity * 100).toFixed(0)}% similarity)`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking duplicate content:', error);
      return false; // Allow post if check fails (fail-safe)
    }
  }
}

// Export singleton instance
export const blogServiceServer = new BlogServiceServer();
export default blogServiceServer;

