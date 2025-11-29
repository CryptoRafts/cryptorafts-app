"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth as firebaseAuth, db, doc, getDoc } from "@/lib/firebase.client";
import authTokens from "@/lib/auth-tokens";

interface AuthContextType {
  user: User | null;
  claims: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize auth system
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize token system
    authTokens.initializeAuthSystem();
    
    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session restore on app start
  useEffect(() => {
    if (isInitialized.current || typeof window === 'undefined') return;
    
    isInitialized.current = true;
    
    // Try to restore session
    restoreSession();
  }, []);

  // Firebase auth listener
  useEffect(() => {
    if (!firebaseAuth || unsubscribeRef.current) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token for API calls
          const idToken = await firebaseUser.getIdToken(true);
          authTokens.setAccessToken(idToken);

          // Get custom claims
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          let userClaims = tokenResult.claims;

          // If no role in claims, check Firestore
          if (!userClaims.role) {
            try {
              const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role) {
                  userClaims = { ...userClaims, role: userData.role };
                  
                  // Cache role hint
                  authTokens.setRoleHint(userData.role);
                }
              }
            } catch (error) {
              console.warn('Error checking Firestore for role:', error);
            }
          } else {
            // Cache role hint
            authTokens.setRoleHint(userClaims.role);
          }

          setUser(firebaseUser);
          setClaims(userClaims);
          setIsLoading(false);
        } catch (error) {
          console.error('Error getting claims:', error);
          setUser(firebaseUser);
          setClaims(null);
          setIsLoading(false);
        }
      } else {
        // No user
        setUser(null);
        setClaims(null);
        setIsLoading(false);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Session restore function
  const restoreSession = async () => {
    try {
      // Show role hint immediately for faster perceived load
      const roleHint = authTokens.getRoleHint();
      if (roleHint) {
        setClaims({ role: roleHint });
      }

      // Try to restore from server
      const result = await authTokens.restoreSession();
      
      if (result.success && result.user && result.claims) {
        console.log('✅ Session restored from server');
        
        // Server claims always win
        setClaims(result.claims);
        
        // Cache updated role hint
        if (result.claims.role) {
          authTokens.setRoleHint(result.claims.role);
        }
      } else {
        // No session to restore
        console.log('ℹ️ No session to restore');
        setClaims(null);
      }
    } catch (error) {
      console.warn('Session restore failed:', error);
      setClaims(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh session (silent reauth)
  const refreshSession = async () => {
    try {
      await authTokens.refreshAccessToken();
      
      // Refetch user data
      if (user) {
        const idToken = await user.getIdToken(true);
        authTokens.setAccessToken(idToken);
        
        const tokenResult = await user.getIdTokenResult(true);
        setClaims(tokenResult.claims);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Force re-login
      await signOut();
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Logout via API (revoke refresh token)
      await authTokens.logout();
      
      // Sign out from Firebase
      if (firebaseAuth) {
        await firebaseSignOut(firebaseAuth);
      }
      
      // Clear local state
      authTokens.clearAuthState();
      setUser(null);
      setClaims(null);
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    claims,
    isLoading,
    isAuthenticated: !!user,
    isOnline,
    signOut,
    refreshSession,
  };

  // Show global loader while loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <AuthContext.Provider value={value}>
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-center z-50 font-semibold">
          ⚠️ Reconnecting...
        </div>
        <div className="pt-10">{children}</div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider");
  }
  return context;
}

// Export for backward compatibility
export const AuthProvider = EnhancedAuthProvider;

