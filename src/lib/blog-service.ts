/**
 * Blog Service - Complete blog management with Firebase/Firestore
 * Supports CRUD operations, AI automation, scheduling, and analytics
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase.client';
import { safeToDate } from './firebase-utils';

// ===========================
// TYPE DEFINITIONS
// ===========================

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
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  postCount?: number;
}

export interface BlogAnalytics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  viewsThisWeek: number;
  topPosts: BlogPost[];
  categoriesStats: { category: string; count: number }[];
}

export interface BlogFilters {
  status?: 'draft' | 'published' | 'scheduled';
  category?: string;
  tags?: string[];
  author?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
}

// ===========================
// CONSTANTS
// ===========================

const COLLECTION_NAME = 'blog_posts';
const STORAGE_PATH = 'blog/uploads';
const CATEGORIES_COLLECTION = 'blog_categories';

// Predefined categories
export const BLOG_CATEGORIES: BlogCategory[] = [
  { id: 'crypto', name: 'Crypto News', slug: 'crypto-news', color: '#f7931a', icon: '₿' },
  { id: 'ai', name: 'AI & Automation', slug: 'ai-automation', color: '#10b981', icon: '🤖' },
  { id: 'tokenomics', name: 'Tokenomics', slug: 'tokenomics', color: '#6366f1', icon: '💎' },
  { id: 'web3', name: 'Web3', slug: 'web3', color: '#8b5cf6', icon: '🌐' },
  { id: 'defi', name: 'DeFi', slug: 'defi', color: '#ec4899', icon: '💱' },
  { id: 'guides', name: 'Guides', slug: 'guides', color: '#14b8a6', icon: '📚' },
  { id: 'startups', name: 'Startups', slug: 'startups', color: '#f59e0b', icon: '🚀' },
  { id: 'investing', name: 'Investing', slug: 'investing', color: '#3b82f6', icon: '💰' },
];

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// ===========================
// BLOG SERVICE CLASS
// ===========================

class BlogService {
  // Add generateSlug as a method
  generateSlug(title: string): string {
    return generateSlug(title);
  }
  private db = db;
  private storageInstance = storage;

  // ===========================
  // CREATE OPERATIONS
  // ===========================

  /**
   * Create a new blog post
   */
  async createPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shares'>): Promise<string> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const slug = postData.slug || generateSlug(postData.title);
      
      // Check if slug already exists
      const existingPost = await this.getPostBySlug(slug);
      if (existingPost) {
        throw new Error(`Slug "${slug}" already exists`);
      }

      const newPost: Partial<BlogPost> = {
        ...postData,
        slug,
        excerpt: postData.excerpt || generateExcerpt(postData.content),
        readingTime: calculateReadingTime(postData.content),
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0,
        shares: 0,
        commentEnabled: true,
        featured: false,
      };

      const docRef = await addDoc(collection(this.db, COLLECTION_NAME), newPost);
      
      console.log('✅ Blog post created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating blog post:', error);
      throw error;
    }
  }

  /**
   * Upload featured image
   */
  async uploadImage(file: File, postId: string): Promise<string> {
    try {
      if (!this.storageInstance) throw new Error('Storage not initialized');

      const timestamp = Date.now();
      const fileName = `${postId}_${timestamp}_${file.name}`;
      const storageRef = ref(this.storageInstance, `${STORAGE_PATH}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      console.log('✅ Image uploaded:', url);
      return url;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  // ===========================
  // READ OPERATIONS
  // ===========================

  /**
   * Get all blog posts with filters
   */
  async getPosts(filters: BlogFilters = {}): Promise<BlogPost[]> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.featured) {
        constraints.push(where('featured', '==', true));
      }
      
      if (filters.author) {
        constraints.push(where('authorId', '==', filters.author));
      }

      // Order by
      constraints.push(orderBy('createdAt', 'desc'));

      // Limit
      constraints.push(limit(filters.limit || 50));

      const q = query(collection(this.db, COLLECTION_NAME), ...constraints);
      const snapshot = await getDocs(q);
      
      let posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeToDate(doc.data().createdAt),
        updatedAt: safeToDate(doc.data().updatedAt),
      })) as BlogPost[];

      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply tag filter if provided
      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter(post => 
          filters.tags!.some(tag => post.tags.includes(tag))
        );
      }

      return posts;
    } catch (error) {
      console.error('❌ Error getting blog posts:', error);
      throw error;
    }
  }

  /**
   * Get a single blog post by ID
   */
  async getPostById(id: string): Promise<BlogPost | null> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as BlogPost;
    } catch (error) {
      console.error('❌ Error getting blog post:', error);
      throw error;
    }
  }

  /**
   * Get a blog post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const q = query(
        collection(this.db, COLLECTION_NAME),
        where('slug', '==', slug),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: safeToDate(doc.data().createdAt),
        updatedAt: safeToDate(doc.data().updatedAt),
      } as BlogPost;
    } catch (error) {
      console.error('❌ Error getting blog post by slug:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(postId: string): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentLikes = docSnap.data().likes || 0;
        await updateDoc(docRef, {
          likes: currentLikes + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentShares = docSnap.data().shares || 0;
        await updateDoc(docRef, {
          shares: currentShares + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Error sharing post:', error);
    }
  }

  // ===========================
  // UPDATE OPERATIONS
  // ===========================

  /**
   * Update a blog post
   */
  async updatePost(postId: string, updates: Partial<BlogPost>): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, postId);
      
      // Recalculate reading time if content changed
      if (updates.content) {
        updates.readingTime = calculateReadingTime(updates.content);
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Blog post updated:', postId);
    } catch (error) {
      console.error('❌ Error updating blog post:', error);
      throw error;
    }
  }

  /**
   * Publish a post (change status from draft to published)
   */
  async publishPost(postId: string): Promise<void> {
    try {
      await this.updatePost(postId, {
        status: 'published',
        publishedAt: new Date(),
      });
      console.log('✅ Post published:', postId);
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      throw error;
    }
  }

  /**
   * Unpublish a post
   */
  async unpublishPost(postId: string): Promise<void> {
    try {
      await this.updatePost(postId, {
        status: 'draft',
      });
      console.log('✅ Post unpublished:', postId);
    } catch (error) {
      console.error('❌ Error unpublishing post:', error);
      throw error;
    }
  }

  // ===========================
  // DELETE OPERATIONS
  // ===========================

  /**
   * Delete a blog post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const docRef = doc(this.db, COLLECTION_NAME, postId);
      
      // Also delete featured image if it exists
      const post = await this.getPostById(postId);
      if (post?.featuredImage) {
        try {
          const imageRef = ref(this.storageInstance!, post.featuredImage);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('⚠️ Could not delete image:', error);
        }
      }
      
      await deleteDoc(docRef);
      console.log('✅ Blog post deleted:', postId);
    } catch (error) {
      console.error('❌ Error deleting blog post:', error);
      throw error;
    }
  }

  /**
   * Delete multiple posts (bulk delete)
   */
  async deletePosts(postIds: string[]): Promise<void> {
    try {
      if (!this.db) throw new Error('Firestore not initialized');

      const batch = writeBatch(this.db);
      
      for (const postId of postIds) {
        const docRef = doc(this.db, COLLECTION_NAME, postId);
        batch.delete(docRef);
      }
      
      await batch.commit();
      console.log('✅ Posts deleted:', postIds.length);
    } catch (error) {
      console.error('❌ Error deleting posts:', error);
      throw error;
    }
  }

  // ===========================
  // ANALYTICS
  // ===========================

  /**
   * Get blog analytics
   */
  async getAnalytics(): Promise<BlogAnalytics> {
    try {
      const allPosts = await this.getPosts({ limit: 1000 });
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const publishedPosts = allPosts.filter(p => p.status === 'published');
      const viewsThisWeek = publishedPosts
        .filter(p => p.publishedAt && new Date(p.publishedAt) > oneWeekAgo)
        .reduce((sum, p) => sum + p.views, 0);
      
      const topPosts = [...publishedPosts]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      
      const categoriesStats = BLOG_CATEGORIES.map(cat => ({
        category: cat.name,
        count: publishedPosts.filter(p => p.category === cat.id).length,
      }));
      
      return {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: allPosts.filter(p => p.status === 'draft').length,
        scheduledPosts: allPosts.filter(p => p.status === 'scheduled').length,
        totalViews: allPosts.reduce((sum, p) => sum + p.views, 0),
        totalLikes: allPosts.reduce((sum, p) => sum + p.likes, 0),
        totalShares: allPosts.reduce((sum, p) => sum + p.shares, 0),
        viewsThisWeek,
        topPosts,
        categoriesStats,
      };
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      throw error;
    }
  }

  // ===========================
  // CATEGORIES
  // ===========================

  /**
   * Get all categories
   */
  async getCategories(): Promise<BlogCategory[]> {
    return BLOG_CATEGORIES;
  }
}

// Export singleton instance
export const blogService = new BlogService();
export default blogService;

