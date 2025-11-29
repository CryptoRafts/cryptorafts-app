// src/lib/auth-tokens.ts
// Secure Token Management - No Repeated Logins

/**
 * AUTH TOKEN SYSTEM
 * 
 * Architecture:
 * - Refresh token: httpOnly, Secure, SameSite=Strict cookie (long-lived)
 * - Access token: In-memory only (short-lived)
 * - Role hints: Namespaced localStorage (crfx:v1:*) - hints only, server wins
 * 
 * Security:
 * - No tokens in localStorage
 * - Refresh token rotation on every use
 * - Reuse detection
 * - Silent reauth on 401
 * - Offline reconnection
 */

const STORAGE_NAMESPACE = 'crfx:v1';

// In-memory access token (never persisted)
let accessToken: string | null = null;

// Session state
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Local storage keys (hints only - server always wins)
const STORAGE_KEYS = {
  ROLE_HINT: `${STORAGE_NAMESPACE}:roleHint`,
  LAST_PORTAL: `${STORAGE_NAMESPACE}:lastPortalPath`,
  REMEMBER_ME: `${STORAGE_NAMESPACE}:rememberMe`,
};

// ============================================
// ACCESS TOKEN MANAGEMENT (IN-MEMORY ONLY)
// ============================================

export function setAccessToken(token: string): void {
  accessToken = token;
  console.log('✅ Access token set (in-memory)');
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
  console.log('🗑️ Access token cleared');
}

// ============================================
// REFRESH TOKEN MANAGEMENT (HTTP-ONLY COOKIE)
// ============================================

/**
 * Call server to refresh tokens
 * - Sends httpOnly refresh cookie automatically
 * - Returns new access token
 * - Server rotates refresh cookie
 */
export async function refreshAccessToken(): Promise<string> {
  // Prevent concurrent refresh requests
  if (isRefreshing && refreshPromise) {
    console.log('⏳ Refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = performRefresh();

  try {
    const newAccessToken = await refreshPromise;
    return newAccessToken;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function performRefresh(): Promise<string> {
  try {
    console.log('🔄 Refreshing access token...');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error('No access token in response');
    }

    // Store new access token in memory
    setAccessToken(data.accessToken);
    
    console.log('✅ Access token refreshed');
    return data.accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    // Clear tokens and force re-login
    clearAccessToken();
    clearAuthState();
    throw error;
  }
}

// ============================================
// SILENT REAUTH ON 401
// ============================================

/**
 * Intercept 401 errors and try silent refresh once
 */
export async function handleUnauthorized(
  originalRequest: () => Promise<Response>
): Promise<Response> {
  try {
    // Try to refresh token
    await refreshAccessToken();
    
    // Retry original request once
    console.log('🔄 Retrying request after token refresh...');
    return await originalRequest();
  } catch (error) {
    console.error('❌ Silent reauth failed, forcing re-login');
    // Clear everything and redirect to login
    clearAuthState();
    window.location.href = '/login';
    throw error;
  }
}

// ============================================
// REMEMBER ME
// ============================================

export function setRememberMe(remember: boolean): void {
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    console.log('✅ Remember me enabled (30 days)');
  } else {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    console.log('ℹ️ Remember me disabled (session only)');
  }
}

export function getRememberMe(): boolean {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
}

// ============================================
// ROLE & PORTAL HINTS (CACHE ONLY)
// ============================================

/**
 * Cache role hint for faster initial load
 * NOTE: Server claims ALWAYS win - this is just a hint
 */
export function setRoleHint(role: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROLE_HINT, role);
    console.log(`💡 Role hint cached: ${role}`);
  } catch (error) {
    console.warn('Failed to cache role hint:', error);
  }
}

export function getRoleHint(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ROLE_HINT);
  } catch (error) {
    return null;
  }
}

/**
 * Cache last portal path for redirect after login
 */
export function setLastPortalPath(path: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PORTAL, path);
    console.log(`💡 Last portal cached: ${path}`);
  } catch (error) {
    console.warn('Failed to cache portal path:', error);
  }
}

export function getLastPortalPath(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_PORTAL);
  } catch (error) {
    return null;
  }
}

// ============================================
// SESSION RESTORE
// ============================================

/**
 * Restore session on app start
 * - Check if refresh token exists (via cookie)
 * - Refresh to get new access token
 * - Load user claims from server
 */
export async function restoreSession(): Promise<{
  success: boolean;
  user?: any;
  claims?: any;
}> {
  try {
    console.log('🔄 Restoring session...');
    
    // Try to refresh token (will fail if no refresh cookie)
    const newAccessToken = await refreshAccessToken();
    
    if (!newAccessToken) {
      return { success: false };
    }

    // Fetch user claims from server
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    
    console.log('✅ Session restored');
    return {
      success: true,
      user: data.user,
      claims: data.claims,
    };
  } catch (error) {
    console.log('ℹ️ No session to restore');
    return { success: false };
  }
}

// ============================================
// LOGOUT & CLEANUP
// ============================================

/**
 * Complete logout
 * - Revoke refresh token on server
 * - Clear access token from memory
 * - Clear all localStorage hints
 */
export async function logout(): Promise<void> {
  try {
    console.log('👋 Logging out...');
    
    // Revoke refresh token on server
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // Send refresh cookie
    });
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear local state
    clearAuthState();
    console.log('✅ Logged out');
  }
}

export function clearAuthState(): void {
  // Clear in-memory token
  clearAccessToken();
  
  // Clear all localStorage hints
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Auth state cleared');
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

// ============================================
// OFFLINE HANDLING
// ============================================

let isOnline = true;
let reconnectQueue: Array<() => Promise<any>> = [];

export function setOnlineStatus(online: boolean): void {
  const wasOffline = !isOnline;
  isOnline = online;
  
  if (online && wasOffline) {
    console.log('🌐 Back online, processing queued requests...');
    processReconnectQueue();
  }
}

export function isAppOnline(): boolean {
  return isOnline;
}

export function queueForReconnect(request: () => Promise<any>): void {
  reconnectQueue.push(request);
  console.log(`📋 Request queued (${reconnectQueue.length} pending)`);
}

async function processReconnectQueue(): Promise<void> {
  const queue = [...reconnectQueue];
  reconnectQueue = [];
  
  for (const request of queue) {
    try {
      await request();
    } catch (error) {
      console.error('Failed to process queued request:', error);
    }
  }
  
  console.log('✅ Reconnect queue processed');
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Setup online/offline listeners
 */
export function initializeAuthSystem(): void {
  if (typeof window === 'undefined') return;
  
  // Online/offline detection
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored');
    setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('📡 Connection lost');
    setOnlineStatus(false);
  });
  
  // Initial online status
  setOnlineStatus(navigator.onLine);
  
  console.log('✅ Auth system initialized');
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Detect suspicious activity (refresh token reuse)
 */
export function detectRefreshTokenReuse(error: any): boolean {
  // Server should send specific error for token reuse
  return error?.code === 'REFRESH_TOKEN_REUSED' || 
         error?.message?.includes('token reuse detected');
}

/**
 * Force re-login on security anomaly
 */
export function forceRelogin(reason: string): void {
  console.warn(`⚠️ Forcing re-login: ${reason}`);
  clearAuthState();
  window.location.href = '/login?reason=' + encodeURIComponent(reason);
}

// ============================================
// EXPORTS
// ============================================

export const authTokens = {
  // Access token (in-memory)
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  
  // Refresh token (httpOnly cookie)
  refreshAccessToken,
  
  // Silent reauth
  handleUnauthorized,
  
  // Remember me
  setRememberMe,
  getRememberMe,
  
  // Hints (cache only)
  setRoleHint,
  getRoleHint,
  setLastPortalPath,
  getLastPortalPath,
  
  // Session
  restoreSession,
  logout,
  clearAuthState,
  
  // Offline
  setOnlineStatus,
  isAppOnline,
  queueForReconnect,
  
  // Security
  detectRefreshTokenReuse,
  forceRelogin,
  
  // Init
  initializeAuthSystem,
};

export default authTokens;

