import { User } from 'firebase/auth';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const COOKIE_EXPIRY_DAYS = 30; // 30 days

export interface CachedUserData {
  uid: string;
  email: string;
  role: string;
  profileCompleted: boolean;
  kybStatus: string;
  orgId: string;
  orgName?: string;
  lastUpdated: number;
  expiresAt: number;
}

export interface RoleCacheConfig {
  enableBrowserCache: boolean;
  enableCookies: boolean;
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  cacheDuration: number;
}

class RoleCacheService {
  private cache: Map<string, CachedUserData> = new Map();
  private config: RoleCacheConfig = {
    enableBrowserCache: true,
    enableCookies: true,
    enableLocalStorage: true,
    enableSessionStorage: true,
    cacheDuration: CACHE_DURATION
  };

  constructor() {
    this.loadFromStorage();
  }

  // Set cache configuration
  setConfig(config: Partial<RoleCacheConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Generate cache key
  private getCacheKey(userId: string): string {
    return `role_cache_${userId}`;
  }

  // Generate cookie name
  private getCookieName(userId: string): string {
    return `crypto_user_${userId.substring(0, 8)}`;
  }

  // Set cookie with expiry
  private setCookie(name: string, value: string, days: number = COOKIE_EXPIRY_DAYS) {
    if (typeof window === 'undefined' || !this.config.enableCookies) return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  }

  // Get cookie value
  private getCookie(name: string): string | null {
    if (typeof window === 'undefined' || !this.config.enableCookies) return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Delete cookie
  private deleteCookie(name: string) {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Cache user data with multiple storage methods
  async cacheUserData(user: User, userData: any): Promise<void> {
    if (!user || !userData) return;

    const cacheKey = this.getCacheKey(user.uid);
    const cookieName = this.getCookieName(user.uid);
    
    const cachedData: CachedUserData = {
      uid: user.uid,
      email: user.email || '',
      role: userData.role || 'user',
      profileCompleted: userData.profileCompleted || false,
      kybStatus: userData.kyb?.status || 'not_submitted',
      orgId: userData.orgId || '',
      orgName: userData.orgName || '',
      lastUpdated: Date.now(),
      expiresAt: Date.now() + this.config.cacheDuration
    };

    try {
      // 1. Memory cache
      if (this.config.enableBrowserCache) {
        this.cache.set(cacheKey, cachedData);
      }

      // 2. Local Storage
      if (this.config.enableLocalStorage && typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      }

      // 3. Session Storage
      if (this.config.enableSessionStorage && typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(cachedData));
      }

      // 4. Cookies (essential data only)
      if (this.config.enableCookies) {
        const cookieData = {
          role: cachedData.role,
          orgId: cachedData.orgId,
          profileCompleted: cachedData.profileCompleted,
          kybStatus: cachedData.kybStatus,
          expiresAt: cachedData.expiresAt
        };
        this.setCookie(cookieName, JSON.stringify(cookieData), COOKIE_EXPIRY_DAYS);
      }

      console.log('🚀 Cached user data for:', user.uid, 'Role:', cachedData.role);
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  // Get cached user data
  async getCachedUserData(userId: string): Promise<CachedUserData | null> {
    if (!userId) return null;

    const cacheKey = this.getCacheKey(userId);
    const cookieName = this.getCookieName(userId);

    try {
      // 1. Check memory cache first
      if (this.config.enableBrowserCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (cached.expiresAt > Date.now()) {
          console.log('🚀 Cache HIT (memory):', userId);
          return cached;
        } else {
          this.cache.delete(cacheKey);
        }
      }

      // 2. Check Local Storage
      if (this.config.enableLocalStorage && typeof window !== 'undefined') {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const cached = JSON.parse(stored) as CachedUserData;
          if (cached.expiresAt > Date.now()) {
            // Update memory cache
            this.cache.set(cacheKey, cached);
            console.log('🚀 Cache HIT (localStorage):', userId);
            return cached;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // 3. Check Session Storage
      if (this.config.enableSessionStorage && typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          const cached = JSON.parse(stored) as CachedUserData;
          if (cached.expiresAt > Date.now()) {
            // Update memory cache
            this.cache.set(cacheKey, cached);
            console.log('🚀 Cache HIT (sessionStorage):', userId);
            return cached;
          } else {
            sessionStorage.removeItem(cacheKey);
          }
        }
      }

      // 4. Check Cookies (fallback for essential data)
      if (this.config.enableCookies) {
        const cookieData = this.getCookie(cookieName);
        if (cookieData) {
          try {
            const parsed = JSON.parse(cookieData);
            if (parsed.expiresAt > Date.now()) {
              console.log('🚀 Cache HIT (cookie):', userId);
              return {
                uid: userId,
                email: '',
                role: parsed.role,
                profileCompleted: parsed.profileCompleted,
                kybStatus: parsed.kybStatus,
                orgId: parsed.orgId,
                lastUpdated: Date.now(),
                expiresAt: parsed.expiresAt
              };
            }
          } catch (error) {
            this.deleteCookie(cookieName);
          }
        }
      }

      console.log('🚀 Cache MISS:', userId);
      return null;
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  // Load from storage on initialization
  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      // Load from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('role_cache_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.expiresAt > Date.now()) {
              this.cache.set(key, data);
            } else {
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      });

      console.log('🚀 Loaded cache from storage:', this.cache.size, 'entries');
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  // Clear cache for specific user
  clearUserCache(userId: string): void {
    const cacheKey = this.getCacheKey(userId);
    const cookieName = this.getCookieName(userId);

    // Clear memory cache
    this.cache.delete(cacheKey);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
      sessionStorage.removeItem(cacheKey);
    }

    // Clear cookie
    this.deleteCookie(cookieName);

    console.log('🚀 Cleared cache for user:', userId);
  }

  // Clear all cache
  clearAllCache(): void {
    // Clear memory cache
    this.cache.clear();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('role_cache_')) {
          localStorage.removeItem(key);
        }
      });

      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('role_cache_')) {
          sessionStorage.removeItem(key);
        }
      });
    }

    // Clear all cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('crypto_user_')) {
          this.deleteCookie(name);
        }
      });
    }

    console.log('🚀 Cleared all cache');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      memoryEntries: this.cache.size,
      localStorageEntries: typeof window !== 'undefined' ? 
        Object.keys(localStorage).filter(k => k.startsWith('role_cache_')).length : 0,
      sessionStorageEntries: typeof window !== 'undefined' ? 
        Object.keys(sessionStorage).filter(k => k.startsWith('role_cache_')).length : 0,
      config: this.config
    };
  }

  // Preload cache for faster role switching
  async preloadRoleData(role: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Preload role-specific data
      const roleData = {
        role,
        preloadedAt: Date.now(),
        expiresAt: Date.now() + this.config.cacheDuration
      };

      const cacheKey = `role_preload_${role}`;
      
      if (this.config.enableLocalStorage) {
        localStorage.setItem(cacheKey, JSON.stringify(roleData));
      }

      console.log('🚀 Preloaded role data for:', role);
    } catch (error) {
      console.error('Error preloading role data:', error);
    }
  }

  // Get preloaded role data
  getPreloadedRoleData(role: string): any | null {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = `role_preload_${role}`;
      const stored = localStorage.getItem(cacheKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        if (data.expiresAt > Date.now()) {
          return data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting preloaded role data:', error);
      return null;
    }
  }
}

// Create singleton instance
export const roleCacheService = new RoleCacheService();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).roleCacheService = roleCacheService;
}

export default roleCacheService;
