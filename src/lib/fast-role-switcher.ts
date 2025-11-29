import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.client';
import { roleCacheService } from './role-cache';

export interface RoleSwitchResult {
  success: boolean;
  role: string;
  userData: any;
  fromCache: boolean;
  loadTime: number;
  error?: string;
}

class FastRoleSwitcher {
  private switchingRoles: Set<string> = new Set();
  private roleSwitchHistory: Map<string, number> = new Map();

  // Fast role detection with caching
  async detectUserRole(user: User): Promise<RoleSwitchResult> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache first (fastest)
      const cachedData = await roleCacheService.getCachedUserData(user.uid);
      
      if (cachedData) {
        const loadTime = Date.now() - startTime;
        console.log(`🚀 Role detected from cache in ${loadTime}ms:`, cachedData.role);
        
        return {
          success: true,
          role: cachedData.role,
          userData: cachedData,
          fromCache: true,
          loadTime
        };
      }

      // 2. Fetch from Firestore (slower but necessary)
      const userDocRef = doc(db!, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (!userSnapshot.exists()) {
        const loadTime = Date.now() - startTime;
        return {
          success: false,
          role: 'user',
          userData: null,
          fromCache: false,
          loadTime,
          error: 'User document not found'
        };
      }

      const userData = userSnapshot.data();
      const role = userData.role || 'user';
      
      // 3. Cache the fresh data
      await roleCacheService.cacheUserData(user, userData);
      
      const loadTime = Date.now() - startTime;
      console.log(`🚀 Role detected from Firestore in ${loadTime}ms:`, role);
      
      return {
        success: true,
        role,
        userData,
        fromCache: false,
        loadTime
      };
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('Error detecting user role:', error);
      
      return {
        success: false,
        role: 'user',
        userData: null,
        fromCache: false,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Fast role switching with preloading
  async switchToRole(role: string, user: User): Promise<RoleSwitchResult> {
    const startTime = Date.now();
    
    try {
      // Check if already switching this role
      if (this.switchingRoles.has(role)) {
        const loadTime = Date.now() - startTime;
        return {
          success: false,
          role,
          userData: null,
          fromCache: false,
          loadTime,
          error: 'Role switch already in progress'
        };
      }

      this.switchingRoles.add(role);

      // 1. Check if we have preloaded data for this role
      const preloadedData = roleCacheService.getPreloadedRoleData(role);
      if (preloadedData) {
        const loadTime = Date.now() - startTime;
        console.log(`🚀 Role switched using preloaded data in ${loadTime}ms:`, role);
        
        this.switchingRoles.delete(role);
        return {
          success: true,
          role,
          userData: preloadedData,
          fromCache: true,
          loadTime
        };
      }

      // 2. Fetch role-specific data
      const userDocRef = doc(db!, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (!userSnapshot.exists()) {
        const loadTime = Date.now() - startTime;
        this.switchingRoles.delete(role);
        return {
          success: false,
          role,
          userData: null,
          fromCache: false,
          loadTime,
          error: 'User document not found'
        };
      }

      const userData = userSnapshot.data();
      
      // 3. Cache the data for future use
      await roleCacheService.cacheUserData(user, userData);
      
      // 4. Preload other roles for faster future switching
      this.preloadOtherRoles(user, role);
      
      const loadTime = Date.now() - startTime;
      console.log(`🚀 Role switched in ${loadTime}ms:`, role);
      
      // Track role switch history
      this.roleSwitchHistory.set(role, Date.now());
      
      this.switchingRoles.delete(role);
      return {
        success: true,
        role,
        userData,
        fromCache: false,
        loadTime
      };
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('Error switching role:', error);
      
      this.switchingRoles.delete(role);
      return {
        success: false,
        role,
        userData: null,
        fromCache: false,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Preload other roles for faster switching
  private async preloadOtherRoles(user: User, currentRole: string) {
    const rolesToPreload = ['vc', 'exchange', 'ido', 'agency', 'influencer', 'founder', 'admin']
      .filter(role => role !== currentRole);

    // Preload in background (don't wait)
    Promise.all(
      rolesToPreload.map(role => 
        roleCacheService.preloadRoleData(role)
      )
    ).then(() => {
      console.log('🚀 Preloaded role data for faster switching');
    }).catch(error => {
      console.error('Error preloading roles:', error);
    });
  }

  // Get role switch statistics
  getRoleSwitchStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return {
      totalSwitches: this.roleSwitchHistory.size,
      recentSwitches: Array.from(this.roleSwitchHistory.entries())
        .filter(([_, timestamp]) => now - timestamp < oneHour)
        .map(([role, timestamp]) => ({ role, timestamp })),
      cacheStats: roleCacheService.getCacheStats(),
      currentlySwitching: Array.from(this.switchingRoles)
    };
  }

  // Clear role switch history
  clearRoleSwitchHistory() {
    this.roleSwitchHistory.clear();
    console.log('🚀 Cleared role switch history');
  }

  // Optimize cache for current user patterns
  async optimizeCacheForUser(user: User) {
    try {
      const stats = this.getRoleSwitchStats();
      const frequentRoles = stats.recentSwitches
        .reduce((acc, { role }) => {
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Preload most frequently used roles
      const topRoles = Object.entries(frequentRoles)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([role]) => role);

      await Promise.all(
        topRoles.map(role => roleCacheService.preloadRoleData(role))
      );

      console.log('🚀 Optimized cache for frequently used roles:', topRoles);
    } catch (error) {
      console.error('Error optimizing cache:', error);
    }
  }

  // Fast redirect based on role
  redirectToRoleDashboard(role: string, userId: string) {
    const roleRoutes = {
      vc: '/vc/dashboard',
      exchange: '/exchange/dashboard',
      ido: '/ido/dashboard',
      agency: '/agency/dashboard',
      influencer: '/influencer/dashboard',
      founder: '/founder/dashboard',
      admin: '/admin/dashboard'
    };

    const route = roleRoutes[role as keyof typeof roleRoutes] || '/dashboard';
    
    // Use history API for faster navigation
    if (typeof window !== 'undefined') {
      window.history.replaceState({ role, userId }, '', route);
      window.location.href = route;
    }
  }

  // Batch role operations for efficiency
  async batchRoleOperations(operations: Array<{ userId: string; role: string }>) {
    const startTime = Date.now();
    const results = [];

    try {
      // Process in batches of 5 for efficiency
      const batchSize = 5;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async ({ userId, role }) => {
            const userDocRef = doc(db!, 'users', userId);
            const userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              // Simulate user object for caching
              const user = { uid: userId } as User;
              await roleCacheService.cacheUserData(user, userData);
              
              return { userId, role, success: true };
            }
            
            return { userId, role, success: false };
          })
        );
        
        results.push(...batchResults);
      }

      const loadTime = Date.now() - startTime;
      console.log(`🚀 Batch processed ${operations.length} role operations in ${loadTime}ms`);
      
      return {
        success: true,
        results,
        loadTime,
        totalProcessed: operations.length
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('Error in batch role operations:', error);
      
      return {
        success: false,
        results,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
export const fastRoleSwitcher = new FastRoleSwitcher();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).fastRoleSwitcher = fastRoleSwitcher;
}

export default fastRoleSwitcher;
