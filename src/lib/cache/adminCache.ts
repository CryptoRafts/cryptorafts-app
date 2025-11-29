/**
 * Admin Cache & Performance Optimization
 * Browser-based caching for super-fast admin experience
 * Saves cookies and cache to improve load times
 */

interface CacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_PREFIX = 'admin_cache_';

/**
 * Admin Cache Manager
 */
export class AdminCache {
  /**
   * Set cache item
   */
  static set(key: string, data: any, duration: number = CACHE_DURATION): void {
    try {
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      };

      localStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );

      console.log(`💾 Cached: ${key}`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get cache item
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem = JSON.parse(cached);

      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        this.remove(key);
        console.log(`🗑️ Expired cache: ${key}`);
        return null;
      }

      console.log(`⚡ Cache hit: ${key}`);
      return cacheItem.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove cache item
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all admin cache
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All admin cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): { count: number; size: number } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });

      return {
        count: cacheKeys.length,
        size: totalSize
      };
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
}

/**
 * Admin Session Persistence
 * Keeps admin session active with cookies
 */
export class AdminSession {
  /**
   * Save admin session
   */
  static save(userId: string, email: string, role: string): void {
    try {
      const sessionData = {
        userId,
        email,
        role,
        loginAt: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      
      // Save to sessionStorage (cleared on browser close)
      sessionStorage.setItem('admin_active', 'true');

      // Set cookie (7 days)
      document.cookie = `admin_logged_in=true; max-age=${7 * 24 * 60 * 60}; path=/; secure; samesite=strict`;

      console.log('💾 Admin session saved');
    } catch (error) {
      console.error('Session save error:', error);
    }
  }

  /**
   * Get admin session
   */
  static get(): { userId: string; email: string; role: string; loginAt: string } | null {
    try {
      const sessionData = localStorage.getItem('admin_session');
      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if session is active
   */
  static isActive(): boolean {
    try {
      const session = this.get();
      const isActive = sessionStorage.getItem('admin_active') === 'true';
      return !!(session && isActive);
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear session
   */
  static clear(): void {
    try {
      localStorage.removeItem('admin_session');
      sessionStorage.removeItem('admin_active');
      document.cookie = 'admin_logged_in=; max-age=0; path=/';
      console.log('🗑️ Admin session cleared');
    } catch (error) {
      console.error('Session clear error:', error);
    }
  }
}

/**
 * Prefetch data for faster navigation
 */
export class AdminPrefetch {
  private static prefetchedData: Map<string, any> = new Map();

  /**
   * Prefetch dashboard data
   */
  static async prefetchDashboard(): Promise<void> {
    try {
      console.log('⚡ Prefetching dashboard data...');
      // Prefetch logic here
    } catch (error) {
      console.error('Prefetch error:', error);
    }
  }

  /**
   * Get prefetched data
   */
  static get(key: string): any {
    return this.prefetchedData.get(key);
  }

  /**
   * Clear prefetch cache
   */
  static clear(): void {
    this.prefetchedData.clear();
  }
}

